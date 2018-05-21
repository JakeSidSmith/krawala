# Krawala

**Simple javascript web-crawler with command line interface**

## Usage

```shell
  Usage: krawala crawl [options]

  Options:
    --help, -h      Display help and usage info
    --depth, -d     Depth to crawl                                      [number]
    --format, -f    Format to return                                    [string]
    --interval, -i  Interval between requests (millis)                  [number]
    --timeout, -t   Maximum time to wait for a request (millis)         [number]
    --url, -u       URL to crawl                                        [string]

  Examples:
    krawala crawl -u http://domain.com -d 100
```
