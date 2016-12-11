'use strict';

(function () {

  function error (message) {
    if (typeof process === 'object') {
      console.error(message);
      process.exit(1);
    } else {
      throw new Error(message);
    }
  }

  module.exports = {
    error: error
  };

})();
