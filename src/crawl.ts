import { Tree } from 'jargs';
import { validateBaseUrl } from './utils';

export interface RequiredOptions {
  kwargs: {
    url: string;
  }
}

interface Options {
  url: string;
  depth: number;
  format: string;
  sequence: boolean;
  interval?: number;
  wait: boolean;
}

let options: Options;
const queue = [];

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
    depth: parseInt(depth, 10),
    format,
    sequence: interval && typeof interval === 'string' ? true : sequence,
    interval: interval && typeof interval === 'string' ? parseInt(interval, 10) : undefined,
    wait
  };
};
