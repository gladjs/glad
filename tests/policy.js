const Policy      = require('../classes/policy');
const Controller  = require('../classes/controller');
const assert      = require('assert');
const redis       = require("redis");
const client      = redis.createClient();
const policies    = require('./mocks/policies');
const server      = { redis: client };
const chai        = require("chai");
const sinon       = require("sinon");
const sinonChai   = require("sinon-chai");
const expect      = chai.expect;
chai.use(sinonChai);

Promise = require('bluebird').Promise;

// policies, logging, server, policy, controller, action

describe("Policies", function () {

  let res = {
    status () {
      return { json (msg) { return msg } }
    },
    json () { return 'json' },
    send () { return 'send'}
  }

  class testController extends Controller {
    myMethod () {
      return "OK";
    }
  }

  let spy = sinon.spy(testController.prototype, "myMethod");
  let policySpy = sinon.spy(policies, 'onFailure');

  it('should call the controller method when the policy is accepted', function () {
    spy.reset();
    new Policy(policies, false, server, 'correctPolicy', testController, 'myMethod').restrict({}, res);
    assert(spy.calledOnce);
  });

  it('should deny the request when the policy does not exist', function () {
    spy.reset();
    policySpy.reset();
    let pol = new Policy(policies, false, server, 'notARealPolicy', testController, 'myMethod').restrict({}, res);
    assert(spy.notCalled);
    assert(policySpy.calledOnce);
  });

  it('should not blow up when an action does not exist on the controller, but it should warn', function () {
    spy.reset();
    policySpy.reset();
    let pol = new Policy(policies, false, server, 'correctPolicy', testController, 'methodMissing').restrict({}, res);
    assert(spy.notCalled);
    assert(policySpy.calledOnce);
  });

  it('should call the controller method when no policy is given', function () {
    spy.reset();
    new Policy(policies, true, server, undefined, testController, 'myMethod').restrict({}, res);
    assert(spy.calledOnce);
  });

  it('should run each policy when an array is provided and only execute the controller after the last one accepts', function () {
    spy.reset();
    let req = {};
    new Policy(policies, false, server, ['correctPolicy', 'secondPolicy'], testController, 'myMethod').restrict(req, res);
    assert(spy.calledOnce);
    expect(req.ranPolicies).to.deep.equal(['correctPolicy', 'secondPolicy']);
  });

  it('should not execute the controller if any policy in the array rejects', function () {
    spy.reset();
    policySpy.reset();
    let req = {};
    new Policy(policies, false, server, ['correctPolicy', 'rejectingPolicy', 'secondPolicy'], testController, 'myMethod').restrict(req, res);
    assert(spy.notCalled);
    assert(policySpy.calledOnce);
  });

  it('should not run subsequent policies when one rejects', function () {
    spy.reset();
    policySpy.reset();
    let req = {};
    new Policy(policies, false, server, ['correctPolicy', 'rejectingPolicy', 'secondPolicy'], testController, 'myMethod').restrict(req, res);
    assert(spy.notCalled);
    assert(policySpy.calledOnce);
    expect(req.ranPolicies).to.deep.equal(['correctPolicy', 'rejectingPolicy']);
  });
});
