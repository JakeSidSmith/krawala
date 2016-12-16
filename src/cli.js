#! /usr/bin/env node
'use strict';

(function () {

  var yargs = require('yargs');
  var krawala = require('./index');
  var utils = require('./utils');
  var packageJson = require('../package.json');

  var error = utils.error;
  var version = packageJson.version;

  var CRAWL_OPTIONS = 'Crawl options:';

  var argv = yargs
  .require(1, 1)
  .strict()
  .usage('Usage: $0 <command> [options]')
  .example('$0 crawl -u http://domain.com -d 100', '(Crawl a URL to a depth of 100)')
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
      choices: ['json', 'yaml']
    },
    parallel: {
      group: CRAWL_OPTIONS,
      alias : 'p',
      default : true,
      type: 'boolean',
      describe: 'Run requests in parallel'
    },
    interval: {
      group: CRAWL_OPTIONS,
      alias : 'i',
      default : 0,
      type: 'number',
      describe: 'Interval between requests (millis) when not in parallel'
    }
  })
  .help('help')
  .alias('help', 'h')
  .version('version', 'Return the version number', version)
  .alias('version', 'v')
  .argv;

  var command = argv._[0];

  if (typeof krawala[command] !== 'function') {
    error('Unknown command: ' + command);
  } else {
    krawala[command](argv);
  }

})();
