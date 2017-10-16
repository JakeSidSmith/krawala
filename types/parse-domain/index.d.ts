declare module 'parse-domain' {

    type parseDomain = (input: string) => {
      tld: string;
      domain: string;
      subdomain: string;
    };

    export = parseDomain;
  }
