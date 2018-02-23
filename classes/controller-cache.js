const lru            = require('./lru-cache');
const debugLogger    = require('debug');
const debugNamespace = Symbol('debugNamespace');
const debug          = Symbol('debug');

module.exports = class ControllerCache {

  constructor (redisClient, controller = 'UNDEFINED-CONTROLLER!', action = 'UNDEFINED-ACTION', options = {}) {
    this.client = redisClient;
    this.controller = controller;
    this.namespace = `${controller}#${action}`;
    this.setOptions(options);
    this.cache = lru(this.client, this.options);
    this[debugNamespace] = debugLogger('glad');
    this[debug]('Created ControllerCache Instance');
  }

  [debug] (name) {
    this[debugNamespace]("ControllerCache %s", name);
  }

  setOptions (opts, rebuild) {
    let { strategy, namespace } = opts;
    if (strategy === 'LRU') {
      opts.score = () => new Date().getTime();
      opts.increment = false;
    } else if (strategy === 'LFU') {
      opts.score = () => 1;
      opts.increment = true;
    }

    opts.namespace = this.namespace;

    if (namespace && opts.namespace !== namespace) {
      opts.namespace += `-${namespace}`;
      this.namespace = opts.namespace;
    }

    this.options = Object.assign({
      score: () => new Date().getTime(),
      increment: false,
      max : 3
    }, opts);

    if (rebuild) {
      this.cache = lru(this.client, this.options);
    }

  }

  cachedVersion (req) {
    this[debug]('Cached Version');
    return this.cache.get(req.url).then(json => json || false);
  }

}
