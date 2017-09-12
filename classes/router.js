const fs      = require('fs');
const path    = require('path');
const { chalk } = require('./../namespace/console');
const policy  = require('./policy');
const bodyParser = require('body-parser');
const args    = require('optimist').argv;
const lodash  = require('lodash');
const debug   = require('debug')('glad');

module.exports = class Router {

  constructor (project, server) {
    debug('Router:constructor');
    this.project  = project;
    this.server   = server;
    this.routes   = {};
    this.controllers = {};
    this.models   = {};
    this.errors   = [];
    this.config   = require(this.project.configPath);
    this.policies = require(path.join(project.projectPath, "policies.js"));
    this.logging  = require(project.configPath).logHTTP;
  }

  /**
   * Builds out the router object
   */
  buildRoutes () {
    debug('Router:buildRoutes');
    return new Promise( (resolve, reject) => {
      this.setRoutes();
      this.setControllers();
      this.setModels();
      if (this.errors.length) {
        reject(this.errors);
      } else {
        resolve();
      }
    });
  }

  /**
   * Requires all of the routes for the application and stores them at Router.routes
   */
  setRoutes () {
    debug('Router:setRoutes');
    this.setObjectsForSegment(this.project.routesPath, 'routes', 'Router');
  }

  /**
   * Requires all of the models for the application and stores them at Router.models
   */
  setModels () {
    debug('Router:setModels');
    this.setObjectsForSegment(this.project.modelsPath, 'models', 'Model');
  }

  /**
   * Requires all of the controllers for the application and stores them at Router.controllers
   */
  setControllers () {
    debug('Router:setControllers');
    this.setObjectsForSegment(this.project.controllersPath, 'controllers', 'Controller');
  }

  /**
   * Gets the file paths for all of the .js files in a directory [path]
   */
  getFilesForPath (path) {
    debug('Router:getFilesForPath');
    let paths = fs.readdirSync(path).filter(file => /(\.js)$/.test(file));
    let only = args.only && args.only.split(',').map(x => `${x}.js`); 
    /**
    * Implement the --only flag. 
    * This allows you to have the server only handle routes for a specific controller.
    * This use case is primarily for occasions such as booting up a server to warm caches for 
    * a specific controller, or for adding additional servers to handle an impacted resource.
    **/
    if (only && only.length) {
      paths = paths.filter( p => lodash.includes(only, p));
    }
    return paths;
  }

  /**
   * Scans a directory for .js files,
   * Requires all of the js files in `fpath` to Router[segment]
   * fpath   fully qualified path to a folder
   * segment `routes` | `models` | `controllers`
   * error   The humanized name of the segment that is being created
   */
  setObjectsForSegment (fpath, segment, error) {
    debug('Router:setObjectsForSegment');
    this.getFilesForPath(fpath).forEach(file => {
      let ref = path.join (fpath, file);
      try {
        this[segment][file.replace('.js', '')] = require(ref);
      } catch (err) {
        chalk.error(`Glad > ${error}`, err.stack);
        this.errors.push({
          message : "> Could Not Bind " + ref.split('/').pop().toString() + '::' + file.replace('.js', '') + " To Any Route!",
          err : err
        });
      }
    });
  }

  /**
   * Implement the default body parser, override the default if the bodyParser key is defined on the route
   * - Allow the engineer to override the default options but still use the default parser.
   * - Allow the engineer to override the parser type but still use the default options.
   * - Allow the engineer to override both the parser and the options.
   */
  bodyParser (config) {
    debug('Router:bodyParser');
    let type, options;
    if (config.bodyParser) {
      type = config.bodyParser.parser || this.config.defaultBodyParser && this.config.defaultBodyParser.type;
      options = config.bodyParser || this.config.defaultBodyParser;
    } else {
      type = this.config.defaultBodyParser && this.config.defaultBodyParser.type;
      options = this.config.defaultBodyParser;
    }
    type = type || 'json';
    options = options || {};
    return bodyParser[type](options);
  }

  setViewPath (config) {
    debug('Router:setViewPath');
    return (req, res, next) => {
      req.__rootViewPath = `${this.project.viewsPath}`;
      req.viewPath = req.__rootViewPath + config.action;
      next();
    }
  }

  /**
  * Create the route in express
  * - Get a body parser
  * - Register the route and send the request through the body-parser then check the policy then finally the controller.
  */
  route (method, config) {
    debug('Router:route');
    let { path, controller, action } = config;
    let bodyParser = this.bodyParser(config);
    let viewPath = this.setViewPath(config);
    method = method.toLowerCase();
    return this.server.app[method](path, bodyParser, viewPath, (req, res) => {
      return new policy(this.policies, this.logging, this.server, config.policy, controller, action).restrict(req, res);
    });
  }

}
