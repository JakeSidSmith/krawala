#! /usr/bin/env node
'use strict';

(function () {

  var yargs = require('yargs');
  var packageJson = require('../package.json');
  var version = packageJson.version;

  var argv = yargs
  .usage('Usage: $0 <command> [options]')
  .command('crawl', 'Crawl a domain')
  .example('$0 crawl domain.com --depth 100', 'Crawl a domain to a depth of 100')
  .alias('crawl', 'c')
  .option(
    'depth',
    {
      alias : 'd',
      default : 10,
      type: 'number',
      describe: 'Depth to crawl'
    }
  )
  .option(
    'format',
    {
      alias : 'f',
      default : 'json',
      type: 'string',
      describe: 'Format to return'
    }
  )
  .help('help')
  .alias('help', 'h')
  .version('version', 'Return the version number', version)
  .alias('version', 'v')
  .argv;

  console.log(argv);

})();
