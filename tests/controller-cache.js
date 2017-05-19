let redis    = require("redis");
let client = redis.createClient();
let cache = require('../classes/controller-cache');
let Controller = require('../classes/controller');
const assert = require('assert');
Promise = require('bluebird').Promise;

const dbsize = () => new Promise((resolve, reject) =>
  client.dbsize((err, result) => {
    if (err) return reject(err);
    resolve(result);
  }));

const tick = (time) => new Promise((resolve) => setTimeout(resolve, time || 2));
const promise = (func) => new Promise(resolve => func(resolve));

beforeEach(done => client.flushdb(done));
afterEach(done => client.flushdb(done));
before(done => client.flushdb(done));
after(done => client.flushdb(done));

describe('ControllerCache Handling various data types', function () {

  it('should take a string', () => {
    let lru = new cache(client, 'someController', 'Get', {max: 10});
    return lru.cache.set('/some', 'string content')
      .then(result => assert.equal(result, 'string content'))
      .then(() => lru.cache.get('/some'))
      .then(result => assert.equal(result, 'string content'))
  })

  it('should take an object', () => {
    let lru = new cache(client, 'someController', 'Get', {max: 10});
    return lru.cache.set('/my/url?foo=true', {foo: 'bar'})
      .then(result => assert.deepEqual(result, {foo: 'bar'}))
  });

  it('should take an array', () => {
    let lru = new cache(client, 'someController', 'Get', {max: 10});
    return lru.cache.set('/my/url', [{foo: 'bar'}])
      .then(result => assert.deepEqual(result, [{foo: 'bar'}]))
      .then(() => lru.cache.get('/my/url'))
      .then(result => assert.deepEqual(result, [{foo: 'bar'}]))
  })

  it('should take a number  (integer)', () => {
    let lru = new cache(client, 'someController', 'Get', {max: 10});
    return lru.cache.set('/how-many/things', 4e8)
      .then(result => assert.equal(result, 4e8))
      .then(() => lru.cache.get('/how-many/things'))
      .then(result => assert.equal(result, 4e8))
  })

  it('should take a number  (negative integer)', () => {
    let lru = new cache(client, 'someController', 'Get', {max: 10});
    return lru.cache.set('/how-many/things', -49637)
      .then(result => assert.equal(result, -49637))
      .then(() => lru.cache.get('/how-many/things'))
      .then(result => assert.equal(result, -49637))
  })

  it('should take a number  (float)', () => {
    let lru = new cache(client, 'someController', 'Get', {max: 10});
    return lru.cache.set('/how-many/things', 4.3427)
      .then(result => assert.equal(result, 4.3427))
      .then(() => lru.cache.get('/how-many/things'))
      .then(result => assert.equal(result, 4.3427))
  })

  it('should take a number  (negative float)', () => {
    let lru = new cache(client, 'someController', 'Get', {max: 10});
    return lru.cache.set('/how-many/things', -49637.342787368763587653876538763)
      .then(result => assert.equal(result, -49637.342787368763587653876538763))
      .then(() => lru.cache.get('/how-many/things'))
      .then(result => assert.equal(result, -49637.342787368763587653876538763))
  })

  it('should take a boolean (true)', () => {
    let lru = new cache(client, 'someController', 'Get', {max: 10});
    return lru.cache.set('/lengthy-analysis/result', true)
      .then(result => assert.equal(result, true))
      .then(() => lru.cache.get('/lengthy-analysis/result'))
      .then(result => assert.equal(result, true))
  })

  it('should take a boolean (false)', () => {
    let lru = new cache(client, 'someController', 'Get', {max: 10});
    return lru.cache.set('/lengthy-analysis/result', false)
      .then(result => assert.equal(result, false))
      .then(() => lru.cache.get('/lengthy-analysis/result'))
      .then(result => assert.equal(result, false))
  })

  it('should take a buffer', () => {
    let lru = new cache(client, 'someController', 'Get', {max: 10});
    let bigArray = [];
    let i = 0;

    for (i; i < 3518; i += 1) {
      bigArray.push((Math.random() * 10) < 5 ? 0 : 1);
    }

    let buffer = new Buffer(bigArray);
    return lru.cache.set('/lengthy-analysis/result', buffer)
      .then(() => lru.cache.get('/lengthy-analysis/result'))
      .then(result => assert.deepEqual(buffer, new Buffer(result)))
  })

});


