global._Promise = Promise;
global.Promise  = require('bluebird').Promise;

const sanitizer = require('sanitizer');
const sanitize  = require('./namespace/sanitize');
let Controller  = require('./classes/controller');
let string      = new (require('./namespace/string'))();
let cache       = require('./namespace/cache');
let imports     = require('./namespace/import');
let log         = require('./namespace/console');
let type        = require('./namespace/type');
let token       = require('./namespace/token');
let number      = require('./namespace/number');
let object      = require('./namespace/object');
let Boot        = require('./boot/boot');

module.exports = global.Glad = {
  imports,
  string,
  type,
  token,
  number,
  object,
  sanitizer,
  sanitize,
  log,
  cache,
  Controller,
  'Date' : require('./namespace/date'),
  __boot__ (cwd) {
    new Boot(cwd).exec();
  }
};
