'use strict';

var assert = require('assert');

describe('test phantom-cheerio basics.', function () {

    var phantomCheerio = require('../index')();

    this.timeout(10000); //npmjs.com is too slow for default timeout

    it('should open any url with response', function (done) {
        phantomCheerio.open('https://www.npmjs.com/', function ($, response) {
            try {
                assert(response, true, 'response should be available.');
                assert(response.status, 200, 'response should be OK.');
                done();
            } catch (e) {
                done(e);
            }
        });
    });

    it('should return a jquery-function', function (done) {
        phantomCheerio.open('https://www.npmjs.com/', function ($) {
            try {
                assert($('title').text(), 'npm', 'title should be npm');
                done();
            } catch (e) {
                done(e);
            }
        });
    });

    after(function () {
        phantomCheerio.close();
    });

});

describe('test phantom-cheerio options.', function () {

    this.timeout(10000); //npmjs.com is too slow for default timeout

    var phantomCheerioJsDisabled = require('../index')({"settings.javascriptEnabled": false});

    it('should open url with javascript disabled', function (done) {
        phantomCheerioJsDisabled.open('https://www.npmjs.com/', function ($) {
            try {
                assert.equal($('#npm-expansions').text(), 'node package manager', 'npm-expansions text should equal node package manager when js disabled');
                done();
            } catch (e) {
                done(e);
            }
        });
    });

    after(function () {
        phantomCheerioJsDisabled.close();
    });

});