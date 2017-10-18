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
  interval?: number;
  wait: boolean;
  timeout: number;
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
  attributes: {
    name: string;
    content: string;
  }
}

export interface Crawlable {
  url: string;
  resolved: string;
  depth: number;
  internal: boolean;
  linkedFrom: string[];
}

export interface Crawled extends Crawlable {
  failed: boolean;
  status: number;
  type: string | string[] | null;
}

export type Link = {
  attributes: {
    href: string;
  }
} & {
  attributes: Partial<{
    rel: string;
    type: string;
  }>
}

export type Script = {
  attributes: {
    src: string;
  }
} & {
  attributes: Partial<{
    type: string;
  }>
}

export interface Image {
  attributes: {
    src: string;
  }
}

export interface Href {
  url: string;
  resolved: string;
  references: number;
}

export type Content = Partial<{
  h1: string | null;
  h2: string | null;
  h3: string | null;
  p: string | null;
}>

export interface RequiredPageData {
  content: Content;
  meta: Meta[];
  links: Link[];
  scripts: Script[];
  images: Image[];
  hrefs: {
    internal: Href[];
    external: Href[];
    samePage: Href[];
    email: Href[];
    phone: Href[];
  }
}

export type PageData = RequiredPageData & Partial<{
  charset: string | null;
  title: string | null;
  wordCount: number | null;
}>

export type Page = Crawled & PageData;

export type PartiallyCrawled = Crawlable & Partial<Crawled>;

export interface OutputLinks {
  pages: Crawlable[];
  externalPages: Crawlable[];
}

export interface Output extends OutputLinks {
  failed: Array<Partial<Crawled>>;
}
