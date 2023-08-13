import Policy from "../classes/policy.js";
import Controller from "../classes/controller.js";
import assert from "assert";
import { createClient } from "redis";
import policies from "./mocks/policies.js";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import res from "./mocks/response-object.js"
chai.use(sinonChai);

const client = createClient();
const server = { redis: client };

// policies, logging, server, policy, controller, action

describe("Policies", function () {
  class testController extends Controller {
    myMethod() {
      return "OK";
    }
  }

  this.beforeAll(function () {
    this.myMethodSpy = sinon.spy(testController.prototype, "myMethod");
    this.policySpy = sinon.spy(policies, "onFailure");
  });

  this.afterEach(function () {
    this.myMethodSpy.resetHistory();
    this.policySpy.resetHistory()
  });

  it("should call the controller method when the policy is accepted", function () {
    new Policy(
      policies,
      false,
      server,
      "correctPolicy",
      testController,
      "myMethod"
    ).restrict({}, res);
    assert(this.myMethodSpy.calledOnce);
  });

  it("should deny the request when the policy does not exist", function () {
    let pol = new Policy(
      policies,
      false,
      server,
      "notARealPolicy",
      testController,
      "myMethod"
    ).restrict({}, res);
    assert(this.myMethodSpy.notCalled);
    assert(this.policySpy.calledOnce);
  });

  it("should not blow up when an action does not exist on the controller, but it should warn", function () {
    let pol = new Policy(
      policies,
      false,
      server,
      "correctPolicy",
      testController,
      "methodMissing"
    ).restrict({}, res);
    assert(this.myMethodSpy.notCalled);
    assert(this.policySpy.calledOnce);
  });

  it("should call the controller method when no policy is given", function () {
    new Policy(
      policies,
      true,
      server,
      undefined,
      testController,
      "myMethod"
    ).restrict({}, res);
    assert(this.myMethodSpy.calledOnce);
  });
});
