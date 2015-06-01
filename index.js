var phantom = require('phantom');
var cheerio = require('cheerio');
var Promise = require('promise');
var querystring = require('querystring');

module.exports = function (phantomSettings) {
    return new PhantomCheerio(phantomSettings);
};

var PhantomCheerio = function (phantomSettings) {

    var _pageInstance;
    var _phantomInstance;

    var _phantomSettings = phantomSettings ? phantomSettings : {};

    this.open = function (url, callback) {
        openAndJquerify(url)
            .then(function (result) {
                callback(result.$, result.response);
            }, function (error) {
                console.log(error);
            });
    };

    this.post = function (url, postData, callback) {
        return new Promise(function (resolve, reject) {
            getPhantomInstance()
                .then(createPageInstance, function(error){ reject(error); })
                .then(function(){ return post(url, postData); }, function (error){ reject(error); })
                .then(function (status) { _pageInstance.close(); callback(status); }, function (error) { reject(error) });
        });
    };

    this.close = function () {
        if(_phantomInstance) {
            _phantomInstance.exit();
        }
    };

    var post = function (url, postData) {
        return new Promise(function (resolve, reject) {
            try {
                var postBody = querystring.stringify(postData);
                _pageInstance.open(url, 'POST', postBody, function (status) {
                    resolve(status);
                });
            } catch (e) {
                reject(e);
            }
        });
    };

    var openAndJquerify = function (url) {
        return new Promise(function (resolve, reject) {
            var pageResponse;
            getPhantomInstance()
                .then(createPageInstance, function(error){ reject(error); })
                .then(function() {return openUrl(url); }, function (error) { reject(error); })
                .then(function (response) { pageResponse = response; return getJqueryfiedContent(); }, function (error) { reject(error); })
                .then(function ($) { _pageInstance.close(); resolve({$ : $, response : pageResponse}); }, function (error) { reject(error) });
        });
    };

    var createPageInstance = function () {
        return new Promise(function (resolve) {
            try {
                _phantomInstance.createPage(function (page) {
                    if (_phantomSettings) {
                        for (var key in _phantomSettings) {
                            if (_phantomSettings.hasOwnProperty(key)) {
                                page.set(key, _phantomSettings[key]);
                            }
                        }
                    }
                    _pageInstance = page;
                    resolve();
                });
            } catch (e) {
                reject(e);
            }
        });
    };

    var getPhantomInstance = function () {
        return new Promise(function (resolve, reject) {
            if (_phantomInstance) {
                resolve();
            } else {
                createPhantomInstance()
                    .then(function () {
                        resolve();
                    }, function (err) {
                        reject(err);
                    });
            }
        });
    };

    var createPhantomInstance = function () {
        return new Promise(function (resolve) {
            phantom.create(function (phantomInstance) {
                _phantomInstance = phantomInstance;
                _phantomInstance.set('onError', function (msg) {
                    console.log('PHANTOM ERROR: ' + msg);
                });
                resolve();
            }, {parameters: {'ignore-ssl-errors': 'yes'}});
        });
    };

    var openUrl = function (url) {
        return new Promise(function (resolve, reject) {
            var _response;
            var targetUrl = url;

            //FIXME just a workaround for nginx rewrites
            _pageInstance.set('onNavigationRequested', function (url) {
                targetUrl = url;
            });

            _pageInstance.set('onUrlChanged', function (changedUrl) {
                targetUrl = changedUrl;
            });

            _pageInstance.set('onResourceReceived', function (response) {
                if (response.url === targetUrl) {
                    _response = response;
                }
            });

            _pageInstance.set('onResourceError', function (resourceError) {
                console.log(resourceError);
            });

            _pageInstance.set('onResourceTimeout', function (request) {
                reject(new Error('URL:' + request.url + ', Error code: ' + request.errorCode + '. Description: ' + request.errorString));
            });

            _pageInstance.open(url, function (status) {
                if(status === 'success') {
                    resolve(_response);
                } else {
                    reject(new Error('Failed to open ' + url));
                }
            });
        });
    };

    var getJqueryfiedContent = function () {
        return new Promise(function (resolve) {
            _pageInstance.getContent(function (content) {
                resolve(cheerio.load(content));
            });
        });
    };

};


