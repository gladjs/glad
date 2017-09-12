let { log, chalk } = require('../namespace/console');
let { error,warn } = chalk;
let Server         = require('../classes/server');
let Router         = require('../classes/router');
let Initializer    = require('./initialize');
let redis          = require("redis");
let session        = require('express-session');
let sessionStore   = require('express-sessions');
let { extend }     = require('../namespace/object');
let Project        = require('../classes/project');
let { join }       = require('path');
let RequestEnd     = require('./after-request');
let Cache          = require('../namespace/cache');
let exposeModelsGlobally  = require('./expose-models-globally');
let RequestIdentifier     = require('./request-identifier');
const debug   = require('debug')('glad');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

module.exports = class Boot {

  constructor (cwd = false) {
    debug('Boot:constructor');
    this.project = new Project(cwd);
    this.project.initialize();
  }

  exec () {

    Promise.each([
      this.createServer,
      this.connectToRedis,
      this.gladCache,
      this.session,
      this.attachSessionToWebsockets,
      this.createRouter,
      this.init,
      this.connectToMongo,
      this.id,
      this.disablePoweredBy,
      this.setViewEngine,
      this.getMiddleware,
      this.getHooks,
      this.after,
      this.middleware,
      this.initializeWaterline,
      this.drawSocketIo,
      this.draw,
      this.exposeModels
    ], exec => exec.call(this))
      .then(() => this.server.listen())
      .catch(err => log(err));
  }

  createServer () {
    debug('Boot:createServer');
    return new Promise( resolve => {
      this.server = new Server(this.project);
      resolve();
    });
  }

  connectToRedis () {
    debug('Boot:connectToRedis');
    return new Promise( resolve => {
      let { config } = this.project;
      this.server.redis = redis.createClient(config.redis);
      resolve();
    });
  }

  gladCache () {
    debug('Boot:gladCache');
    Glad.cache = new Cache(this.server, this.project);
    return new Promise.resolve();
  }

  init () {
    debug('Boot:init');
    return new Initializer(this.project, this.server).initialize();
  }

  connectToMongo () {
    debug('Boot:connectToMongo');
    let { config } = this.project;

    if (config.orm === 'mongoose' && config.mongodb) {
      return new Promise( resolve => {
        let mongoose = require('mongoose');
        mongoose.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database);
        resolve();
      });
    }
  }

  id () {
    debug('Boot:id');
    return new Promise( resolve => {
      let identifier = new RequestIdentifier(this.project);
      this.server.app.use(identifier.id.bind(identifier));
      resolve();
    });
  }

  disablePoweredBy () {
    debug('Boot:disablePoweredBy');
    this.server.app.disable('x-powered-by');
    return Promise.resolve();
  }

  getMiddleware () {
    debug('Boot:getMiddleware');
    return new Promise( resolve => {
      this.project.middleware = require(join(this.project.projectPath, 'middleware'));
      resolve();
    });
  }

  getHooks () {
    debug('Boot:getHooks');
    this.project.hooks = require(join(this.project.projectPath, 'hooks'));
    return Promise.resolve();
  }

  // THIS NEEDS TO BE MOVED IN THE ROUTER CHAIN vvvvvvvvvvv
  after () {
    debug('Boot:after');
    return new Promise( resolve => {
      let after = new RequestEnd(this.project);
      this.server.app.use(after.end.bind(after));
      resolve();
    });
  }

  /**
   * If there is a session key in the config then implement sessions based on the config.
   * Otherwise it is assumed that a roll your own implementation or no sessions will be used.
   */
  session () {
    debug('Boot:session');
    return new Promise( resolve => {
      let { config } = this.project;
      if (config.session) {

        let options = extend({
          instance: this.server.redis,
          storage: 'redis'
        }, config.session);

        this._sessions = session({
          secret: config.cookie.secret,
          resave: config.cookie.resave || false,
          store: new sessionStore(options),
          saveUninitialized: true,
          cookie : config.cookie,
          name : config.cookie.name
        });

        this.server.app.use(this._sessions);

      }
      resolve();
    });
  }

  /**
   * If there is a session key in the config then attach the session to websocket events.
   * Otherwise look for setupWebsockets in the config, if it exists, pass the setup over to there and waith for that promise to resolve.
   */
  attachSessionToWebsockets () {
    debug('Boot:attachSessionToWebsockets');
    return new Promise( resolve => {
      let { config } = this.project;
      if (config.session) {
        this.server.websockets.use((socket, next) => {
          this._sessions(socket.request, socket.request.res, next);
        });
        this.server.websockets.on('connection', conn => {
          if (conn.request.session) {
            conn.request.session.socketId = conn.id;
          } else {
            error("ERROR: You are trying to attach a websocket id to a session, but there is NO session");
          }
        });
        resolve();
      } else if (config.setupWebsockets && typeof config.setupWebsockets === 'function' ) {
        config.setupWebsockets(this.server.websockets).then(resolve);
      } else {
        resolve();
      }
    });
  }

  createRouter () {
    debug('Boot:createRouter');
    return new Promise( (resolve, reject) => {
      this.router = new Router(this.project, this.server);
      this.router.buildRoutes().then(resolve).catch(reject);
    });
  }

  exposeModels () {
    debug('Boot:exposeModels');
    let { config } = this.project;
    return new Promise( (resolve, reject) => {
      if (config.exposeModelsGlobally && config.orm === 'mongoose') {
        exposeModelsGlobally(this.router).then(resolve).catch(reject);
      } else if (config.exposeModelsGlobally) {
        warn('You can only automatically expose model globally when specifying mongoose as your ORM');
        warn('If you are using mongoose, please set `orm : "mongoose"` in your config.js file.');
        warn('If you are not using mongoose, please set "exposeModelsGlobally : false" in your config.js file to supress this warning');
      }
    });
  }

  middleware () {
    debug('Boot:middleware');
    return new Promise( (resolve, reject) => {
      Promise.each(this.project.middleware, exec => exec(this.server))
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * If Waterline is being used, then the developer needs to initialize it.
   * This is wrapped in a try/catch because we don't expect that this method will be there (especially if the project is not using glad-cli).
   */
  initializeWaterline () {
    debug('Boot:initializeWaterline');
    return new Promise( (resolve, reject) => {
      if (this.project.orm === 'waterline') {
        try {
          let hooks = require(`${this.project.projectPath}/hooks`);
          hooks.initializeWaterline(this.router).then(resolve).catch(reject);
        } catch (err) {
          error(err);
          reject("It seems like you have initialized this project to use waterline, but you are missing the onAfterModels hook in your hooks file.");
        }
      } else {
        // no need to initialize for waterline.
        resolve();
      }
    });
  }

  drawSocketIo () {
    debug('Boot:drawSocketIo');
    return new Promise( resolve => {
      try {
        let socketRouter  = require(`${this.project.projectPath}/sockets/router`);
        let socketPolicies = require(`${this.project.projectPath}/sockets/policies`);
        this.server.websockets.on('connection', conn => {
          socketRouter.forEach(route => {
            conn.on(route.event, data => {
              if (route.policy && socketPolicies[route.policy]) {
                socketPolicies[route.policy](conn, () => {
                  route.action.call(this.server.websockets, data, conn);
                });
              } else if (route.policy) {
                error(`WS: The route for the ${route.event} event requires a policy, but the socket policy does not exist. Please ensure that it is defined in ${this.project.projectPath}/sockets/policies.js`);
              } else {
                route.action.call(this.server.websockets, data, conn);
              }
            });
          });
        });
        resolve();
      } catch (err) {
        log("Not using websockets");
        resolve();
      }
    });
  }

  draw () {
    debug('Boot:draw');
    return new Promise( resolve => {
      let key;
      for (key in this.router.routes) {
        if (this.router.routes.hasOwnProperty(key)) {
          let target = this.router.routes[key];
          let method;
          for (method in target) {
            if (target.hasOwnProperty(method)) {
              target[method].forEach(cfg => {
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

  setViewEngine () {
    debug('Boot:setViewEngine');
    let { config } = this.project;
    this.server.app.set('view engine', config.defaultViewEngine || 'pug');
    return Promise.resolve();
  }

}
