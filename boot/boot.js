import { chalk } from "../namespace/console.js";
import dynamicImport from "../lib/dynamic-import.js"
let { error, warn } = chalk;
import Server from "../classes/server.js";
import Router from "../classes/router.js";
import Initializer from "./initialize.js";
import redis from "redis";
import session from "express-session";
import sessionStore from "express-sessions";
import { extend } from "../namespace/object.js";
import Project from "../classes/project.js";
import { join } from "path";
import RequestEnd from "./after-request.js";
import Cache from "../namespace/cache.js";
import exposeModelsGlobally from "./expose-models-globally.js";
import RequestIdentifier from "./request-identifier.js";
import _debug from "debug";

const { createClient } = redis;

const debug = Symbol("debug");
const debugNamespace = Symbol("debugNamespace");

export default class Boot {
  constructor(cwd = false) {
    this[debugNamespace] = _debug("glad");
    this[debug]("constructor");
    this.project = new Project(cwd);
  }

  [debug](msg) {
    this[debugNamespace]("Boot: %s", msg);
  }

  async exec() {
    try {
      await this.project.initialize();
      this.createServer();
      await this.connectToRedis();
      this.gladCache();
      await this.session();
      await this.attachSessionToWebsockets();
      await this.createRouter();
      await this.init();
      this.id();
      await this.disablePoweredBy();
      await this.setViewEngine();
      await this.getMiddleware();
      await this.getHooks();
      await this.after();
      await this.middleware();
      await this.initializeWaterline();
      await this.drawSocketIo();
      await this.draw();
      await this.exposeModels();
      await this.server.listen();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  createServer() {
    this[debug]("createServer");
    this.server = new Server(this.project);
    global.Glad.server = this.server;
  }

  async connectToRedis() {
    this[debug]("connectToRedis");
    this.server.redis = createClient(this.project.config.redis);
    await this.server.redis.connect();
  }

  gladCache() {
    this[debug]("gladCache");
    Glad.cache = new Cache(this.server, this.project);
    if (Glad.cache.disabled) {
      chalk.info("Cache: DISABLED");
    } else {
      chalk.ok("Cache: ENABLED");
    }
  }

  init() {
    this[debug]("init");
    return new Initializer(this.project, this.server).initialize();
  }

  async id() {
    this[debug]("id");
    const identifier = new RequestIdentifier(this.project);
    await identifier.initialize();
    this.server.app.use(identifier.id.bind(identifier));
  }

  disablePoweredBy() {
    this[debug]("disablePoweredBy");
    this.server.app.disable("x-powered-by");
    return Promise.resolve();
  }

  async getMiddleware() {
    this[debug]("getMiddleware");
    this.project.middleware = await dynamicImport(
      join(this.project.projectPath, "middleware.js")
    );
  }

  async getHooks() {
    this[debug]("getHooks");
    this.project.hooks = await dynamicImport(
      join(this.project.projectPath, "hooks.js")
    );
  }

  // THIS NEEDS TO BE MOVED IN THE ROUTER CHAIN vvvvvvvvvvv
  async after() {
    this[debug]("after");
    let after = new RequestEnd(this.project);
    await after.initialize();
    this.server.app.use(after.end.bind(after));
  }

  /**
   * If there is a session key in the config then implement sessions based on the config.
   * Otherwise it is assumed that a roll your own implementation or no sessions will be used.
   */
  async session() {
    this[debug]("session");
    const { config } = this.project;
    var userSessionModule;

    try {
      userSessionModule = await dynamicImport(
        join(this.project.projectPath, "/session.js")
      );
    } catch (err) {
      userSessionModule = false;
    }

    if (config.session) {
      let options = extend(
        {
          instance: this.server.redis,
          storage: "redis",
        },
        config.session
      );

      this._sessions = session({
        secret: config.cookie.secret || 'keyboard cat',
        resave: config.cookie.resave || false,
        saveUninitialized: true,
        cookie: config.cookie || { secure: true }
      })

      this.server.app.use((req, res, next) => {
        let debugMiddleware = _debug("glad");
        debugMiddleware("Session:middleware");
        if (userSessionModule) {
          debugMiddleware("Session:middleware: using session.js");
          userSessionModule(req, res, next).then((result) => {
            if (result) {
              debugMiddleware(
                "Session:middleware: session.js > Use Glad Session"
              );
              this._sessions(req, res, next);
            } else {
              debugMiddleware("Session:middleware: session.js > Not using Session");
            }
          });
        } else {
          debugMiddleware("Session:middleware: Using Glad Session");
          this._sessions(req, res, next);
        }
      });
    }
  }

  /**
   * If there is a session key in the config then attach the session to websocket events.
   * Otherwise look for setupWebsockets in the config, if it exists, pass the setup over to there and waith for that promise to resolve.
   */
  async attachSessionToWebsockets() {
    this[debug]("attachSessionToWebsockets");
    return new Promise((resolve) => {
      let { config } = this.project;
      if (config.session) {
        this[debug]("attachSessionToWebsockets attaching");
        this.server.websockets.use((socket, next) => {
          this._sessions(socket.request, socket.request.res, next);
        });
        this.server.websockets.on("connection", (conn) => {
          _debug("glad")("⚡ websocket ⚡ connected");
          if (conn.request.session) {
            _debug("glad")("⚡ websocket ⚡ attaching session");
            conn.request.session.socketId = conn.id;
          } else {
            error(
              "ERROR: You are trying to attach a websocket id to a session, but there is NO session"
            );
          }
        });
        resolve();
      } else if (
        config.setupWebsockets &&
        typeof config.setupWebsockets === "function"
      ) {
        this[debug]("attachSessionToWebsockets using config.setupWebsockets")
        config.setupWebsockets(this.server.websockets).then(resolve);
      } else {
        resolve();
      }
    });
  }

  async createRouter() {
    this[debug]("createRouter");
    this.router = new Router(this.project, this.server);
    await this.router.buildRoutes();
  }

  exposeModels() {
    this[debug]("exposeModels");
    let { config } = this.project;
    return new Promise((resolve, reject) => {
      if (config.exposeModelsGlobally && config.orm === "mongoose") {
        exposeModelsGlobally(this.router).then(resolve).catch(reject);
      } else if (config.exposeModelsGlobally) {
        resolve();
        warn(
          "You can only automatically expose model globally when specifying mongoose as your ORM"
        );
        warn(
          'If you are using mongoose, please set `orm : "mongoose"` in your config.js file.'
        );
        warn(
          'If you are not using mongoose, please set "exposeModelsGlobally : false" in your config.js file to supress this warning'
        );
      } else {
        resolve();
      }
    });
  }

  async middleware() {
    this[debug]("middleware");
    for (let i = 0; i < this.project.middleware.length; i +=1) {
      await this.project.middleware[i](this.server)
    }
  }

  /**
   * If Waterline is being used, then the developer needs to initialize it.
   * This is wrapped in a try/catch because we don't expect that this method will be there (especially if the project is not using glad-cli).
   */
  async initializeWaterline() {
    this[debug]("initializeWaterline");
    return new Promise(async (resolve, reject) => {
      if (this.project.orm === "waterline") {
        this[debug]("initializeWaterline: Using Waterline");
        try {
          let hooks = await dynamicImport(`${this.project.projectPath}/hooks`);
          hooks.initializeWaterline(this.router).then(resolve).catch(reject);
        } catch (err) {
          error(err);
          reject(
            "It seems like you have initialized this project to use waterline, but you are missing the onAfterModels hook in your hooks file."
          );
        }
      } else {
        this[debug]("initializeWaterline: Not using Waterline");
        // no need to initialize for waterline.
        resolve();
      }
    });
  }

  async drawSocketIo() {
    this[debug]("drawSocketIo");
    const { config } = this.project;
    try {
      const socketRouter = await dynamicImport(
        `${this.project.projectPath}/sockets/router.js`
      );
      const socketPolicies = await dynamicImport(
        `${this.project.projectPath}/sockets/policies.js`
      );
      this.server.websockets.on("connection", (conn) => {
        const connectionDebug = _debug("glad");
        socketRouter.forEach((route) => {
          connectionDebug(
            "⚡ websocket ⚡ drawing route for %s",
            route.event
          );
          conn.prependAnyOutgoing(event => {
            _debug("glad")("⚡ websocket ⚡ emitting %s", route.event)
            if (config.logHTTP) {
              chalk.ok(`← ⚡ ${conn.id} ${event}`)
            }
          });
          conn.on(route.event, (data) => {
            const routeDebug = _debug("glad");
            routeDebug("`⚡ websocket ⚡ Received %s", route.event);
            if (config.logHTTP) {
              chalk.info(`→ ⚡ ${conn.id} ${route.event}`)
            }
            if (route.policy && socketPolicies[route.policy]) {
              routeDebug(
                "`⚡ websocket ⚡ applying policy for %s",
                route.event
              );
              socketPolicies[route.policy](conn, () => {
                routeDebug(
                  "`⚡ websocket ⚡ policy accepted for %s",
                  route.event
                );
                route.action.call(this.server.websockets, data, conn);
              });
            } else if (route.policy) {
              error(
                `WS: The route for the ${route.event} event requires a policy, but the socket policy does not exist. Please ensure that it is defined in ${this.project.projectPath}/sockets/policies.js`
              );
            } else {
              routeDebug(
                "`⚡ websocket ⚡ no policy for %s > Calling action",
                route.event
              );
              route.action.call(this.server.websockets, data, conn);
            }
          });
        });
      });
    } catch (err) {
      this[debug]("not using websockets");
      error("not using websockets");
      throw(err)
    }
  }

  draw() {
    this[debug]("draw");
    return new Promise((resolve) => {
      let key;
      for (key in this.router.routes) {
        if (this.router.routes.hasOwnProperty(key)) {
          let target = this.router.routes[key];
          let method;
          for (method in target) {
            if (target.hasOwnProperty(method)) {
              target[method].forEach((cfg) => {
                cfg.controller = this.router.controllers[key];
                this.router.route(method, cfg);
              });
            }
          }
        }
      }
      resolve();
    });
  }

  setViewEngine() {
    this[debug]("setViewEngine");
    let { config } = this.project;
    this.server.app.set("view engine", config.defaultViewEngine || "pug");
    return Promise.resolve();
  }
}
