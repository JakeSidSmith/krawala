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
  url: string;
  resolved: string;
  failed: boolean;
  internal: boolean;
  status: number;
  type: string | null;
}

export interface Link extends Crawlable {
  attributes: Partial<{
    rel: string;
    type: string;
    href: string;
  }>
}

export interface Script extends Crawlable {
  attributes: Partial<{
    type: string;
    src: string;
  }>
}

export interface Image extends Crawlable {
  attributes: Partia<{
    src: string;
  }>
}

export type Page = Crawlable & Partial<{
  charset: string;
  title: string;
  wordCount: number;
  content: Content;
  meta: Meta[];
  links: Link[];
  scripts: Script[];
  images: Image[];
  hrefs: Crawlable[];
}>
