# Glad JS

[![NPM](https://nodei.co/npm/glad.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/glad/)

[![Code Climate](https://codeclimate.com/github/gladjs/glad/badges/gpa.svg)](https://codeclimate.com/github/gladjs/glad)
[![Build Status](https://travis-ci.org/gladjs/glad.svg?branch=master)](https://travis-ci.org/gladjs/glad)
[![Coverage Status](https://coveralls.io/repos/github/gladjs/glad/badge.svg?branch=master)](https://coveralls.io/github/gladjs/glad?branch=master)

* [Glad JS Website](http://gladjs.com/)

<br>

## Required

* [Node.js >= 6.5](http://nodejs.org/) (with NPM)
* [Redis](http://redis.io/)

<br>

## Important This version of Glad JS no longer supports node < 6.5.

If you prefer Node < 6.5, you can use Glad < 1.0.0, or consider using express.

<br>

## Installation

The recommended way to install glad is using glad cli. However, it is not necessary. Previous versions of glad included the CLI. In versions newer than 1.0.0, the cli has been abstracted out to a separate package.

#### Installing Glad CLI

`npm install -g glad-cli`

#### Creating your new project using Glad CLI.

- Create a new folder for your project
- `cd /path/to/new-folder`
- `glad init`

#### Creating a project without glad-cli

- Create a new folder for your project
- `cd /path/to/new-folder`
- `npm install glad --save`

<br><br>

## What is Glad?
Glad is a Node JS (MC / MVC) framework that aims to make common things that apps need available in an easy and intuitive manner.
This includes lru/lfu caching, general caching, REST endpoints, websockets, utility methods such as tokenization, number conversions, object tools, array tools, and other various utilities. Out of the box, You get a Model Controller framework which is great for building REST APIs for either client rendered apps such as Ember, Angular etc... or just plain API development.

If you are familiar with Node JS, then getting started with Glad is absolutely painless. If you are new to Node JS, then you should move along quite nicely and Glad will kick start your project in superhero fashion. In fact, you can get a rest API up and running in a matter of minutes after initializing your project.

<br><br>

## Running / Development

<b>Before you start this guide, make sure that you have redis installed and running.</b>

<b>The quick start guide uses the default setup which is mongodb and mongoose, If you follow along with the quick start, ensure that you have mongodb installed and running</b>

#### Quick Start (Uses mongoose/mongodb by default)

Step 1: Create a directory for your app `mkdir <your-app> && cd <your-app>`
<br>
Step 2: Initialize Glad w/ default settings `glad init`
<br>
Step 3: Create your first endpoint `glad api widgets`
<br>
Step 4: Start the server `glad s`

#### Using Waterline as an ORM and Postgres as your database

Step 1: Create a directory for your app `mkdir <your-app> && cd <your-app>`
<br>
Step 2: Initialize Glad w/ waterline/postgresql `glad init --orm=waterline --adapter=sails-postgresql`
<br>
Step 3: Create your first endpoint `glad api widgets`
<br>
Step 4: Start the server `glad s`

#### Using Waterline as an ODM and MongoDB as your database

Step 1: Create a directory for your app `mkdir <your-app> && cd <your-app>`
<br>
Step 2: Initialize Glad w/ waterline/mongo `glad init --orm=waterline --adapter=sails-mongo`
<br>
Step 3: Create your first endpoint `glad api widgets`
<br>
Step 4: Start the server `glad s`

#### Using Waterline with other databases
Replace `--adapter=any-adapter` with any database adapter for waterline

#### Opting out of an ODM/ORM
You may have your own database driver or decide that you would rather opt out of using an ODM/ORM.
In this case you'll want to initialize glad with --orm=false. This will setup glad without an ORM/ODM.

<br>

## The Config File
```js
{

  port : 4242, // <-- The port that the http server will listen to

  host : '0.0.0.0', // <-- The host that the http server will listen on

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
  }

}
```

<br><br>

## Policies
Policies are rules that you can define that determine if a request can have access to a controller action.

```
  module.exports = {

    /*
     The onFailure method is a default that you can set for denying requests.
     This method receives the req & res objects, as well as an optional rejection reason that you pass to the reject method.
    */
    onFailure : function (req, res, rejectMessage) {
      res.status(403).json({error: rejectMessage});
    },

    // This method is intentionally overly verbose with the nested if/else statements. Hopefully this makes it clear what is happening.
    authenticated : function (req, res, accept, reject) {
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
    isDeveloper : function (req, res, accept, reject) {
      if (req.session && req.session.developer) {
        accept();
      } else {
        reject("You are not allowed to access this API");
      }
    },

    // Note: This policy requires you to follow the convention /api/resource/:id
    resourceOwnerOrAdmin : function (req, res, accept, reject) {

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

<br><br>

## Routing

In the routes folder file you will find your routes. The routes object is organized by request method.

```
  module.exports = {
    GET: [{
        path: '/users',         // <--- what url does this entry match?
        action: 'GET',  // <--- what controller method should handle this request?
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
As you can see, you have an array of Get, Post, Put, and Delete methods.
The combination of request method and url are used to determine the action to take and the policy to implement.

* path : matching url
* action : the controller method to call when this route is matched
* policy : the policy method to call in order to determine if the action is allowed. * see policies.js
* rateLimit : A rate limiter configuration (See Below)
* bodyParser: A body parser configuration (See Below)

You can also specify rate limiting per endpoint.

```
rateLimit : {
  max : 30,
  per : 1000 * 30,
  onLimit : {
    code : 429,
    msg  : "You can only read 30 users per hour. Please try again in an hour"
  }
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

## Web Sockets
Glad comes with full support for websockets and an intuitive convention in dealing with it.
There should be a directory in your project root called websockets. The websockets directory consists of a few files.
- router.js
- policies.js

The router works very much like the Glad HTTP router. Each entry must specify an event and an action. The policy is optional.
the action is a function that will be invoked when a connection sends a message to the given event. Furthermore the value of `this`
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


Policies are also similar to the HTTP policies. They receive two arguments, the connection that sent the message, and an accept method.
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

# The Controller

Each request creates a new instance of your controller. Your controller should always extend the GladController.

Methods available using `this` from within an action

- cache         Caching Class
- actionCache   Action Caching Store
- cacheStore    Current Cache Store
- req           Express request object
- res           Express response object
- params        Alias for `this.req.params`
- body          Alias for `this.req.body`
- query         Alias for `this.req.query`
- redisClient   Redis Connection
- permit        A method that removes non-whitelisted objects. Nested Objects are not allowed without using dot notation to specify the nested keys.
- deepPermit    A method that removes non-whitelisted objects. Nested Objects are allowed.
- permitted     Boolean, has this action called permit. This may be useful to enforce permitting.
- render        Renders a view.

### cache

Actions can be cached in two ways. Using the callback method or the chainable method.

##### The callback method

Using the callback method we tell the controller that we want to cache the result of this method for next time.
We provide some configuration regarding what type of strategy we'd like to use, as well as the max number of items that this particular
method is allowed to store in cache. This allows us to better understand how much data we'll be putting into our caches, and allows us to
favor certain methods over other (maybe less important) methods. The available named strategies are `"LRU"` and `"LFU"` for controller actions.
If you would prefer to implement your own strategy, you can specify that by providing a additional parameters called score and increment. For LRU cache the scoring function is simply `() => new Date().getTime()` with `increment : false`. For LFU it is `() => 1` with `increment : true`.

Now to the callback. Below you can see that we are sending in a callback that contains our code to generate the data we need to send back to the client.
It will receive a caching function that you should call once your final data is generated.
The first time this request happens, it runs our code to generate the response. The next time, it will not run the callback, instead it will get the data from redis.

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

##### The chainable method.

Just like the callback method, the code that runs to generate the data we need to send back to the client only gets executed on a cache:miss. In this case, it's a callback sent into the miss method. You also have an optional hit method that receives the cached data so that you can determine how you'd like to respond. (This could be useful when you'll be rendering a view with the data)

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
- What if i'm not using json? `this.cache({ max: 2, strategy: 'LFU', type: 'html' })` you can pass in an additional parameter called type. This can be any type that express undersatnds.
