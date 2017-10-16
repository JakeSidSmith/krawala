export interface Progress {
  maxDepth: number;
  depth: number;
  maxCrawled: number;
  crawled: number;
  failed: number;
  progressMade: boolean;
}
