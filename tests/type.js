import { equal } from "assert";
import typeModule from "../namespace/type.js";
const { isArray, isNotArray, isObject, isNotObject } = typeModule;

describe("Type Tests", function () {
  it("Array is an Array", function () {
    equal(isArray([1, 2, 3]), true);
  });

  it("Object is not an Array", function () {
    equal(isNotArray({}), true);
  });

  it("Object is Object", function () {
    equal(isObject({}), true);
  });

  it("Array is not Object", function () {
    equal(isNotObject([1, 2, 3, 4]), true);
  });

  it("Object is not Array (false)", function () {
    equal(isArray({}), false);
  });

  it("Array is Array (false)", function () {
    equal(isNotArray([]), false);
  });

  it("Array is not object (false)", function () {
    equal(isObject([]), false);
  });

  it("Object is Object (false)", function () {
    equal(isNotObject({}), false);
  });
});
