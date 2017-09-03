let { log, warn, error, info, time, timeEnd } = console;
let { color }     = new (require('./string'))();
let { NODE_ENV }  = process.env;
let testing = (NODE_ENV === 'test') || (NODE_ENV === 'testing');
let anon = () => {};
let config;
let disabled;
let enabled;

try {
  config = require(path.join(process.cwd(), 'config'));
} catch (err) {
  config = {};
}

disabled = testing && !config.enableConsoleMethodsWhenTesting;
enabled = !disabled;

exports.log     = disabled ? anon : log;
exports.warn    = disabled ? anon : warn;
exports.error   = disabled ? anon : error;
exports.info    = disabled ? anon : info;
exports.time    = disabled ? anon : time;
exports.timeEnd = disabled ? anon : timeEnd;

exports.verbose = function (...args) {
  if (disabled) return;
  if (process.verbose) {
    log(args);
  }
}

exports.chalk = {

  ok (...args) {
    if (disabled) return;
    log(color(args.map(a => {
      return (typeof a === typeof {}) ? JSON.stringify(a, null, 2) : a;
    }).join('\n'), 'green'));
  },

  warn (...args) {
    if (disabled) return;
    log(color(args.map(a => {
      return (typeof a === typeof {}) ? JSON.stringify(a, null, 2) : a;
    }).join('\n'), 'yellow'));
  },

  error (...args) {
    if (disabled) return;
    error(color(args.map(a => {
      return (typeof a === typeof {}) ? JSON.stringify(a, null, 2) : a;
    }).join('\n'), 'red'));
  },

  info (...args) {
    if (disabled) return;
    info(color(args.map(a => {
      return (typeof a === typeof {}) ? JSON.stringify(a, null, 2) : a;
    }).join('\n'), 'grey'));
  },

  verbose (information, _color = 'grey') {
    if (disabled) return;
    if (process.verbose) {
      info(color(information, _color));
    }
  }

}
