import { createClient } from "redis";
import cache from "../classes/controller-cache.js";
import Controller from "../classes/controller.js";
import { equal, deepEqual } from "assert";

const client = createClient();
const dbsize = async () => await client.dbSize();
const tick = (time = 2) => new Promise((resolve) => setTimeout(resolve, time));

before(async () => await client.connect());
beforeEach(async () => await client.flushDb());
after(async () => {
  await client.flushDb()
  await client.disconnect()
});

describe("ControllerCache Handling various data types", function () {
  it("should take a string", async () => {
    let lru = new cache(client, "someController", "Get", { max: 10 });
    let result = await lru.cache.set("/some", "string content");
    equal(result, "string content");

    result = await lru.cache.get("/some");
    equal(result, "string content");
  });

  it("should take an object", () => {
    let lru = new cache(client, "someController", "Get", { max: 10 });
    return lru.cache
      .set("/my/url?foo=true", { foo: "bar" })
      .then((result) => deepEqual(result, { foo: "bar" }));
  });

  it("should take an array", () => {
    let lru = new cache(client, "someController", "Get", { max: 10 });
    return lru.cache
      .set("/my/url", [{ foo: "bar" }])
      .then((result) => deepEqual(result, [{ foo: "bar" }]))
      .then(() => lru.cache.get("/my/url"))
      .then((result) => deepEqual(result, [{ foo: "bar" }]));
  });

  it("should take a number  (integer)", () => {
    let lru = new cache(client, "someController", "Get", { max: 10 });
    return lru.cache
      .set("/how-many/things", 4e8)
      .then((result) => equal(result, 4e8))
      .then(() => lru.cache.get("/how-many/things"))
      .then((result) => equal(result, 4e8));
  });

  it("should take a number  (negative integer)", () => {
    let lru = new cache(client, "someController", "Get", { max: 10 });
    return lru.cache
      .set("/how-many/things", -49637)
      .then((result) => equal(result, -49637))
      .then(() => lru.cache.get("/how-many/things"))
      .then((result) => equal(result, -49637));
  });

  it("should take a number  (float)", () => {
    let lru = new cache(client, "someController", "Get", { max: 10 });
    return lru.cache
      .set("/how-many/things", 4.3427)
      .then((result) => equal(result, 4.3427))
      .then(() => lru.cache.get("/how-many/things"))
      .then((result) => equal(result, 4.3427));
  });

  it("should take a number  (negative float)", () => {
    let lru = new cache(client, "someController", "Get", { max: 10 });
    return lru.cache
      .set("/how-many/things", -49637.342787368763587653876538763)
      .then((result) => equal(result, -49637.342787368763587653876538763))
      .then(() => lru.cache.get("/how-many/things"))
      .then((result) => equal(result, -49637.342787368763587653876538763));
  });

  it("should take a boolean (true)", () => {
    let lru = new cache(client, "someController", "Get", { max: 10 });
    return lru.cache
      .set("/lengthy-analysis/result", true)
      .then((result) => equal(result, true))
      .then(() => lru.cache.get("/lengthy-analysis/result"))
      .then((result) => equal(result, true));
  });

  it("should take a boolean (false)", async () => {
    let lru = new cache(client, "someController", "Get", { max: 10 });
    const result = await lru.cache.set("/lengthy-analysis/result", false);
    equal(result, false);
    const result_1 = await lru.cache.get("/lengthy-analysis/result");
    equal(result_1, false);
  });

  it("should take a buffer", () => {
    let lru = new cache(client, "someController", "Get", { max: 10 });
    let bigArray = [];
    let i = 0;

    for (i; i < 3518; i += 1) {
      bigArray.push(Math.random() * 10 < 5 ? 0 : 1);
    }

    let buffer = new Buffer.from(bigArray);
    return lru.cache
      .set("/lengthy-analysis/result", buffer)
      .then(() => lru.cache.get("/lengthy-analysis/result"))
      .then((result) => deepEqual(buffer, new Buffer.from(result)));
  });
});

