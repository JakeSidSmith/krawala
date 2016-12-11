'use strict';

(function () {

  var request = require('superagent');
  var utils = require('./utils');

  var error = utils.error;

  function crawl(options, callback) {
    var json = {};
    var depth = options.depth;
    var format = options.format;

    if (!options.url) {
      error('No url specified');
    }

    var urls = [options.url];

    function continueCrawl (url) {
      request
      .get(url)
      .accept('text/html')
      .send()
      .end(function (err, res) {
        if (err) {
          error(err);
        } else {
          var html = res.text;

          json.url = {
            body: res.text
          };

          if (urls.length) {

          } else if (typeof process === 'object') {
            process.stdout.write(JSON.stringify(json, null, 2) + '\n')
          } if (typeof callback === 'function') {
            callback(JSON.stringify(json, null, 2) + '\n');
          }
        }
      });
    }

    continueCrawl(urls.shift());

  }

  module.exports = {
    crawl: crawl
  };

})();
