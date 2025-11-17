const { chalk } = require('./../namespace/console');
const path = require('path');
const debug = require('debug');

module.exports = class Policy {

  constructor (policies, logging, server, policy, controller, action) {
    this.policy = policy;
    this.controller = controller;
    this.action = action;
    this.server = server;
    this.policies = policies;
    this.logging = logging;
    this.debug = debug('glad');
    this.policyList = this.normalizePolicies(policy);
    this.rejected = false;
  }

  normalizePolicies (policy) {
    if (!policy && policy !== 0) {
      return [];
    }

    if (Array.isArray(policy)) {
      return policy.filter(Boolean);
    }

    return [policy];
  }

  restrict (req, res) {
    this.debug('Policy: evaluating > %s', req.id);
    req.controller = this.controller.name;
    req.action = this.action;
    this.rejected = false;

    if (this.logging) {
      chalk.info(`Routing   ${req.id} to ${this.controller.name}#${this.action}`);
    }

    if (this.policyList.length) {
      const reject = this.rejector(req, res);

      for (let i = 0; i < this.policyList.length; i++) {
        const name = this.policyList[i];

        this.debug('Policy: lookup %s > %s', name, req.id);

        if (!this.policies[name]) {
          this.debug('Policy: %s not found [error] %s', name, req.id);
          chalk.error(`Policy Error: ${req.id || ''} The policy "${name}" does not exist, therefore the request was denied`);
          reject();
          break;
        }

        const accept = this.acceptor(req, res, i);
        this.debug('Policy: apply %s > %s', name, req.id);
        this.policies[name](req, res, accept, reject);
      }
    } else {
      this.debug('Policy: no policy to apply > %s', req.id);
      this.runControllerMethod(req, res);
    }
  }

  acceptor (req, res, index) {
    return () => {
      this.debug('Policy:accept > %s', req.id);
      const isLastPolicy = this.policyList.length === index + 1;
      if (isLastPolicy && !this.rejected) {
        this.runControllerMethod(req, res);
      }
    };
  }

  rejector (req, res) {
    return (custom) => {
      if (this.rejected) {
        return;
      }
      this.debug('Policy:reject > %s', req.id);
      this.rejected = true;
      return this.policies.onFailure(req, res, custom);
    };
  }

  runControllerMethod (req, res) {
    this.debug('Policy:runControllerMethod > %s', req.id);
    let controller = new this.controller(req, res, this.server.redis, this.server.websockets);
    if (controller[this.action]) {
      controller[this.action]();
    } else {
      chalk.error(`Routing Error: ${req.id || ''} Can not route request to "${req.controller}#${req.action}" because ${req.action} does not exist on ${req.controller}`);
      this.policies.onFailure(req, res);
    }
  }

}
