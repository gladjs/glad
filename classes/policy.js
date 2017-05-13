const { chalk } = require('./../namespace/console');
const path = require('path');

module.exports = class Policy {

  constructor (project, server, policy, controller, action) {
    this.policy = policy;
    this.controller = controller;
    this.action = action;
    this.project = project;
    this.server = server;
    this.policies = require(path.join(project.projectPath, "policies.js"));
    this.logging = require(project.configPath).logHTTP;
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
        chalk.error(`The policy "${this.policy}" does not exist, therefore the request was denied`);
        this.policies.onFailure(req, res);
      }
    } else {
      new this.controller(req, res, this.server.redis)[this.action]();
    }
  }

  acceptor (req, res) {
    return () => {
      new this.controller(req, res, this.server.redis)[this.action]()
    };
  }

  rejector (req, res) {
    return (custom) => this.policies.onFailure(req, res, custom);
  }

}











//
