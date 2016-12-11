'use strict';

(function () {

  var _ = require('underscore');
  var request = require('superagent');
  var cheerio = require('cheerio');
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
          var $ = cheerio.load(html);

          var links = _.chain($('a[href]').toArray().map(function (el) {
            var element = $(el);

            return element.attr('href');
          }))
          .groupBy(_.identity)
          .map(function (values, key) {
            return {
              url: key,
              number: values.length
            };
          })
          .sortBy('url')
          .value()

          json[url] = {
            title: $('title').text(),
            charset: $('meta[charset]').attr('charset') || null,
            meta: _.object($('meta[name]').toArray().map(function (el) {
              var element = $(el);

              return [element.attr('name'), element.attr('content')];
            })),
            links: links
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
