/**
 * @module type
 *
 * The type module is useful when it comes to testing the type of something.
 */
module.exports = {
  array : typeof [],
  object: typeof {},
  function : typeof Function,
  number : typeof 1,
  boolean : typeof true,
  symbol : typeof Symbol(),
  string : typeof '',

  isObject (val) {
    return val.constructor === Object;
  },

  isNotObject (val) {
    return !this.isObject(val);
  },

  isArray (val) {
    return val.constructor === Array;
  },

  isNotArray (val) {
    return !this.isArray(val);
  }

};
