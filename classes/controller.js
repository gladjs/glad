const path = require('path');
const debugLogger     = require('debug');
const debugNamespace  = Symbol('debugNamespace');
const debug           = Symbol('debug');
const ControllerCache = require('./controller-cache');
const { chalk: {info}} = require('../namespace/console');
const object  = require('../namespace/object');
const types   = require('../namespace/type');

/**
 * Controller Class.
 * API:
 * ---
 * ```
 * - cache         Caching Class
 * - actionCache   Action Caching Store
 * - cacheStore    Current Cache Store
 * - req           Express request object
 * - res           Express response object
 * - params        Alias for `this.req.params`
 * - body          Alias for `this.req.body`
 * - redisClient   Redis Connection
 * - permit        A method that removes non-whitelisted objects. Nested Objects are not allowed without using dot notation to specify the nested keys.
 * - deepPermit    A method that removes non-whitelisted objects. Nested Objects are allowed.
 * - permitted     Boolean, has this action called permit. This may be useful to enforce permitting.
 * - render        Renders a view.
 * ```
 */
class Controller {

  constructor (req, res, redisClient) {
    let { params, body } = req;
    this.req = req;
    this.res = res;
    this.params = params;
    this.body = body;
    this.redisClient = redisClient;
    this.cacheStore = {};
    this.viewPath = req.controller.replace('Controller', '').toLowerCase();
    this[debugNamespace] = debugLogger('glad');
    this[debug]('Created Controller Instance');
  }

  [debug] (name) {
    this[debugNamespace]("Controller: %s > %s", name, this.req.id);
  }

  /**
   * Whitelist allowable data in a request body. This is a good idea if you mass assigning things.
   * Ex: Shallow
   * ```javascript
   * this.req.body = { name: 'Fooze', admin: true };
   * this.permit('name', 'email', 'phone');
   * // this.req.body === { name: 'Fooze' }
   * ```
   *
   * Ex: Deep
   * ```javascript
   * this.req.body = { user: { name: 'Fooze', admin: true } };
   * this.permit('user.name', 'user.email', 'user.phone');
   * // this.req.body === { user: { name: 'Fooze' } }
   * ```
   * You must be specific when the key contains an object.
   * You can not permit the whole user object at once. In order to permit "sub documents"
   * you need to use the `deepPermit` method instead. This is intentional because it can defeat
   * the purpose of `permit` when you permit a subdocument that could potentially contain things
   * that shouldnt be allowed. For example: { user : { admin: true } }. Assume that admin was injected by a malicious
   * user trying to gain admin access to the site, and admin access is determined by the admin key.
   */
  permit (...keys) {
    this[debug]('permit');
    let i = 0;
    let len = keys.length;
    let ref = {};

    for (i; i < len; i += 1) {
      let val = object.get(this.body, keys[i]);

      if (types.isNotObject(val)) {
        if (val) {
          object.set(ref, keys[i], val);
        }
      }
    }
    this.body = this.req.body = ref;
    this.permitted = true;
  }

  /**
   * This method is similar to permit, only it also permits subdocuments.
   */
  deepPermit(...keys) {
    this[debug]('deepPermit');
    let i = 0;
    let len = keys.length;
    let ref = {};

    for (i; i < len; i += 1) {
      let val = object.get(this.body, keys[i]);
      if (val) {
        object.set(ref, keys[i], val);
      }
    }
    this.body = this.req.body = ref;
    this.permitted = true;
  }

  /**
   * The default error response for the controller
   * @param {object} error - The error that occured. Providing `status` on the error object will set the HTTP Status code on the respone.
   */
  error (err = {}) {
    this[debug]('error');
    this.res.status(err.status || 500).json(err)
  }