describe("ControllerCache Set and Get methods", () => {
  it("should save an item in the cache and allow to get it back", () => {
    const lru = new cache(client, "UserController").cache;

    return lru
      .set("key", "hello")
      .then((result) => equal(result, "hello"))
      .then(() => lru.set("key2", { message: "goodbye" }))
      .then(() => Promise.all([lru.get("key"), lru.get("key2")]))
      .then((results) => {
        equal(results[0], "hello");
        deepEqual(results[1], { message: "goodbye" });
      });
  });

  it("should return null if a key is not found in the cache", () => {
    const lru = new cache(client, "UserController").cache;

    return lru.get("key1").then((result) => equal(result, null));
  });

  it("should save up to opts.max items in the cache", async () => {
    const lru = new cache(client, "UserController").cache;

    await lru.set("k1", "v1");
    await lru.set("k2", "v2");
    await lru.set("k3", "v3");

    const r = await lru.get("k1");
    equal(r, "v1");
    await tick();

    const r_1 = await lru.get("k2");
    equal(r_1, "v2");
    await tick();

    const r_2 = await lru.get("k3");
    equal(r_2, "v3");
    const r_3 = await dbsize();
    equal(r_3, 4);

    await lru.set("k4", "v4");
    await tick();
    const r_4 = await lru.get("k1");
    equal(r_4, null, "k1 should have been evicted from the cache");

    const r_5 = await lru.get("k2");
    equal(r_5, "v2");

    const r_6 = await lru.get("k3");
    equal(r_6, "v3");

    const r_7 = await lru.get("k4");
    equal(r_7, "v4");
    const r_8 = await dbsize();
    equal(r_8, 4, "db size should not have grown");
  });

  it("should keep different items in different namespaces", () => {
    const lru1 = new cache(client, "first").cache;
    const lru2 = new cache(client, "second").cache;

    return lru1
      .set("k1", "first cache")
      .then(() => lru2.set("k1", "second cache"))
      .then(() => Promise.all([lru1.get("k1"), lru2.get("k1")]))
      .then((results) => {
        equal(results[0], "first cache");
        equal(results[1], "second cache");
      });
  });

  it("should keep the last accessed items first", async () => {
    const lru = new cache(client, "UserController").cache;

    await lru.set("k1", "v1");
    await lru.set("k2", "v2");
    await lru.set("k3", "v3");
    await lru.get("k2");
    await tick();
    await lru.get("k3");
    await tick();
    await lru.get("k1");
    await tick();
    await lru.set("k4", "v4");
    const result = await lru.get("k2");
    equal(result, null);
  });

  it("should update value and last accessed score when setting a key again", () => {
    const lru = new cache(client, "UserController").cache;

    return lru
      .set("k1", "v1")
      .then(() => lru.set("k2", "v2"))
      .then(() => lru.set("k3", "v3"))
      .then(() => lru.get("k2"))
      .then(tick)
      .then(() => lru.get("k3"))
      .then(tick)
      .then(() => lru.get("k1"))
      .then(tick)
      .then(() => lru.set("k2", "v2")) // k2 back to front, k3 is oldest
      .then(tick)
      .then(() => lru.set("k4", "v4")) // k3 out
      .then(() => lru.get("k3"))
      .then((result) => {
        equal(result, null);
      });
  });

  it("should not update last accessed score on a different namespace", async () => {
    let lru1 = new cache(client, "c1", "get", { max: 2 });
    let lru2 = new cache(client, "c2", "get", { max: 2 });

    await lru1.cache.set("k1", "v1");
    await lru1.cache.set("k2", "v2");
    await lru2.cache.set("k1", "v1");
    await tick();
    await lru2.cache.set("k2", "v2");
    await tick();
    await lru1.cache.get("k1");
    await tick();
    await lru2.cache.set("k3", "v3");
    const result = await lru2.cache.get("k1");
    equal(result, null);
  });
});

describe("ControllerCache LRU set options during runtime (Single Prop)", function () {
  it("should update the max options", function () {
    let myCache = new cache(client, "UserController");
    myCache.setOptions({ max: 1 }, true);
    return myCache.cache
      .set("k1", "v1")
      .then(() => myCache.cache.set("k2", "v2"))
      .then(() => myCache.cache.get("k1"))
      .then(tick)
      .then(() => myCache.cache.get("k1"))
      .then((result) => {
        equal(result, null);
      })
      .then(() => myCache.cache.reset());
  });
});

