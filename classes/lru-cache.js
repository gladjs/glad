export default class LruCache {
  options = {}
  client = null
  ZSET_KEY
  namespace

  constructor (client, options) {
    this.validateClient(client)
    this.validateOptions(options)
    this.options = this.buildOptions(options)
    this.ZSET_KEY = `${this.options.namespace}-i`;
    this.namespace = this.options.namespace;
    this.client = client;
  }

  validateClient (client) {
    if (!client) {
      throw Error("redis client is required.");
    }
  }

  validateOptions (options) {
    if (!options.max) {
      throw Error("max number of items in cache must be specified.");
    }
  }

  buildOptions (options) {
    return { 
      namespace: ":LRU-CACHE!",
      score: () => new Date().getTime(),
      increment: false,
      ...options
    }
  }

  namedKey(key) {
    if (!typeof key === "string") {
      return Promise.reject(Error("key should be a string."));
    }

    return `${this.namespace}${key}`;
  }

  /*
   * Remove a set of keys from the cache and the index, in a single transaction,
   * to avoid orphan indexes or cache values.
   */
  async safeDelete (keys) {
    if (keys.length) {
      await this.client.multi().zRem(this.ZSET_KEY, keys).del(keys).exec();
    }

    return Promise.resolve();
  }

  /*
   * Gets the value for the given key and updates its timestamp score, only if
   * already present in the zset. The result is JSON.parsed before returned.
   */
  async get (k) {
    const key = this.namedKey(k);
    const score = -1 * this.options.score(key);
    const multi = this.client.multi();
    const { increment } = this.options;

    multi.get(key)

    if (increment) {
      multi.zAdd(
        this.ZSET_KEY, 
        { score, value: key }, 
        { CH: true, NX: true }
      )
      multi.zIncrBy(this.ZSET_KEY, -1, key) 
    } else {
      multi.zAdd(
        this.ZSET_KEY, 
        { score, value: key }, 
        { XX: true, CH: true }
      )
    }
    
    let result = await multi.exec();

    if (result[0] === null && result[1]) {
      // value has been expired, remove from zset
      await this.client.zRem(this.ZSET_KEY, key);
      return null;
    }
    
    return JSON.parse(result[0]);
  };

  /*
   * Save (add/update) the new value for the given key, and update its timestamp
   * score. The value is JSON.stringified before saving.
   *
   * If there are more than options.max items in the cache after the operation
   * then remove each exceeded key from the zset index and its value from the
   * cache (in a single transaction).
   */
  async set (key, value, maxAge = this.options.maxAge) {
    if (Glad.cache.disabled || (value === null) || (value === undefined)) {
      return Promise.resolve(false);
    }

    key = this.namedKey(key);
    const score = -1 * this.options.score(key);
    const multi = this.client.multi();

    
    if (maxAge) {
      multi.set(key, JSON.stringify(value), { PX: maxAge });
    } else {
      multi.set(key, JSON.stringify(value));
    }

    if (this.options.increment) {
      multi.zAdd(this.ZSET_KEY, { score, value: key }, { INCR: true });
    } else {
      multi.zAdd(this.ZSET_KEY, { score, value: key });
    }

    // we get zRange first then safe delete instead of just zremrange,
    // that way we guarantee that zset is always in sync with available data in the cache
    // also, include the last item inside the cache size, because we always want to
    // preserve the one that was just set, even if it has same or less score than other.
    multi.zRange(this.ZSET_KEY, this.options.max - 1, -1);
    let results = await multi.exec();

    if (results[2].length > 1) {
      // the first one is inside the limit
      let toDelete = results[2].slice(1);
      if (toDelete.indexOf(key) !== -1) {
        toDelete = results[2].slice(0, 1).concat(results[2].slice(2));
      }

      await this.safeDelete(toDelete);
    }

    return value;
  };

  /*
   * Try to get the value of key from the cache. If missing, call function and store
   * the result.
   */
  async getOrSet (key, fn, maxAge) {
    let result = await this.get(key);
    if (result === null) {
      let result = await fn();
      await this.set(key, result, maxAge);
      return result;
    }
    return result;
  } 

  /*
   * Retrieve the value for key in the cache (if present), without updating the
   * timestamp score. The result is JSON.parsed before returned.
   * `let result = await cache.peek("yourKey")`
   */
  async peek (key) {
    let result = await this.client.get(this.namedKey(key));
    // remove value from zset if it's expired
    if (result === null) {
      await this.client.zRem(this.ZSET_KEY, key)
      return Promise.resolve(null)
    }

    return JSON.parse(result);
  }

  /*
   * Remove the value of key from the cache (and the zset index).
   */
  async del (key) {
    return await this.safeDelete([this.namedKey(key)]);
  }

  /*
   * Remove all items from cache and the zset index.
   */
  async reset () {
    let keys = await this.client.zRange(this.ZSET_KEY, 0, -1);
    await this.safeDelete(keys);
  }

  /*
   * Return true if the given key is in the cache
   */
  async has (key) {
    let result = await this.client.get(this.namedKey(key));
    return !!result;
  }

  /*
   * Return an array of the keys currently in the cache, most recently accessed
   * first.
   */
  async keys () {
    const results = await this.client.zRange(this.ZSET_KEY, 0, -1);
    return results.map(key => key.slice(`${this.namespace}`.length));
  }

  /*
   * Return an array of the values currently in the cache, most recently accessed
   * first.
   */
  async values () {
    const multi = this.client.multi();
    let results = await this.client.zRange(this.ZSET_KEY, 0, this.options.max - 1);

    results.forEach(key => multi.get(key));
    let theValues = await multi.exec();

    return theValues.map(JSON.parse)
  }

  async entries () {
    const entries = [];
    const multi = this.client.multi();
    const theKeys = await this.client.zRange(this.ZSET_KEY, 0, this.options.max - 1);
    
    if (theKeys.length  === 0) {
      return []
    }

    multi.mGet(theKeys);
    
    const [ theValues ] = await multi.exec()

    for (let i = 0; i < theKeys.length; i += 1) {
      entries.push({ [theKeys[i]]: theValues[i] && JSON.parse(theValues[i]) })
    }
    
    return entries
  }

  /*
   * Return the amount of items currently in the cache.
   */
  async count () {
    return await this.client.zCard(this.ZSET_KEY)
  }
}
