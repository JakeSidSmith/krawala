export interface RequiredOptions {
  kwargs: {
    url: string;
  }
}

export interface Options {
  url: string;
  resolved: string;
  depth: number;
  format: string;
  sequence: boolean;
  interval?: number;
  wait: boolean;
}

export interface Progress {
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
  depth: number;
  url: string;
}

export interface Crawled extends Crawlable {
  resolved: string;
  internal: boolean;
  failed: boolean;
  status: number;
  type: string | null;
}

export interface Link extends Crawled {
  attributes: Partial<{
    rel: string;
    type: string;
    href: string;
  }>
}

export interface Script extends Crawled {
  attributes: Partial<{
    type: string;
    src: string;
  }>
}

export interface Image extends Crawled {
  attributes: Partial<{
    src: string;
  }>
}

export type Page = Crawled & Partial<{
  charset: string;
  title: string;
  wordCount: number;
  content: Content;
  meta: Meta[];
  links: Link[];
  scripts: Script[];
  images: Image[];
  hrefs: Crawled[];
}>
