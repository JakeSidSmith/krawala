'use strict';

(function () {

  function error (message) {
    if (typeof process === 'object') {
      console.error(message);
      process.exit(1); // eslint-disable-line no-undef
    } else {
      throw new Error(message);
    }
  }

  module.exports = {
    error: error
  };

})();
