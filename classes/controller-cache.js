import LruCache from "./lru-cache.js";
import debugLogger from "debug";
const debugNamespace = Symbol("debugNamespace");
const debug = Symbol("debug");

export default class ControllerCache {
  constructor(
    redisClient,
    controller = "UNDEFINED-CONTROLLER!",
    action = "UNDEFINED-ACTION",
    options = {}
  ) {
    this.client = redisClient;
    this.controller = controller;
    this.namespace = `${controller}:${action}`;
    this.setOptions(options);
    this.cache = new LruCache(this.client, this.options);
    this[debugNamespace] = debugLogger("glad");
    this[debug]("Created ControllerCache Instance");
  }

  [debug](name) {
    this[debugNamespace]("ControllerCache %s", name);
  }

  setOptions(opts, rebuild) {
    let { strategy } = opts;
    if (strategy === "LRU") {
      opts.score = () => new Date().getTime();
      opts.increment = false;
    } else if (strategy === "LFU") {
      opts.score = () => 1;
      opts.increment = true;
    }

    if (opts.namespace && (opts.namespace !== this.namespace)) {
      opts.namespace = `${this.namespace}:${opts.namespace}:`;
      if (opts.uuid) {
        opts.namespace = `${opts.namespace}${opts.uuid}:`
      }
    } else if (opts.namespace && opts.uuid) {
      opts.namespace = `${opts.namespace}:${opts.uuid}:`
    } else if (opts.uuid) {
      opts.namespace = `${this.namespace}:${opts.uuid}:`
    } else {
      opts.namespace = this.namespace
    }

    this.namespace = opts.namespace;

    this.options = Object.assign(
      {
        score: () => new Date().getTime(),
        increment: false,
        max: 3,
      },
      opts
    );

    if (rebuild) {
      this.cache = new LruCache(this.client, this.options);
    }
  }

  async cachedVersion(req) {
    this[debug]("Cached Version");
    const json = await this.cache.get(req.url);
    return json || false;
  }
}