describe("ControllerCache LRU set options during runtime (Multiple Props)", function () {
  it("should update the strategy", async function () {
    let controllerCache = new cache(client, "UserController");
    controllerCache.setOptions({ max: 2, strategy: "LFU" }, true);
    await controllerCache.cache.set("beatles", "john, paul, george, ringo");
    await controllerCache.cache.get("beatles");
    await controllerCache.cache.set("zeppelin", "jimmy, robert, john, bonzo");
    await controllerCache.cache.set(
      "floyd",
      "david, roger, syd, richard, nick"
    );
    const result = await controllerCache.cache.get("zeppelin");
    equal(result, null);
  });

  it("should update the namespace", function () {
    let myCache = new cache(client, "UserController");
    myCache.setOptions({ max: 2, strategy: "LFU", namespace: "fooze" }, true);
    return myCache.cache
      .set("beatles", "john, paul, george, ringo")
      .then(() => myCache.cache.get("beatles")) // accessed twice
      .then(() => myCache.cache.set("zeppelin", "jimmy, robert, john, bonzo"))
      .then(() =>
        myCache.cache.set("floyd", "david, roger, syd, richard, nick")
      ) // cache full, remove least frequently accessed
      .then(() => myCache.cache.get("zeppelin"))
      .then((result) => {
        equal(result, null);
        equal(myCache.namespace, "UserController:UNDEFINED-ACTION:fooze:");
      });
  });
});

describe("ControllerCache getOrSet method", () => {
  it("should get the value from cache and NOT call the function", () => {
    const lru = new cache(client, "someController");

    function fn() {
      throw Error("should not call");
    }

    return lru.cache
      .set("key", "hello")
      .then(() => lru.cache.getOrSet("key", fn))
      .then((result) => equal(result, "hello"));
  });

  it("should set key to the return value of the function", () => {
    const lru = new cache(client, "someController").cache;

    function fn() {
      return 5;
    }

    return lru
      .getOrSet("key", fn)
      .then((result) => equal(result, 5))
      .then(() => lru.get("key"))
      .then((result) => equal(result, 5));
  });

  it("should set key to the resolved value of the promise returned by the function", () => {
    const lru = new cache(client, "someController").cache;

    function fn() {
      return Promise.resolve(5);
    }

    return lru
      .getOrSet("key", fn)
      .then((result) => equal(result, 5))
      .then(() => lru.get("key"))
      .then((result) => equal(result, 5));
  });

  it("should reject if function rejects", () => {
    const lru = new cache(client, "someController").cache;

    function fn() {
      return Promise.reject(Error("something went wrong"));
    }

    return lru
      .getOrSet("key", fn)
      .then(() => {
        throw Error("should not resolve");
      })
      .catch((err) => equal(err.message, "something went wrong"));
  });

  it("should reject if function throws", () => {
    const lru = new cache(client, "someController").cache;

    function fn() {
      throw Error("something went wrong");
    }

    return lru
      .getOrSet("key", fn)
      .then(() => {
        throw Error("should not resolve");
      })
      .catch((err) => equal(err.message, "something went wrong"));
  });

  it("should update recent-ness when getOrSet a saved value", async () => {
    const lru = new cache(client, "someController", "FindOne").cache;

    await lru.set("k1", "v1");
    await lru.set("k2", "v2");
    await lru.set("k3", "v3");
    await lru.getOrSet("k2");
    await tick();
    await lru.getOrSet("k3");
    await tick();
    await lru.getOrSet("k1");
    await tick();
    await lru.set("k4", "v4");
    const result = await lru.get("k2");
    equal(result, null);
  });

  it("should update recent-ness when getOrSet a missing value", () => {
    const lru = new cache(client, "someController").cache;

    return lru
      .getOrSet("k2", () => 2) // k2 last
      .then(tick)
      .then(() => lru.getOrSet("k3", () => 3)) // k3 second
      .then(tick)
      .then(() => lru.getOrSet("k1", () => 1)) // k1 first
      .then(tick)
      .then(() => lru.set("k4", "v4")) // should evict oldest => k2 out
      .then(() => lru.get("k2"))
      .then((result) => {
        equal(result, null);
      });
  });
});

describe("ControllerCache peek method", () => {
  xit("should return the value without changing the recent-ness score", async () => {
    let lrucache = new cache(client, "someController", "Get", { max: 2 });
    const lru = lrucache.cache;

    const time = await lru.set("k1", "v1");
    await tick(time);
    await lru.set("k2", "v2");
    await tick(time);
    const r = await lru.peek("k1");
    equal(r, "v1");
    await lru.set("k3", "v3");
    await tick(time);
    const r_1 = await lru.get("k1");
    return equal(r_1, null);
  });
});

