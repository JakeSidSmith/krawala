import { Tree } from 'jargs';

const queue = [];

export const crawl = (tree: Tree) => {
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

  const options = {
    url,
    depth: parseInt(depth, 10),
    format,
    sequence: interval && typeof interval === 'string' ? true : sequence,
    interval,
    wait
  };
};
