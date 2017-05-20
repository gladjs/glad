const assert = require('assert');
const type = require('../namespace/type');

describe("Type Tests", function () {

  it('Array is an Array', function () {
    assert.equal(type.isArray([1,2,3]), true);
  });

  it('Object is not an Array', function () {
    assert.equal(type.isNotArray({}), true);
  });

  it('Object is Object', function () {
    assert.equal(type.isObject({}), true);
  });

  it('Array is not Object', function () {
    assert.equal(type.isNotObject([1,2,3,4]), true);
  });

  it('Object is not Array (false)', function () {
    assert.equal(type.isArray({}), false);
  });

  it('Array is Array (false)', function () {
    assert.equal(type.isNotArray([]), false);
  });

  it('Array is not object (false)', function () {
    assert.equal(type.isObject([]), false);
  });

  it('Object is Object (false)', function () {
    assert.equal(type.isNotObject({}), false);
  });

});
