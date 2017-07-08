const sanitizer = require('sanitizer');
const GladString = require('../namespace/string');
let string = new GladString();
const { sanitize } = sanitizer;



module.exports = {

  sanitize,

  lowerCase (str = "") {
    return sanitize(str).toLowerCase();
  },

  upperCase (str = "") {
    return sanitize(str).toUpperCase();
  },

  titleCase (str = "") {
    return string.titelize(sanitize(str));
  },

  clean (str = "") {
    return sanitize(string.cleanSpaces(str.trim()));
  },

  deburr (str = "") {
    return string.deburr(sanitize(str));
  },

  sentenceCase (str = "") {
    return string.sentenceCase(sanitize(str));
  }

};