describe("ControllerCache del method", () => {
  it("should remove the key from the cache and preserve the rest", () => {
    let lrucache = new cache(client, "someController", "Get", { max: 2 });
    const lru = lrucache.cache;

    return lru
      .set("k1", "v1")
      .then(() => lru.set("k2", "v2"))
      .then(() => lru.del("k1"))
      .then(() => lru.get("k1"))
      .then((r) => equal(r, null))
      .then(() => lru.get("k2"))
      .then((r) => equal(r, "v2"));
  });

  it("should not remove from other namespaces", () => {
    let lrucache = new cache(client, "someController", "Foo", { max: 2 });
    const lru = lrucache.cache;

    let cache2 = new cache(client, "c2");
    cache2.setOptions({ max: 2 });
    const lru2 = cache2.cache;

    return lru
      .set("k1", "v1")
      .then(() => lru2.set("k1", "v1"))
      .then(() => lru.del("k1"))
      .then(() => lru.get("k1"))
      .then((r) => equal(r, null))
      .then(() => lru2.get("k1"))
      .then((r) => equal(r, "v1"));
  });
});

describe("ControllerCache reset method", () => {
  it("should remove all keys from the cache", async () => {
    let lrucache = new cache(client, "someController", "foo", { max: 2 });
    const lru = lrucache.cache;

    await lru.set("k1", "v1");
    await lru.set("k2", "v2");
    await lru.reset();
    const r = await lru.get("k1");
    equal(r, null);
    const r_1 = await lru.get("k2");
    return equal(r_1, null);
  });

  it("should not empty other namespaces", () => {
    let lrucache = new cache(client, "someController", "getSomeList", {
      max: 2,
    });
    const lru = lrucache.cache;

    let cache2 = new cache(client, "c2");
    cache2.setOptions({ max: 2 }, true);
    const lru2 = cache2.cache;

    return lru
      .set("k1", "v1")
      .then(() => lru2.set("k1", "v1"))
      .then(() => lru.reset())
      .then(() => lru.get("k1"))
      .then((r) => equal(r, null))
      .then(() => lru2.get("k1"))
      .then((r) => equal(r, "v1"));
  });
});

describe("ControllerCache has method", () => {
  it("should return true if the item is in the cache without affecting the recent-ness", async () => {
    let lrucache = new cache(client, "someController");
    lrucache.setOptions({ max: 2 }, true);
    const lru = lrucache.cache;

    await lru.set("k1", "v1");
    await tick();
    await lru.set("k2", "v2");
    await tick();
    const r = await lru.has("k1");
    equal(r, true);
    await lru.set("k3", "v3");
    await tick();
    const r_1 = await lru.get("k1");
    return equal(r_1, null);
  });

  it("should return false if the item is not in the cache", async () => {
    let lru = new cache(client);
    lru.setOptions({ max: 2 }, true);

    await lru.cache.set("k1", "v1");
    await lru.cache.set("k2", "v2");
    const r = await lru.cache.has("k3");
    equal(r, false);
  });
});

describe("ControllerCache keys method", () => {
  it("should return all keys inside the cache", async () => {
    let lru = new cache(client, "someController");
    lru.setOptions({ max: 2 }, true);

    const time = await lru.cache.set("k1", "v1");
    await tick(time);
    await lru.cache.set("k2", "v2");
    const r = await lru.cache.keys();
    return deepEqual(r.sort(), ["k2", "k1"].sort());
  });

  it("should not return more keys if size exceeded before", async () => {
    let lrucache = new cache(client, "22", "aa");
    lrucache.setOptions({ max: 2 }, true);
    const lru = lrucache.cache;

    await lru.set("k1", "v1");
    await tick();
    await lru.set("k2", "v2");
    await tick();
    await lru.set("k3", "v3");
    const r = await lru.keys();
    deepEqual(r.sort(), ["k3", "k2"].sort());
  });
});

describe("ControllerCache values method", () => {
  it("should return all values inside the cache", async () => {
    let lrucache = new cache(client, "someController");
    lrucache.setOptions({ max: 2 }, true);
    const lru = lrucache.cache;

    const time = await lru.set("k1", "v1");
    await tick();
    await lru.set("k2", "v2");
    const r = await lru.values();
    return deepEqual(r.sort(), ["v2", "v1"].sort());
  });

  it("should not return more values if size exceeded before", async () => {
    let lrucache = new cache(client, "someController");
    lrucache.setOptions({ max: 2 }, true);
    const lru = lrucache.cache;

    let time = await lru.set("k1", "v1");
    await tick(time);
    time = await lru.set("k2", "v2");
    await tick(time);
    await lru.set("k3", "v3");
    const r = await lru.values();
    return deepEqual(r.sort(), ["v3", "v2"].sort());
  });
});

