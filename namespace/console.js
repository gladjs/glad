import string from "./string.js";

let { log, warn, error, info, time, timeEnd } = console;
let { color } = new string();
let { NODE_ENV } = process.env;
let testing = NODE_ENV === "test" || NODE_ENV === "testing";
let anon = () => {};
let disabled;
let enabled;

disabled = testing && !process.env.GLAD_ENABLE_CONSOLE_WHEN_TESTING;
enabled = !disabled;

const _log = disabled ? anon : log;
export { _log as log };
const _warn = disabled ? anon : warn;
export { _warn as warn };
const _error = disabled ? anon : error;
export { _error as error };
const _info = disabled ? anon : info;
export { _info as info };
const _time = disabled ? anon : time;
export { _time as time };
const _timeEnd = disabled ? anon : timeEnd;
export { _timeEnd as timeEnd };

export function logPromise(promise) {
  promise.then(console.log.bind(console)).catch(console.error.bind(console))
} 

export function verbose(...args) {
  if (disabled) return;
  if (process.verbose) {
    log(args);
  }
}

export const chalk = {
  ok(...args) {
    if (disabled) return;
    log(
      color(
        args
          .map((a) => {
            return typeof a === typeof {} ? JSON.stringify(a, null, 2) : a;
          })
          .join("\n"),
        "green"
      )
    );
  },

  warn(...args) {
    if (disabled) return;
    log(
      color(
        args
          .map((a) => {
            return typeof a === typeof {} ? JSON.stringify(a, null, 2) : a;
          })
          .join("\n"),
        "yellow"
      )
    );
  },

  error(...args) {
    if (disabled) return;
    error(
      color(
        args
          .map((a) => {
            return typeof a === typeof {} ? JSON.stringify(a, null, 2) : a;
          })
          .join("\n"),
        "red"
      )
    );
  },

  info(...args) {
    if (disabled) return;
    info(
      color(
        args
          .map((a) => {
            return typeof a === typeof {} ? JSON.stringify(a, null, 2) : a;
          })
          .join("\n"),
        "grey"
      )
    );
  },

  verbose(information, _color = "grey") {
    if (disabled) return;
    if (process.verbose) {
      info(color(information, _color));
    }
  },
};

export default {
  chalk,
  verbose,
  log: _log,
  warn: _warn,
  info: _info,
  error: _error,
  time: _time,
  timeEnd: _timeEnd
}