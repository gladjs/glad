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
* Including `NODE_ENV=development` will disable caching by default
*
* In effort to test caching in development, just set the disabled flag.
*
* From Glad
* ```javascript
* Glad.cache.disabled = false; // enables the cache on development
* ```
*/
class Cache {

  /**
   * Create a Cache instance. (Private, the instance is available at Glad.cache)
   * @param {Server} server - The Server Object.
   * @param {Project} project - The Project Object.
   */
  constructor (server, project) {
    this.redis = server.redis;
    this.project = project;
    this.disabled = project.development;
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
  get (name) {
    return new Promise( (resolve, reject) => {
      this.redis.get(name, (err, data) => {
        if (err) return reject(err);
        try {
          return resolve( (data || false) && JSON.parse(data));
        } catch (e) {
          return resolve(data || false);
        }
      });
    });
  }

  /**
   * Adds an item to the cache
   *
   * Example:
   * ```javascript
   * let { cache } = require('glad');
   * cache.store('latestAnalytics', { math: 'Numbers and stuff' }, 604800).then(redisResponse => cool(redisResponse)).catch(err => shucks(err));
   * ```
   * @param {string} name - The name of the cache key to set
   * @param {object|string} data - The data to cache
   * @param {number} time - Time in seconds until this item expires (defaults to 24 hours)
   * @returns {object|array|string|number} - The item being stored in cache
   */
  store (name, data, time = 864e2) {

    if (this.disabled) {
      return Promise.resolve();
    }

    return new Promise( (resolve, reject) => {
      if (typeof data === typeof {}) {
        this.redis.setex(name, time, JSON.stringify(data), resolve);
      } else if (data) {
        this.redis.setex(name, time, data, resolve);
      } else {
        reject(`
          You are trying to cache data,
          but you did not provide data.\n
          This request item not be cached.
        `);
      }
    });
  }

  /**
   * Checks for an item in the cache. If it exists, then `resolve` is called with the cached value.
   * Otherwise, the method passed in will get executed and receives a cache function
   * that can be used to add the item to the cache next time.
   *
   * Usage: (Same as above example)
   * ```javascript
   * getHotelsNearCityCenterOnDate (citySlug = '', date = new Date().toString()) {
   *   return new Promise ( function (resolve, reject) {
   *     let key = `getHotelsNearCityCenterOnDate_${citySlug}_${date}`;
   *     Glad.cache.resolve(key, resolve).miss(function doHotelQuery (cache) {
   *       yourHotelQuery().then(results => {
   *         cache(results);
   *         resolve(results);
   *       }).catch(reject);
   *     })
   *   });
   * }
   * ```
   *
   * @param {string} name - The name of the cache key to set
   * @param {Promise.resolve} resolver - the resolver to call if the data is available
   * @param {number} time - Time in seconds until this item expires (defaults to 24 hours)
   * @returns {object} - A chainable miss method
   */
  resolve (name, resolve, time) {

    let id;

    if (typeof name === typeof {}) {
      id = name.id;
      name = name.url;
    }

    let chain = {
      __method () {},
      miss (method) {
        this.__method = method;
      }
    };

    this.redis.get(name, (err, data) => {
      if (err) return reject(err);

      if (data) {
        try {
          return resolve( (data || false) && JSON.parse(data));
        } catch (e) {
          return resolve(data || false);
        }
      } else {
        chain.__method(cacheData => {
          this.store(name, cacheData, time);
        });
      }
    });

    return chain;
  }

  /**
   * Clears the cache for a key, or everything.
   * @param {string} name - Optional, the name of the key to expire. If none is provided, all of the caches are wiped out. (careful!)
   * @returns {boolean} - If the operation was successful / keys were removed * see (`redis.del` and `redis.flushall`).
   */
  clear (name = false) {
    return new Promise( (resolve, reject) => {
      if (name) {
        return this.redis.del(name, resolve);
      } else {
        return this.redis.flushall(resolve);
      }
    });
  }

  /**
   * Clears keys matching a pattern. This method can be memory intensive depending on how many keys you have in redis.
   * It requires all keys that match the pattern to be loaded into memory. (Just the key names).
   */
  clearWhere (pattern) {
    return new Promise( (resolve, reject) => {
      this.list(pattern).then(keys => {
        let i = 0;
        let len = keys.length;
        let queue = function () {
          if (keys.length) {
            this.clear(keys.shift()).then(queue).catch(err => {
              reject({err: err, remainingKeys: keys});
            });
          } else {
            resolve(true);
          }
        }.bind(this);
        queue();
      }).catch(reject);
    });
  }

  /**
   * Lists all of the keys in the cache.
   * @param {string} pattern - Optional, a redis pattern to match against. Defaults to *  (So be careful!)
   */
  list (pattern) {
    return new Promise( (resolve, reject) => {
      this.redis.keys(pattern || '*', (err, data) => err ? reject(err) : resolve(data));
    });
  }

}

module.exports = Cache;
