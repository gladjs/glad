const { join }  = require('path');
const { chalk } = require('./../namespace/console');
const { error, verbose } = chalk;

module.exports = class Initializer {

  constructor (project, server) {
    this.project = project;
    this.server = server;
  }

  initialize () {
    return new Promise( (resolve, reject) => {
      try {
        let initialize = require(join(this.project.projectPath, 'init'));
        verbose("Glad: Running Your Initialize Hook", 'yellow');
        initialize(this.server.server, this.server.app, this.server.express).then(resolve).catch(reject);
      } catch (err) {
        error('An error occured while initializing the app.');
        error('Be sure that your init.js file exists, and that you resolve the promise');
        error('See Error below...');
        error(err);
        reject(err);
      }
    });
  }
}
