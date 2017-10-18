import { Tree } from 'jargs';
import * as request from 'request';
import * as _ from 'underscore';
import {
  Crawled,
  Href,
  Options,
  Output,
  OutputLinks,
  Page,
  PartiallyCrawled,
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

const crawled: {[index: string]: PartiallyCrawled} = {};
const queue: PartiallyCrawled[] = [];

const progress: Progress = {
  depth: 0,
  urlsToCrawl: [],
  urlsCrawled: [],
  failed: [],
  progressMade: false
};

const output: Output = {
  pages: [],
  externalPages: [],
  failed: []
};

const enqueue = (node: PartiallyCrawled) => {
  progress.urlsToCrawl.push(node.resolved);
  queue.push(node);
};

const storeNode = (node: PartiallyCrawled) => {
  crawled[node.resolved] = node;
};

const storeSubNode = (node: PartiallyCrawled, href: Href, key: keyof OutputLinks) => {
  const { url, resolved } = href;

  const subNode = {
    url,
    resolved,
    depth: node.depth + 1,
    internal: isSameDomain(resolved, options.resolved),
    linkedFrom: [node.resolved]
  };

  if (progress.urlsToCrawl.indexOf(resolved) < 0) {
    output[key].push(subNode);
    enqueue(subNode);
  }

  const subCrawledNode = crawled[resolved];

  if (typeof subCrawledNode === 'object') {
    subCrawledNode.linkedFrom.push(node.resolved);
  } else {
    storeNode(subNode);
  }
};

let crawlQueue: () => void;

const crawlNode = (node: PartiallyCrawled) => {
  if (node.depth > progress.depth) {
    progress.depth = node.depth;
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
            page.hrefs.internal.forEach((href) => storeSubNode(node, href, 'pages'));
            page.hrefs.external.forEach((href) => storeSubNode(node, href, 'externalPages'));
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
        complete(options, {...output, failed: getFailed(crawled)});
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

  const node = {
    url,
    resolved: resolveUrl(url),
    depth: 0,
    internal: true,
    linkedFrom: []
  };

  output.pages.push(node);
  enqueue(node);

  crawlQueue();
};

export default crawl;
