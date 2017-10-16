export interface Progress {
  maxDepth: number;
  depth: number;
  maxCrawled: number;
  crawled: number;
  failed: number;
  progressMade: boolean;
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

export interface Crawlable {
  resolved: string;
  failed: boolean;
  internal: boolean;
  status: number;
  type: string | null;
}

export type Link = Partial<{
  rel: string;
  type: string;
  href: string;
}> & Crawlable

export type Script = Partial<{
  type: string;
  src: string;
}> & Crawlable

export type Image = Partial<{
  src: string;
}> & Crawlable

export type Result = {
  url: string;
} & Partial<{
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
