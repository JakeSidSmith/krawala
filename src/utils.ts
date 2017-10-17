import * as yaml from 'js-yaml';
import * as parseDomain from 'parse-domain';
import * as readline from 'readline';
import * as parseUrl from 'url-parse';
import { Progress } from './types';

const PROGRESS_LINES = 7;
const PADDING = '                ';

export const error = (message: string): void => {
  if (typeof process === 'object' && typeof process.exit === 'function') {
    console.error(message); // tslint:disable-line no-console
    process.exit(1);
  } else {
    throw new Error(message);
  }
}

export const isSameDomain = (url: string, parentUrl: string): boolean => {
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

export const getOutput = (scope: {[index: string]: any}): string => {
  switch (scope.format) {
    case 'yaml':
      return yaml.safeDump(scope.json, {indent: 2});
    case 'json':
    default:
      return JSON.stringify(scope.json, null, 2) + '\n';
  }
}

export const padLeft = (value: string | number) => {
  value = PADDING + value.toString();
  return value.substring(value.length - PADDING.length);
}

export const clearProgress = () => {
  for (let i = 0; i < PROGRESS_LINES; i += 1) {
    readline.moveCursor(process.stderr, 0, -1);
    readline.clearLine(process.stderr, 0);
  }
}

export const createProgressMessage = (progress: Progress, currentTask: string) => {
  return (
    `--------------------- Progress ---------------------


    Depth:  ${padLeft(progress.maxDepth)} / ${progress.depth}
    Urls:   ${padLeft(progress.maxCrawled)} / ${progress.crawled}
    Failed: ${padLeft(progress.failed)}
    ${currentTask}`
  );
}

export const updateProgress = (progress: Progress, currentTask: string) => {
  if (typeof process === 'object') {
    if (progress.progressMade) {
      clearProgress();
    }

    process.stderr.write(createProgressMessage(progress, currentTask));

    progress.progressMade = true;
  }
}
