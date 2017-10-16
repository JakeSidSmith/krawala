export interface Progress {
  maxDepth: number;
  depth: number;
  maxCrawled: number;
  crawled: number;
  failed: number;
  progressMade: boolean;
}

export interface Crawlable {
  url: string;
  resolved: string;
  failed: boolean;
  status: number;
  type: string | null;
}

export type Content = Partial<{
  h1: string;
  h2: string;
  h3: string;
  p: string;
}>

export type Meta = Partial<{
  name: string;
  content: string;
}>

export type Link = Partial<{
  rel: string;
  type: string;
  href: string;
}>

export type Script = Partial<{
  type: string;
  src: string;
}>

export type Image = Partial<{
  src: string;
}>

export type Result = Partial<{
  charset: string;
  title: string;
  wordCount: number;
  content: Content;
  meta: Meta[];
  links: Link[];
  scripts: Script[];
  images: Image[];
  hrefs: Crawlable[];
}> & Crawlable
