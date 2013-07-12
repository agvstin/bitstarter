#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var url = require('url');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};
var assertValidUrl = function(input) {
    var urlObj = url.parse(input);
    if(!(urlObj.protocol === 'http:' || urlObj.protocol === 'https:')) {
        console.log("%s does not look like a valid url. Exiting.", input);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return input;
};
var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};
var cheerioHtmlString = function(html) {
    return cheerio.load(html);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checks) {
    $ = cheerioHtmlFile(htmlfile);

    return doCheck($, checks);
};
var checkHtmlString = function(html, checks) {
    $ = cheerioHtmlString(html);

    return doCheck($, checks);
};
var doCheck = function($, checks) {
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};
var printResults = function(checkJson) {
    var outJson = JSON.stringify(checkJson, null, 4);

    console.log(outJson);
}
var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <html_url>', 'URL to index.html', clone(assertValidUrl))
        .parse(process.argv);

    var checks = loadChecks(program.checks).sort();

    if (program.url) {
      rest.get(program.url).on('complete', function(result, response) {
        if (result instanceof Error) {
          console.error('Error: ' + util.format(response.message));
          process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
        }
        var checkJson = checkHtmlString(result, checks);

        printResults(checkJson);
      });
    } else {
      var checkJson = checkHtmlFile(program.file, checks);

      printResults(checkJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
    exports.checkHtmlString = checkHtmlString;
}
