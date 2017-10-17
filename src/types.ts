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
  attributes: {
    name: string;
    content: string;
  }
}

export interface Crawlable {
  url: string;
  resolved: string;
  depth: number;
}

export interface Crawled extends Crawlable {
  internal: boolean;
  failed: boolean;
  status: number;
  type: string | null;
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

export interface Hrefs {
  hrefs: {
    internal: Href[];
    external: Href[];
    samePage: Href[];
    email: Href[];
    phone: Href[];
  }
}

export type PageData = Hrefs & Partial<{
  charset: string | null;
  title: string | null;
  wordCount: number | null;
  content: Content;
  meta: Meta[];
  links: Link[];
  scripts: Script[];
  images: Image[];
}>

export type Page = Crawled & PageData;

export interface Output {
  pages: Crawlable[];
  externalPages: Crawlable[];
}
