let { log, warn, error, info, time, timeEnd } = console;
let { color }  = new (require('./string'))();

exports.log     = log;
exports.warn    = warn;
exports.error   = error;
exports.info    = info;
exports.time    = time;
exports.timeEnd = timeEnd;
exports.verbose = function (...args) {
  if (process.verbose) {
    log(args);
  }
}

exports.chalk = {

  ok (...args) {
    log(color(args.map(a => {
      return (typeof a === typeof {}) ? JSON.stringify(a, null, 2) : a;
    }).join('\n'), 'green'));
  },

  error (...args) {
    error(color(args.map(a => {
      return (typeof a === typeof {}) ? JSON.stringify(a, null, 2) : a;
    }).join('\n'), 'red'));
  },

  info (...args) {
    info(color(args.map(a => {
      return (typeof a === typeof {}) ? JSON.stringify(a, null, 2) : a;
    }).join('\n'), 'grey'));
  },

  verbose (information, _color = 'grey') {
    if (process.verbose) {
      info(color(information, _color));
    }
  }

}
