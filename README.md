#phantom-cheerio

## Installation

Install it like this:

    npm install phantom-cheerio


##Examples with mocha 

```mocha
describe('test phantom-cheerio basics.', function () {
    this.timeout(10000);

    it('should open any url with response', function (done) {
        phantomCheerio.open('https://www.npmjs.com/', function ($, response) {
            assert(response, true, 'response should be available.');
            assert(response.status, 200, 'response should be OK.');
            done();
        }, done)
    });

    it('should return a jquery-function', function (done) {
        phantomCheerio.open('https://www.npmjs.com/', function ($) {
            assert($('title').text(), 'npm', 'title should be npm');
            done();
        }, done)
    });

});

    
describe('test phantom-cheerio options.', function () {

    this.timeout(10000);

    var phantomCheerioJsDisabled = require('../index')({"settings.javascriptEnabled": false});

    it('should open any url with response', function (done) {
        phantomCheerioJsDisabled.open('https://www.npmjs.com/', function ($, response) {
            assert($('#notification-banner').css('display'), 'none', 'notification banner is not visible with js disabled.');
            done();
        }, done)
    });

});
```