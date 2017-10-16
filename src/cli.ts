#! /usr/bin/env node

import {
  collect,
  Command,
  Flag,
  Help,
  KWArg,
  Program,
  Required
} from 'jargs';

import { crawl } from './';

collect(
  Help(
    'help',
    {
      alias: 'h',
      description: 'Display help and usage info'
    },
    Program(
      'krawala',
      {
        description: 'Simple javascript web-crawler with command line interface',
        usage: 'krawala <command> [options]',
        examples: [
          'krawala crawl -u http://domain.com -d 100'
        ]
      },
      Required( // Swap for RequireAny when more sub-commands added
        Command(
          'crawl',
          {
            description: 'Crawl a domain',
            usage: 'krawala crawl [options]',
            examples: [
              'krawala crawl -u http://domain.com -d 100'
            ],
            alias: 'c',
            callback: crawl
          },
          Required(
            KWArg(
              'url',
              {
                description: 'URL to crawl',
                alias : 'u',
                type: 'string'
              }
            )
          ),
          KWArg(
            'depth',
            {
              description: 'Depth to crawl',
              alias : 'd',
              type: 'number'
            }
          ),
          KWArg(
            'format',
            {
              description: 'Format to return',
              alias: 'f',
              type: 'string',
              options: ['json', 'yaml']
            }
          ),
          Flag(
            'sequence',
            {
              description: 'Run requests in sequence',
              alias: 's'
            }
          ),
          KWArg(
            'interval',
            {
              description: 'Interval between requests (millis) when not in parallel',
              alias : 'i',
              type: 'number'
            }
          ),
          Flag(
            'wait',
            {
              description: 'Wait for user input upon if a request fails',
              alias: 'w'
            }
          )
        )
      )
    )
  )
);
