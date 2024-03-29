/**
 * Glad.cache is available for general caching and is different than the controller cache.
 * Glad.cache is available anywhere in your code base, whereas the controller cache is meant as a
 * endpoint level cache. Use Glad.cache when you need to cache things that live outside the controller.
 *
 * For example, say you have a class that finds hotels on a given date, close to a city center and you want it cached for an hour.
 * We'll be using the resolve method which is nice if your method returns a promise. By passing in the resolver of your method, the cache
 * retrieval will automatically resolve it for you if there is a hit, otherwise it calls the function passed in `doHotelQuery` (in the example below).
 * the function `doHotelQuery` receives a cache method that you can call to cache the results for the next time around.
 * ```javascript
 * getHotelsNearCityCenterOnDate (citySlug = '', date = new Date().toString()) {
 *   return new Promise ( function (resolve, reject) {
 *     let key = `getHotelsNearCityCenterOnDate_${citySlug}_${date}`;
 *     Glad.cache.resolve(key, resolve, 60 * 60).miss(function doHotelQuery (cache) {
 *       yourHotelQuery().then(results => {
 *         cache(results);
 *         resolve(results);
 *       }).catch(reject);
 *     })
 *   });
 * }
 * ```
 *
 * The same thing, using get and store.
 * ```javascript
 * getHotelsNearCityCenterOnDate (citySlug, date) {
 *   return new Promise ( function (resolve, reject) {
 *     let key = `getHotelsNearCityCenterOnDate_${citySlug}_${date}`;
 *     Glad.cache.get(key).then(hotels => {
 *       if (hotels) {
 *         resolve(hotels);
 *       } else {
 *         yourHotelQuery().then(results => {
 *           Glad.cache.store(key, results, 60 * 60);
 *           resolve(results);
 *         }).catch(reject);
 *       }
 *     })
 *   });
 * }
 * ```
 *
 * In effort to make life better on this planet,
 * Including `GLAD_ENV=development` will disable caching by default
 *
 * In effort to test caching in development, just set the disabled flag.
 *
 * From Glad
 * ```javascript
 * Glad.cache.disabled = false; // enables the cache on development
 * ```
 */

import optimist from "optimist";
const { argv: args } = optimist;

class Cache {
  /**
   * Create a Cache instance. (Private, the instance is available at Glad.cache)
   * @param {Server} server - The Server Object.
   * @param {Project} project - The Project Object.
   */
  constructor(server, project) {
    this.redis = server.redis;
    this.project = project;
    this.disabled =
      !!args["disable-cache"] || (project.development && !args["enable-cache"]);
  }

  transformedValue(value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }

  /**
   * Gets a value from the cache.
   * ### Example
   * ```javascript
   * myCache.get('/user/5/analytics')
   *  .then(cachedData => doStuff(cachedData))
   *  .catch(err => ohNo(err));
   * ```
   * @param {string} name - The name of the cache key to retrieve
   * @returns {object|array|string|number} - The item being stored in cache
   */
  async get(name) {
    let data = await this.redis.get(name);

    if (!data) {
      return false;
    }

    return this.transformedValue(data);
  }

  /**
   * Adds an item to the cache
   *
   * Example:
   * ```javascript
   * let { cache } = Glad;
   * cache.store('latestAnalytics', { math: 'Numbers and stuff' }, 604800).then(redisResponse => cool(redisResponse)).catch(err => shucks(err));
   * ```
   * @param {string} name - The name of the cache key to set
   * @param {object|string} data - The data to cache
   * @param {number} time - Time in seconds until this item expires (defaults to 24 hours)
   * @returns {object|array|string|number} - The item being stored in cache
   */
  async store(name, data, time = 864e2) {
    if (this.disabled || !data) {
      return Promise.resolve(false);
    }

    if (data) {
      await this.redis.setEx(name, time, JSON.stringify(data));
    }
  }


  /**
   * Checks for an item in the cache. If it exists, then `resolve` is called with the cached value.
   * Otherwise, the method passed in will get executed and receives a cache function
   * that can be used to add the item to the cache next time.
   *
   * Usage: (Same as above example)
   * ```javascript
   * async getHotelsNearCityCenterOnDate (citySlug = 'tacoma-wa', date = new Date().toString()) {
   *   let key = `getHotelsNearCityCenterOnDate_${citySlug}_${date}`;
   *   let hotels = await Glad.cache.resolve(key)
   *       .miss(() => {
   *         let data = await yourHotelQuery();
   *         return data;
   *       })
   * }
   * ```
   *
   * @param {string} name - The name of the cache key to set
   * @param {number} time - Time in seconds until this item expires (defaults to 24 hours)
   * @returns {object} - a method to invoke in the event that it's a cache miss.
   */
  resolve(name, time) {
    const chain = {
      miss: async asyncFunc => {
        let data = await this.get(name);
        if (data) {
          return data;
        }

        data = await asyncFunc();
        if (!data) return false;
        
        await this.store(name, data, time);
        return data;
      }
    };

    return chain;
  }

  /**
   * Clears the cache for a key, or everything.
   * @param {string} name - Optional, the name of the key to expire. If none is provided, all of the caches are wiped out. (careful!)
   * @returns {boolean} - If the operation was successful / keys were removed * see (`redis.del` and `redis.flushall`).
   */
  async clear(name = false) {
    try {
      var result;

      if (name) {
        result = await this.redis.del(name);
      } else {
        result = await this.redis.flushAll();
      }

      return result
    } catch (err) {
      throw(err)
    }
  }

  /**
   * Clears keys matching a pattern. This method can be memory intensive depending on how many keys you have in redis.
   * It requires all keys that match the pattern to be loaded into memory. (Just the key names).
   */
  async clearWhere(pattern) {
    return new Promise((resolve, reject) => {
      this.list(pattern)
        .then((keys) => {
          let queue = function () {
            if (keys.length) {
              this.clear(keys.shift())
                .then(queue)
                .catch((err) => {
                  reject({ err: err, remainingKeys: keys });
                });
            } else {
              resolve(true);
            }
          }.bind(this);
          queue();
        })
        .catch(reject);
    });
  }

  /**
   * Lists all of the keys in the cache.
   * @param {string} pattern - Optional, a redis pattern to match against. Defaults to *  (So be careful!)
   */
  async list(pattern = '*') {
    try {
      let keys = await this.redis.keys(pattern)
      return keys;
    } catch (err) {
      throw(err)
    }
  }
}

export default Cache;
