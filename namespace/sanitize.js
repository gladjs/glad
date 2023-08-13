import sanitizer from "sanitizer";
import GladString from "../namespace/string.js";
let string = new GladString();
export const { sanitize } = sanitizer;

export function lowerCase(str) {
  str = str || "";
  return sanitize(str).toLowerCase();
}

export function upperCase(str) {
  str = str || "";
  return sanitize(str).toUpperCase();
}

export function titleCase(str) {
  str = str || "";
  return string.titelize(sanitize(str));
}

export function clean(str) {
  str = str || "";
  return sanitize(string.cleanSpaces(str.trim()));
}

export function deburr(str) {
  str = str || "";
  return string.deburr(sanitize(str));
}

export function sentenceCase(str) {
  str = str || "";
  return string.sentenceCase(sanitize(str));
}

export default {
  sanitize,
  lowerCase,
  upperCase,
  titleCase,
  clean,
  deburr,
  sentenceCase,
};