  /**
  * ##  The controller level cache.
  * ---
  * All options are optional.
  *
  * [ *Number* ]  `max`: Maximum amount of items the cache can hold. This option is required; if no
  * other option is needed, it can be passed directly as the second parameter when creating
  * the cache.
  *
  * [ *String* ]  `namespace`: Prefix appended to all keys saved in Redis, to avoid clashes with other applications
  * and to allow multiple instances of the cache. Given a controller called "Products" and an action called "find", the default
  * namespace is `Products#find`. By setting this value to 'server007' it would be `Products#find-server007`.
  *
  * [ *Number* ]  `maxAge`: Maximum amount of milliseconds the key will be kept in the cache; after that getting/peeking will
  * resolve to `null`. Note that the value will be removed from Redis after `maxAge`, but the key will
  * be kept in the cache until next time it's accessed (i.e. it will be included in `count`, `keys`, etc., although not in `has`.).
  *
  * [ *Function* ] `score`: function to customize the score used to order the elements in the cache. Defaults to `() => new Date().getTime()`
  *
  * [ *Boolean* ] `increment`: if `true`, on each access the result of the `score` function is added to the previous one,
  *  rather than replacing it.
  *
  * [ *String* ] `strategy`: If 'LRU', the scoring function will be set to LRU Cache.
  * If 'LFU', the scoring function will be set to 'LFU'. The default strategy is 'LFU'
  *
  * [ *String* ] `type`: Overrides the default response type (json). Set this to any mime type express supports. [Docs Here](https://expressjs.com/en/api.html#res.type)
  *
  * ---
  *
  * #### Call back method
  * ```javascript
  * this.cache({ max: 100, strategy: 'LFU' }, cache => {
  *   Products.find({category: 'widgets'}).exec( (err, widgets) => {
  *     this.res.status(200).json(widgets);
  *     cache(doc);
  *   });
  * });
  * ```
  * Using the call back method using LFU cache. In the event of a cache miss, The callback function recieves a cache method
  * that you can call to set the cache for identical requests that may happen in the future. Once this is set, the call back
  * will be skipped and the default response method will be called automatically.
  *
  * #### Chained Methods offer more control.
  * ```javascript
  * this.cache({ max: 100, strategy: 'LRU' })
  *   .miss(cache => {
  *     Products.find({category: 'widgets'}).exec( (err, widgets) => {
  *       this.res.status(200).json(widgets);
  *       cache(widgets);
  *     });
  *   })
  *   .hit(data => this.res.status(200).json(data))
  *   .exec();
  * ```
  * In the above example, we don't pass in a callback. Instead we use chaining to express
  * how we want to handle the control flow.
  *
  * - `miss` registers a callback to allow you to store the item in the cache
  *
  * - `hit` registers a callback to allow you to handle your own response
  *
  * - `exec` runs the function and is a required function call.
  *
  * @param {object} options - (optional) Caching options. See options in the description.
  * @param {function} fn - (optional) the method to call for a cache miss.
  */
  cache (options, fn) {
    this[debug]('cache');
    var cache = new ControllerCache(this.redisClient, this.req.controller, this.req.action, options);
    var hitFn, missFn;

    this.res.cache = function (content) {
      return cache.cache.set(this.req.url, content);
    }

    this.cacheStore = cache.cache;

    if (fn) {
      return cache.cachedVersion(this.req).then(result => {
        if (result) {
          this[debug]('cache:callback:hit');
          this.res.set('X-GLAD-CACHE-HIT', 'true');
          return this.res.type(options.type || 'json').send(result);
        } else {
          this[debug]('cache:callback:miss');
          return fn.call(this, (content) => {
            return cache.cache.set(this.req.url, content);
          });
        }
      });
    } else {
      return {
        hit   (func) { hitFn = func; return this;},
        miss  (func) { missFn = func; return this;},
        exec  : () => {
          return new Promise( (resolve, reject) => {
            cache.cachedVersion(this.req).then(result => {

              if (result) {
                this[debug]('cache:exec:hit');
                this.res.set('X-Glad-Cache-Hit', 'true');
              }

              if (result && hitFn) {
                hitFn(result);
                resolve(result);
              } else if (result) {
                this.res.type(options.type || 'json').send(result);
                resolve(result);
              } else if (missFn) {
                this[debug]('cache:exec:miss');
                missFn(data => {
                  cache.cache.set(this.req.url, data);
                  resolve(data);
                });
              } else {
                this[debug]('cache:exec:error');
                reject({
                  err: `
                    Missing method Error.
                    Please provide the '.miss' portion of your cache chain.
                    this.cache({..opts}).miss((cache) => { ..do stuff >> res.json(stuff) >> cache(stuff) })
                  `
                });
              }
            });
          });
        }
      };
    }
  }

  /**
   * Returns a Cache instance for a give controller action.
   * This makes the following cache methods available.
   * This is needed when you need to manage a cache for another action on the same controller.
   *
   * <strong>Example:</strong> You may want to expire individual items from cache.
   * ```javascript
   * this.actionCache('FindOne').del('/widgets/12').then(function () {});
   *
   * ```
   * <strong>Example:</strong> A DELETE request to `/api/widgets/12` might delete the 12th widget in your database.
   * After removing the item from your database, you may want to reset some caches. The simplest form of this might be to
   * clear the cache for the `Get` action, and remove it from the `FindOne` cache as well. This would ensure that (starting immediately)
   * future requests for widgets will not include this data.
   *
   * ```javascript
   * this.actionCache('Get').reset().then( () => {
   *   this.actionCache('FindOne').del('/widgets/12').then(res);
   * });
   * ```
   *
   * TODO:
   * -----------
   * <strong>Example:</strong> You may have objects in your cache that will change over time, but always need to live in cache.
   * ```javascript
   * this.actionCache('Get').find({url : '/widgets/100'}).update(cache => {
   *   //..do stuff then call cache(widget);
   * });
   * ```
   *
   * TODO:
   * -----------
   * <strong>Example:</strong> You may want to create cache re-warmers for actions.
   * Furthermore after your data changes, you may need to clear a cache and rewarm it.
   * the forEach method will iterate over every item in your action's cache, and provide
   * the item and a cacher specific to the item which you can call to update that item.
   * ```javascript
   * this.actionCache('Get').forEach((item, cache, next) => {
   *   //..do stuff then call cache(updatedItem);
   * });
   * ```
   */
  actionCache (action) {
    this[debug]('actionCache');
    let _cache    = new ControllerCache(this.redisClient, this.req.controller, action);
    let { cache } = _cache;
    return cache;
  }

  /**
   * Renders a view. In the end, this maps to express res.render. By default it looks for a view residing in views/:controller/:action.pug.
   * This can be overridden by passing in the path to the view to render.
   *
   * A controller named User would look for views in the `view/user` folder. If you were rendering from an action called `findOne`, the complete
   * view path would be `views/user/findone`. If you would prefer to specify your own viewpath, there are a two options for you.
   *
   * #### From a controller method:
   * ```
   * // Specify the viewPath on the controller instance. This applies to a request instance.
   * this.viewPath = 'my-views/wigets/widget.pug';
   *
   * // Use this.res.render (from express)
   * this.res.render('path/to/view', data);
   * ```
   */
  render (...args) {
    this[debug]('render');
    args[0] = path.join(this.viewPath, args[0]);
    this.res.render.apply(this.res, args);
  }

}

module.exports = Controller;
