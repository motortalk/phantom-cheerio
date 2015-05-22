var phantom = require('phantom');
var cheerio = require('cheerio');
var Promise = require('promise');

var _instance;

var originalIt = it;
it = function (title, cb) {
    originalIt(title, function (done) {
        try {
            cb(done);
        } catch (err) {
            done(err);
        }
    });
};

module.exports = function (phantomSettings) {
    return new PhantomCheerio(phantomSettings);
};

var PhantomCheerio = function (phantomSettings) {

    var _phantomInstance;
    var _phantomSettings = phantomSettings ? phantomSettings : {};

    this.open = function (url, callback, done) {
        openAndJquerify(url)
            .then(function (result) {
                try {
                    callback(result.$, result.response);
                } catch (err) {
                    done(err);
                }
            }, function(error){
                done(error);
            });
    };

    var openAndJquerify = function (url) {
        return new Promise(function (resolve, reject) {
            var response;
            var pageInstance;
            createPageInstance()
                .then(function (instance) { pageInstance = instance; return openUrl(pageInstance, url); }, function (error) { reject(error); })
                .then(function (result) { response = result.response; return getJqueryfiedContent(pageInstance); }, function (error) { reject(error); })
                .then(function ($) { pageInstance.close(); resolve({$ : $, response : response}); }, function (error) { reject(error) });
        });
    };

    var createPageInstance = function () {
        return new Promise(function (resolve, reject) {
            getPhantomInstance()
                .then(function (phantomInstance) {
                    phantomInstance.createPage(function (page) {
                        if(_phantomSettings) {
                            for(var key in _phantomSettings) {
                                if(_phantomSettings.hasOwnProperty(key)) {
                                    page.set(key, _phantomSettings[key]);
                                }
                            }
                        }
                        resolve(page);
                    });
                }, function (error) {
                    reject(error);
                });
        });
    };

    var getPhantomInstance = function () {
        return new Promise(function (resolve, reject) {
            if (_phantomInstance) {
                resolve(_phantomInstance)
            } else {
                createInstance()
                    .then(function (instance) {
                        resolve(instance);
                    }, function (error) {
                        reject(error);
                    })
            }
        });
    };

    var createInstance = function () {
        return new Promise(function (resolve) {
            phantom.create(function (phantomInstance) {
                _phantomInstance = phantomInstance;
                resolve(phantomInstance);
            }, {parameters: {'ignore-ssl-errors': 'yes'}});
        });
    };


    var openUrl = function (pageInstance, url) {
        return new Promise(function (resolve, reject) {
            var _response;
            var targetUrl = url;

            //FIXME just a workaround for nginx rewrites
            pageInstance.set('onNavigationRequested', function (url) {
                targetUrl = url;
            });

            pageInstance.set('onUrlChanged', function (changedUrl) {
                targetUrl = changedUrl;
            });

            pageInstance.onResourceRequested(
                function (requestData, request, pageRequestUrl) {
                    var resourceUrl = requestData.url;
                    var rootDomainRegex = /^https?\:\/\/[^\.]*.([^\/?#]+)(?:[\/?#]|$)/i;
                    var pageRequestUrlMatches = pageRequestUrl.match(rootDomainRegex);
                    var pageRequestRootDomain = pageRequestUrlMatches && pageRequestUrlMatches[1];
                    var resourceUrlMatches = resourceUrl.match(rootDomainRegex);
                    var resourceRootDomain = resourceUrlMatches && resourceUrlMatches[1];
                    if (resourceRootDomain !== pageRequestRootDomain && resourceUrl.indexOf('data:image') < 0) {
                        request.abort();
                    }
                },
                function (requestData) {
                }, url);


            pageInstance.set('onResourceReceived', function (response) {
                if (response.url === targetUrl) {
                    _response = response;
                }
            });

            pageInstance.set('onResourceError', function (resourceError) {
                if (!isExternalRequest(url, resourceError.url)) {
                    reject(new Error('URL:' + resourceError.url + ', Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString));
                }
            });

            pageInstance.set('onResourceTimeout', function (request) {
                reject(new Error('URL:' + request.url + ', Error code: ' + request.errorCode + '. Description: ' + request.errorString));
            });

            pageInstance.open(url, function(){
                resolve({
                    pageInstance: pageInstance,
                    response: _response
                });
            });
        });
    };

    var getJqueryfiedContent = function (pageInstance) {
        return new Promise(function (resolve) {
            pageInstance.getContent(function (content) {
                resolve(cheerio.load(content));
            });
        });
    };

    var isExternalRequest = function (requestedPageUrl, resourceRequestUrl) {
        var rootDomainRegex = /^https?\:\/\/[^\.]*.([^\/?#]+)(?:[\/?#]|$)/i;
        var pageRequestUrlMatches = requestedPageUrl.match(rootDomainRegex);
        var pageRequestRootDomain = pageRequestUrlMatches && pageRequestUrlMatches[1];
        var resourceUrlMatches = resourceRequestUrl.match(rootDomainRegex);
        var resourceRootDomain = resourceUrlMatches && resourceUrlMatches[1];
        return resourceRootDomain !== pageRequestRootDomain && resourceRequestUrl.indexOf('data:image') < 0
    };

};


