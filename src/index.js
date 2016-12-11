'use strict';

(function () {

  var utils = require('./utils');

  var error = utils.error;

  function crawl(options) {
    var url = options.url;
    var depth = options.depth;
    var format = options.format;

    if (!url) {
      error('No url specified');
    }

    console.log(url, depth, format);
  }

  module.exports = {
    crawl: crawl
  };

})();
