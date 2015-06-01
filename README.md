#phantom-cheerio

## Installation

    npm install phantom-cheerio

##Examples with mocha 

    'use strict';
    var phantomCheerio = require('../index')();
    var assert = require('assert');
    
    describe('test phantom-cheerio basics.', function () {
    
        this.timeout(10000); //npmjs.com is too slow for default timeout
    
        it('should open any url with response', function (done) {
            phantomCheerio.open('https://www.npmjs.com/', function ($, response) {
                assert(response, true, 'response should be available.');
                assert(response.status, 200, 'response should be OK.');
                done();
            });
        });
    
        it('should return a jquery-function', function (done) {
            phantomCheerio.open('https://www.npmjs.com/', function ($) {
                assert($('title').text(), 'npm', 'title should be npm');
                done();
            });
        });
    
    });
    
    describe('test phantom-cheerio options.', function () {
    
        this.timeout(10000); //npmjs.com is too slow for default timeout
    
        var phantomCheerioJsDisabled = require('../index')({"settings.javascriptEnabled": false});
    
        it('should open url with javascript disabled', function (done) {
            phantomCheerioJsDisabled.open('https://www.npmjs.com/', function ($) {
                assert.equal($('#notification-banner').css('display'), 'none', 'notification banner is not visible with js disabled.');
                done();
            });
        });
    
        //this is an error case
        it('should fail due to wrong assertion', function (done) {
            phantomCheerioJsDisabled.open('https://www.npmjs.com/', function ($) {
                try {
                    assert.equal($('#notification-banner').css('display'), 'block', 'notification banner is not visible with js disabled.');
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    
    });
        
### Sessions
Sessions are available by using the same phantom-instance. Calling the method close will also close the session.
    
    describe('test phantom-cheerio sessions.', function () {
    
        this.timeout(10000); //npmjs.com is too slow for default timeout
    
        it('instance should use existing session', function (done) {
    
            var phantomCheerioWithUA = require('../index')({
                "settings.userAgent" : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36'
            });
    
            var credentials = {
                userName: "userName",
                password: "password",
                login: true
            };
    
            phantomCheerioWithUA.post('https://www.npmjs.com/login', credentials, function (status) {
                phantomCheerioWithUA.open('https://www.npmjs.com/', function ($) {
                    assert.equal($('#user-info li.username a').text(), 'userName', 'logged in username should be present.');
                    phantomCheerioWithUA.close();                    
                    done();
                });
            });
    
        });
    
    });