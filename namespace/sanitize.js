const sanitizer = require('sanitizer');
const GladString = require('../namespace/string');
let string = new GladString();
const { sanitize } = sanitizer;



module.exports = {

  sanitize,

  lowerCase (str) {
    str = str || ""
    return sanitize(str).toLowerCase();
  },

  upperCase (str) {
    str = str || ""
    return sanitize(str).toUpperCase();
  },

  titleCase (str) {
    str = str || ""
    return string.titelize(sanitize(str));
  },

  clean (str) {
    str = str || ""
    return sanitize(string.cleanSpaces(str.trim()));
  },

  deburr (str) {
    str = str || ""
    return string.deburr(sanitize(str));
  },

  sentenceCase (str) {
    str = str || ""
    return string.sentenceCase(sanitize(str));
  }

};