describe('ControllerCache Set and Get methods', () => {
  it('should save an item in the cache and allow to get it back', () => {
    const lru = new cache(client, 'UserController').cache;

    return lru.set('key', 'hello')
      .then((result) => assert.equal(result, 'hello'))
      .then(() => lru.set('key2', {message: 'goodbye'}))
      .then(() => Promise.all([lru.get('key'), lru.get('key2')]))
      .then((results) => {
        assert.equal(results[0], 'hello');
        assert.deepEqual(results[1], {message: 'goodbye'});
      });
  });

  it('should return null if a key is not found in the cache', () => {
    const lru = new cache(client, 'UserController').cache;

    return lru.get('key1')
      .then((result) => assert.equal(result, null));
  });

  it('should save up to opts.max items in the cache', () => {
    const lru = new cache(client, 'UserController').cache;

    return Promise.all([
      lru.set('k1', 'v1'), lru.set('k2', 'v2'), lru.set('k3', 'v3')
    ])
    .then(() => lru.get('k1'))
    .then((r) => assert.equal(r, 'v1'))
    .then(tick)
    .then(() => lru.get('k2'))
    .then((r) => assert.equal(r, 'v2'))
    .then(tick)
    .then(() => lru.get('k3'))
    .then((r) => assert.equal(r, 'v3'))
    .then(dbsize)
    .then((r) => assert.equal(r, 4)) // DB size is #items + 1 for the index
    .then(() => lru.set('k4', 'v4'))
    .then(() => lru.get('k1'))
    .then((r) => assert.equal(r, null, 'k1 should have been evicted from the cache'))
    .then(() => lru.get('k2'))
    .then((r) => assert.equal(r, 'v2'))
    .then(() => lru.get('k3')) // set k4, get k1, k2 => k3 out of the cache
    .then((r) => assert.equal(r, 'v3'))
    .then(() => lru.get('k4'))
    .then((r) => assert.equal(r, 'v4'))
    .then(dbsize)
    .then((r) => assert.equal(r, 4, 'db size should not have grown'));
  });

  it('should keep different items in different namespaces', () => {
    const lru1 = new cache(client, 'first').cache;
    const lru2 = new cache(client, 'second').cache;

    return lru1.set('k1', 'first cache')
      .then(() => lru2.set('k1', 'second cache'))
      .then(() => Promise.all([lru1.get('k1'), lru2.get('k1')]))
      .then((results) => {
        assert.equal(results[0], 'first cache');
        assert.equal(results[1], 'second cache');
      });
  });

  it('should keep the last accessed items first', () => {
    const lru = new cache(client, 'UserController').cache;

    return lru.set('k1', 'v1')
    .then(() => lru.set('k2', 'v2'))
    .then(() => lru.set('k3', 'v3'))
    .then(() => lru.get('k2')) // k2 last
    .then(tick)
    .then(() => lru.get('k3')) // k3 second
    .then(tick)
    .then(() => lru.get('k1')) // k1 first
    .then(tick)
    .then(() => lru.set('k4', 'v4')) // should evict oldest => k2 out
    .then(() => lru.get('k2'))
    .then((result) => {
      assert.equal(result, null);
    });
  });

  it('should update value and last accessed score when setting a key again', () => {
    const lru = new cache(client, 'UserController').cache;

    return lru.set('k1', 'v1')
    .then(() => lru.set('k2', 'v2'))
    .then(() => lru.set('k3', 'v3'))
    .then(() => lru.get('k2'))
    .then(tick)
    .then(() => lru.get('k3'))
    .then(tick)
    .then(() => lru.get('k1'))
    .then(tick)
    .then(() => lru.set('k2', 'v2')) // k2 back to front, k3 is oldest
    .then(tick)
    .then(() => lru.set('k4', 'v4')) // k3 out
    .then(() => lru.get('k3'))
    .then((result) => {
      assert.equal(result, null);
    });
  });

  it('should not update last accessed score on a different namespace', () => {
    let lru1 = new cache(client, 'c1', 'get', {max : 2});
    let lru2 = new cache(client, 'c2', 'get', {max: 2});

    return lru1.cache.set('k1', 'v1')
    .then(() => lru1.cache.set('k2', 'v2'))
    .then(() => lru2.cache.set('k1', 'v1'))
    .then(tick)
    .then(() => lru2.cache.set('k2', 'v2'))
    .then(tick)
    .then(() => lru1.cache.get('k1')) // bumps k1 in first cache
    .then(tick)
    .then(() => lru2.cache.set('k3', 'v3')) // should evict k1 in second cache
    .then(() => lru2.cache.get('k1'))
    .then((result) => {
      assert.equal(result, null);
    });
  });
});