describe("ControllerCache count method", () => {
  it("should return zero if no items in the cache", () => {
    let lrucache = new cache(client, "someController");
    lrucache.setOptions({ max: 2 }, true);
    const lru = lrucache.cache;

    return lru.count().then((r) => equal(r, 0));
  });

  it("should return the amount of items in the cache", () => {
    let lrucache = new cache(client, "someController");
    lrucache.setOptions({ max: 2 }, true);
    const lru = lrucache.cache;

    return lru
      .set("k1", "v1")
      .then(tick)
      .then(() => lru.set("k2", "v2"))
      .then(() => lru.count())
      .then((r) => equal(r, 2));
  });

  it("should return the max size if cache size exceeded before", () => {
    let lrucache = new cache(client, "someController");
    lrucache.setOptions({ max: 2 }, true);
    const lru = lrucache.cache;

    return lru
      .set("k1", "v1")
      .then(tick)
      .then(() => lru.set("k2", "v2"))
      .then(tick)
      .then(() => lru.set("k3", "v3"))
      .then(() => lru.count())
      .then((r) => equal(r, 2));
  });
});

describe("ControllerCache maxAge option", () => {
  it("should return null after global maxAge has passed", () => {
    let lrucache = new cache(client, "someController");
    lrucache.setOptions({ max: 2, maxAge: 10 }, true);
    const lru = lrucache.cache;

    return lru
      .set("k1", "v1")
      .then(() => lru.get("k1"))
      .then((result) => equal(result, "v1"))
      .then(() => tick(11))
      .then(() => lru.get("k1"))
      .then((result) => equal(result, null));
  });

  it("should return null after key maxAge has passed", () => {
    let lrucache = new cache(client, "someController");
    lrucache.setOptions({ max: 2 }, true);
    const lru = lrucache.cache;

    return lru
      .set("k1", "v1", 10)
      .then(() => lru.get("k1"))
      .then((result) => equal(result, "v1"))
      .then(() => tick(11))
      .then(() => lru.get("k1"))
      .then((result) => equal(result, null));
  });

  it("should reduce dbsize after key expiration", async () => {
    let lru = new cache(client, "someController");
    lru.setOptions({ max: 2, maxAge: 10 }, true);

    await lru.cache.set("k1", "value_1");
    await tick(11);
    const result = await lru.cache.get("k1");
    equal(result, null);
  });

  it("should remove expired key from index next time is getted", async () => {
    let lru = new cache(client, "someController");
    lru.setOptions({ max: 2 }, true);

    await lru.cache.set("k1", "v1");
    await lru.cache.set("k2", "v2", 10);
    await tick(11);
    const result = await lru.cache.get("k2");
    equal(result, null);
  });

  it("should remove expired key from index next time is peeked", async () => {
    let lru = new cache(client, "someController");
    lru.setOptions({ max: 2 }, true);

    await lru.cache.set("k1", "v1");
    await lru.cache.set("k2", "v2", 10);
    await tick(12);
    const result = await lru.cache.peek("k2");
    equal(result, null);
  });

  it("should not let key maxAge affect other keys", () => {
    let lrucache = new cache(client, "someController");
    lrucache.setOptions({ max: 2, maxAge: 30 }, true);
    const lru = lrucache.cache;

    return lru
      .set("k1", "v1", 10)
      .then(() => lru.set("k2", "v2"))
      .then(() => lru.get("k1"))
      .then((result) => equal(result, "v1"))
      .then(() => lru.get("k2"))
      .then((result) => equal(result, "v2"))
      .then(() => tick(11))
      .then(() => lru.get("k1"))
      .then((result) => equal(result, null))
      .then(() => lru.get("k2"))
      .then((result) => equal(result, "v2"))
      .then(() => tick(20))
      .then(() => lru.get("k2"))
      .then((result) => equal(result, null));
  });

  it("should return false when calling has on an expired item", () => {
    let lrucache = new cache(client, "someController");
    lrucache.setOptions({ max: 2, maxAge: 10 }, true);
    const lru = lrucache.cache;

    return lru
      .set("k1", "v1")
      .then(() => lru.has("k1"))
      .then((result) => equal(result, true))
      .then(() => tick(11))
      .then(() => lru.has("k1"))
      .then((result) => equal(result, false));
  });
});

