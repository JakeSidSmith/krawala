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
  urlsToCrawl: string[];
  urlsCrawled: string[];
  failed: string[];
  progressMade: boolean;
}

export type Meta = Partial<{
  name: string;
  content: string;
}>

export interface Crawlable {
  depth: number;
  url: string;
  resolved: string;
}

export interface Crawled extends Crawlable {
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

export type Content = Partial<{
  h1: string | null;
  h2: string | null;
  h3: string | null;
  p: string | null;
}>

export type Page = Crawled & Partial<{
  charset: string | null;
  title: string | null;
  wordCount: number | null;
  content: Content;
  meta: Meta[];
  links: Link[];
  scripts: Script[];
  images: Image[];
  hrefs: Crawled[];
}>