describe("ControllerCache LRU set options during runtime (Single Prop)", function () {

  it('should update the max options', function () {
    let myCache = new cache(client, 'UserController');
    myCache.setOptions({max: 1}, true);
    return myCache.cache.set('k1', 'v1')
    .then(() => myCache.cache.set('k2', 'v2'))
    .then(() => myCache.cache.get('k1'))
    .then(tick)
    .then(() => myCache.cache.get('k1'))
    .then(result => {
      assert.equal(result, null);
    }).then(() => myCache.cache.reset());
  });

});

describe("ControllerCache LRU set options during runtime (Multiple Props)", function () {
  it('should update the strategy', function () {
    let myCache = new cache(client, 'UserController');
    myCache.setOptions({max: 2, strategy: 'LFU'}, true);
    return myCache.cache.set('beatles', 'john, paul, george, ringo')
      .then(() => myCache.cache.get('beatles')) // accessed twice
      .then(() => myCache.cache.set('zeppelin', 'jimmy, robert, john, bonzo'))
      .then(() => myCache.cache.set('floyd', 'david, roger, syd, richard, nick')) // cache full, remove least frequently accessed
      .then(() => myCache.cache.get('zeppelin'))
      .then(result => {
        assert.equal(result, null);
      })
  });

  it('should update the namespace', function () {
    let myCache = new cache(client, 'UserController');
    myCache.setOptions({max: 2, strategy: 'LFU', namespace: 'fooze'}, true);
    return myCache.cache.set('beatles', 'john, paul, george, ringo')
      .then(() => myCache.cache.get('beatles')) // accessed twice
      .then(() => myCache.cache.set('zeppelin', 'jimmy, robert, john, bonzo'))
      .then(() => myCache.cache.set('floyd', 'david, roger, syd, richard, nick')) // cache full, remove least frequently accessed
      .then(() => myCache.cache.get('zeppelin'))
      .then(result => {
        assert.equal(result, null);
        assert.equal(myCache.namespace, 'UserController#UNDEFINED-ACTION-fooze');
      })
  });

});