describe("ControllerCache custom score/increment options", () => {
  it("should allow building a LFU cache with a custom score and increment", async () => {
    let { cache: lfu } = new cache(client, "someController", "Get", {
      max: 5,
      strategy: "LFU",
    });

    await lfu.set("k1", "x");
    await lfu.set("k2", "x");
    await lfu.set("k3", "x");
    await lfu.set("k4", "x");
    await lfu.set("k5", "x");

    await lfu.get("k1");
    await lfu.get("k2");
    await lfu.get("k4");
    await lfu.get("k5");
    await lfu.get("k5");
    await lfu.get("k5");
    await lfu.get("k5");
    await lfu.get("k5");
    await lfu.set("k6", "x");

    const result = await lfu.get("k3");
    equal(result, null);
  });
});

describe("ControllerCache Use a URL as a key", function () {
  it("should store a url as a key", function () {
    let lru = new cache(client, "someController");
    return lru.cache
      .set("/bands/led-zeppelin", "v1")
      .then(() => lru.cache.get("/bands/led-zeppelin"))
      .then((result) => equal(result, "v1"));
  });

  it("should store a url & querystring as a key", function () {
    let lru = new cache(client, "someController");
    return lru.cache
      .set(
        '/bands/led-zeppelin?foo=bar&zap=123&weird=[1,2,3,4]&why={"key": "val"}',
        "v1"
      )
      .then(() =>
        lru.cache.get(
          '/bands/led-zeppelin?foo=bar&zap=123&weird=[1,2,3,4]&why={"key": "val"}'
        )
      )
      .then((result) => equal(result, "v1"));
  });
});

describe("ControllerCache cachedVersion", function () {
  it("should return the cached version when it is available", function () {
    let lru = new cache(client, "someController", "Get");
    let req = {
      controller: "someController",
      action: "Get",
      url: "/bands/led-zeppelin",
    };
    lru.cache.set("/bands/led-zeppelin", { name: "Led Zeppelin" });

    return lru.cachedVersion(req).then((result) => {
      equal(result.name, "Led Zeppelin");
    });
  });

  it("should return false when it is not available", function () {
    let lru = new cache(client, "someController", "Get");
    let req = {
      controller: "someController",
      action: "Get",
      url: "/bands/led-zeppelin",
    };

    return lru.cachedVersion(req).then((result) => {
      equal(result, false);
    });
  });
});

