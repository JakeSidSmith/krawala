declare module 'parse-domain' {

  function parseDomain (url?: string): void | parseDomain.DomainInfo;

  export = parseDomain;

  namespace parseDomain {
    export interface DomainInfo {
      tld?: string;
      domain?: string;
      subdomain?: string;
    }
  }

}
