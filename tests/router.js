import Router from "../classes/router.js";
import assert, { ok, deepEqual } from "assert";
import { createClient } from "redis";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import path, { join } from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const base = path.dirname(__filename);

const client = createClient();
const server = { redis: client, app: { get() {} } };
const project = {
  routesPath: join(base, "../tests/mocks/routes"),
  modelsPath: join(base, "../tests/mocks/models"),
  controllersPath: join(base, "../tests/mocks/controllers"),
  viewsPath: join(base, "../tests/mocks/views"),
  configPath: join(base, "../tests/mocks/config.js"),
  projectPath: join(base, "../tests/mocks"),
};

chai.use(sinonChai);

describe("Router", function () {
  before(async () => {
    await client.connect()
  })
  after(async () => {
    await client.disconnect()
  })
  it("should build the routes", async function () {
    let router = new Router(project, server);
    await router.buildRoutes();
    ok(router);
    deepEqual(router.controllers.ok.name, "myController");
    deepEqual(router.models, { ok: true });
    deepEqual(router.routes.ok.GET, [{path: "/test", action: "Get"}]);
  });

  it("should draw a route", async function () {
    let router = new Router(project, server);
    let spy = sinon.spy(server.app, "get");

    await router.buildRoutes();

    for (let key in router.routes) {
      let target = router.routes[key];
      let method;
      for (method in target) {
        target[method].forEach((cfg) => {
          cfg.controller = router.controllers[key];
          router.route(method, cfg);
        });
      }
    }

    assert(spy.calledOnce);
  });

  // Route mapping is already tested using Express' coverage.
});
