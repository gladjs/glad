const assert = require('assert');
let redis    = require("redis");
let client = redis.createClient();
let Cache = require('../namespace/cache');
let productionCache = new Cache({redis: client}, {development : false});
let developmentCache = new Cache({redis: client}, {development : true});

describe('Glad.cache', function () {

  it('should cache an object and retrieve it', function () {
    return productionCache.store('test001', {foo : true})
      .then(() => productionCache.get('test001'))
      .then(data => {
        assert.deepEqual(data, {foo: true});
      });
  });

  it('should cache a string and retrieve it', function () {
    return productionCache.store('stringtest', 'testdata')
      .then(() => productionCache.get('stringtest'))
      .then(data => {
        assert.equal(data, 'testdata');
      });
  });

  it('should cache an object, retrieve it, delete it', function () {
    return productionCache.store('test001', {foo : true})
      .then(() => productionCache.get('test001'))
      .then(data => {
        return assert.deepEqual(data, {foo: true});
      })
      .then(() => productionCache.clear('test001'))
      .then(() => productionCache.get('test001'))
      .then(data => {
        return assert.equal(data, false);
      });
  });

  it('cache.clear should only remove the key passed in, when one is present', function () {
    return productionCache.store('test001', {foo : true})
      .then(() => productionCache.store('test002', {foo : false}))
      .then(() => productionCache.get('test001'))
      .then(data => {
        return assert.deepEqual(data, {foo: true});
      })
      .then(() => productionCache.get('test002'))
      .then(data => {
        return assert.deepEqual(data, {foo: false});
      })
      .then(() => productionCache.clear('test001'))
      .then(() => productionCache.get('test001'))
      .then(data => {
        return assert.equal(data, false);
      })
      .then(() => productionCache.get('test002'))
      .then(data => {
        return assert.deepEqual(data, {foo: false});
      });
  });

  it('cache.clear should remove all keys passed in, when none are present', function () {
    return productionCache.store('test001', {foo : true})
      .then(() => productionCache.store('test002', {foo : false}))
      .then(() => productionCache.get('test001'))
      .then(data => {
        return assert.deepEqual(data, {foo: true});
      })
      .then(() => productionCache.get('test002'))
      .then(data => {
        return assert.deepEqual(data, {foo: false});
      })
      .then(() => productionCache.clear())
      .then(() => productionCache.get('test001'))
      .then(data => {
        return assert.equal(data, false);
      })
      .then(() => productionCache.get('test002'))
      .then(data => {
        return assert.equal(data, false);
      })
  });

  it('cache.resolve should resolve the outer promise when a hit is found, and cache a string', function () {
    return productionCache.store('test001', 'testdata')
      .then(() => productionCache.get('test001'))
      .then(data => {
        return assert.equal(data, 'testdata');
      })
      .then(() => {
        return new Promise( (resolve, reject) => {
          productionCache.resolve('test001', resolve).miss(() => {
            throw new Error('Miss should not be called');
          });
        });
      })
      .then(() => {
        return true;
      })
  });

  it('cache.resolve should cache a number', function () {
    return productionCache.store('test001', 54321)
      .then(() => productionCache.get('test001'))
      .then(data => {
        return assert.equal(data, 54321);
      })
      .then(() => {
        return new Promise( (resolve, reject) => {
          productionCache.resolve('test001', resolve).miss(() => {
            throw new Error('Miss should not be called');
          });
        });
      })
      .then(() => {
        return true;
      })
  });

  it('cache.resolve should cache an object', function () {
    return productionCache.store('test001', {foo : '98'})
      .then(() => productionCache.get('test001'))
      .then(data => {
        return assert.deepEqual(data, {foo : '98'});
      })
      .then(() => {
        return new Promise( (resolve, reject) => {
          productionCache.resolve('test001', resolve).miss(() => {
            throw new Error('Miss should not be called');
          });
        });
      })
      .then(() => {
        return true;
      })
  });

  it('cache.list should list all keys', function () {
    return productionCache.clear()
      .then(() => productionCache.store('test001', 'testing-001'))
      .then(() => productionCache.store('test002', 'testing-002'))
      .then(() => productionCache.store('test003', 'testing-003'))
      .then(() => productionCache.store('test004', 'testing-004'))
      .then(() => productionCache.store('non-match', 'testing-non-match'))
      .then(() => productionCache.list())
      .then(keys => assert.deepEqual(keys.sort(), ['test001', 'test002', 'test003', 'test004', 'non-match'].sort()))
  });

  it('cache.list should list only matching keys when a pattern is provided', function () {
    return productionCache.clear()
      .then(() => productionCache.store('test001', 'testing-001'))
      .then(() => productionCache.store('test002', 'testing-002'))
      .then(() => productionCache.store('test003', 'testing-003'))
      .then(() => productionCache.store('test004', 'testing-004'))
      .then(() => productionCache.store('non-match', 'testing-non-match'))
      .then(() => productionCache.list('test*'))
      .then(keys => assert.deepEqual(keys.sort(), ['test001', 'test002', 'test003', 'test004'].sort()))
  });

  it('cache.list should list only matching keys when a pattern is provided (2)', function () {
    return productionCache.clear()
      .then(() => productionCache.store('test001', 'testing-001'))
      .then(() => productionCache.store('test002', 'testing-002'))
      .then(() => productionCache.store('test003', 'testing-003'))
      .then(() => productionCache.store('test004', 'testing-004'))
      .then(() => productionCache.store('non-match', 'testing-non-match'))
      .then(() => productionCache.list('non*'))
      .then(keys => assert.deepEqual(keys, ['non-match']))
  });

  it('cache.clearWhere should remove only matching keys (1)', function () {
    return productionCache.clear()
      .then(() => productionCache.store('test001', 'testing-001'))
      .then(() => productionCache.store('test002', 'testing-002'))
      .then(() => productionCache.store('test003', 'testing-003'))
      .then(() => productionCache.store('test004', 'testing-004'))
      .then(() => productionCache.store('non-match', 'testing-non-match'))
      .then(() => productionCache.clearWhere('test*'))
      .then(() => productionCache.list())
      .then(keys => assert.deepEqual(keys, ['non-match']))
      .then(() => productionCache.get('non-match')
      .then(data => assert.equal(data, 'testing-non-match')));
  });

  it('cache.clearWhere should remove only matching keys (2)', function () {
    return productionCache.clear()
      .then(() => productionCache.store('widgets/32', 'testing-001'))
      .then(() => productionCache.store('widgets/41', 'testing-002'))
      .then(() => productionCache.store('widgets/190', 'testing-003'))
      .then(() => productionCache.store('widgets/720', 'testing-004'))
      .then(() => productionCache.store('non-match', 'testing-non-match'))
      .then(() => productionCache.clearWhere('widgets/*'))
      .then(() => productionCache.list())
      .then(keys => assert.deepEqual(keys, ['non-match']))
      .then(() => productionCache.get('non-match')
      .then(data => assert.equal(data, 'testing-non-match')));
  });

  it('cache.clearWhere should remove only matching keys (3)', function () {
    return productionCache.clear()
      .then(() => productionCache.store('widgets/32', 'testing-001'))
      .then(() => productionCache.store('widgets/41', 'testing-002'))
      .then(() => productionCache.store('widgets/190', 'testing-003'))
      .then(() => productionCache.store('widgets/720', 'testing-004'))
      .then(() => productionCache.store('foo/widgets/720', 'testing-004'))
      .then(() => productionCache.store('non-match', 'testing-non-match'))
      .then(() => productionCache.clearWhere('widgets/*'))
      .then(() => productionCache.list())
      .then(keys => assert.deepEqual(keys.sort((a,b) => a < b), ['foo/widgets/720', 'non-match'].sort((a,b) => a < b)))
      .then(() => productionCache.get('non-match')
      .then(data => assert.equal(data, 'testing-non-match')));
  });

  it('cache.clearWhere should remove only matching keys (4)', function () {
    return productionCache.clear()
      .then(() => productionCache.store('widgets/32', 'testing-001'))
      .then(() => productionCache.store('widgets/41', 'testing-002'))
      .then(() => productionCache.store('widgets/190', 'testing-003'))
      .then(() => productionCache.store('widgets/720', 'testing-004'))
      .then(() => productionCache.store('foo/widgets/720', 'testing-004'))
      .then(() => productionCache.store('non-match', 'testing-non-match'))
      .then(() => productionCache.clearWhere('*widgets/*'))
      .then(() => productionCache.list())
      .then(keys => assert.deepEqual(keys, ['non-match']))
      .then(() => productionCache.get('non-match')
      .then(data => assert.equal(data, 'testing-non-match')));
  });

  it('caching should be disabled in development', function () {
    return productionCache.clear()
      .then(() => developmentCache.store('development', 'nope'))
      .then(() => developmentCache.get('development'))
      .then(result => assert.equal(result, false));
  });

  it('cache.resolve should always hit the miss function in development', function () {
    return developmentCache.store('dev', 100)
      .then(() => developmentCache.get('test'))
      .then(data => {
        return assert.equal(data, false);
      })
      .then(() => {
        return new Promise( (resolve, reject) => {
          developmentCache.resolve('dev', resolve).miss((cache) => {
            cache(100);
            resolve('miss');
          });
        });
      })
      .then(result => {
        return assert.equal(result, 'miss');
      })
      .then(() => {
        return new Promise( (resolve, reject) => {
          developmentCache.resolve('dev', resolve).miss((cache) => {
            resolve('miss');
          });
        });
      })
      .then(result => {
        return assert.equal(result, 'miss');
      })
  });

});
