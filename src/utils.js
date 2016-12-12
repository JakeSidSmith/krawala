'use strict';

(function () {

  var parseUrl = require('url-parse');
  var parseDomain = require('parse-domain');

  function error (message) {
    if (typeof process === 'object') {
      console.error(message);
      process.exit(1); // eslint-disable-line no-undef
    } else {
      throw new Error(message);
    }
  }

  function isSameDomain (url, parentUrl) {
    var parentUrlInfo = parseUrl(parentUrl);
    var urlInfo = parseUrl(url, parentUrl);

    var parentDomainInfo = parseDomain(parentUrlInfo.href);
    var domainInfo = parseDomain(urlInfo.href);

    return parentDomainInfo.domain === domainInfo.domain &&
      parentDomainInfo.tld === domainInfo.tld;
  }

  function resolveUrl (url, parentUrl) {
    return parseUrl(url, parentUrl).href;
  }

  function isValidBaseUrl (url) {
    if (!url) {
      error('Invalid URL. URL cannot be empty');
    }

    var urlInfo = parseUrl(url);
    var domainInfo = parseDomain(url);

    if (!urlInfo.protocol) {
      error('Invalid URL. URL must have an explicit protocol e.g. \'http://\'');
    }

    if (!domainInfo || !domainInfo.domain || !domainInfo.tld) {
      error(
        'Invalid URL. Could not resolve a domain. ' +
        'Ensure the URL has a valid protocol, domain, & TLD e.g. \'http://domain.com\''
      );
    }

    return true;
  }

  module.exports = {
    error: error,
    isSameDomain: isSameDomain,
    resolveUrl: resolveUrl,
    isValidBaseUrl: isValidBaseUrl
  };

})();
