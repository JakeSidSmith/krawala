#! /usr/bin/env node
'use strict';

(function () {

  var yargs = require('yargs');
  var packageJson = require('../package.json');
  var version = packageJson.version;

  var CRAWL_OPTIONS = 'Crawl options:';

  var argv = yargs
  .usage('Usage: $0 <command> [options]')
  .example('$0 crawl -u domain.com -d 100', '(Crawl a URL to a depth of 100)')
  .alias('crawl', 'c')
  .command('crawl', 'Crawl a domain', {
    url: {
      group: CRAWL_OPTIONS,
      alias : 'u',
      required: true,
      type: 'string',
      describe: 'URL to crawl'
    },
    depth: {
      group: CRAWL_OPTIONS,
      alias : 'd',
      default : 10,
      type: 'number',
      describe: 'Depth to crawl'
    },
    format: {
      group: CRAWL_OPTIONS,
      alias : 'f',
      default : 'json',
      type: 'string',
      describe: 'Format to return',
      choices: ['json']
    }
  })
  .help('help')
  .alias('help', 'h')
  .version('version', 'Return the version number', version)
  .alias('version', 'v')
  .require(1)
  .strict()
  .argv;

  console.log(argv);

})();
