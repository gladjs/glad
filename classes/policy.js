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
  }

  restrict (req, res) {
    this.debug('Policy: evaluating > %s', req.id);
    req.controller = this.controller.name;
    req.action = this.action;

    if (this.logging) {
      chalk.info(`Routing   ${req.id} to ${this.controller.name}#${this.action}`);
    }

    if (this.policy) {
      this.debug('Policy: lookup %s > %s', this.policy, req.id);
      if (this.policies[this.policy]) {
        this.debug('Policy: apply %s > %s', this.policy, req.id);
        this.policies[this.policy](req, res, this.acceptor(req, res), this.rejector(req, res));
      } else {
        this.debug('Policy: %s not found [error] %s', this.policy, req.id);
        chalk.error(`Policy Error: ${req.id || ''} The policy "${this.policy}" does not exist, therefore the request was denied`);
        this.policies.onFailure(req, res);
      }
    } else {
      this.debug('Policy: no policy to apply > %s', req.id);
      this.runControllerMethod(req, res);
    }
  }

  acceptor (req, res) {
    return () => {
      this.debug('Policy:accept > %s', req.id);
      this.runControllerMethod(req, res);
    };
  }

  rejector (req, res) {
    return (custom) => {
      this.debug('Policy:reject > %s', req.id);
      return this.policies.onFailure(req, res, custom)
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
