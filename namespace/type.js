/**
 * @module type
 *
 * The type module is useful when it comes to testing the type of something.
 */
export function isObject(val) {
  return val !== undefined && val.constructor === Object;
}

export function isNotObject (val) {
  return !isObject(val);
}

export function isArray(val) {
  return val !== undefined && val.constructor === Array;
}

export function isNotArray(val) {
  return !isArray(val);
}

export default {
  array: typeof [],
  object: typeof {},
  function: typeof Function,
  number: typeof 1,
  boolean: typeof true,
  symbol: typeof Symbol(),
  string: typeof "",
  isObject,
  isNotObject,
  isArray,
  isNotArray,
};
