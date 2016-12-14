'use strict';

(function () {

  var _ = require('underscore');
  var request = require('superagent');
  var cheerio = require('cheerio');
  var wordCount = require('word-count');
  var yaml = require('js-yaml');

  var utils = require('./utils');

  var isSameDomain = utils.isSameDomain;
  var resolveUrl = utils.resolveUrl;
  var isValidBaseUrl = utils.isValidBaseUrl;

  var PROGRESS_LINES = 7;
  var PADDING = '                ';

  function padLeft (value) {
    value = PADDING + value;
    return value.substring(value.length - PADDING.length);
  }

  function clearProgress () {
    for (var i = 0; i < PROGRESS_LINES; i += 1) {
      process.stderr.moveCursor(0, -1); // eslint-disable-line no-undef
      process.stderr.clearLine(); // eslint-disable-line no-undef
    }
  }

  function createProgressMessage (scope, currentTask) {
    return (
      '--------------------- Progress ---------------------\n\n' +
      'Depth:  {farthestDepth} / {depth}\n' +
      'Urls:   {currentUrls} / {totalUrls}\n' +
      'Failed: {failed}\n\n' +
      currentTask + '\n'
    )
    .replace('{farthestDepth}', padLeft(scope.farthestDepth))
    .replace('{depth}', scope.depth)
    .replace('{currentUrls}', padLeft(scope.urlsCrawled.length))
    .replace('{totalUrls}', scope.urlsToCrawl.length)
    .replace('{failed}', padLeft(scope.failed));
  }

  function updateProgress (scope, currentTask) {
    if (typeof process === 'object') {
      if (scope.progressMade) {
        clearProgress();
      }

      process.stderr.write(createProgressMessage(scope, currentTask)); // eslint-disable-line no-undef

      scope.progressMade = true;
    }
  }

  function markHrefsAsCrawledAndFailed (scope) {
    var crawledUrls = scope.json.urls.map(function (crawledUrl) {
      return crawledUrl.resolved;
    });

    _.each(scope.json.urls, function (crawledUrl, index) {
      if (crawledUrl.hrefs) {
        _.each(crawledUrl.hrefs.internal, function (href, hrefIndex) {
          var crawledIndex = crawledUrls.indexOf(href.resolved);

          if (crawledIndex >= 0) {
            scope.json.urls[index].hrefs.internal[hrefIndex].crawled = true;
            scope.json.urls[index].hrefs.internal[hrefIndex].failed = scope.json.urls[crawledIndex].failed;
            scope.json.urls[index].hrefs.internal[hrefIndex].type = scope.json.urls[crawledIndex].type;
            scope.json.urls[index].hrefs.internal[hrefIndex].status = scope.json.urls[crawledIndex].status;
          } else {
            scope.json.urls[index].hrefs.internal[hrefIndex].crawled = false;
          }
        });
      }
    });
  }

  function getFailedUrls (scope) {
    return _.chain(scope.json.urls)
    .filter(function (crawledUrl) {
      return crawledUrl.failed;
    })
    .map(function (crawledUrl) {
      return {
        url: crawledUrl.url,
        resolved: crawledUrl.resolved,
        linkedFrom: _.chain(scope.json.urls)
        .filter(function (possiblyLinkedFrom) {
          return possiblyLinkedFrom.hrefs && _.any(possiblyLinkedFrom.hrefs.internal, function (href) {
            return href.url === crawledUrl.url;
          });
        })
        .map(function (linkedFrom) {
          return linkedFrom.resolved;
        })
      };
    })
    .sortBy('url')
    .value();
  }

  function getHrefs (scope, url, $) {
    return _.chain($('a[href]').toArray().map(function (el) {
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
    .groupBy(function (href) {
      if (href.url.indexOf('#') === 0) {
        return 'samePage';
      }

      if (href.url.indexOf('tel:') === 0) {
        return 'phone';
      }

      if (href.url.indexOf('mailto:') === 0) {
        return 'email';
      }

      return isSameDomain(href.url, scope.baseUrl.resolved) ? 'internal' : 'external';
    })
    .value();
  }

  function getAttribs ($, selector) {
    return _.chain($(selector).toArray())
    .map(function (link) {
      return link.attribs;
    })
    .value();
  }

  function getData (scope, res, url) {
    var $ = cheerio.load(res.text);

    var hrefs = getHrefs(scope, url, $);

    return {
      url: url.url,
      resolved: url.resolved,
      failed: false,
      type: res.type,
      status: res.status,
      title: $('title').text() || null,
      wordCount: wordCount($('body').text()),
      charset: $('meta[charset]').attr('charset') || null,
      meta: getAttribs($, 'meta[name],meta[property]'),
      links: getAttribs($, 'link[rel]'),
      scripts: getAttribs($, 'script[src]'),
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

  function getOutput (scope) {
    switch (scope.format) {
      case 'yaml':
        return yaml.safeDump(scope.json, {indent: 2});
      case 'json':
      default:
        return JSON.stringify(scope.json, null, 2) + '\n';
    }
  }

  function complete (scope) {
    markHrefsAsCrawledAndFailed(scope);

    scope.json.failedUrls = getFailedUrls(scope);;
    scope.json.totalUrlsCrawled = _.size(scope.json.urls);
    scope.json.totalFailedUrls = _.size(scope.json.failedUrls);;

    if (typeof process === 'object') {
      process.stdout.write(getOutput(scope)); // eslint-disable-line no-undef
    } else if (typeof scope.callback === 'function') {
      scope.callback(getOutput(scope));
    }
  }

  function continueCrawl (scope, url, currentDepth, then) {
    if (currentDepth > scope.farthestDepth) {
      scope.farthestDepth = currentDepth;
    }

    updateProgress(scope, 'Crawling: ' + url.resolved);

    request
    .get(url.resolved)
    .accept('text/html')
    .send()
    .end(function (err, res) {
      scope.urlsCrawled.push(url.resolved);
      updateProgress(scope, 'Crawled: ' + url.resolved);

      if (err) {
        scope.failed += 1;

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
          _.each(scope.json.urls[index].hrefs.internal, function (href) {
            if (scope.urlsToCrawl.indexOf(href.resolved) < 0) {
              scope.urlsToCrawl.push(href.resolved);
              scope.queue.push(continueCrawl.bind(null, scope, href, currentDepth + 1));
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

      if (typeof then === 'function') {
        then();
      }

      if (scope.urlsToCrawl.length === scope.urlsCrawled.length) {
        complete(scope);
      }
    });
  }

  function runCrawl (scope) {
    if (scope.parallel) {
      while (scope.queue.length) {
        scope.queue.shift()(runCrawl.bind(null, scope));
      }
    } else if (scope.queue.length) {
      if (scope.interval) {
        setTimeout(function () {
          scope.queue.shift()(runCrawl.bind(null, scope));
        }, scope.interval);
      } else {
        scope.queue.shift()(runCrawl.bind(null, scope));
      }
    }
  }

  function crawl (options) {
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
      queue: [],
      farthestDepth: 0,
      failed: 0,
      depth: options.depth,
      format: options.format,
      callback: options.callback,
      parallel: options.parallel,
      interval: options.interval
    };

    scope.queue.push(continueCrawl.bind(null, scope, scope.baseUrl, 0));

    runCrawl(scope);

  }

  module.exports = {
    crawl: crawl
  };

})();
