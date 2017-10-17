import { Tree } from 'jargs';
import { Crawlable, Crawled, Options, Page, Progress, RequiredOptions } from './types';
import { isSameDomain, resolveUrl, validateBaseUrl } from './utils';

const progress: Progress = {
  depth: 0,
  maxCrawled: 0,
  crawled: 0,
  failed: 0,
  progressMade: false
};
let options: Options;
const queue: Array<Crawlable & Partial<Crawled>> = [];
const pages: Array<Crawlable & Partial<Page>> = [];

const enqueue = (node: Crawlable) => {
  queue.push(node);
};

const crawlNode = (node: Crawlable & Partial<Crawled>, then?: () => void) => {
  node.resolved = resolveUrl(node.url);
  node.internal = isSameDomain(node.resolved, options.resolved);
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

  pages.push({url});
  enqueue(pages[pages.length - 1]);

  crawlQueue();
};

export default crawl;
