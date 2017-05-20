const assert = require('assert');

describe('No files should have syntax errors and every file should be requirable', function () {

  it("boot/after-request.js", function () {
    assert.ok(require('../boot/after-request'));
  });

  it("boot/expose-models-globally.js", function () {
    let exposeGlobals = require('../boot/expose-models-globally');
    exposeGlobals({models : [{fooze: true}]});
  });

  it("boot/initialize.js", function () {
    assert.ok(require('../boot/initialize'));
  });

  it("boot/initialize.js Should not throw an error for an invalid project, but it should reject the promise", function (done) {
    let Initialize = require('../boot/initialize');
    let initializer = new Initialize({}, {});
    initializer.initialize().then(() => {
      throw new Error('This should not be called');
    }).catch(err => {
      assert.ok(err);
      done();
    });
  });

  it("boot/request-identifier.js", function () {
    assert.ok(require('../boot/request-identifier'));
  });

  it("classes/controller-cache.js", function () {
    assert.ok(require('../classes/controller-cache'));
  });

  it("classes/controller.js", function () {
    assert.ok(require('../classes/controller'));
  });

  it("classes/policy.js", function () {
    assert.ok(require('../classes/policy'));
  });

  it("classes/router.js", function () {
    assert.ok(require('../classes/router'));
  });

  it("classes/server.js", function () {
    assert.ok(require('../classes/server'));
  });

  it("namespace/cache.js", function () {
    assert.ok(require('../namespace/cache'));
  });

  it("namespace/console.js", function () {
    assert.ok(require('../namespace/console'));
  });

  it("namespace/date.js", function () {
    assert.ok(require('../namespace/date'));
  });

  it("namespace/import.js", function () {
    assert.ok(require('../namespace/import'));
  });

  it("namespace/number.js", function () {
    assert.ok(require('../namespace/number'));
  });

  it("namespace/object.js", function () {
    assert.ok(require('../namespace/object'));
  });

  it("namespace/string.js", function () {
    assert.ok(require('../namespace/string'));
  });

  it("namespace/token.js", function () {
    assert.ok(require('../namespace/token'));
  });

  it("boot/boot.js", function () {
    assert.ok(require('../boot/boot'));
  });

  it("index.js", function () {
    assert.ok(require('../index'));
  });
});
