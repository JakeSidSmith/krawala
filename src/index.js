'use strict';

(function () {

  var _ = require('underscore');
  var request = require('superagent');
  var cheerio = require('cheerio');
  var wordCount = require('word-count');

  var utils = require('./utils');

  var isSameDomain = utils.isSameDomain;
  var resolveUrl = utils.resolveUrl;
  var isValidBaseUrl = utils.isValidBaseUrl;

  function getData (scope, res, url) {
    var $ = cheerio.load(res.text);

    var hrefs = _.chain($('a[href]').toArray().map(function (el) {
      var element = $(el);

      return element.attr('href');
    }))
    .groupBy(_.identity)
    .map(function (values, key) {
      return {
        url: key,
        resolved: resolveUrl(key, url.resolved),
        references: values.length
      };
    })
    .sortBy('url')
    .groupBy(function (link) {
      if (link.url.indexOf('#') === 0) {
        return 'samePage';
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
      url: url.url,
      resolved: url.resolved,
      failed: false,
      type: res.type,
      status: res.status,
      title: $('title').text() || null,
      wordCount: wordCount($('body').text()),
      charset: $('meta[charset]').attr('charset') || null,
      meta: _.object($('meta[name],meta[property]').toArray().map(function (el) {
        var element = $(el);

        return [element.attr('name') || element.attr('property'), element.attr('content')];
      })),
      h1: $('h1').first().text() || null,
      h2: $('h2').first().text() || null,
      h3: $('h3').first().text() || null,
      p: $('p').first().text() || null,
      hrefs: {
        internal: hrefs.internal || [],
        external: hrefs.external || [],
        samePage: hrefs.samePage || [],
        email: hrefs.email || [],
        phone: hrefs.phone || []
      }
    };
  }

  function continueCrawl (scope, url, currentDepth) {
    request
    .get(url.resolved)
    .accept('text/html')
    .send()
    .end(function (err, res) {
      scope.urlsCrawled.push(url.resolved);

      if (err) {
        scope.json.urls.push({
          url: url.url,
          resolved: url.resolved,
          failed: true,
          type: err.type || null,
          status: err.status || null
        });
      } else if (res.type === 'text/html' && res.text) {
        scope.json.urls.push(getData(scope, res, url));

        var index = scope.json.urls.length - 1;

        if (currentDepth < scope.depth) {
          _.each(scope.json.urls[index].hrefs.internal, function (link) {
            if (scope.urlsToCrawl.indexOf(link.resolved) < 0) {
              scope.urlsToCrawl.push(link.resolved);
              continueCrawl(scope, link, currentDepth + 1);
            }
          });
        }
      } else {
        scope.json.urls.push({
          url: url.url,
          resolved: url.resolved,
          failed: false,
          type: res.type,
          status: res.status
        });
      }

      if (scope.urlsToCrawl.length === scope.urlsCrawled.length) {
        var failedUrls = _.chain(scope.json.urls)
        .filter(function (crawledUrl) {
          return crawledUrl.failed;
        })
        .map(function (crawledUrl) {
          return {
            url: crawledUrl.url,
            resolved: crawledUrl.resolved,
            linkedFrom: _.chain(scope.json.urls)
            .filter(function (possiblyLinkedFrom) {
              return possiblyLinkedFrom.hrefs && _.any(possiblyLinkedFrom.hrefs.internal, function (link) {
                return link.url === crawledUrl.url;
              });
            })
            .map(function (linkedFrom) {
              return linkedFrom.resolved;
            })
          };
        })
        .value();

        var totalUrlsCrawled = _.size(scope.json.urls);
        var totalFailedUrls = _.size(failedUrls);

        _.each(scope.json.urls, function (crawledUrl, index) {
          if (crawledUrl.hrefs) {
            _.each(crawledUrl.hrefs.internal, function (link, linkIndex) {
              if (link.resolved in scope.json) {
                scope.json.urls[index].hrefs.internal[linkIndex].crawled = true;
                scope.json.urls[index].hrefs.internal[linkIndex].failed = scope.json[link.resolved].failed;
                scope.json.urls[index].hrefs.internal[linkIndex].type = scope.json[link.resolved].type;
                scope.json.urls[index].hrefs.internal[linkIndex].status = scope.json[link.resolved].status;
              } else {
                scope.json.urls[index].hrefs.internal[linkIndex].crawled = false;
              }
            });
          }
        });

        scope.json.failedUrls = failedUrls;
        scope.json.totalUrlsCrawled = totalUrlsCrawled;
        scope.json.totalFailedUrls = totalFailedUrls;

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
      json: {
        urls: []
      },
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

    continueCrawl(scope, scope.baseUrl, 0);

  }

  module.exports = {
    crawl: crawl
  };

})();
