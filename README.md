<img src="https://raw.githubusercontent.com/gladjs/glad/master/.assets/glad-banner.png" height="160px" width="712px" align="center">

[![Code Climate](https://codeclimate.com/github/gladjs/glad/badges/gpa.svg)](https://codeclimate.com/github/gladjs/glad)
[![Build Status](https://travis-ci.org/gladjs/glad.svg?branch=master)](https://travis-ci.org/gladjs/glad)
[![Coverage Status](https://coveralls.io/repos/github/gladjs/glad/badge.svg?branch=master)](https://coveralls.io/github/gladjs/glad?branch=master)

[![NPM](https://nodei.co/npm/glad.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/glad/)


<div style="clear:both;"></div>

<h2>Required</h2>

* [Node >= 6.5](http://nodejs.org/) *(with NPM)*
* [Redis >= 3.0.2](http://redis.io/)

*Requires Redis 3.0.2 or greater because caching uses the [XX option of ZADD](https://redis.io/commands/zadd#zadd-options-redis-302-or-greater).*
<br>
*Requires Node 6.5 or greater because many features of ES6 are used.*
<br>
*You can still use Glad versions less than 1.0.0 with older versions of Node/IOJS*

<br>

## What is Glad?
Glad is a Node JS (MC / MVC) framework built on top of Express that aims to make common things that developers need available in an easy and intuitive manner.

#### Main features.
- REST-MC or MVC Workflow
- Endpoint access policies
- Class based controllers
- Intuitive routing with route based body parsing and policies
- Socket.io integration & Websocket routing with route based policies available
- Built in session management
- LRU/LFU controller action caching
- General caching
- Sane project directory structure
- Works with any database
- High test coverage
- Leverages the Express ecosystem so you can too.
- REST endpoint generation with Glad CLI
- Utilities such as tokenization, number conversions, object tools, array tools, date tools and other various utilities.
- Console Access to the server process with Glad CLI


Out of the box, you get a Model/Controller framework which is great for building REST APIs for either client rendered apps
such as Ember, Angular, React/Redux etc... or API Service development.
Furthermore, Glad supports MVC and comes bundled with Pug (formerly Jade). Under the hood, view rendering is handled by Express. This gives you the utility of the Express eco-system right at your fingertips.

If you are familiar with Node JS, then getting started with Glad is absolutely painless. If you are new to Node JS, then you should move along quite nicely and Glad will kick start your project in superhero fashion. In fact, you can get a REST API up and running in a matter of minutes after initializing your project.

<br/>

## Installation

The recommended way to install Glad is using Glad CLI. However, it is not necessary, but again highly reccomended. Previous versions of glad included the CLI. In versions >= 1.0.0, the CLI has been abstracted out to a separate package.

#### Installing Glad CLI

`npm install -g glad-cli`

#### Installing Glad without the CLI
`npm install glad --save`

<br/>

#### Creating a new project using Glad CLI

Glad CLI has many options for initializing a project. The CLI supports several different databases including MongoDB, Postgresql, MySQL. In addition, Glad CLI supports either Mongoose, Waterline, or usage without an ORM/ODM. You can read the documentation for Glad-CLI [here.](https://github.com/gladjs/glad-cli/blob/master/README.md)

**Example using MongoDB & Mongoose**
- Create a new folder for your project
- `cd /path/to/new-folder`
- `glad init --odm=mongoose`

**Example using Postgresql & Waterline**
- Create a new folder for your project
- `cd /path/to/new-folder`
- `glad init --odm=waterline --adapter=sails-postgresql`

#### Creating a project without Glad-CLI

- Create a new folder for your project
- `cd /path/to/new-folder`
- `npm install glad --save`

<br/>

# Running / Development

Let us begin with a brief overview of how Glad.JS works by taking a high level look at the request lifecycle.

- A request comes in to `/foo`
- The router locates the `/foo` route.
- The router checks the route entry to see if there is a specific body parser it should use for this request. If not, it uses the default body parser defined in your `config.js` file. Either way, the body gets parsed.
- The router then checks to see if there is a policy specified on the route entry.
- If there is a policy, it routes the request to the policy and if it is accepted, the policy hands the request off to the correct controller/action combo.
- If there is no policy, The router routes the request off to the correct controller/action combo.

There's quite a lot happening behind the scenes to facilitate this flow, but that's basically the gist of it. You have routes, models, controllers, and (if you'd like) views. Routes point to controllers, controllers pull in models and complete the request with various types of data/views.

Now lets take a look at getting set up. After installation, it's a good idea to take a look at the config file and make any neccesary adjustments. The config file contains all of the settings you'll need to change when either developing or deploying your application. It's safe to assume that you might want to read environment variables or dynamically change different configuration options based on any number of factors. You'll most likely want to do that here.


### An overview of the config file
```js
{

  port : 4242, // <-- The port that the http server will listen to

  host : '0.0.0.0', // <-- The host that the http server will listen on, (Can be /tmp/sock)

  logHTTP: true, // <-- Log HTTP request info to stdout

  defaultBodyParser : { // <-- The default body parser
    limit : '0.3mb',
    type : 'json'
  },

  exposeModelsGlobally : true, // <-- Makes your models available in the global namespace

  redis : {
    host: "localhost", // <-- The Redis Host
    port: 6379 // <-- The Redis Port
  },

  cookie : {
    name : 'glad.sid',     // <-- The name of your cookie
    secret: 'change-this', // <-- The cookie secret
    maxAge : 3600000 * 24, // <-- Cookie expiration date
  },

  session : {
    storage: 'redis' // <-- Where sessions are stored. See the section on Sessions for more options
  },

  defaultViewEngine : 'pug', // <-- The default view engine to use

  orm: "mongoose" // <-- This tells Glad CLI to use the mongoose blueprint when generating APIs

}
```

<br>

Next we'll have a look at policies. A policy is an asynchronous function that receives the request & response objects as well as accept and reject methods.
If accept is invoked, the request gets routed to the controller action. If reject is invoked, the request is terminated and the **onFailure** method of the policies object is called. The reject method takes an optional argument. This argument can be anything, but it can be useful to extend the onFailure method.
Maybe you want to pass functions into the **onFailure** method and have a default responder combined with custom responders. See `fig.p-1` for an example of this.

### Policies

```js
  module.exports = {

    /*
     The onFailure method is a default that you can set for denying requests.
     This method receives the req & res objects, as well as an optional rejection reason that you pass to the reject method.
    */
    onFailure (req, res, rejectMessage) {
      res.status(403).json({error: rejectMessage});
    },

    /*
    This method is intentionally overly verbose
    to make it clear what is happening.
    */
    authenticated (req, res, accept, reject) {
      if (req.session) {
        if (req.session.authenticated) { // <--- What value on the session says they are logged in?
          accept(); // Accept the request. All is good
        } else {
          reject("You must be logged in to do that"); // Reject the request. This will end up calling the above on failure method.
        }
      } else {
        reject();
      }
    },

    // <--- Add additional policies if needed. Examples below....
    isDeveloper (req, res, accept, reject) {
      if (req.session && req.session.developer) {
        accept();
      } else {
        reject("You are not allowed to access this API");
      }
    },

    // Note: This policy requires you to follow the convention /api/resource/:id
    resourceOwnerOrAdmin (req, res, accept, reject) {

      if (!req.params) {
        return reject("Incorrect Parameters: Missing Parameters");
      } else if (!req.params.id) {
        return reject("Incorrect Parameters: Missing ID");
      }

      if (req.session && req.session.authenticated) {
        if (req.session.user.admin) {
          accept();
        } else if (req.session.user.id === req.params.id) {
          accept();
        } else {
          reject("You don't have access to this content");
        }
      } else {
        reject("You must be logged in to do that.");
      }
    }
  };
```

`fig.p-1` An example of a flexible approach:
```js
module.exports = {
  onFailure (req, res, custom = false) {
    if (custom && typeof custom === 'function') {
      custom();
    } else {
      res.status(403).end()
    }
  },

  authenticated (req, res, accept, reject) {
    if (req.session.authenticated) {
      accept();
    } else {
      reject(() => res.status(403).json({error: 'You must be logged in to do that'}));
    }
  },

  never (req, res, accept, reject) {
    reject();
  }
}
```

<br>

Moving right along to routing. A route file is an object and the keys consist of HTTP verbs. (Any valid HTTP verb can be used) Each verb is an array route entries. This is how the router knows what controller action to route the request to, what policy to check, and if there is a specific body parser to use or the default. Each controller in your app will have it's own route file. You can think of it as resource based routing. Given a resource called `user` you should have the following files.

- controllers/user.js
- models/user.js
- routes/user.js

If you plan to render views, you should also have `views/user/some-view.pug`

**A route entry**
* path : matching url
* action : the controller method to call when this route is matched
* policy : the policy method to call in order to determine if the action is allowed. * see policies.js
* bodyParser: A body parser configuration *(See Below)*

**A resource**
- model
- route
- controller
- view folder


## Routing

In the routes folder file you will find your routes. The routes object is organized by request method.

```
  module.exports = {
    GET: [{
        path: '/users',         // <--- what url does this entry match?
        action: 'GET',          // <--- what controller method should handle this request?
        policy: 'authenticated' // <--- what policy applies to this route?
    },{
        path: '/users/:id',
        action: 'findOne',
        policy: 'resourceOwnerOrAdmin' // <--- Not built in, but in the policies example above.
    }],

    POST: [{
        path: '/users',
        action: 'POST',
        policy: 'authenticated'
    }],

    PUT: [{
        path: '/users/:id',
        action: 'PUT',
        policy: 'authenticated'
    }],

    DELETE: [{
        path: '/users/:id',
        action: 'DELETE',
        policy: 'authenticated'
    }]
  }
```

If you need to override the default body parser or the max body limit you can do this per endpoint.

```
bodyParser : {
  limit : '10kb',
  parser : 'json'
}
```

<br><br>

# The Controller

Each request creates a new instance of your controller. Your controller should always extend the **GladController**.

Methods / Objects available using `this` from within an action.

| method / object | Short Description |
| :-------------- |:------------------|
| cache  | Caching class |
| actionCache | Action caching store |
| cacheStore | Current request's cache store |
| req | Express request object |
| res | Express response object |
| params | Alias for `this.req.params` |
| body | Alias for `this.req.body` |
| query | Alias for `this.req.query` |
| redisClient | Redis Connection |
| permit | A method that removes non-whitelisted objects. Nested Objects are not allowed without using dot notation to specify the nested keys. |
| deepPermit | A method that removes non-whitelisted objects. Nested Objects are allowed. |
| permitted | Boolean, has this action called permit. This may be useful to enforce permitting. |
| render | Renders a view. |

## Methods / Objects in detail

### cache

Actions can be cached in two ways. Using the callback method or the chainable method.

**The callback method**

When using the callback method you tell the controller that you want to cache the result of this method for next time.
You will provide some configuration regarding what type of strategy you'd like to use, as well as the max number of items that this particular
method is allowed to store in cache. This allows you to better understand how much data you'll be putting into your caches, and allows you to
favor certain methods over other (maybe less important) methods. The available named strategies are `"LRU"` and `"LFU"` for controller actions.
If you would prefer to implement your own strategy, you can specify that by providing a additional parameters called score and increment. For LRU cache the scoring function is simply `() => new Date().getTime()` with `increment : false`. For LFU it is `() => 1` with `increment : true`.

Now to the callback. Below you can see that we are sending in a callback that contains our code to generate the data we need to send back to the client.
It will receive a caching function that you should call once your final data is generated.
The first time this request happens, it runs your code to generate the response. The next time, it will not run the callback. Instead it will get the data from redis.

```javascript
  GET () {
    this.cache({ max: 200, strategy: 'LFU' }, cache => {
      SomeModel.find()
        .limit(15)
        .then(users => this.res.json(users) && cache(users))
        .catch(err => this.error(err))
    });
  }
```

It is worth noting that a cache hit is defined by the url including any query parameters. So '/api/widgets?foo=1&bar=2' !== `/api/widgets?foo=1`.

##### The chain-able method.

Just like the callback method, the code that runs to generate the data you need to send back to the client only gets executed on a cache:miss. In this case, it's a callback sent into the miss method. You also have an optional hit method that receives the cached data so that you can determine how you'd like to respond. (This could be useful when you'll be rendering a view with the data)

```javascript
this.cache({ max: 100, strategy: 'LRU' })
  .miss(cache => {
    Products.find({category: 'widgets'}).exec( (err, widgets) => {
      this.res.status(200).json(widgets);
      cache(widgets);
    });
  })
  .hit(data => this.res.status(200).json(data))
  .exec();
```


##### How To?

What if i'm not using json? `this.cache({ max: 2, strategy: 'LFU', type: 'html' })` you can pass in an additional parameter called type. This can be any type that express understands.

<br/>

### actionCache

The **actionCache** method retrieves the cache store used for a specific method on your controller. Since controller methods have their own separate namespaced cache, you will need to look up an action's cache namespace if you want to operate on it from a different action. This is especially useful if you need to drop/re-warm a cache when data changes. As an example, let's say that you have a controller setup for widgets, and when you HTTP PUT a widget, you want to remove that item from the cache. Let's also assume that `FindOne` handles the GET requests for a specific widget, and the GET method handles GET requests for an array of widgets.

From the PUT action on the controller

```js
this.actionCache('FindOne').del('/widgets/12').then(..do stuff);
this.actionCache('GET').del('/widgets').then(..do stuff);
```

### cacheStore

The **cacheStore** object is an instance of **ControllerCache** delegated to the current controller instance.
This means that `this.cacheStore` only operates on the current action's cache namespace.

API:  All methods return a **Promise**.

| method | Description |
| --- | ---|
| `set(key, value, maxAge)` | set value for the given key, marking it as the most recently accessed one. Keys should be strings, values will be - - - JSON.stringified. The optional maxAge overrides for this specific key the global expiration of the cache. |
|`get(key)` | resolve to the value stored in the cache for the given key or null if not present. If present, the key will be marked as the most recently accessed one.|
| `getOrSet(key, fn, maxAge)` | resolve to the value stored in the cache for the given key. If not present, execute fn, save the result in the cache and return it. fn should be a no args function that returns a value or a promise. If maxAge is passed, it will be used only if the key is not already in the cache.|
| `peek(key)` | resolve to the value stored in the cache for the given key, without changing its last accessed time.|
| `del(key)` | removes the item from the cache. |
| `reset()` | empties the cache. |
| `has(key)` | resolves to true if the given key is present in the cache. |
| `keys()` | resolves to an array of keys in the cache, sorted from most to least recently accessed. |
| `values()` | resolves to an array of values in the cache, sorted from most to least recently accessed. |
| `count()` | resolves to the number of items currently in the cache. |


### req / res / params / query / body

See [Express Request](https://expressjs.com/en/api.html#req)
<br/>
See [Express Response](https://expressjs.com/en/api.html#res)
<br/>
See [req.params](https://expressjs.com/en/api.html#req.params)
<br/>
See [req.query](https://expressjs.com/en/api.html#req.query)
<br/>
See [req.body](https://expressjs.com/en/api.html#req.body)

### redisClient

Initialzed redis client. See [redis package on NPM](https://www.npmjs.com/package/redis)

### permit / deepPermit / permitted

Whitelist allowable data in a request body. This is a good idea if you are mass assigning things.

Ex: Shallow

```js
this.req.body = { name: 'Fooze', admin: true };
this.permit('name', 'email', 'phone');
// this.req.body === { name: 'Fooze' }
```

Ex: Deep
```js
this.req.body = { user: { name: 'Fooze', admin: true } };
this.permit('user.name', 'user.email', 'user.phone');
// this.req.body === { user: { name: 'Fooze' } }
```

- You must be specific when the key contains an object.
- You cannot permit the whole user object at once. In order to permit "sub documents" you need to use the **deepPermit** method instead. This is intentional because it can defeat the purpose of **permit** when you permit a subdocument that could potentially contain things that shouldn't be allowed.

After calling permit, `this.permitted` will be true.


### render

The render method is an enhanced version of Express' **res.render**. Calling `this.render` from a controller automatically looks in the correct folder for the view file. As an example, let's say you have a controller for a resource called widgets. This means that there should be a folder in the views directory called widgets. Invoking `this.render('my-widget', {data: 'stuff'})` will render the view located at `views/widgets/my-widget.pug`.


<br><br>

## Web Sockets / Real Time API
<img src="https://socket.io/assets/img/logo.svg" height="35px">

Glad comes with full support for websockets and an intuitive convention in dealing with it.

**Features**
- Session integration
- Routing
- Policies

There should be a directory in your project root called websockets. The websockets directory consists of a few files.
- router.js
- policies.js

The router works very much like the Glad HTTP router. Each entry must specify an event and an action. The policy is optional.
The action is a function that will be invoked when a connection sends a message to the given event. Furthermore the value of `this`
in the action will be the instance of SocketIo.

```javascript
module.exports = [{
  event: 'hello',
  action (message, connection) {
    connection.emit('hello', message);
  },
  policy : 'canSayHello'
},{
  event: 'subscribeToRomm',
  action (room, connection) {
    socket.join(room);
  },
  policy: 'loggedIn'
}];
```
For illustrative purposes, the action method is defined in the example above. However, you may find that it's good to create another file(s) in the sockets directory that will define your handlers, like below.

```javascript

let chats = require('./chats');

module.exports = [{
  event: 'hello',
  action: chats.hello,
  policy : 'canSayHello'
},{
  event: 'subscribeToRomm',
  action: chats.joinRoom,
  policy: 'loggedIn'
}];
```


Policies are also similar to the HTTP policies. They receive two arguments: the connection that sent the message and an accept method.
If you choose not to call the accept method, then it is rejected by default.

```javascript
module.exports = {
  canSayHello (connection, accept) {
    if (connection.request.session.loggedIn) { // By default glad handles syncing up the session to the socket connection.
      accept();
    }
  }
};
```
