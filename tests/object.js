const assert = require('assert');
let {
  hasPath, set, get,
  extend, clone,
  arrayToObject, invert,
  select, drop, selectCombination, format
} = require('../namespace/object');

describe("Object Methods", function () {

  it("atPath:: Should be able to pick the value of an object", function () {
    let o = {foo: {bar : 'foobar' }};
    assert.equal(get(o, 'foo.bar'), 'foobar');
  });

  it("atPath:: Should not blow up when the path requires traversal of undefined", function () {
    let o = {foo: {bar : 'foobar' }};
    assert.equal(get('foo.bar.baz.boze.ok', o), undefined);
  });

  it("extend:: should extend the src object", function () {
    let src = {one: 1};
    let ext = {two: 2};
    assert.deepEqual(extend(src, ext), {one: 1, two: 2});
  });

  it("extend:: should extend the src object with many objects", function () {
    let src = {one: 1};
    let ext = {two: 2};
    let ext2 = {three: 3};
    assert.deepEqual(extend(src, ext, ext2), {one: 1, two: 2, three: 3});
  });

  it("extend:: should overwrite src when keys are same", function () {
    let src = {one: 1};
    let ext = {one: 2};
    let ext2 = {three: 3};
    assert.deepEqual(extend(src, ext, ext2), {one: 2, three: 3});
  });

  it("extend:: should overwrite keys in order of args when keys are same", function () {
    let src = {one: 1};
    let ext = {two: 2};
    let ext2 = {two: 3};
    let ext3 = {two: 4};
    assert.deepEqual(extend(src, ext, ext2, ext3), {one: 1, two: 4});
  });

  it("hasPath:: should return a boolean value if an object contains a path", function () {
    let src = {one: 1};
    assert.equal(hasPath(src, 'one'), true);
    assert.equal(hasPath(src, 'one.value.at.nowhere'), false);
  });

  it("clone:: should return a new object", function () {
    let src = {one: 1, two: {a: 1}};
    assert.deepEqual(clone(src), {one: 1, two: {a: 1}});
  });

  it("clone:: new object should not be passed by reference", function () {
    let src = {one: 1, two: {a: 1} };
    let src2 = clone(src);
    src2.two.a = 3;
    assert.equal(src.two.a, 1);
    assert.equal(src2.two.a, 3);
  });

  it("set:: should set a value at the given path", function () {
    let src = {};
    set(src, 'foo', 1);
    assert.equal(src.foo, 1);
  });

  it("set:: should create the path if it does not exist, and set the value", function () {
    let src = {};
    set(src, 'foo.bar.baz.x', 1);
    assert.equal(src.foo.bar.baz.x, 1);
  });

  it("arrayToObject:: should convert an array of arrays to an object", function () {
    let arr  = [['a', 1], ['b', 2]];
    let o = arrayToObject(arr);
    assert.equal(o.a, 1);
    assert.equal(o.b, 2);
  });

  it("invert:: should invert an object", function () {
    let o = {a: 'A', b: 'B'};
    invert(o);
    assert.deepEqual(o, {A: 'a', B: 'b'});
    assert.equal(o.a, undefined);
  });

  it("select:: should select keys from an object", function () {
    let o = {name: 'fred', email: 'me@mail.com', password: 'secretSquirrel'};
    let fields = select(o, 'name', 'email');
    assert.deepEqual(fields, {name: 'fred', email: 'me@mail.com'});
  });

  it("select:: should select keys from an object via Array", function () {
    let o = {name: 'fred', email: 'me@mail.com', password: 'secretSquirrel'};
    let fields = select(o, ['name', 'email']);
    assert.deepEqual(fields, {name: 'fred', email: 'me@mail.com'});
  });

  it("drop:: should drop keys from an object", function () {
    let o = { name: 'fred', email: 'me@mail.com', password: 'secretSquirrel' };
    drop(o, 'password');
    assert.deepEqual(o, {name: 'fred', email: 'me@mail.com'});
  });

  it("drop:: should drop keys from an object via Array", function () {
    let o = { name: 'fred', email: 'me@mail.com', password: 'secretSquirrel' };
    drop(o, ['password']);
    assert.deepEqual(o, {name: 'fred', email: 'me@mail.com'});
  });

  it("selectCombination:: should select values from multiple objects and create a new one", function () {
    let a = { name: 'fred', email: 'me@mail.com', password: 'secretSquirrel' };
    let b = { sid: '8372487234', last_visit: new Date()};
    let c = { likes : 'stuff', knows: 'things'};
    let o = selectCombination([a, b, c], 'name', 'email', 'last_visit', 'likes', 'knows');
    assert.deepEqual(o, { name: 'fred', email: 'me@mail.com', last_visit: b.last_visit, likes : 'stuff', knows: 'things'});
  });

  it("format:: should format values properly", function () {
    let a = { name: 'fred', email: 'me@mail.com', data: { stuff: { a: 'a', b: 'b'}, more : { c: 'value'} } };
    let o = format(a, 'name', 'email', ['stuff', 'data.stuff.a' ], ['value', 'data.more.c']);
    assert.deepEqual(o, { name: 'fred', email: 'me@mail.com', stuff: 'a', value : 'value'});
  });

  it("format:: should format values properly (2)", function () {
    let a = { name: 'fred', email: 'me@mail.com', data: { stuff: { a: 'a', b: 'b'}, more : { c: 'value'} } };
    let o = format(a, ['name', 'email', ['stuff', 'data.stuff.a' ], ['value', 'data.more.c']]);
    assert.deepEqual(o, { name: 'fred', email: 'me@mail.com', stuff: 'a', value : 'value'});
  });

});