describe('ControllerCache getOrSet method', () => {
  it('should get the value from cache and NOT call the function', () => {
    const lru = new cache(client, 'someController')

    function fn () {
      throw Error('should not call');
    }

    return lru.cache.set('key', 'hello')
      .then(() => lru.cache.getOrSet('key', fn))
      .then((result) => assert.equal(result, 'hello'));
  });

  it('should set key to the return value of the function', () => {
    const lru = new cache(client, 'someController').cache

    function fn () {
      return 5;
    }

    return lru.getOrSet('key', fn)
      .then((result) => assert.equal(result, 5))
      .then(() => lru.get('key'))
      .then((result) => assert.equal(result, 5));
  });

  it('should set key to the resolved value of the promise returned by the function', () => {
    const lru = new cache(client, 'someController').cache

    function fn () {
      return Promise.resolve(5);
    }

    return lru.getOrSet('key', fn)
      .then((result) => assert.equal(result, 5))
      .then(() => lru.get('key'))
      .then((result) => assert.equal(result, 5));
  });

  it('should reject if function rejects', () => {
    const lru = new cache(client, 'someController').cache

    function fn () {
      return Promise.reject(Error('something went wrong'));
    }

    return lru.getOrSet('key', fn)
      .then(() => { throw Error('should not resolve'); })
      .catch((err) => assert.equal(err.message, 'something went wrong'));
  });

  it('should reject if function throws', () => {
    const lru = new cache(client, 'someController').cache

    function fn () {
      throw Error('something went wrong');
    }

    return lru.getOrSet('key', fn)
      .then(() => { throw Error('should not resolve'); })
      .catch((err) => assert.equal(err.message, 'something went wrong'));
  });

  it('should update recent-ness when getOrSet a saved value', () => {
    const lru = new cache(client, 'someController', 'FindOne').cache

    return lru.set('k1', 'v1')
    .then(() => lru.set('k2', 'v2'))
    .then(() => lru.set('k3', 'v3'))
    .then(() => lru.getOrSet('k2')) // k2 last
    .then(tick)
    .then(() => lru.getOrSet('k3')) // k3 second
    .then(tick)
    .then(() => lru.getOrSet('k1')) // k1 first
    .then(tick)
    .then(() => lru.set('k4', 'v4')) // should evict oldest => k2 out
    .then(() => lru.get('k2'))
    .then((result) => {
      assert.equal(result, null);
    });
  });

  it('should update recent-ness when getOrSet a missing value', () => {
    const lru = new cache(client, 'someController').cache

    return lru.getOrSet('k2', () => 2) // k2 last
    .then(tick)
    .then(() => lru.getOrSet('k3', () => 3)) // k3 second
    .then(tick)
    .then(() => lru.getOrSet('k1', () => 1)) // k1 first
    .then(tick)
    .then(() => lru.set('k4', 'v4')) // should evict oldest => k2 out
    .then(() => lru.get('k2'))
    .then((result) => {
      assert.equal(result, null);
    });
  });
});

describe('ControllerCache peek method', () => {
  it('should return the value without changing the recent-ness score', () => {
    let lrucache = new cache(client, 'someController', 'Get', {max: 2});
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(tick)
      .then(() => lru.set('k2', 'v2'))
      .then(() => lru.peek('k1'))
      .then((r) => {
        assert.equal(r, 'v1');
        return lru.set('k3', 'v3'); // should evict k1 since last peek doesnt update recentness
      })
      .then(() => lru.get('k1'))
      .then((r) => assert.equal(r, null));
  });
});

describe('ControllerCache del method', () => {
  it('should remove the key from the cache and preserve the rest', () => {
    let lrucache = new cache(client, 'someController', 'Get', {max: 2});
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(() => lru.set('k2', 'v2'))
      .then(() => lru.del('k1'))
      .then(() => lru.get('k1'))
      .then((r) => assert.equal(r, null))
      .then(() => lru.get('k2'))
      .then((r) => assert.equal(r, 'v2'));
  });

  it('should not remove from other namespaces', () => {
    let lrucache = new cache(client, 'someController', 'Foo', {max: 2});
    const lru = lrucache.cache;

    let cache2 = new cache(client, 'c2');
    cache2.setOptions({max: 2});
    const lru2 = cache2.cache;

    return lru.set('k1', 'v1')
      .then(() => lru2.set('k1', 'v1'))
      .then(() => lru.del('k1'))
      .then(() => lru.get('k1'))
      .then((r) => assert.equal(r, null))
      .then(() => lru2.get('k1'))
      .then((r) => assert.equal(r, 'v1'));
  });
});

describe('ControllerCache reset method', () => {
  it('should remove all keys from the cache', () => {
    let lrucache = new cache(client, 'someController', 'foo', {max: 2});
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(() => lru.set('k2', 'v2'))
      .then(() => lru.reset())
      .then(() => lru.get('k1'))
      .then((r) => assert.equal(r, null))
      .then(() => lru.get('k2'))
      .then((r) => assert.equal(r, null));
  });

  it('should not empty other namespaces', () => {
    let lrucache = new cache(client, 'someController', 'getSomeList', {max: 2});
    const lru = lrucache.cache;

    let cache2 = new cache(client, 'c2');
    cache2.setOptions({max: 2}, true);
    const lru2 = cache2.cache;

    return lru.set('k1', 'v1')
      .then(() => lru2.set('k1', 'v1'))
      .then(() => lru.reset())
      .then(() => lru.get('k1'))
      .then((r) => assert.equal(r, null))
      .then(() => lru2.get('k1'))
      .then((r) => assert.equal(r, 'v1'));
  });
});

