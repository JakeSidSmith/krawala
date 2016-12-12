'use strict';

(function () {

  var _ = require('underscore');
  var request = require('superagent');
  var cheerio = require('cheerio');
  var wordCount = require('word-count');

  var utils = require('./utils');

  var error = utils.error;
  var isSameDomain = utils.isSameDomain;
  var resolveUrl = utils.resolveUrl;
  var isValidBaseUrl = utils.isValidBaseUrl;

  function getData (scope, html, parentUrl) {
    var $ = cheerio.load(html);

    var links = _.chain($('a[href]').toArray().map(function (el) {
      var element = $(el);

      return element.attr('href');
    }))
    .groupBy(_.identity)
    .map(function (values, key) {
      return {
        url: key,
        resolved: resolveUrl(key, parentUrl),
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

      return isSameDomain(link.url, scope.baseUrl.resolved) ? 'internal' : 'external';
    })
    .value();

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

  function continueCrawl (scope, url) {
    request
    .get(url)
    .accept('text/html')
    .send()
    .end(function (err, res) {
      if (err) {
        error(err);
      } else {
        if (res.type === 'text/html' && res.text && !(url in scope.json)) {
          scope.json[url] = getData(scope, res.text, url);
        }

        // if (urls.length && currentDepth < depth) {
        //   while (urls.length) {
        //     var childUrl = urls.shift();
        //
        //     continueCrawl(childUrl, url, currentDepth + 1);
        //   }
        // }
        if (typeof process === 'object') {
          process.stdout.write(JSON.stringify(scope.json, null, 2) + '\n'); // eslint-disable-line no-undef
        } else if (typeof scope.callback === 'function') {
          scope.callback(JSON.stringify(scope.json, null, 2) + '\n');
        }
      }
    });
  }

  function crawl (options, callback) {
    isValidBaseUrl(options.url);

    var resolvedUrl = resolveUrl(options.url);

    var scope = {
      json: {},
      currentDepth: 0,
      baseUrl: {
        url: options.url,
        resolved: resolvedUrl
      },
      urlsToCrawl: [resolvedUrl],
      urlsCrawled: [],
      depth: options.depth,
      format: options.format,

      callback: callback
    };

    continueCrawl(scope, scope.urlsToCrawl[0]);

  }

  module.exports = {
    crawl: crawl
  };

})();
