import { DomainInfo } from 'parse-domain';
import * as parseDomain from 'parse-domain';
import * as parseUrl from 'url-parse';

export const error = (message: string) => {
  if (typeof process === 'object' && typeof process.exit === 'function') {
    console.error(message); // tslint:disable-line no-console
    process.exit(1);
  } else {
    throw new Error(message);
  }
}

export const isSameDomain = (url: string, parentUrl: string) => {
  let parentUrlInfo = parseUrl(parentUrl);
  // Remove path
  parentUrlInfo = parseUrl('/', parentUrlInfo.href);

  let urlInfo = parseUrl(url, parentUrl);
  // Remove path
  urlInfo = parseUrl('/', urlInfo.href);

  const parentDomainInfo = parseDomain(parentUrlInfo.href);
  const domainInfo = parseDomain(urlInfo.href);

  return parentDomainInfo.domain === domainInfo.domain &&
    parentDomainInfo.tld === domainInfo.tld;
}

export const resolveUrl = (url: string, parentUrl: string) => {
  return parseUrl(url, parentUrl).href;
}

export const validateBaseUrl = (url?: string): true | void => {
  if (typeof url !== 'string' || !url) {
    return error('Invalid URL. URL cannot be empty');
  }

  const urlInfo = parseUrl(url);
  const domainInfo = parseDomain(url);

  if (!urlInfo.protocol) {
    return error('Invalid URL. URL must have an explicit protocol e.g. \'http://\'');
  }

  if (!domainInfo || !domainInfo.domain || !domainInfo.tld) {
    return error(
      'Invalid URL. Could not resolve a domain. ' +
      'Ensure the URL has a valid protocol, domain, & TLD e.g. \'http://domain.com\''
    );
  }

  return true;
}
