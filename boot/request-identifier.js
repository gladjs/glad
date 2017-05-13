/**
 * Request Identifer.
 * Creates a shortened unique id that can be converted into a date object.
 */
const { timeCoded } = require('./../namespace/token');
const { chalk, time } = require('./../namespace/console');

module.exports = class RequestIdentifer {

  constructor (project) {
    this.logging = require(project.configPath).logHTTP;
  }

  id (req, res, next) {
    req.id = timeCoded();
    if (this.logging) {
      time(`Timing    ${req.id}`);
      chalk.info(`Request   ${req.id} << ${req.method}: ${req.url}`);
    }
    next();
  }

}
