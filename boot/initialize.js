import { join } from 'path';
import { chalk } from './../namespace/console.js';
const { error, verbose } = chalk;

export default class Initializer {

  constructor (project, server) {
    this.project = project;
    this.server = server;
  }

  async initialize () {
    try {
      let { default: initialize } = await import(join(this.project.projectPath, 'init.js'));
      verbose("Glad: Running Your Initialize Hook", 'yellow');
      const promise = await initialize(this.server.server, this.server.app, this.server.express)

      setTimeout(function () {
        console.log(promise)
      }, this.project.config.initializerTimeOut || 5000)

    } catch (err) {
      error('An error occured while initializing the app.');
      error('Be sure that your init.js file exists, and that you resolve the promise');
      error('See Error below...');
      error(err);
    }
  }
}
