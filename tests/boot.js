import { ok } from 'assert';
import afterRequest from '../boot/after-request.js';
import exposeGlobals from '../boot/expose-models-globally.js';
import Initialize from '../boot/initialize.js';
import RequestIdentifier from '../boot/request-identifier.js';
import controllerCache from '../classes/controller-cache.js';
import Controller from '../classes/controller.js';
import Policy from '../classes/policy.js';
import Router from '../classes/router.js';
import index from '../index.js';

describe('No files should have syntax errors and every file should be requirable', function () {

  it("boot/after-request.js", function () {
    ok(afterRequest);
  });

  it("boot/expose-models-globally.js", async function () {
    exposeGlobals({models : [{fooze: true}]});
  });

  it("boot/initialize.js", function () {
    ok(Initialize);
  });

  it("boot/initialize.js Should not throw an error for an invalid project, but it should reject the promise", function (done) {
    let initializer = new Initialize({}, {});
    initializer.initialize().then(() => {
      throw new Error('This should not be called');
    }).catch(err => {
      ok(err);
      done();
    });
  });

  it("boot/request-identifier.js", function () {
    ok(RequestIdentifier);
  });

  it("classes/controller-cache.js", function () {
    ok(controllerCache);
  });

  it("classes/controller.js", function () {
    ok(Controller);
  });

  it("classes/policy.js", function () {
    ok(Policy);
  });

  it("classes/router.js", function () {
    ok(Router);
  });

  // it("classes/server.js", function () {
  //   ok(require('../classes/server'));
  // });

  // it("namespace/cache.js", function () {
  //   ok(require('../namespace/cache'));
  // });

  // it("namespace/console.js", function () {
  //   ok(require('../namespace/console'));
  // });

  // it("namespace/date.js", function () {
  //   ok(require('../namespace/date'));
  // });

  // it("namespace/import.js", function () {
  //   ok(require('../namespace/import'));
  // });

  // it("namespace/number.js", function () {
  //   ok(require('../namespace/number'));
  // });

  // it("namespace/object.js", function () {
  //   ok(require('../namespace/object'));
  // });

  // it("namespace/string.js", function () {
  //   ok(require('../namespace/string'));
  // });

  // it("namespace/token.js", function () {
  //   ok(require('../namespace/token'));
  // });

  // it("boot/boot.js", function () {
  //   ok(require('../boot/boot'));
  // });

  it("index.js", function () {
    ok(index);
  });
});