describe('ControllerCache has method', () => {
  it('should return true if the item is in the cache without affecting the recent-ness', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(tick)
      .then(() => lru.set('k2', 'v2'))
      .then(() => lru.has('k1'))
      .then((r) => {
        assert.equal(r, true);
        return lru.set('k3', 'v3'); // should evict k1 since last peek doesnt update recentness
      })
      .then(() => lru.get('k1'))
      .then((r) => assert.equal(r, null));
  });

  it('should return false if the item is not in the cache', () => {
    let lrucache = new cache(client);
    lrucache.setOptions({max: 2}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(() => lru.set('k2', 'v2'))
      .then(() => lru.has('k3'))
      .then((r) => assert.equal(r, false));
  });
});

describe('ControllerCache keys method', () => {
  it('should return all keys inside the cache', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(tick)
      .then(() => lru.set('k2', 'v2'))
      .then(() => lru.keys())
      .then((r) => assert.deepEqual(r, ['k2', 'k1']));
  });

  it('should not return more keys if size exceeded before', () => {
    let lrucache = new cache(client, '22', 'aa');
    lrucache.setOptions({max: 2}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(tick)
      .then(() => lru.set('k2', 'v2'))
      .then(tick)
      .then(() => lru.set('k3', 'v3'))
      .then(() => lru.keys())
      .then((r) => assert.deepEqual(r, ['k3', 'k2']));
  });
});

describe('ControllerCache values method', () => {
  it('should return all values inside the cache', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(tick)
      .then(() => lru.set('k2', 'v2'))
      .then(() => lru.values())
      .then((r) => assert.deepEqual(r, ['v2', 'v1']));
  });

  it('should not return more values if size exceeded before', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(tick)
      .then(() => lru.set('k2', 'v2'))
      .then(tick)
      .then(() => lru.set('k3', 'v3'))
      .then(() => lru.values())
      .then((r) => assert.deepEqual(r, ['v3', 'v2']));
  });
});

describe('ControllerCache count method', () => {
  it('should return zero if no items in the cache', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2}, true);
    const lru = lrucache.cache;

    return lru.count()
      .then((r) => assert.equal(r, 0));
  });

  it('should return the amount of items in the cache', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(tick)
      .then(() => lru.set('k2', 'v2'))
      .then(() => lru.count())
      .then((r) => assert.equal(r, 2));
  });

  it('should return the max size if cache size exceeded before', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(tick)
      .then(() => lru.set('k2', 'v2'))
      .then(tick)
      .then(() => lru.set('k3', 'v3'))
      .then(() => lru.count())
      .then((r) => assert.equal(r, 2));
  });
});

