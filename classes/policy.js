const { chalk } = require('./../namespace/console');
const path = require('path');


module.exports = class Policy {

  constructor (policies, logging, server, policy, controller, action) {
    this.policy = policy;
    this.controller = controller;
    this.action = action;
    this.server = server;
    this.policies = policies;
    this.logging = logging;
  }

  restrict (req, res) {
    req.controller = this.controller.name;
    req.action = this.action;

    if (this.logging) {
      chalk.info(`Routing   ${req.id} to ${this.controller.name}#${this.action}`);
    }

    if (this.policy) {
      if (this.policies[this.policy]) {
        this.policies[this.policy](req, res, this.acceptor(req, res), this.rejector(req, res));
      } else {
        chalk.error(`Policy Error: ${req.id || ''} The policy "${this.policy}" does not exist, therefore the request was denied`);
        this.policies.onFailure(req, res);
      }
    } else {
      this.runControllerMethod(req, res);
    }
  }

  acceptor (req, res) {
    return () => {
      this.runControllerMethod(req, res);
    };
  }

  rejector (req, res) {
    return (custom) => this.policies.onFailure(req, res, custom);
  }

  runControllerMethod (req, res) {
    let controller = new this.controller(req, res, this.server.redis);
    if (controller[this.action]) {
      controller[this.action]();
    } else {
      chalk.error(`Routing Error: ${req.id || ''} Can not route request to "${req.controller}#${req.action}" because ${req.action} does not exist on ${req.controller}`);
      this.policies.onFailure(req, res);
    }
  }

}











//
