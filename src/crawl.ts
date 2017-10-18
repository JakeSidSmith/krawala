import { Tree } from 'jargs';
import * as request from 'request';
import * as _ from 'underscore';
import {
  Crawlable,
  Crawled,
  Options,
  Page,
  Progress,
  RequiredOptions
} from './types';
import {
  collectData,
  complete,
  getFailed,
  isSameDomain,
  resolveUrl,
  updateProgress,
  validateBaseUrl
} from './utils';

const MATCHES_TEXT_HTML = /\btext\s*\/\s*html\b/i;

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36';

const REQUEST_OPTIONS = {
  method: 'GET',
  headers: {
    'User-Agent': USER_AGENT
  }
};

let options: Options;
const crawled: {[index: string]: Partial<Crawled> | undefined} = {};
const queue: Array<Crawlable & Partial<Crawled>> = [];
const pages: Array<Crawlable & Partial<Page>> = [];
const externalPages: Array<Crawlable & Partial<Crawled>> = [];
const progress: Progress = {
  depth: 0,
  urlsToCrawl: [],
  urlsCrawled: [],
  failed: [],
  progressMade: false
};

const enqueue = (node: Crawlable) => {
  progress.urlsToCrawl.push(node.resolved);
  queue.push(node);
};

let crawlQueue: () => void;

const crawlNode = (node: Crawlable & Partial<Crawled>) => {
  node.internal = isSameDomain(node.resolved, options.resolved);

  if (node.depth > progress.depth) {
    progress.depth = node.depth;
  }

  if (!crawled.hasOwnProperty(node.resolved)) {
    crawled[node.resolved] = {
      url: node.url,
      resolved: node.resolved,
      depth: node.depth,
      internal: node.internal
    };
  }

  updateProgress(options, progress, `Crawling: ${node.resolved}`);

  request
    .get(node.resolved, {...REQUEST_OPTIONS, timeout: options.timeout}, (error, response, body) => {
      progress.urlsCrawled.push(node.resolved);

      const status = response.statusCode;
      const contentType = response.headers['content-type'];
      const type = Array.isArray(contentType) ? `[${contentType.join(', ')}]` : contentType;

      if (error) {
        progress.failed.push(node.resolved);

        node.failed = true,
        node.type = error.type || null,
        node.status = error.status || null
      } else {
        node.failed = false;
        node.type = type;
        node.status = status;

        if (node.internal && MATCHES_TEXT_HTML.test(type) && body) {
          const data = collectData(node as Crawled, body, options.resolved);

          _.extend(node, data);

          const page = node as Page;

          if (node.depth < options.depth) {
            page.hrefs.internal.forEach((subPage) => {
              const { url, resolved } = subPage;

              if (progress.urlsToCrawl.indexOf(resolved) < 0) {
                pages.push({url, resolved, depth: node.depth + 1});
                enqueue(pages[pages.length - 1]);
              }
            });

            page.hrefs.external.forEach((externalPage, index) => {
              const { url, resolved } = externalPage;

              if (progress.urlsToCrawl.indexOf(resolved) < 0) {
                externalPages.push({url, resolved, depth: node.depth + 1});
                enqueue(externalPages[externalPages.length - 1]);
              }
            });
          }
        } else {
          node.failed = false;
          node.type = type;
          node.status = status;
        }
      }

      const crawledNode = crawled[node.resolved];

      if (typeof crawledNode === 'object') {
        crawledNode.failed = node.failed;
        crawledNode.type = node.type;
        crawledNode.status = node.status;
      }

      updateProgress(options, progress, `Crawled:  ${node.resolved}`);

      if (progress.urlsToCrawl.length === progress.urlsCrawled.length) {
        complete(options, {pages, externalPages, failed: getFailed(crawled)});
      } else if (options.interval) {
        setTimeout(crawlQueue, options.interval);
      } else {
        crawlQueue();
      }
    });
};

crawlQueue = () => {
  const node = queue.shift();

  if (node) {
    crawlNode(node);
  }
};

export const crawl = (tree: Tree & RequiredOptions) => {
  const {
    kwargs: {
      url,
      depth = '10',
      format = 'json',
      interval,
      timeout = '10000'
    },
    flags: {
      wait = false
    }
  } = tree;

  validateBaseUrl(url);

  options = {
    url,
    resolved: resolveUrl(url),
    depth: parseInt(depth, 10),
    format,
    interval: interval && typeof interval === 'string' ? parseInt(interval, 10) : undefined,
    wait,
    timeout: parseInt(timeout, 10)
  };

  pages.push({url, resolved: resolveUrl(url), depth: 0});
  enqueue(pages[pages.length - 1]);

  crawlQueue();
};

export default crawl;
