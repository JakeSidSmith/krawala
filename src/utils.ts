import * as cheerio from 'cheerio';
import * as yaml from 'js-yaml';
import * as parseDomain from 'parse-domain';
import * as readline from 'readline';
import * as _ from 'underscore';
import * as parseUrl from 'url-parse';
import * as wordCount from 'word-count';
import {
  Attributes,
  Crawled,
  LinkScriptImageOrHref,
  Options,
  Output,
  Page,
  PageData,
  PartiallyCrawled,
  Progress,
} from './types';

const PROGRESS_LINES = 8;
const PADDING = '                ';

export const error = (message: string): void => {
  if (typeof (process as any) === 'object' && typeof (process as any).exit === 'function') {
    console.error(message); // tslint:disable-line no-console
    process.exit(1);
  } else {
    throw new Error(message);
  }
};

export const isSameDomain = (url: string, parentUrl: string): boolean => {
  let parentUrlInfo = parseUrl(parentUrl);
  // Remove path
  parentUrlInfo = parseUrl('/', parentUrlInfo.href);

  let urlInfo = parseUrl(url, parentUrl);
  // Remove path
  urlInfo = parseUrl('/', urlInfo.href);

  const parentDomainInfo = parseDomain(parentUrlInfo.href);
  const domainInfo = parseDomain(urlInfo.href);

  return parentDomainInfo && domainInfo ?
    parentDomainInfo.domain === domainInfo.domain &&
    parentDomainInfo.tld === domainInfo.tld :
    false;
};

export const resolveUrl = (url: string, parentUrl?: string) => {
  return parseUrl(url, parentUrl).href;
};

export const validateBaseUrl = (url: string): true | void => {
  if (!url) {
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
};

export const padLeft = (value: string | number) => {
  value = PADDING + value.toString();
  return value.substring(value.length - PADDING.length);
};

export const clearProgress = () => {
  for (let i = 0; i < PROGRESS_LINES; i += 1) {
    readline.moveCursor(process.stderr, 0, -1);
    readline.clearLine(process.stderr, 0);
  }
};

export const createProgressMessage = (options: Options, progress: Progress, currentTask: string) => {
  return `
--------------------- Progress ---------------------

Depth:  ${padLeft(progress.depth)} / ${options.depth}
Urls:   ${padLeft(progress.urlsCrawled.length)} / ${progress.urlsToCrawl.length}
Failed: ${padLeft(progress.failed.length)}
${currentTask}

`;
};

export const updateProgress = (options: Options, progress: Progress, currentTask: string) => {
  if (typeof (process as any) === 'object') {
    if (progress.progressMade) {
      clearProgress();
    }

    process.stderr.write(createProgressMessage(options, progress, currentTask));

    progress.progressMade = true;
  }
};

export const resolveLinkScriptImageOrHref = (
  attribsList: Attributes[],
  url: string,
  baseUrl: string,
  linkKey: string
) => {
  return attribsList.map((attribs) => ({
    url: attribs[linkKey],
    resolved: resolveUrl(attribs[linkKey], url),
    references: attribsList.filter((otherAttribs) => attribs[linkKey] === otherAttribs[linkKey]).length,
    attributes: attribs,
  }));
};

export const groupHrefs = (resolvedHrefs: LinkScriptImageOrHref[], baseUrl: string) => {
  return _.groupBy(resolvedHrefs, (href): string => {
    if (href.url.indexOf('#') === 0) {
      return 'samePage';
    }

    if (href.url.indexOf('tel:') === 0) {
      return 'phone';
    }

    if (href.url.indexOf('mailto:') === 0) {
      return 'email';
    }

    return isSameDomain(href.resolved, baseUrl) ? 'internal' : 'external';
  });
};

export const collectData = (node: Crawled & Partial<Page>, text: string, baseUrl: string): PageData => {
  const $ = cheerio.load(text);

  const hrefAttribs = $('a[href]').toArray().map((element) => element.attribs);

  const hrefResolved = resolveLinkScriptImageOrHref(hrefAttribs, node.resolved, baseUrl, 'href');
  const groupedHrefs = groupHrefs(hrefResolved, baseUrl);

  const linksAttribs = $('link[href]').toArray().map((element) => element.attribs);
  const linksResolved = resolveLinkScriptImageOrHref(linksAttribs, node.resolved, baseUrl, 'href');

  const scriptsAttribs = $('script[src]').toArray().map((element) => element.attribs);
  const scriptsResolved = resolveLinkScriptImageOrHref(scriptsAttribs, node.resolved, baseUrl, 'src');

  const imagesAttribs = $('img[src]').toArray().map((element) => element.attribs);
  const imagesResolved = resolveLinkScriptImageOrHref(imagesAttribs, node.resolved, baseUrl, 'src');

  return {
    title: $('title').text() || null,
    wordCount: wordCount($('body').text()),
    charset: $('meta[charset]').attr('charset') || null,
    meta: $('meta[name],meta[property]').toArray().map((element) => ({attributes: element.attribs})),
    links: linksResolved,
    scripts: scriptsResolved,
    images: imagesResolved,
    content: {
      h1: $('h1').first().text() || null,
      h2: $('h2').first().text() || null,
      h3: $('h3').first().text() || null,
      p: $('p').first().text() || null,
    },
    hrefs: {
      internal: groupedHrefs.internal || [],
      external: groupedHrefs.external || [],
      samePage: groupedHrefs.samePage || [],
      email: groupedHrefs.email || [],
      phone: groupedHrefs.phone || [],
    },
  };
};

export const getOutput = (options: Options, pages: {[index: string]: any} | any[]): string => {
  switch (options.format) {
    case 'yaml':
      return yaml.safeDump(pages, {indent: 2});
    case 'json':
    default:
      return JSON.stringify(pages, null, 2) + '\n';
  }
};

export const complete = (options: Options, pages: Output) => {
  if (typeof (process as any) === 'object' && typeof (process.stdout as any) !== 'undefined') {
    process.stdout.write(getOutput(options, pages));
  } else if (typeof options.callback === 'function') {
    options.callback(getOutput(options, pages));
  }
};

export const getFailed = (crawled: {[index: string]: PartiallyCrawled | undefined}): PartiallyCrawled[] => {
  return _.toArray<PartiallyCrawled>(crawled).filter((crawledNode) => crawledNode.failed);
};
