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