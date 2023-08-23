import { chalk } from './../namespace/console.js';
import { join } from 'path'
const { error, verbose } = chalk;

export default class Initializer {

  constructor (project, server) {
    this.project = project;
    this.server = server;
  }

  createTimeout () {
    return new Promise((resolve, reject) => {
      this.timeout = setTimeout(() => {
        const timeout = this.project.config.initializerTimeOut || 5000
        const reason = this.project.config.initializerTimeOut ? "config" : "default"
        const timeoutReason = this.project.config.initializerTimeOut ? "the initializerTimeOut key in config.js" : "the default timeout";
        reject([
          "Your initializer timed out.", 
          `The current timeout is set to ${timeout}ms and was derived from ${timeoutReason}`,
          `You can change this behavior by ${reason === "config" ? "updating" : "adding"} the initializerTimeOut key in the config file`,
          "--> " + this.project.configPath,
        ].join("\n"));
      }, this.project.config.initializerTimeOut || 5000)
      resolve()
    })
  }

  async initialize () {
    try {
      verbose("Glad: Running Your Initialize Hook", 'yellow');
      let { default: initialize } = await import(join(this.project.projectPath, 'init.js'));
      await this.createTimeout().then(async () => {
        await initialize(this.server.server, this.server.app, this.server.express)
        clearTimeout(this.timeout)
      }).catch(err => {
        throw err
      })
    } catch (err) {
      error('An error occured while initializing the app.');
      error('Be sure that your init.js file exists, and that you resolve the promise');
      error('See Error below...');
      throw new Error(err);
    }
  }
}
