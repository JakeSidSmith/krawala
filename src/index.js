'use strict';

(function () {

  var _ = require('underscore');
  var request = require('superagent');
  var cheerio = require('cheerio');
  var parseDomain = require('parse-domain');
  var wordCount = require('word-count');
  var utils = require('./utils');

  var error = utils.error;

  var MATCHES_NO_PROTOCOL = /^\/\//;
  var MATCHES_RELATIVE_URL = /\.?\//;

  var baseDomain, urls, json, depth, format, callback;

  function getData (html) {
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
      if (link.url.indexOf('#') === 0) {
        return 'same-page';
      }

      if (link.url.indexOf('tel:') === 0) {
        return 'phone';
      }

      if (link.url.indexOf('mailto:') === 0) {
        return 'email';
      }

      var linkDomain = parseDomain(link.url.replace(MATCHES_NO_PROTOCOL, ''));

      if (!linkDomain) {
        var relativeUrl = MATCHES_RELATIVE_URL.exec(link.url);
        return relativeUrl && relativeUrl.index === 0 ? 'internal' : 'unknown';
      }

      return linkDomain.domain === baseDomain.domain &&
        linkDomain.tld === baseDomain.tld ? 'internal' : 'external';
    })
    .value();

    _.each(links.internal, function (link) {
      urls.push(link.url);
    });

    return {
      title: $('title').text() || null,
      wordCount: wordCount($('body').text()),
      charset: $('meta[charset]').attr('charset') || null,
      meta: _.object($('meta[name],meta[property]').toArray().map(function (el) {
        var element = $(el);

        return [element.attr('name') || element.attr('property'), element.attr('content')];
      })),
      links: {
        internal: links.internal || [],
        external: links.external || [],
        'same-page': links['same-page'] || [],
        email: links.email || [],
        phone: links.phone || [],
        unknown: links.unknown || []
      }
    };
  }

  function continueCrawl (url, currentDepth) {
    if (typeof currentDepth === 'undefined') {
      currentDepth = 0;
    }

    request
    .get(url)
    .accept('text/html')
    .send()
    .end(function (err, res) {
      if (err) {
        error(err);
      } else {
        if (res.type === 'text/html' && res.text && !(url in json)) {
          json[url] = getData(res.text);
        }

        if (urls.length && currentDepth < depth) {
          while (urls.length) {
            continueCrawl(urls.shift(), currentDepth + 1);
          }
        } else if (typeof process === 'object') {
          process.stdout.write(JSON.stringify(json, null, 2) + '\n'); // eslint-disable-line no-undef
        } else if (typeof callback === 'function') {
          callback(JSON.stringify(json, null, 2) + '\n');
        }
      }
    });
  }

  function crawl (options, inputCallback) {
    if (!options.url) {
      error('No url specified');
    }

    baseDomain = parseDomain(options.url);

    if (!baseDomain) {
      error('Invalid domain');
    }

    urls = [options.url];
    json = {};
    depth = options.depth;
    format = options.format;

    callback = inputCallback;

    continueCrawl(urls.shift());

  }

  module.exports = {
    crawl: crawl
  };

})();
