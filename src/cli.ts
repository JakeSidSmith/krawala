#! /usr/bin/env node

import {
  collect,
  Command,
  Flag,
  Help,
  KWArg,
  Program,
  Required,
} from 'jargs';

import { crawl } from './';

collect(
  Help(
    'help',
    {
      alias: 'h',
      description: 'Display help and usage info',
    },
    Program(
      'krawala',
      {
        description: 'Simple javascript web-crawler with command line interface',
        usage: 'krawala <command> [options]',
        examples: [
          'krawala crawl -u http://domain.com -d 100',
          'krawala crawl --help',
        ],
      },
      Required( // Swap for RequireAny when more sub-commands added
        Command(
          'crawl',
          {
            description: 'Crawl a domain',
            usage: 'krawala crawl [options]',
            examples: [
              'krawala crawl -u http://domain.com -d 100',
            ],
            alias: 'c',
            callback: crawl,
          },
          Required(
            KWArg(
              'url',
              {
                description: 'URL to crawl',
                alias : 'u',
                type: 'string',
              }
            )
          ),
          KWArg(
            'depth',
            {
              description: 'Depth to crawl',
              alias : 'd',
              type: 'number',
            }
          ),
          KWArg(
            'format',
            {
              description: 'Format to return',
              alias: 'f',
              type: 'string',
              options: ['json', 'yaml'],
            }
          ),
          KWArg(
            'interval',
            {
              description: 'Interval between requests (millis)',
              alias : 'i',
              type: 'number',
            }
          ),
          KWArg(
            'timeout',
            {
              description: 'Maximum time to wait for a request (millis)',
              alias : 't',
              type: 'number',
            }
          ),
          Flag(
            'wait',
            {
              description: 'Wait for user input upon a failed request',
              alias: 'w',
            }
          )
        )
      )
    )
  )
);
