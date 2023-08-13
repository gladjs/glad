import { readdirSync } from "fs";
import { join } from "path";
import { chalk } from "./../namespace/console.js";
import policy from "./policy.js";
import bodyParser from "body-parser";
import optimist from "optimist";
import lodash from "lodash";
import debug from "debug";
import path from "path";
import dynamicImport from "../lib/dynamic-import.js"

const { argv: args } = optimist;

export default class Router {
  constructor(project, server) {
    this.debug = debug("glad");
    this.debug("Router:constructor");
    this.project = project;
    this.server = server;
    this.routes = {};
    this.controllers = {};
    this.models = {};
    this.errors = [];
  }

  async setUp () {
    this.debug("Router:setUp");
    this.config = await dynamicImport(this.project.configPath);
    this.policies = await dynamicImport(join(this.project.projectPath, "policies.js"));
    this.logging = await dynamicImport(this.project.configPath).logHTTP;
  }
  /**
   * Builds out the router object
   */
  async buildRoutes() {
    this.debug("Router:buildRoutes");
    await this.setUp();
    await this.setRoutes();
    await this.setControllers();
    await this.setModels();

    return new Promise((resolve, reject) => {
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
  async setRoutes() {
    this.debug("Router:setRoutes");
    await this.setObjectsForSegment(this.project.routesPath, "routes", "Router");
  }

  /**
   * Requires all of the models for the application and stores them at Router.models
   */
  async setModels() {
    this.debug("Router:setModels");
    await this.setObjectsForSegment(this.project.modelsPath, "models", "Model");
  }

  /**
   * Requires all of the controllers for the application and stores them at Router.controllers
   */
  async setControllers() {
    this.debug("Router:setControllers");
    await this.setObjectsForSegment(
      this.project.controllersPath,
      "controllers",
      "Controller"
    );
  }

  /**
   * Gets the file paths for all of the .js files in a directory [path]
   */
  getFilesForPath(path) {
    this.debug(`Router:getFilesForPath - gets all js files in ${path}`);
    let paths = readdirSync(path).filter((file) => /(\.js)$/.test(file));
    let only = args.only && args.only.split(",").map((x) => `${x}.js`);
    /**
     * Implement the --only flag.
     * This allows you to have the server only handle routes for a specific controller.
     * This use case is primarily for occasions such as booting up a server to warm caches for
     * a specific controller, or for adding additional servers to handle an impacted resource.
     **/
    if (only && only.length) {
      paths = paths.filter((p) => lodash.includes(only, p));
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
  async setObjectsForSegment(fpath, segment, error) {
    this.debug(`Router:setObjectsForSegment ${segment}`);
    const filesInPath = this.getFilesForPath(fpath);

    for (let i = 0; i < filesInPath.length; i +=1) {
      const ref = join(fpath, filesInPath[i]);
      const filename = path.parse(filesInPath[i]).name

      try {
        this[segment][filename] = (await dynamicImport(ref));
      } catch (err) {
        chalk.error(`Glad > ${error}`, err.stack);
        this.errors.push({
          message:
            "> Could Not Bind " +
            ref.split("/").pop().toString() +
            "::" +
            filename +
            " To Any Route!",
          err: err,
        });
      }
    }
  }

  /**
   * Implement the default body parser, override the default if the bodyParser key is defined on the route
   * - Allow the engineer to override the default options but still use the default parser.
   * - Allow the engineer to override the parser type but still use the default options.
   * - Allow the engineer to override both the parser and the options.
   */
  bodyParser(config) {
    this.debug("Router:bodyParser");
    let type, options;
    if (config.bodyParser && config.bodyParser.custom) {
      return config.bodyParser.custom;
    } else if (config.bodyParser) {
      type =
        config.bodyParser.parser ||
        (this.config.defaultBodyParser && this.config.defaultBodyParser.type);
      options = config.bodyParser || this.config.defaultBodyParser;
    } else {
      type =
        this.config.defaultBodyParser && this.config.defaultBodyParser.type;
      options = this.config.defaultBodyParser;
    }
    type = type || "json";
    options = options || {};
    return bodyParser[type](options);
  }

  setViewPath(config) {
    this.debug("Router:setViewPath");
    return (req, res, next) => {
      req.__rootViewPath = `${this.project.viewsPath}`;
      req.viewPath = req.__rootViewPath + config.action;
      next();
    };
  }

  /**
   * Create the route in express
   * - Get a body parser
   * - Register the route and send the request through the body-parser then check the policy then finally the controller.
   */
  route(method, config) {
    if (!config.controller) {
      this.noControllerError(config);
    }
    this.debug(
      `Router:route ${config.path} => ${config.controller.name}#${config.action}`
    );
    let { path, controller, action } = config;
    let bodyParser = this.bodyParser(config);
    let viewPath = this.setViewPath(config);
    method = method.toLowerCase();
    return this.server.app[method](path, bodyParser, viewPath, (req, res) => {
      debug("glad")(
        "Router:apply %s => %s#%s with policy %s",
        path,
        controller.name,
        action,
        config.policy || "none"
      );
      return new policy(
        this.policies,
        this.logging,
        this.server,
        config.policy,
        controller,
        action
      ).restrict(req, res);
    });
  }

  noControllerError(config) {
    chalk.error(
      [
        "",
        "-------------------------------------",
        "Error: NO_CONTROLLER",
        "You can not have a route wthout a controller to handle requests made to it.",
        "If you feel that you have encountered this message unexpectedly...",
        "Please check that the name of the route file matches the exact name of the intended controller file.",
        "Please review the route config that caused this error below.",
        "-------------------------------------",
        JSON.stringify(config),
        "",
      ].join("\n")
    );

    process.exit(1);
  }
}
