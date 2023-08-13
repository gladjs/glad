import { deepEqual, equal, strictEqual, ok } from 'assert';
import { createClient } from "redis";
import Cache from '../namespace/cache.js';

let client = createClient();
let productionCache = new Cache({redis: client}, {development : false});
let developmentCache = new Cache({redis: client}, {development : true});

before(async () => await client.connect());
beforeEach(async () => await client.flushDb());
after(async () => {
  await client.flushDb()
  await client.disconnect()
});


describe('Glad.cache', function () {

  it('should cache an object and retrieve it', async function () {
    await productionCache.store('test', { foo : true });
    let data = await productionCache.get('test');
    deepEqual(data, {foo: true});
  });

  it('should cache a string and retrieve it', async function () {
    await productionCache.store('test', 'testdata');
    let data = await productionCache.get('test');
    deepEqual(data, 'testdata');
  });

  it('should cache an object, retrieve it, delete it', async function () {
    await productionCache.store('test001', {foo : true});
    let data = await productionCache.get('test001');
    deepEqual(data, {foo: true});

    await productionCache.clear('test001');
    data = await productionCache.get('test001');
    equal(data, false);
  });

  it('cache.clear should only remove the key passed in, when one is present', async function () {
    await productionCache.store('test001', { foo : true })
    await productionCache.store('test002', { foo : false })
    
    let firstRetrieve = await productionCache.get('test001');
    let secondRetrieve = await productionCache.get('test002');

    deepEqual(firstRetrieve, {foo: true});
    deepEqual(secondRetrieve, {foo: false});

    await productionCache.clear('test001');
    let firstClearedResult = await productionCache.get('test001');
    equal(firstClearedResult, false);
     
    secondRetrieve = await productionCache.get('test002');
    deepEqual(secondRetrieve, {foo: false});
  });

  it('cache.clear should remove all keys passed in, when none are present', async function () {
    await productionCache.store('test001', {foo : true})
    await productionCache.store('test002', {foo : false})

    let firstRetrieve = await productionCache.get('test001');
    let secondRetrieve = await productionCache.get('test002'); 

    deepEqual(firstRetrieve, {foo: true});
    deepEqual(secondRetrieve, {foo: false});

    await productionCache.clear();

    firstRetrieve = await productionCache.get('test001');
    secondRetrieve = await productionCache.get('test002'); 
      
    equal(firstRetrieve, false);
    equal(secondRetrieve, false);
  });

  it('cache.resolve should retrieve a cached number', async function () {
    await productionCache.store('test001', 54321);
    let firstRetrieve = await productionCache.get('test001');
    strictEqual(firstRetrieve, 54321);

    const data = await productionCache.resolve('test001').miss(() => {
      throw new Error('Miss should not be called');
    })
    
    strictEqual(data, 54321);
  });

  it('cache.resolve should resolve the outer promise when a hit is found, and cache a string', async function () {
    await productionCache.store('test001', 'testdata');
    let firstRetrieve = await productionCache.get('test001');
    equal(firstRetrieve, 'testdata');
    
    const data = await productionCache.resolve('test001').miss(() => {
      throw new Error('Miss should not be called');
    });
    
    strictEqual(data, 'testdata');
  });

  it('cache.resolve should cache an object', async function () {
    await productionCache.store('test001', {foo: true});
    let firstRetrieve = await productionCache.get('test001');
    deepEqual(firstRetrieve, {foo: true});
    
    const data = await productionCache.resolve('test001').miss(() => {
      throw new Error('Miss should not be called');
    });
    
    deepEqual(data, {foo: true});
  });

  it('cache.resolve should cache a missed object', async function () {
    const data = await productionCache.resolve('test001').miss(async () => {
      return Promise.resolve({hello: 'world'})
    });
    
    deepEqual(data, {hello: 'world'});

    let firstRetrieve = await productionCache.get('test001');
    deepEqual(firstRetrieve, {hello: 'world'});
  });

  it('cache.resolve fails with false when no data is returned from the miss method', async function () {
    let data = await productionCache.resolve('test001').miss(async () => null);
    equal(data, false)
  });

  it('cache.list should list all keys', async function () {
    try {
      await productionCache.store('test001', 'testing-001')
      await productionCache.store('test002', 'testing-002')
      await productionCache.store('test003', 'testing-003')
      await productionCache.store('test004', 'testing-004')
      await productionCache.store('non-match', 'testing-non-match')
      let keys = await productionCache.list()

      deepEqual(
        keys.sort(), 
        ['test001', 'test002', 'test003', 'test004', 'non-match'].sort()
      )
    } catch(err) {
      console.error(err)
      throw(err);
    }
  });

  it('cache.list should list only matching keys when a pattern is provided', async function () {
    try {
      await productionCache.store('test001', 'testing-001')
      await productionCache.store('test002', 'testing-002')
      await productionCache.store('test003', 'testing-003')
      await productionCache.store('test004', 'testing-004')
      await productionCache.store('non-match', 'testing-non-match')
      let keys = await productionCache.list('test*')

      deepEqual(
        keys.sort(), 
        ['test001', 'test002', 'test003', 'test004'].sort()
      )
    } catch(err) {
      console.error(err)
      throw(err);
    }
  });

  it('cache.list should list only matching keys when a pattern is provided (2)', async function () {
    try {
      await productionCache.store('test001', 'testing-001')
      await productionCache.store('test002', 'testing-002')
      await productionCache.store('test003', 'testing-003')
      await productionCache.store('test004', 'testing-004')
      await productionCache.store('non-match', 'testing-non-match')
      let keys = await productionCache.list('non*')

      deepEqual(keys, ['non-match'])
    } catch(err) {
      console.error(err)
      throw(err);
    }
  });

  it('cache.clearWhere should remove only matching keys (1)', async function () {
    try {
      await productionCache.store('test001', 'testing-001')
      await productionCache.store('test002', 'testing-002')
      await productionCache.store('test003', 'testing-003')
      await productionCache.store('test004', 'testing-004')
      await productionCache.store('non-match', 'testing-non-match')
      
      await productionCache.clearWhere('test*')
      let keys = await productionCache.list()
      deepEqual(keys, ['non-match'])

      let value = await productionCache.get('non-match')
      equal(value, 'testing-non-match')
    } catch(err) {
      console.error(err)
      throw(err);
    }
  });

  it('cache.clearWhere should remove only matching keys (2)', async function () {
    await productionCache.store('widgets/32', 'testing-001')
    await productionCache.store('widgets/41', 'testing-002')
    await productionCache.store('widgets/190', 'testing-003')
    await productionCache.store('widgets/720', 'testing-004')
    await productionCache.store('non-match', 'testing-non-match')
    await productionCache.clearWhere('widgets/*')
    
    let keys = await productionCache.list()
    deepEqual(keys, ['non-match'])

    let data = await productionCache.get('non-match')
    equal(data, 'testing-non-match')
  });

  it('cache.clearWhere should remove only matching keys (3)', async function () {
    await productionCache.clear()
      .then(() => productionCache.store('widgets/32', 'testing-001'))
      .then(() => productionCache.store('widgets/41', 'testing-002'))
      .then(() => productionCache.store('widgets/190', 'testing-003'))
      .then(() => productionCache.store('widgets/720', 'testing-004'))
      .then(() => productionCache.store('foo/widgets/720', 'testing-004'))
      .then(() => productionCache.store('non-match', 'testing-non-match'))
      .then(() => productionCache.clearWhere('widgets/*'))
      .then(() => productionCache.list())
      .then(keys => deepEqual(keys.sort(), ['non-match', 'foo/widgets/720'].sort()))
      .then(() => productionCache.get('non-match')
      .then(data => equal(data, 'testing-non-match')));
  });

  it('cache.clearWhere should remove only matching keys (4)', async function () {
    await productionCache.clear()
      .then(() => productionCache.store('widgets/32', 'testing-001'))
      .then(() => productionCache.store('widgets/41', 'testing-002'))
      .then(() => productionCache.store('widgets/190', 'testing-003'))
      .then(() => productionCache.store('widgets/720', 'testing-004'))
      .then(() => productionCache.store('foo/widgets/720', 'testing-004'))
      .then(() => productionCache.store('non-match', 'testing-non-match'))
      .then(() => productionCache.clearWhere('*widgets/*'))
      .then(() => productionCache.list())
      .then(keys => deepEqual(keys, ['non-match']))
      .then(() => productionCache.get('non-match')
      .then(data => equal(data, 'testing-non-match')));
  });

  it('caching should be disabled in development', async function () {
    await productionCache.clear()
      .then(() => developmentCache.store('development', 'nope'))
      .then(() => developmentCache.get('development'))
      .then(result => equal(result, false));
  });

  it('cache.resolve should always hit the miss function in development', async function () {
    await developmentCache.store('dev', 100)
    let data = await developmentCache.get('test')
    equal(data, false);

    data = await developmentCache.resolve('dev').miss(() => {
      return { hey: 1 }
    });

    deepEqual(data, { hey: 1 })
  });
});
