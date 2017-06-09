let { log, warn, error, info, time, timeEnd } = console;
let { color }     = new (require('./string'))();
let { NODE_ENV }  = process.env;
let anon = () => {};

exports.log     = NODE_ENV === 'test' ? anon : log;
exports.warn    = NODE_ENV === 'test' ? anon : warn;
exports.error   = NODE_ENV === 'test' ? anon : error;
exports.info    = NODE_ENV === 'test' ? anon : info;
exports.time    = NODE_ENV === 'test' ? anon : time;
exports.timeEnd = NODE_ENV === 'test' ? anon : timeEnd;

exports.verbose = function (...args) {
  if (process.verbose) {
    log(args);
  }
}

exports.chalk = {

  ok (...args) {
    if (NODE_ENV === 'test') return;
    log(color(args.map(a => {
      return (typeof a === typeof {}) ? JSON.stringify(a, null, 2) : a;
    }).join('\n'), 'green'));
  },

  warn (...args) {
    if (NODE_ENV === 'test') return;
    log(color(args.map(a => {
      return (typeof a === typeof {}) ? JSON.stringify(a, null, 2) : a;
    }).join('\n'), 'yellow'));
  },

  error (...args) {
    if (NODE_ENV === 'test') return;
    error(color(args.map(a => {
      return (typeof a === typeof {}) ? JSON.stringify(a, null, 2) : a;
    }).join('\n'), 'red'));
  },

  info (...args) {
    if (NODE_ENV === 'test') return;
    info(color(args.map(a => {
      return (typeof a === typeof {}) ? JSON.stringify(a, null, 2) : a;
    }).join('\n'), 'grey'));
  },

  verbose (information, _color = 'grey') {
    if (NODE_ENV === 'test') return;
    if (process.verbose) {
      info(color(information, _color));
    }
  }

}
