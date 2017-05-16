const Policy      = require('../classes/policy');
const Controller  = require('../classes/controller');
const Router      = require('../classes/router');
const assert      = require('assert');
const redis       = require("redis");
const client      = redis.createClient();
const policies    = require('./mocks/policies');
const server      = { redis: client, app : { get () {} } };
const chai        = require("chai");
const sinon       = require("sinon");
const sinonChai   = require("sinon-chai");
const expect      = chai.expect;
const path        = require('path');
const base        = __dirname;
const project     = {
  routesPath : path.join(base,'../tests/mocks/routes'),
  modelsPath : path.join(base,'../tests/mocks/models'),
  controllersPath : path.join(base,'../tests/mocks/controllers'),
  viewsPath : path.join(base, '../tests/mocks/views'),
  configPath : path.join(base,'../tests/mocks/config'),
  projectPath : path.join(base,'../tests/mocks')
};

chai.use(sinonChai);

Promise = require('bluebird').Promise;

describe('router', function () {

  it ('should build the routes', function () {
    let router = new Router(project, server);
    router.buildRoutes();
    assert.ok(router);
    assert.deepEqual(router.controllers.ok.name, 'myController');
    assert.deepEqual(router.models, {ok: true});
    assert.deepEqual(router.routes, { ok: require(path.join(project.routesPath, 'ok'))});
  });

  it ('should draw a route', function () {
    let router = new Router(project, server);
    let spy = sinon.spy(server.app, 'get');

    router.buildRoutes();

    for (key in router.routes) {
      let target = router.routes[key];
      let method;
      for (method in target) {
        target[method].forEach(cfg => {
          cfg.controller = router.controllers[key];
          router.route(method, cfg);
        });
      }
    }

    assert(spy.calledOnce);

  });

  // Route mapping is already tested using Express' coverage.

});
