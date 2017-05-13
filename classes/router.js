const fs      = require('fs');
const path    = require('path');
const { chalk } = require('./../namespace/console');
const policy  = require('./policy');
const bodyParser = require('body-parser');
const RateLimiter = require('./rate-limit');

module.exports = class Router {

  constructor (project, server) {
    this.project  = project;
    this.server   = server;
    this.routes = {};
    this.controllers = {};
    this.models = {};
    this.errors = [];
    this.config = require(this.project.configPath);
  }

  /**
   * Builds out the router object
   */
  buildRoutes () {
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
    this.setObjectsForSegment(this.project.routesPath, 'routes', 'Router');
  }

  /**
   * Requires all of the models for the application and stores them at Router.models
   */
  setModels () {
    this.setObjectsForSegment(this.project.modelsPath, 'models', 'Model');
  }

  /**
   * Requires all of the controllers for the application and stores them at Router.controllers
   */
  setControllers () {
    this.setObjectsForSegment(this.project.controllersPath, 'controllers', 'Controller');
  }

  /**
   * Gets the file paths for all of the .js files in a directory [path]
   */
  getFilesForPath (path) {
    return fs.readdirSync(path).filter(file => /(\.js)$/.test(file));
  }

  /**
   * Scans a directory for .js files,
   * Requires all of the js files in `fpath` to Router[segment]
   * fpath   fully qualified path to a folder
   * segment `routes` | `models` | `controllers`
   * error   The humanized name of the segment that is being created
   */
  setObjectsForSegment (fpath, segment, error) {
    var files = this.getFilesForPath(fpath);
    files.forEach(file => {
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

  rateLimit (config) {
    return (req, res, next) => {
      if (config.rateLimit) {
        new RateLimiter(this.server, req, res, config.rateLimit).limit().then(next);
      } else {
        next();
      }
    }
  }

  setViewPath (config) {
    return (req, res, next) => {
      req.__rootViewPath = `${this.project.viewsPath}`;
      req.viewPath = req.__rootViewPath + config.action;
    }
  }

  /**
  * Create the route in express
  * - Get a body parser
  * - Register the route and send the request through the body-parser then check the policy then finally the controller.
  */
  route (method, config) {
    let { path, controller, action } = config;
    let bodyParser = this.bodyParser(config);
    let viewPath = this.setViewPath(config);
    method = method.toLowerCase();
    return this.server.app[method](path, this.rateLimit(config), bodyParser, viewPath, (req, res) => {
      return new policy(this.project, this.server, config.policy, controller, action).restrict(req, res);
    });
  }

}