describe('ControllerCache maxAge option', () => {
  it('should return null after global maxAge has passed', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2, maxAge: 10}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(() => lru.get('k1'))
      .then((result) => assert.equal(result, 'v1'))
      .then(() => tick(11))
      .then(() => lru.get('k1'))
      .then((result) => assert.equal(result, null));
  });

  it('should return null after key maxAge has passed', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1', 10)
      .then(() => lru.get('k1'))
      .then((result) => assert.equal(result, 'v1'))
      .then(() => tick(11))
      .then(() => lru.get('k1'))
      .then((result) => assert.equal(result, null));
  });

  it('should reduce dbsize after key expiration', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2, maxAge: 10}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(dbsize)
      .then((size) => assert.equal(size, 2))
      .then(() => tick(11))
      .then(() => lru.get('k1'))
      .then((result) => assert.equal(result, null))
      .then(dbsize)
      .then((size) => assert.equal(size, 0)); // zset doesnt count if empty
  });

  it('should remove expired key from index next time is getted', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(() => lru.set('k2', 'v2', 10))
      .then(() => tick(11))
      .then(() => lru.get('k2'))
      .then((result) => assert.equal(result, null))
      .then(() => lru.count())
      .then((count) => assert.equal(count, 1))
      .then(() => lru.keys())
      .then((keys) => assert.deepEqual(keys, ['k1']));
  });

  it('should remove expired key from index next time is peeked', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(() => lru.set('k2', 'v2', 10))
      .then(() => tick(11))
      .then(() => lru.peek('k2'))
      .then((result) => assert.equal(result, null))
      .then(() => lru.count())
      .then((count) => assert.equal(count, 1))
      .then(() => lru.keys())
      .then((keys) => assert.deepEqual(keys, ['k1']));
  });

  it('should not let key maxAge affect other keys', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2, maxAge: 30}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1', 10)
      .then(() => lru.set('k2', 'v2'))
      .then(() => lru.get('k1'))
      .then((result) => assert.equal(result, 'v1'))
      .then(() => lru.get('k2'))
      .then((result) => assert.equal(result, 'v2'))
      .then(() => tick(11))
      .then(() => lru.get('k1'))
      .then((result) => assert.equal(result, null))
      .then(() => lru.get('k2'))
      .then((result) => assert.equal(result, 'v2'))
      .then(() => tick(20))
      .then(() => lru.get('k2'))
      .then((result) => assert.equal(result, null));
  });

  it('should return false when calling has on an expired item', () => {
    let lrucache = new cache(client, 'someController');
    lrucache.setOptions({max: 2, maxAge: 10}, true);
    const lru = lrucache.cache;

    return lru.set('k1', 'v1')
      .then(() => lru.has('k1'))
      .then((result) => assert.equal(result, true))
      .then(() => tick(11))
      .then(() => lru.has('k1'))
      .then((result) => assert.equal(result, false));
  });
});

describe('ControllerCache custom score/increment options', () => {
  it('should allow building a LFU cache with a custom score and increment', () => {
    let lrucache = new cache(client, 'someController', 'Get', {max: 3, strategy: 'LFU'});
    const lfu = lrucache.cache;

    return lfu.set('k1', 'v1')
      .then(() => lfu.get('k1'))
      .then(() => lfu.get('k1')) // k1 used three times
      .then(() => lfu.set('k2', 'v2'))
      .then(() => lfu.set('k2', 'v22')) // k2 used 2 times
      .then(() => lfu.set('k3', 'v3'))
      .then(() => lfu.set('k4', 'v4')) // k3 should be removed
      .then(() => lfu.get('k3'))
      .then((result) => assert.equal(result, null))
      .then(() => lfu.keys())
      .then((keys) => assert.deepEqual(keys, ['k1', 'k2', 'k4']));
  });
});

describe('ControllerCache Use a URL as a key', function () {
  it('should store a url as a key', function () {
    let lru = new cache(client, 'someController');
    return lru.cache.set('/bands/led-zeppelin', 'v1')
      .then(() => lru.cache.get('/bands/led-zeppelin'))
      .then(result => assert.equal(result,'v1'))
  });

  it('should store a url & querystring as a key', function () {
    let lru = new cache(client, 'someController');
    return lru.cache.set('/bands/led-zeppelin?foo=bar&zap=123&weird=[1,2,3,4]&why={"key": "val"}', 'v1')
      .then(() => lru.cache.get('/bands/led-zeppelin?foo=bar&zap=123&weird=[1,2,3,4]&why={"key": "val"}'))
      .then(result => assert.equal(result,'v1'))
  });
});

describe('ControllerCache cachedVersion', function () {
  it('should return the cached version when it is available', function () {
    let lru = new cache(client, 'someController', 'Get');
    let req = {
      controller : 'someController',
      action : 'Get',
      url : '/bands/led-zeppelin'
    };
    lru.cache.set('/bands/led-zeppelin', { name : 'Led Zeppelin' });

    return lru.cachedVersion(req).then(result => {
      assert.equal(result.name, 'Led Zeppelin')
    });
  });

  it('should return false when it is not available', function () {
    let lru = new cache(client, 'someController', 'Get');
    let req = {
      controller : 'someController',
      action : 'Get',
      url : '/bands/led-zeppelin'
    };

    return lru.cachedVersion(req).then(result => {
      assert.equal(result, false);
    });
  });
});

