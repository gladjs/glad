/**
 * Action Cache
 * Summary:
 * The action cache is needed to be able to access the cache of any 
 * controller / action combo. The storage key pattern exists as follows.
 * Controller:Action:Namespace:UUID:the_url_or_key
 * Action Cache should return an instance of modified instance ControllerCache.
 * It has all of the sam methods as ControllerCache, but also includes the following.
 * `forEach` A method that iterates over every item in the cache and provides a caching function to update that item
 * `action` A method that retrieves all entries for an action `Controller:Action` regardless of namespace or uuid
 * `namespace` A method that retrieves all entries for `Controller:Action:Namespace` regardless of uuid
 * `uuid` A method that retrieves all entries for `Controller:Action:Namespace:UUID` regardless of key
 * 
 * Example function calls from within a controller
 * this.actionCache("GET")
 */

import { createClient } from "redis";
import ActionCacheTestController from "./mocks/controllers/action-cache-tests.js";
import { deepEqual } from "assert";
import res from "./mocks/response-object.js";

const client = createClient();

before(async () => await client.connect());
beforeEach(async () => await client.flushDb());
after(async () => {
  await client.flushDb()
  await client.disconnect()
});

describe("Action Cache", function () {
  const sortValues = values => values.sort((a,b) => Object.keys(a)[0] > Object.keys(b)[0] ? -1 : 1);

  it("should be able access the first object using a namespace and uuid", async function () {
    let myController = new ActionCacheTestController(
      { controller: "ActionCacheTestController", action: "NSandUUID", url: "/some-url" },
      res,
      client
    );
    await myController.NSandUUID();
    const value = await myController.actionCache({action: "NSandUUID", namespace: "v1", uuid: "123"}).get("/some-url", );
    return deepEqual(value, { name: "doc1", uuid: 123 });
  });

  it("should be able access the second object using a namespace and uuid", async function () {
    let myController = new ActionCacheTestController(
      { controller: "ActionCacheTestController", action: "NSandUUID", url: "/action-class" },
      res,
      client
    );
    await myController.NSandUUID();
    const value = await myController.actionCache({action: "NSandUUID", namespace: "v1", uuid: "321"}).get("/action-class", );
    return deepEqual(value, { name: "doc1", uuid: 321 });
  });

  it("should be able access a namespace alone", async function () {
    let myController = new ActionCacheTestController(
      { controller: "ActionCacheTestController", action: "JustNS", url: "/action-class" },
      res,
      client
    );
    await myController.JustNS();
    const value = await myController.actionCache({action: "JustNS", namespace: "v1"}).get("/action-class", );
    return deepEqual(value, { name: "doc1", uuid: 123 });
  });

  it("should be able access a item that was set with just the uuid alone", async function () {
    let myController = new ActionCacheTestController(
      { controller: "ActionCacheTestController", action: "JustUUID", url: "/action-class" },
      res,
      client
    );
    await myController.JustUUID();
    const actionCache = myController.actionCache({action: "JustUUID", uuid: 123})
    const value = await actionCache.get("/action-class", );
    return deepEqual(value, { name: "doc1", uuid: 123 });
  });

  it("should be able to retrieve everything within a namespace", async function () {
    const params = {
      controller: "ActionCacheTestController", 
      action: "populateNamespace", 
    }

    let otherControllerInstance = new ActionCacheTestController(
      { controller: "ActionCacheTestController", action: "someOtherAction", url: "/some-other-url" },
      res,
      client
    );

    const requests = [
      new ActionCacheTestController(
        { ...params, url: "populate-namespace?id=1", body: { namespace: "v1", value: "test"} },
        res,
        client
      ),
      new ActionCacheTestController(
        { ...params, url: "populate-namespace?id=2", body: { namespace: "v1", value: "test2"} },
        res,
        client
      ),
      new ActionCacheTestController(
        { ...params, url: "populate-namespace?id=1", body: { namespace: "v2", value: "test"} },
        res,
        client
      ),
      new ActionCacheTestController(
        { ...params, url: "populate-namespace?id=2", body: { namespace: "v2", value: "test2"} },
        res,
        client
      )
    ]
    
    for (let i = 0; i < requests.length; i +=1) {
      await requests[i].populateNamespace()
    }

    const actionCache = otherControllerInstance.actionCache({ action: "populateNamespace", namespace: "v1" })
    const values = await actionCache.entries();

    deepEqual(sortValues(values), [
      {
        'ActionCacheTestController:populateNamespace:v1:populate-namespace?id=2': { namespace: 'v1', value: 'test2' }
      },
      {
        'ActionCacheTestController:populateNamespace:v1:populate-namespace?id=1': { namespace: 'v1', value: 'test' }
      }
    ]);

    const actionCache2 = otherControllerInstance.actionCache({ action: "populateNamespace", namespace: "v2" })
    const values2 = await actionCache2.entries();

    return deepEqual(sortValues(values2), [
      {
        'ActionCacheTestController:populateNamespace:v2:populate-namespace?id=2': { namespace: 'v2', value: 'test2' }
      },
      {
        'ActionCacheTestController:populateNamespace:v2:populate-namespace?id=1': { namespace: 'v2', value: 'test' }
      }
    ]);
  });

  it("should be able to retrieve everything within a namespace and UUID", async function () {
    const params = {
      controller: "ActionCacheController", 
      action: "populateNamespaceAndUUID",
      url: "populate-namespace-and-uuid",
      uuid: 123
    }

    let otherControllerInstance = new ActionCacheTestController(
      { controller: "ActionCacheController", action: "someOtherAction", url: "/some-other-url" },
      res,
      client
    );

    const requests = [
      new ActionCacheTestController(
        { ...params, body: { namespace: "v1", value: "test"} },
        res,
        client
      ),
      new ActionCacheTestController(
        { ...params, body: { namespace: "v2", value: "test"} },
        res,
        client
      )
    ]
    
    for (let i = 0; i < requests.length; i +=1) {
      await requests[i].populateNamespaceAndUUID()
    }

    const actionCache = otherControllerInstance.actionCache({ action: "populateNamespaceAndUUID", namespace: "v1", uuid: "123" })
    const values = await actionCache.entries();
    
    deepEqual(values, [
      {
        'ActionCacheController:populateNamespaceAndUUID:v1:123:populate-namespace-and-uuid': { namespace: 'v1', value: 'test' }
      }
    ]);

    const actionCache2 = otherControllerInstance.actionCache({ action: "populateNamespaceAndUUID", namespace: "v1", uuid: "123" })
    const values2 = await actionCache2.entries();

    deepEqual(values2, [
      {
        'ActionCacheController:populateNamespaceAndUUID:v1:123:populate-namespace-and-uuid': { namespace: 'v1', value: 'test' }
      }
    ]);
  });
});
