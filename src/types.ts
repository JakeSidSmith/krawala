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

export interface Attributes {
  [index: string]: string;
}

export interface Meta {
  attributes: Attributes;
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
  status: number | null;
  type: string | string[] | null;
}

export interface LinkScriptImageOrHref {
  url: string;
  resolved: string;
  references: number;
  attributes: Attributes;
}

export type Content = Partial<{
  h1: string | null;
  h2: string | null;
  h3: string | null;
  p: string | null;
}>;

export interface RequiredPageData {
  content: Content;
  meta: Meta[];
  links: LinkScriptImageOrHref[];
  scripts: LinkScriptImageOrHref[];
  images: LinkScriptImageOrHref[];
  hrefs: {
    internal: LinkScriptImageOrHref[];
    external: LinkScriptImageOrHref[];
    samePage: LinkScriptImageOrHref[];
    email: LinkScriptImageOrHref[];
    phone: LinkScriptImageOrHref[];
  }
}

export type PageData = RequiredPageData & Partial<{
  charset: string | null;
  title: string | null;
  wordCount: number | null;
}>;

export type Page = Crawled & PageData;

export type PartiallyCrawled = Crawlable & Partial<Crawled>;

export interface OutputLinks {
  pages: Crawlable[];
  externalPages: Crawlable[];
  links: Crawlable[];
  scripts: Crawlable[];
  images: Crawlable[];
}

export interface Output extends OutputLinks {
  failed: Array<Partial<Crawled>>;
}
