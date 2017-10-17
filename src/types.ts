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
  callback?: (output: string) => any;
}

export interface Progress {
  depth: number;
  urlsToCrawl: string[];
  urlsCrawled: string[];
  failed: string[];
  progressMade: boolean;
}

export interface Meta {
  attributes: Partial<{
    name: string;
    content: string;
  }>
}

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

export interface Link {
  attributes: Partial<{
    rel: string;
    type: string;
    href: string;
  }>
}

export interface Script {
  attributes: Partial<{
    type: string;
    src: string;
  }>
}

export interface Image {
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

export type PageData = Partial<{
  charset: string | null;
  title: string | null;
  wordCount: number | null;
  content: Content;
  meta: Meta[];
  links: Link[];
  scripts: Script[];
  images: Image[];
  hrefs: {
    internal: Array<Partial<Crawled>>;
    external: Array<Partial<Crawled>>;
    samePage: Array<Partial<Crawled>>;
    email: Array<Partial<Crawled>>;
    phone: Array<Partial<Crawled>>;
  };
}>

export type Page = Crawled & PageData;
