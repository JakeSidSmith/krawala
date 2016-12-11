'use strict';

(function () {

  var _ = require('underscore');
  var request = require('superagent');
  var cheerio = require('cheerio');
  var parseDomain = require('parse-domain');
  var utils = require('./utils');

  var error = utils.error;

  var MATCHES_RELATIVE_URL = /\.?\//;

  function crawl(options, callback) {
    if (!options.url) {
      error('No url specified');
    }

    var baseDomain = parseDomain(options.url);

    if (!baseDomain) {
      error('Invalid domain');
    }

    var urls = [options.url];
    var json = {};
    var depth = options.depth;
    var format = options.format;

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
              references: values.length
            };
          })
          .sortBy('url')
          .groupBy(function (link) {
            var linkDomain = parseDomain(link.url.replace(/^\/\/(\w)/, '$1'));

            if (!linkDomain) {
              var relativeUrl = MATCHES_RELATIVE_URL.exec(link.url);
              return relativeUrl && relativeUrl.index === 0 ? 'internal' : 'unknown';
            }

            return linkDomain.domain === baseDomain.domain &&
              linkDomain.tld === baseDomain.tld ? 'internal' : 'external';
          })
          .value();

          json[url] = {
            title: $('title').text() || null,
            charset: $('meta[charset]').attr('charset') || null,
            meta: _.object($('meta[name]').toArray().map(function (el) {
              var element = $(el);

              return [element.attr('name'), element.attr('content')];
            })),
            links: {
              internal: links.internal || [],
              external: links.external || [],
              unknown: links.unknown || []
            }
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
