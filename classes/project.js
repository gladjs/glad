const fs   = require('fs');
const path = require('path');
const NODE_ENV = process.env['NODE_ENV'];
let { get } = require('../namespace/object');
let { chalk } = require('../namespace/console');
let { ok, error } = chalk;
let { exit } = process;

module.exports = class Project {

  constructor () {
    this.cliPath         = path.join(__dirname, '../..');
    this.projectPath     = process.cwd();
    this.packagePath     = path.join(this.projectPath, "package.json");
    this.configPath      = path.join(this.projectPath, "config.js");
    this.hooksPath       = path.join(this.projectPath, "hooks.js");
    this.modelsPath      = path.join(this.projectPath, "models");
    this.controllersPath = path.join(this.projectPath, "controllers");
    this.routesPath      = path.join(this.projectPath, "routes");
    this.viewsPath      = path.join(this.projectPath, "views");
    this.config          = require(this.configPath);
    this.orm             = this.config.orm || 'mongoose';
    this.development     = NODE_ENV === "development" || !NODE_ENV;
    this.staging         = NODE_ENV === "staging";
    this.production      = NODE_ENV === "production";
  }

  initialize () {
    if (this.isProject()) {
      ok(`Glad version ${this.cliVersion}`);
      ok(`${new Date()}`);
      ok(`Project root ${this.projectPath}`);
    } else {
      error(`You don't seem to be in a valid Glad project. Your current cwd is ${this.projectPath}`);
      exit(1);
    }
  }

  isProject () {
    let hasPackageFile = fs.existsSync(this.packagePath);

    if (hasPackageFile) {
      this.package    = require(this.packagePath);
      this.cliVersion = get(this.package, 'dependencies.glad');
      return !!this.cliVersion;
    } else {
      return false;
    }

  }

  logEnvVariables () {

  }

}
