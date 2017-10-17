import { Tree } from 'jargs';
import * as request from 'superagent';
import { Crawlable, Crawled, Options, Page, Progress, RequiredOptions } from './types';
import { isSameDomain, resolveUrl, updateProgress, validateBaseUrl } from './utils';

let options: Options;
const queue: Array<Crawlable & Partial<Crawled>> = [];
const pages: Array<Crawlable & Partial<Page>> = [];
const progress: Progress = {
  depth: 0,
  urlsToCrawl: [],
  urlsCrawled: [],
  failed: 0,
  progressMade: false
};

const enqueue = (node: Crawlable) => {
  progress.urlsToCrawl.push(node.resolved);
  queue.push(node);
};

const crawlNode = (node: Crawlable & Partial<Crawled>, then?: () => void) => {
  node.internal = isSameDomain(node.resolved, options.resolved);

  if (node.depth > progress.depth) {
    progress.depth = node.depth;
  }

  updateProgress(options, progress, `Crawling: ${node.resolved}`);

  request
    .get(node.resolved)
    .accept('text/html')
    .send()
    .end((error, response) => {
      progress.urlsCrawled.push(progress.urlsToCrawl.slice(progress.urlsToCrawl.indexOf(node.resolved), 1)[0]);

      if (error) {
        progress.failed += 1;

        node.failed = true,
        node.type = error.type || null,
        node.status = error.status || null
      } else if (node.internal && response.type === 'text/html' && response.text) {

      } else {
        node.failed = false;
        node.type = response.type;
        node.status = response.status;
      }

      updateProgress(options, progress, `Crawled:  ${node.resolved}`);
    });
};

const crawlQueue = () => {
  if (!options.sequence) {
    while (queue.length) {
      const node = queue.shift();

      if (node) {
        crawlNode(node, crawlQueue);
      }
    }
  }
};

export const crawl = (tree: Tree & RequiredOptions) => {
  const {
    kwargs: {
      url,
      depth = '10',
      format = 'json',
      interval
    },
    flags: {
      sequence = false,
      wait = false
    }
  } = tree;

  validateBaseUrl(url);

  options = {
    url,
    resolved: resolveUrl(url),
    depth: parseInt(depth, 10),
    format,
    sequence: interval && typeof interval === 'string' ? true : sequence,
    interval: interval && typeof interval === 'string' ? parseInt(interval, 10) : undefined,
    wait
  };

  pages.push({url, depth: 0, resolved: resolveUrl(url)});
  enqueue(pages[pages.length - 1]);

  crawlQueue();
};

export default crawl;