describe("ControllerCache Controller Methods should work", function () {
  class testController extends Controller {
    async Get() {
      const doc = await this.cache({ max: 100, strategy: "LFU" }, async () => {
        return  [{ name: "doc1" }];
      });
      this.res.status(200).json(doc);
    }

    async FindOne() {
      const doc = await this.cache({
        max: 100,
        strategy: "LRU",
        namespace: "v1",
        uuid: 45370,
      }, async () => ({ name: "doc1" }));
      
      this.res.status(200).json(doc);
    }

    async Post() {
      return this.actionCache({ action: "Get" }).reset();
    }

    async Put() {
      return this.actionCache({ action: "Get" }).reset();
    }

    async Delete() {
      this.res.status(200).json({ result: "Ya, its gone forever" });
      return this.actionCache({ action: "Get" })
        .reset()
        .then(() => {
          this.actionCache({ action: "FindOne" }).del("/widgets/12").then(res);
        });
    }

    lookup(val) {
      return this.cache.get(val);
    }

    async callbackWithResponseType() {
      const doc = await this.cache(
        { max: 100, strategy: "LRU", responseMethod: "send" },
        async () => ({ name: "doc1" })
      );
    }

    async promisable() {
      const users = await this.cache({ max: 2, strategy: "LFU" }, async () => await Promise.resolve([{name: "Oly"}, {name: "Dexter"}]))
      this.res.json(users)
    }
  }

  let res = {
    status() {
      return {
        json() {
          return "json";
        },
      };
    },
    json() {
      return "json";
    },
    send() {
      return "send";
    },
  };

  it("GET should cache on a request to a cacheable method", function () {
    let myController = new testController(
      { controller: "myController", action: "Get", url: "/widgets" },
      res,
      client
    );
    return myController
      .Get()
      .then(() => myController.cacheStore.get("/widgets"))
      .then((value) => deepEqual(value, [{ name: "doc1" }]));
  });

  it("FINDONE should cache on a request to a cacheable method", async function () {
    let myController = new testController(
      {
        controller: "TestController",
        action: "FindOne",
        url: "/widgets",
      },
      res,
      client
    );
    await myController.FindOne();
    const value = await myController.cacheStore.get("/widgets");
    deepEqual(value, { name: "doc1" });
  });

  it("should remove a cached Item (PUT)", async function () {
    let controllerForGet = new testController(
      { controller: "myController", action: "Get", url: "/widgets" },
      res,
      client
    );
    let controllerForPut = new testController(
      { controller: "myController", action: "Put", url: "/widgets/12" },
      res,
      client
    );

    await controllerForGet.Get();
    const value = await controllerForGet.cacheStore.get("/widgets");
    deepEqual(value, [{ name: "doc1" }]);

    await controllerForPut.Put();
    const value_1 = await controllerForGet.cacheStore.get("/widgets");
    return equal(value_1, null);
  });

  it("should remove a cached Item (DELETE)", function () {
    let controllerForGet = new testController(
      { controller: "myController", action: "Get", url: "/widgets" },
      res,
      client
    );
    let controllerForFindOne = new testController(
      { controller: "myController", action: "FindOne", url: "/widgets/12" },
      res,
      client
    );
    let controllerForDelete = new testController(
      { controller: "myController", action: "Delete", url: "/widgets/12" },
      res,
      client
    );

    return controllerForGet
      .Get()
      .then(() => controllerForFindOne.FindOne())
      .then(() => controllerForGet.cacheStore.get("/widgets"))
      .then((value) => deepEqual(value, [{ name: "doc1" }]))

      .then(() => controllerForFindOne.cacheStore.get("/widgets/12"))
      .then((value) => deepEqual(value, { name: "doc1" }))
      .then(() => controllerForDelete.Delete())
      .then(() => controllerForGet.cacheStore.get("/widgets"))
      .then((value) => equal(value, null));
  });
});

describe("ControllerCache Environment Settings", function () {
  class testController extends Controller {
    async Get() {
      const doc = await this.cache({ max: 100, strategy: "LFU" }, async () => {
        return [{ name: "doc1" }];
      });
      this.res.status(200).json(doc);
    }

    async FindOne() {
      const doc = await this.cache({ max: 100, strategy: "LRU", namespace: "server001" }, async () => ({name: "doc1"}))
      this.res.status(200).json(doc);
    }

    async Post() {
      return this.actionCache({ action: "Get" }).reset();
    }

    async Put() {
      return this.actionCache({ action: "Get" }).reset();
    }

    async Delete() {
      this.res.status(200).json({ result: "Ya, its gone forever" });
      return this.actionCache({ action: "Get" })
        .reset()
        .then(() => {
          this.actionCache({ action: "FindOne" }).del("/widgets/12");
        });
    }

    async lookup(val) {
      return this.cache.get(val);
    }

    async callbackWithResponseType() {
      const doc = await this.cache(
        { max: 100, strategy: "LRU", responseMethod: "send" },
        async () => ({ name: "doc1" })
      );
      this.res.send(doc)
    }

    async promisable() {
      const doc = this.cache({ max: 2, strategy: "LFU" }, async => [{name: "Sullivan"}, {name: "Gloria"}])
      this.res.json(doc)
    }
  }

  let res = {
    status() {
      return {
        json() {
          return "json";
        },
      };
    },
    json() {
      return "json";
    },
    send() {
      return "send";
    },
  };

  it("should cache on a request to a cacheable method (GET)", function () {
    let myController = new testController(
      { controller: "myController", action: "Get", url: "/widgets" },
      res,
      client
    );
    return myController
      .Get()
      .then(() => myController.cacheStore.get("/widgets"))
      .then((value) => deepEqual(value, [{ name: "doc1" }]));
  });

  it("should not cache on a request to a cacheable method (GET) when cache is disabled", function () {
    let myController = new testController(
      { controller: "myController", action: "Get", url: "/widgets" },
      res,
      client
    );
    Glad.cache.disabled = true;
    return myController
      .Get()
      .then(() => myController.cacheStore.get("/widgets"))
      .then((value) => deepEqual(value, null))
      .then((x) => (Glad.cache.disabled = false));
  });
});

//
