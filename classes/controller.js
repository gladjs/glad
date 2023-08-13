import { join } from "path";
import debugLogger from "debug";
import ControllerCache from "./controller-cache.js";
import object from "../namespace/object.js";
import { isNotObject } from "../namespace/type.js";
const debugNamespace = Symbol("debugNamespace");
const debug = Symbol("debug");
const { get, set } = object;

/**
 * Controller Class.s
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
 * - socketIO      SocketIO
 * - permit        A method that removes non-whitelisted objects. Nested Objects are not allowed without using dot notation to specify the nested keys.
 * - deepPermit    A method that removes non-whitelisted objects. Nested Objects are allowed.
 * - permitted     Boolean, has this action called permit. This may be useful to enforce permitting.
 * - render        Renders a view.
 * ```
 */
class Controller {
  constructor(req, res, redisClient, socketIO) {
    let { params, body } = req;
    this.req = req;
    this.res = res;
    this.params = params;
    this.body = body;
    this.redisClient = redisClient;
    this.socketIO = socketIO;
    this.cacheStore = {};
    this.viewPath = req.controller.replace("Controller", "").toLowerCase();
    this[debugNamespace] = debugLogger("glad");
    this[debug]("Created Controller Instance");
  }

  [debug](name) {
    this[debugNamespace]("Controller: %s > %s", name, this.req.id);
  }

  /**
   * Whitelist allowable data in a request body. This is a good idea if you are mass assigning things.
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
  permit(...keys) {
    this[debug]("permit");
    let i = 0;
    let len = keys.length;
    let ref = {};

    for (i; i < len; i += 1) {
      let val = get(this.body, keys[i]);

      if (isNotObject(val)) {
        if (val) {
          set(ref, keys[i], val);
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
    this[debug]("deepPermit");
    let i = 0;
    let len = keys.length;
    let ref = {};

    for (i; i < len; i += 1) {
      let val = get(this.body, keys[i]);
      if (val) {
        set(ref, keys[i], val);
      }
    }
    this.body = this.req.body = ref;
    this.permitted = true;
  }

  /**
   * The default error response for the controller
   * @param {object} error - The error that occured. Providing `status` on the error object will set the HTTP Status code on the respone.
   */
  error(err = {}) {
    this[debug]("error");
    this.res.status(err.status || 500).json(err);
  }

  /**
   * ##  The controller level cache.
   * ---
   * All options are optional.
   *
   * [ *Number* ]  `max`: Maximum amount of items the cache can hold. This option is required.
   *
   * [ *String* ]  `namespace`: Prefix appended to all keys saved in Redis, to avoid clashes with other applications
   * and to allow multiple instances of the cache. Given a controller called "Products" and an action called "find", the default
   * namespace is `Products#find`. By setting this value to 'server007' it would be `Products#find-server007`.
   *
   * [ *Number* ]  `maxAge`: Maximum amount of milliseconds the key will be kept in the cache; after that getting/peeking will
   * resolve to `null`. Note that the value will be removed from Redis after `maxAge`, but the key will
   * be kept in the cache until next time any cache is accessed (i.e. it will be included in `count`, `keys`, etc., although not in `has`.).
   *
   * [ *Function* ] `score`: function to customize the score used to order the elements in the cache. Defaults to `() => new Date().getTime()`
   *
   * [ *Boolean* ] `increment`: if `true`, on each access the result of the `score` function is added to the previous one,
   *  rather than replacing it.
   *
   * [ *String* ] `strategy`: If 'LRU', the scoring function will be set to LRU Cache.
   * If 'LFU', the scoring function will be set to 'LFU'. The default strategy is 'LFU'
   *
   * [ *String* ] `uuid`: This is an additional suffix that can be added to the key in order to support caching items that belong to an entity, like a user for example/
   * If you do not set this, then a cache hit will occur when the following are satisfied, [Controller, Method, request.url, namespace]
   *
   *
   * #### Example.
   * ```javascript
   * const data = await this.cache({ max: 100, strategy: 'LRU' }, async cache => await getTheData())
   * ```
   *
   * @param {object} options - Caching options. See options in the description.
   * @param {function} fn - An async function that will be used to get the data that we'll use to populate the cache.
   */

  async cache(options, missFn) {
    try {
      this[debug]("cache");
      var cache = new ControllerCache(
        this.redisClient,
        this.req.controller,
        this.req.action,
        options
      );

      this.cacheStore = cache.cache;
      const result = await cache.cachedVersion(this.req);

      if (result) {
        this[debug]("cache:hit");
        this.res.set("X-Glad-Cache-Hit", "true");
        return result;
      }

      this[debug]("cache:miss");
      const missFnResult = await missFn();
      this[debug]("cache:set");
      await cache.cache.set(this.req.url, missFnResult);
      this[debug]("cache:set complete");
      return missFnResult;
    } catch (err) {
      throw err;
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
  actionCache({ action, namespace, uuid }) {
    this[debug]("actionCache");

    let _cache = new ControllerCache(
      this.redisClient,
      this.req.controller,
      action,
      { namespace, uuid }
    );
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
  render(...args) {
    this[debug]("render");
    args[0] = join(this.viewPath, args[0]);
    this.res.render.apply(this.res, args);
  }
}

export default Controller;