describe('ControllerCache Controller Methods should work', function () {

  class testController extends Controller {

    Get () {
      return promise( res => {
        this.cache({ max: 100, strategy: 'LFU' }, cache => {
          let doc = [{ name: 'doc1' }];
          this.res.status(200).json(doc);
          cache(doc).then(res);
        });
      });
    }

    FindOne () {
      return promise( res => {
        let doc = { name: 'doc1' };
        this.cache({ max: 100, strategy: 'LRU' })
          .miss(cache => {
            this.res.status(200).json(doc);
            cache(doc);
          })
          .hit(data => this.res.status(200).json(data))
          .exec().then(res);
      });
    }

    Post () {
      return promise( res => {
        this.actionCache('Get').reset().then(res);
      });
    }

    Put () {
      return promise( res => {
        this.actionCache('Get').reset().then(res);
      })
    }

    Delete () {
      return promise( res => {
        this.res.status(200).json({result: 'Ya, its gone forever'});
        this.actionCache('Get').reset().then( () => {
          this.actionCache('FindOne').del('/widgets/12').then(res);
        });
      })
    }

    lookup (val) {
      return this.cache.get(val);
    }

    callbackWithResponseType () {
      let doc = { name: 'doc1' };
      return promise( res => {
        let doc = { name: 'doc1' };
        this.cache({ max: 100, strategy: 'LRU', responseMethod: 'send' }, cache => {
          res(this.res.send(doc));
          cache(doc);
        })
      });
    }

    promisable () {
      let doc = { name: 'doc14' };
      return promise( res => {
        let doc = { name: 'doc1' };
        this.cache({ max: 2, strategy: 'LFU' })
            .then(() => User.find().limit(15))
            .then(users => this.res.json(users).cache(users))
            .catch(err => this.error(err))
            .finally(res)
      });
    }

  }

  let res = {
    status () {
      return { json () { return 'json' } }
    },
    json () { return 'json' },
    send () { return 'send'}
  }

  it('should cache on a request to a cacheable method (GET)', function () {
    let myController = new testController({controller: 'myController', action: 'Get', url: '/widgets'}, res, client);
    return myController.Get()
      .then(() => myController.cacheStore.get('/widgets'))
      .then(value => assert.deepEqual(value, [{name: 'doc1'}]))
  })

  it('should cache on a request to a cacheable method (FindOne)', function () {
    let myController = new testController({controller: 'myController', action: 'FindOne', url: '/widgets'}, res, client);
    return myController.FindOne()
      .then(() => myController.cacheStore.get('/widgets'))
      .then(value => assert.deepEqual(value, { name: 'doc1' }))
  })

  it('should remove a cached Item (PUT)', function () {
    let controllerForGet = new testController({controller: 'myController', action: 'Get', url: '/widgets'}, res, client);
    let controllerForPut = new testController({controller: 'myController', action: 'Put', url: '/widgets/12'}, res, client);

    return controllerForGet.Get()
      .then(() => controllerForGet.cacheStore.get('/widgets'))
      .then(value => assert.deepEqual(value, [{name: 'doc1'}]))
      .then(() => controllerForPut.Put())
      .then(() => controllerForGet.cacheStore.get('/widgets'))
      .then(value => assert.equal(value, null))
  })


  it('should remove a cached Item (DELETE)', function () {
    let controllerForGet = new testController({controller: 'myController', action: 'Get', url: '/widgets'}, res, client);
    let controllerForFindOne = new testController({controller: 'myController', action: 'FindOne', url: '/widgets/12'}, res, client);
    let controllerForDelete = new testController({controller: 'myController', action: 'Delete', url: '/widgets/12'}, res, client);

    return controllerForGet.Get()
      .then(() => controllerForFindOne.FindOne())
      .then(() => controllerForGet.cacheStore.get('/widgets'))
      .then(value => assert.deepEqual(value, [{name: 'doc1'}]))

      .then(() => controllerForFindOne.cacheStore.get('/widgets/12'))
      .then(value => assert.deepEqual(value, {name: 'doc1'}))
      .then(() => controllerForDelete.Delete())
      .then(() => controllerForGet.cacheStore.get('/widgets'))
      .then(value => assert.equal(value, null))
  })

});

//
