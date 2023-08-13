/**
 * Request Identifer.
 * Creates a shortened unique id that can be converted into a date object.
 */
import { timeCoded } from './../namespace/token.js';
import { chalk, time } from './../namespace/console.js';

export default class RequestIdentifier {

  constructor (project) {
    this.project = project
  }

  async initialize () {
    const { default: config } = await import(this.project.configPath);
    this.logging = config.logHTTP;
  }

  id (req, res, next) {
    req.id = timeCoded();
    if (this.logging) {
      time(`Timing    ${req.id}`);
      chalk.info(`→ Request ${req.id} ${req.method}: ${req.url}`);
    }
    next();
  }

}
