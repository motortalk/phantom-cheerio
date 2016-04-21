var phantom = require('phantom');
var cheerio = require('cheerio');
var Promise = require('promise');
var querystring = require('querystring');

module.exports = function (phantomSettings) {
    return new PhantomCheerio(phantomSettings);
};

var PhantomCheerio = function (phantomSettings) {

    var SETTINGS_PREFIX = 'settings.';

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
                .then(createPageInstance, function (error) {
                    reject(error);
                })
                .then(function () {
                    return post(url, postData);
                }, function (error) {
                    reject(error);
                })
                .then(function (status) {
                    _pageInstance.close();
                    callback(status);
                }, function (error) {
                    reject(error)
                });
        });
    };

    this.close = function () {
        if (_phantomInstance) {
            _phantomInstance.exit();
        }
    };

    var post = function (url, postData) {
        return new Promise(function (resolve, reject) {
            try {
                var postBody = querystring.stringify(postData);
                _pageInstance.open(url, 'POST', postBody)
                    .then(function (status) {
                        resolve(status);
                    }, function (err) {
                        reject(err);
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
                .then(createPageInstance, function (error) {
                    reject(error);
                })
                .then(function () {
                    return openUrl(url);
                }, function (error) {
                    reject(error);
                })
                .then(function (response) {
                    pageResponse = response;
                    return getJqueryfiedContent();
                }, function (error) {
                    reject(error);
                })
                .then(function ($) {
                    _pageInstance.close();
                    resolve({$: $, response: pageResponse});
                }, function (error) {
                    reject(error)
                });
        });
    };

    var createPageInstance = function () {
        return new Promise(function (resolve, reject) {
            _phantomInstance.createPage()
                .then(function (page) {
                    try {
                        if (_phantomSettings) {
                            for (var key in _phantomSettings) {
                                if (_phantomSettings.hasOwnProperty(key) && key.indexOf(SETTINGS_PREFIX) == 0) {
                                    page.setting(key.slice(SETTINGS_PREFIX.length), _phantomSettings[key]);
                                }
                            }
                        }
                    } catch (e) {
                        reject(e);
                    }
                    _pageInstance = page;
                    resolve();
                }, function (err) {
                    reject(err)
                });
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
        return new Promise(function (resolve, reject) {
            phantom.create(["--ignore-ssl-errors=true"])
                .then(function (phantomInstance) {
                    _phantomInstance = phantomInstance;
                    resolve();
                }, function (err) {
                    reject(err)
                });
        });
    };

    var openUrl = function (url) {
        return new Promise(function (resolve, reject) {
            var targetUrl = url;

            //FIXME just a workaround for nginx rewrites
            _pageInstance.property('onNavigationRequested', function (url) {
                targetUrl = url;
            });

            _pageInstance.property('onUrlChanged', function (changedUrl) {
                targetUrl = changedUrl;
            });

            var _responseOut = _phantomInstance.createOutObject();
            _pageInstance.property('onResourceReceived', function (response, out) {
                if (response.url === targetUrl) {
                    out.status = response.status;
                    out.url = response.url;
                    out.time = response.time;
                    out.headers = response.headers;
                    out.contentType = response.contentType;
                    out.redirectURL = response.redirectURL;
                }
            }, _responseOut);

            _pageInstance.property('onResourceError', function (resourceError) {
                console.log('Error:' + resourceError.errorString);
            });

            _pageInstance.property('onResourceTimeout', function (request) {
                reject(new Error('URL:' + request.url + ', Error code: ' + request.errorCode + '. Description: ' + request.errorString));
            });

            _pageInstance.open(url)
                .then(function (status) {
                    if (status === 'success') {
                        getResponseObjectFrom(_responseOut)
                            .then(function (response) {
                                resolve(response);
                            });
                    } else {
                        reject(new Error('Failed to open ' + url));
                    }
                }, function (err) {
                    reject(err);
                });
        });
    };

    var getResponseObjectFrom = function (phantomOutObject) {
        return new Promise(function (resolve) {
            var response = {};
            phantomOutObject.property('status')
                .then(function (status) {
                    response.status = status;
                    return phantomOutObject.property('url');
                })
                .then(function (url) {
                    response.url = url;
                    return phantomOutObject.property('time');
                })
                .then(function (time) {
                    response.time = time;
                    return phantomOutObject.property('headers');
                })
                .then(function (headers) {
                    response.headers = headers;
                    return phantomOutObject.property('contentType');
                })
                .then(function (contentType) {
                    response.contentType = contentType;
                    return phantomOutObject.property('redirectURL');
                })
                .then(function (redirectURL) {
                    response.redirectURL = redirectURL;
                    resolve(response);
                });
        });
    };


    var getJqueryfiedContent = function () {
        return new Promise(function (resolve, reject) {
            _pageInstance.property('content')
                .then(function (content) {
                    resolve(cheerio.load(content));
                }, function (err) {
                    reject(err)
                });
        });
    };

};


