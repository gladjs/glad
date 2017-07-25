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

## Models


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


## Flags

#### Only

 `--only=[controller|controllers,controllers]`
 Using the only flag, you can spin up a server that only binds routes for a specific controller or a group of controllers.
 
 As an example, `glad s --only=posts` would launch your app and allow traffic to routes handled by the posts controller.
 
 If you would like to launch a group of controllers, you would simply comma separate the controllers such as `glad s --only=posts,users`.
 
 The convention is such that you provide the lowercase filename of your controller(s) that should be enabled.
 
 If you are not using Glad CLI, this will still work with the node binary.
 
 `node index.js --only=posts`

#### Server Flags

`--port` | `--host` | `--sock` |  `--backlog`
Using the server flags you can over ride the values in your config.js file.  


## Classes / Helpers / Tools

Glad comes with lots of helpful utilities.

### String

Assume `string === Glad.string` for the examples below.

- color
  - Produces a colorized string for stdout. `string.color('Oh No', 'red')`
  - Can be any color name supported by chalk.js

- deburr
	- converts unicode

    `string.deburr('♥') === 'love'`

  - converts short symbols

    `string.deburr('<3') === 'love'`

    `string.deburr('released w/ stuff') === 'released with stuff'`

    `string.deburr('live && loud') === live and loud'`

    `string.deburr(':) || sad') === 'smile or sad'`

  - converts Latin characters

    `string.deburr('À') === 'A'` <i>See fig s1 at the bottom of the page for a list of all supported characters</i>

  - converts Greek characters

    `string.deburr('α') === 'a'` <i>See fig s2 at the bottom of the page for a list of all supported characters</i>

  - converts Turkish characters

    `string.deburr('ş') === 's'` <i>See fig s3 at the bottom of the page for a list of all supported characters</i>

  - converts Russian characters

    `string.deburr('ф') === 'f'` <i>See fig s4 at the bottom of the page for a list of all supported characters</i>  

- slugify

  Creates a normalized slug from a string

  `string.slugify('San Francisco, CA') === 'san-francisco-ca'`

  `string.slugify('The brown fox w/ βeta') === 'the-brown-fox-with-beta'`

	`string.slugify('good news so you can :)') === 'good-news-so-you-can-smile'`

  If you need to create a multi-variable slug such as `first_name + " " + last_name` etc... consider allowing slugify to do the concatenation for you. `slugify` can receive "n" arguments which become concatenated to form additional segments of the slug.

  `string.slugify('how to create stuff', 'June 17 2017') === 'how-to-create-stuff-june-17-2017'`

- camelize

  `string.camelize("fooze-barz") === 'foozeBarz'`


- titleize

	`string.titelize("fooze barz") === 'Fooze Barz'`

- slasherize

  `string.slasherize("fooze barz") === "fooze/barz"`

- reverseSlasherize

	`string.reverseSlasherize("fooze barz") === "barz/fooze"`

- underscore

	`string.underscore("fooze barz") === "fooze_barz"`


- cleanSpaces

	`string.cleanSpaces("fooze  barz") === "fooze barz"

- endsWith

	`string.endsWith("fooze  barz fooze", "fooze") === true`

  `string.endsWith("fooze  barz", "fooze") === false`


- escape

	`string.escape("fred, barney, & pebbles") === "fred, barney, &amp; pebbles"


- unescape

	`string.unescape("fred, barney, &amp; pebbles") === "fred, barney, & pebbles"`

- escapeRegExp

  escapes a string for use in regexp

  `string.escapeRegExp('[lodash](https://lodash.com/)') === "\\[lodash\\]\\(https://lodash\\.com/\\)"`


- repeat

	`string.repeat("glad", 2) === "gladglad"`


- startsWith

	`string.startsWith("fooze  barz", "fooze") === true`

  `string.startsWith("x fooze  barz", "fooze") === false`


- words

	split a string based on words

  `string.words('fred, barney, & pebbles') === ['fred', 'barney', 'pebbles']`

  split a string based on words and keep elements by regexp

  `string.words('fred, barney, & pebbles', /[^, ]+/g) === ['fred', 'barney', '&', 'pebbles']`

- sentenceCase

	Capitalizes letters at the beginning of a string, and after periods.

### Objects

Assume object refences Glad.object

- get

  Pick a value from an object
  ```
    let o = {foo: {bar : 'foobar' }};
    object.get(o, 'foo.bar') => 'foobar'
  ```

- extend

  Extend `object at argument 1` with `object at argument 2,3,4,n`. The order of extension is from left to right. Duplicate values will be taken from the right-most arguments.

  ```
    let src = {one: 1};
    let ext = {two: 2};
    assert.deepEqual(object.extend(src, ext), {one: 1, two: 2})
  ```

  ```
    let src = {one: 1};
    let ext = {two: 2};
    let ext2 = {three: 3};
    assert.deepEqual(object.extend(src, ext, ext2), {one: 1, two: 2, three: 3});
  ```

  ```
    let src = {one: 1};
    let ext = {one: 2};
    let ext2 = {three: 3};
    assert.deepEqual(object.extend(src, ext, ext2), {one: 2, three: 3});
  ```

  ```
    let src = {one: 1};
    let ext = {two: 2};
    let ext2 = {two: 3};
    let ext3 = {two: 4};
    assert.deepEqual(object.extend(src, ext, ext2, ext3), {one: 1, two: 4});
  ```

- hasPath

  return a boolean value if an object contains a path

  ```
    let src = {one: 1};
    assert.equal(object.hasPath(src, 'one'), true);
    assert.equal(object.hasPath(src, 'one.value.at.nowhere'), false);
  ```

- clone

  return a new object

  ```
    let src = {one: 1, two: {a: 1}};
    assert.deepEqual(object.clone(src), {one: 1, two: {a: 1}});
  ```

  new object should not be passed by reference

  ```
    let src = {one: 1, two: {a: 1} };
    let src2 = object.clone(src);
    src2.two.a = 3;
    assert.equal(src.two.a, 1);
    assert.equal(src2.two.a, 3);
  ```

- set

  set a value at the given path (null/undefined safe)

  ```
    let src = {};
    object.set(src, 'foo', 1);
    assert.equal(src.foo, 1);
  ```

  ```
    let src = {};
    object.set(src, 'foo.bar.baz.x', 1);
    assert.equal(src.foo.bar.baz.x, 1);
  ```

- arrayToObject

	convert an array of arrays to an object

  ```
    let arr  = [['a', 1], ['b', 2]];
    let o = object.arrayToObject(arr);
    assert.equal(o.a, 1);
    assert.equal(o.b, 2);
  ```

- invert

	invert an object    

  ```
    let o = {a: 'A', b: 'B'};
    object.invert(o);
    assert.deepEqual(o, {A: 'a', B: 'b'});
    assert.equal(o.a, undefined);
  ```

- select

	select keys from an object (creates a new object)

  ```
    let o = {name: 'fred', email: 'me@mail.com', password: 'secretSquirrel'};
    let fields = object.select(o, 'name', 'email');
    assert.deepEqual(fields, {name: 'fred', email: 'me@mail.com'});
  ```

  select keys from an object via Array

  ```
    let o = {name: 'fred', email: 'me@mail.com', password: 'secretSquirrel'};
    let fields = object.select(o, ['name', 'email']);
    assert.deepEqual(fields, {name: 'fred', email: 'me@mail.com'});
  ```

- drop  

	drop keys from an object

  ```  
    let o = { name: 'fred', email: 'me@mail.com', password: 'secretSquirrel' };
    object.drop(o, 'password');
    assert.deepEqual(o, {name: 'fred', email: 'me@mail.com'});
  ```

  drop keys from an object via Array

  ```
    let o = { name: 'fred', email: 'me@mail.com', password: 'secretSquirrel'  
    object.drop(o, ['password']);
    assert.deepEqual(o, {name: 'fred', email: 'me@mail.com'});
  });
  ```

- selectCombination

 	select values from multiple objects and create a new one

	```
    let a = {
      name: 'fred',
      email: 'me@mail.com',
      password: 'secretSquirrel'
    };
    let b = { sid: '8372487234', last_visit: new Date()};
    let c = { likes : 'stuff', knows: 'things'};
    let o = object.selectCombination([a, b, c], 'name', 'email', 'last_visit', 'likes', 'knows');
    assert.deepEqual(o, { name: 'fred', email: 'me@mail.com', last_visit: b.last_visit, likes : 'stuff', knows: 'things'});
  });
	```

- format

	Create a new object from an existing one, but reformat the keys.
  Individual arguments such as 'email' or 'name' copy the value for the respective key to the new object maintaining the same key name. In order to map a value from the existing array to a new key on the new object, you use an array. [`destination path`, `source path`].

  ```
    let a = {
      name: 'fred',
      email: 'me@mail.com',
      data: {
        stuff: { a: 'a', b: 'b'},
        more : { c: 'value'}
      }
    };

    let o = object.format(a, 'name', 'email', ['stuff', 'data.stuff.a' ], ['value', 'data.more.c']);

    assert.deepEqual(o, {
      name: 'fred',
      email: 'me@mail.com',
      stuff: 'a',
      value : 'value'
    });

  });
  ```

  Format the keys using an array

  ```
    let a = {
      name: 'fred',
      email: 'me@mail.com',
      data: {
        stuff: { a: 'a', b: 'b'},
        more : { c: 'value'}
      }
    };

    let o = object.format(a, [
      'name',
      'email',
      ['stuff', 'data.stuff.a' ],
      ['value', 'data.more.c']
    ]);

    assert.deepEqual(o, {
      name: 'fred',
      email: 'me@mail.com',
      stuff: 'a',
      value : 'value'
    });

  });
  ```

- explode

 	Explode an object

  ```

    let row = {
      'id': 2,
      'contact.name.first': 'John',
      'contact.name.last': 'Doe',
      'contact.email': 'example@gmail.com',
      'contact.info.about.me': 'classified',
      'devices.0': 'mobile',
      'devices.1': 'laptop',
      'some.other.things.0': 'this',
      'some.other.things.1': 'that',
      'some.other.stuff.0.key': 'stuff'
    };

    object.explode(row);

    assert.deepEqual(row, {
      "id": 2,
      "contact": {
        "name": {
          "first": "John",
          "last": "Doe"
        },
        "email": "example@gmail.com",
        "info": {
          "about": {
            "me": "classified"
          }
        }
      },
      "devices": [
        "mobile",
        "laptop"
      ],
      "some": {
        "other": {
          "things": [
            "this",
            "that"
          ],
          stuff : [{
            key : "stuff"
          }]
        }
      }
    });
  });
  ```

### Number

Assume number is Glad.number

- Time Constants
	```
    assert.equal(number.SECOND, 1000);
    assert.equal(number.MINUTE, 1000 * 60);
    assert.equal(number.HOUR, 1000 * 60 * 60);
    assert.equal(number.DAY, 1000 * 60 * 60 * 24);
	```

- parse

  Strip off weird stuff

  ```
    assert.equal(number.parse("$34.72"), 34.72);
    assert.equal(number.parse("65.323%"), 65.323);
    assert.equal(number.parse("65%"), 65);

    // RESPECTS NEGATIVE NUMBERS
    assert.equal(number.parse("-65%"), -65);
    assert.equal(number.parse("-$65.34"), -65.34);
    assert.equal(number.parse("-78.32-"), -78.32);
	```


- random

  generate a random number between x,y

    ```
    let rand = number.random(5,10);
    assert.equal(rand <= 10, true);
    assert.equal(rand >= 5, true);
		```

- withDelimiter

	Simply format a number with commas and decimals

  ```
   assert.equal(number.withDelimiter(4), '4.00');
   assert.equal(number.withDelimiter(45), '45.00');
   assert.equal(number.withDelimiter(450), '450.00');
   assert.equal(number.withDelimiter(4500), '4,500.00');
   assert.equal(number.withDelimiter(45000), '45,000.00');
   assert.equal(number.withDelimiter(450000), '450,000.00');
   assert.equal(number.withDelimiter(4500000), '4,500,000.00');
   assert.equal(number.withDelimiter(45000000), '45,000,000.00');
   assert.equal(number.withDelimiter(450000000), '450,000,000.00');
   assert.equal(number.withDelimiter(4500000000), '4,500,000,000.00');
   assert.equal(number.withDelimiter(45000000000), '45,000,000,000.00');
   assert.equal(number.withDelimiter(450000000000), '450,000,000,000.00');
   assert.equal(number.withDelimiter(4500000000000), '4,500,000,000,000.00');
   assert.equal(number.withDelimiter(45000000000000), '45,000,000,000,000.00');
   assert.equal(number.withDelimiter(450000000000000), '450,000,000,000,000.00');
   assert.equal(number.withDelimiter(99e19),            '990,000,000,000,000,000,000.00');
	```

- toAbbr

	Abbreviate a number

  ```
   assert.equal(number.toAbbr(45000), '45k');
   assert.equal(number.toAbbr(450000), '450k');
   assert.equal(number.toAbbr(4500000), '4.5m');
   assert.equal(number.toAbbr(45000000), '45m');
   assert.equal(number.toAbbr(450000000), '450m');
   assert.equal(number.toAbbr(4500000000), '4.5b');
   assert.equal(number.toAbbr(45000000000), '45b');
   assert.equal(number.toAbbr(450000000000), '450b');
   assert.equal(number.toAbbr(450), '450');
   assert.equal(number.toAbbr(4500), '4.5k');
	```

- `toData(bytes)`

 	format a number in data units

  ```
   assert.equal(number.toData(126.02 * 1000), '126.0 kB');
   assert.equal(number.toData(126.32 * 1000), '126.3 kB');
   assert.equal(number.toData(126.32 * 1000 * 1000), '126.3 MB');
   assert.equal(number.toData(126.32 * Math.pow(1000, 3)), '126.3 GB');
   assert.equal(number.toData(126.32 * Math.pow(1000, 4)), '126.3 TB');
   assert.equal(number.toData(126.32 * Math.pow(1000, 5)), '126.3 PB');
   assert.equal(number.toData(126.32 * Math.pow(1000, 6)), '126.3 EB');
   assert.equal(number.toData(126.32 * Math.pow(1000, 7)), '126.3 ZB');
   assert.equal(number.toData(126.32 * Math.pow(1000, 8)), '126.3 YB');
  ```

- `toTime(seconds, returnArray = false)`

	format a number in time

  ```
   const HOUR = 60 * 60;
   const DAY = 24 * HOUR;

   assert.equal(number.toTime(50), '50 sec');
   assert.equal(number.toTime(60), '1 min');
   assert.equal(number.toTime(HOUR), '1 hr');
   assert.equal(number.toTime(DAY), '1 day');
   assert.equal(number.toTime(DAY * 30), '30 days');
   assert.equal(number.toTime( (DAY * 2) + 10), '2 days 10 sec');
   assert.equal(number.toTime( (DAY * 2) + (HOUR * 2) + 32), '2 days 2 hr 32 sec');
  ```

  format a number in time and return an array

  ```
   assert.deepEqual(number.toTime(50, true), [0, 0, 0, 50]);
   assert.deepEqual(number.toTime(60, true), [0, 0, 1, 0]);
   assert.deepEqual(number.toTime(HOUR, true), [0, 1, 0, 0]);
   assert.deepEqual(number.toTime(DAY, true), [1, 0, 0, 0]);
   assert.deepEqual(number.toTime(DAY * 30, true), [30, 0, 0, 0]);
   assert.deepEqual(number.toTime( (DAY * 2) + 10, true), [2, 0, 0, 10]);
   assert.deepEqual(number.toTime( (DAY * 2) + (HOUR * 2) + 32, true), [2, 2, 0, 32]);
  ```

- `toCurrency(number, precision, decimal, comma)`

	format a number in USD currency (convienience method)

  ```
  assert.equal(number.toCurrency(240.658), '$240.66');
  assert.equal(number.toCurrency(-376240.658), '$-376,240.66');
  ```

  If you need to format a number in other currencies, use the NumberFormatter Class.

  ```
  let toGBP = new Glad.number.NumberFormatter("£", false, 2, ',', '.');
  assert.equal(toGBP(1234567.89), '£1.234.567,89');
  ```

- `toPercent(number, comma = ",", decimal = ".")`

	format a number as a percentage

  ```
   assert.equal(number.toPercent(43.47576353), '43.48%');
   assert.equal(number.toPercent(43.47576353, 4), '43.4758%');
   assert.equal(number.toPercent(43873.47581765327, 4, '*', '\''), "43'873*4758%");
   assert.equal(number.toPercent(-43.47576353), '-43.48%');
   assert.equal(number.toPercent(-43.47576353, 4), '-43.4758%');
  ```


- `toPhone(number = "", formatAreaCode = false, extension = false)`

	format a number as a phone number
  ```
   assert.equal(number.toPhone(9255551212), "925-555-1212");
   assert.equal(number.toPhone('9255551212'), "925-555-1212");
   assert.equal(number.toPhone(9255551212, true), "(925) 555-1212");
   assert.equal(number.toPhone(9255551212, true, 4528), "(925) 555-1212 x4528");
  ```

### imports
Imports is a require alias with some nifty features specifically for Glad. When using the imports method, paths are imported relative to your working directory.

Examples: (Assume imports is Glad.imports)

Both controllers and models can be imported without pluralization

`imports('UserModel')` => `require('./models/user')`

Importing the widget model from within the directory `queries/widgets/find-by-name`

`imports('UserModel')` => `require('../../models/user')`

Importing using reverse camelize

`imports('UserQueryMocksTest')` => `require('./test/mocks/query/user')`

Importing normally from within a sub-directory

`imports('classes/fooze')` => `require('../../classes/fooze')`

### Dates

Glad's Date class allows you to create different instances to use for different timezone offsets. To use Glad's Date class you'll need to install moment. `npm install moment --save`

For each example below assume these variables are created.

```
let moment  = require('moment');
let utcDate = new Glad.Date(moment);
let pstDate = new Glad.Date(moment, -8);
```
When creating an inistance of Glad.Date, the first argument is moment, and the 2nd is the offset to use. All methods return a Javascript Date Object.

Also assume that the current Date is January 1st 1970 12:00am

- monthsFromNow
	```
    utcDate.monthsFromNow(1)  => 1970-02-01T00:00:00.000Z
    utcDate.monthsFromNow(12) => 1971-01-01T00:00:00.000Z
    utcDate.monthsFromNow(24) => 1972-01-01T00:00:00.000Z
	```


- weeksFromNow

  ```
    utcDate.weeksFromNow(1) => 1970-01-08T00:00:00.000Z
 	```

- daysFromNow

	```
  utcDate.daysFromNow(1) => 1970-01-02T00:00:00.000Z
  utcDate.daysFromNow(10) => 1970-01-11T00:00:00.000Z
  ```


- hoursFromNow

    ```
    utcDate.hoursFromNow(1) => 1970-01-01T01:00:00.000Z')
    ```

- minutesFromNow

	```
  utcDate.minutesFromNow(1) => 1970-01-01T00:01:00.000Z
  utcDate.minutesFromNow(14) => 1970-01-01T00:14:00.000Z
  ```

- secondsFromNow

	```
  utcDate.secondsFromNow(1)  => 1970-01-01T00:00:01.000Z
  utcDate.secondsFromNow(10) => 1970-01-01T00:00:10.000Z
  utcDate.secondsFromNow(61) => 1970-01-01T00:01:01.000Z
  ```

- startOfSecond

  Supply a Date Object and this will return a new date object with milliseconds zeroed out.


- startOfMinute

	Supply a Date Object and this will return a new date object with milliseconds and seconds zeroed out.

- startOfHour

	Supply a Date Object and this will return a new date object with milliseconds, seconds and minutes zeroed out.

- startOfDay

	Supply a Date Object and this will return a new date object with milliseconds, seconds, minutes, and hours zeroed out.



- startOfWeek

  Supply a Date Object and this will return a new date object set to the beginning of the week that the supplied date landed in.
	```
    let testDate = utcDate.daysFromNow(22);
    let startOfWeek = utcDate.startOfWeek(testDate);
    startOfWeek.toISOString() => 1970-01-18T00:00:00.000Z
  ```

- startOfMonth

  Supply a Date Object and this will return a new date object set to the beginning of the month that the supplied date landed in.
	```
    let testDate = utcDate.daysFromNow(22);
    utcDate.startOfMonth(testDate) => 1970-01-01T00:00:00.000Z
  ```

- startOfQuarter

  Supply a Date Object and this will return a new date object set to the beginning of the quarter that the supplied date landed in.

	```
    let testDate = utcDate.daysFromNow(2);
    utcDate.startOfQuarter(testDate) => 1970-01-01T00:00:00.000Z
	```

  ```
    let testDate = utcDate.daysFromNow(100);
    utcDate.startOfQuarter(testDate) => 1970-04-01T00:00:00.000Z
  ```

  ```
    let testDate = utcDate.daysFromNow(270);
    utcDate.startOfQuarter(testDate) => 1970-07-01T00:00:00.000Z
  ```

  ```
    let testDate = utcDate.daysFromNow(300);
    utcDate.startOfQuarter(testDate) => 1970-10-01T00:00:00.000Z
  ```

- startOfYear

  Supply a Date Object and this will return a new date object set to the beginning of the year that the supplied date landed in.

	```
    let testDate = utcDate.daysFromNow(300);
    utcDate.startOfYear(testDate) => 1970-01-01T00:00:00.000Z
	```

  ```
    let testDate = utcDate.daysFromNow(366);
    utcDate.startOfYear(testDate) => 1971-01-01T00:00:00.000Z
  ```

### Tokenization

The examples below assume the following constants are declared.

```
const { generate, create, timeCoded, timeDecoded } = Glad.token;
```

** Uniqueness **

The probability is extremely low that duplicate tokens will be created if you are generating long enough tokens. However, it can happen.

Uniqueness is not built in. It's up to you to ensure uniqueness. If uniqueness is crucial to your use case, please use something more robust or add to the token using unique things such as a database record id.

** Radix **

The default Radix is url safe so your tokens can safely be used in URLs.
`ABCDEFGHIJKLMNOPQRSTUVWXYZ-0987654321_abcdefghijklmnopqrstuvwxyz`

You can use your own radix or view the ones available under `Glad.token.radixes`.

** create a 6 character token **

`generate(6);`

** create a 12 character token **

`generate(12);`


** create a new tokenizer from a provided radix **

```
let myTokenizer = create('0123456789');
myTokenizer.generate(6) => 6 characters, only digits
```

** create a TimeEncoded Token **

	`let timeToken = timeCoded()`

** decode a TimeEncoded Token **

	`let tokenCreatedAt = timeDecoded(timeToken)`



---

** fig s1 ** - Supported Latin Chars
```
'À' => 'A'
'Á' => 'A'
'Â' => 'A'
'Ã' => 'A'
'Ä' => 'A'
'Å' => 'A'
'Æ' => 'Ae'
'Ç' => 'C'
'È' => 'E'
'É' => 'E'
'Ê' => 'E'
'Ë' => 'E'
'Ì' => 'I'
'Í' => 'I'
'Î' => 'I'
'Ï' => 'I'
'Ð' => 'D'
'Ñ' => 'N'
'Ò' => 'O'
'Ó' => 'O'
'Ô' => 'O'
'Õ' => 'O'
'Ö' => 'O'
'Ő' => 'O'
'Ø' => 'O'
'Ù' => 'U'
'Ú' => 'U'
'Û' => 'U'
'Ü' => 'U'
'Ű' => 'U'
'Ý' => 'Y'
'Þ' => 'Th'
'ß' => 'ss'
'à' => 'a'
'á' => 'a',
'â' => 'a'
'ã' => 'a'
'ä' => 'a'
'å' => 'a'
'æ' => 'ae'
'ç' => 'c'
'è' => 'e',
'é' => 'e'
'ê' => 'e'
'ë' => 'e'
'ì' => 'i'
'í' => 'i'
'î' => 'i'
'ï' => 'i'
'ð' => 'd'
'ñ' => 'n'
'ò' => 'o'
'ó' => 'o'
'ô' => 'o'
'õ' => 'o'
'ö' => 'o'
'ő' => 'o'
'ø' => 'o'
'ù' => 'u'
'ú' => 'u'
'û' => 'u'
'ü' => 'u'
'ű' => 'u'
'ý' => 'y'
'þ' => 'th'
'ÿ' => 'y'
```

fig s2 Greek character conversion
```
'α' => 'a'
'β' => 'b'
'γ' => 'g'
'δ' => 'd'
'ε' => 'e'
'ζ' => 'z'
'η' => 'h'
'θ' => '8'
'ι' => 'i'
'κ' => 'k'
'λ' => 'l'
'μ' => 'm'
'ν' => 'n'
'ξ' => '3'
'ο' => 'o'
'π' => 'p'
'ρ' => 'r'
'σ' => 's'
'τ' => 't'
'υ' => 'y'
'φ' => 'f'
'χ' => 'x'
'ψ' => 'ps'
'ω' => 'w'
'ά' => 'a'
'έ' => 'e'
'ί' => 'i'
'ό' => 'o'
'ύ' => 'y'
'ή' => 'h'
'ώ' => 'w'
'ς' => 's'
'ϊ' => 'i'
'ΰ' => 'y'
'ϋ' => 'y'
'ΐ' => 'i'
'Α' => 'A'
'Β' => 'B'
'Γ' => 'G'
'Δ' => 'D'
'Ε' => 'E'
'Ζ' => 'Z'
'Η' => 'H'
'Θ' => '8'
'Ι' => 'I'
'Κ' => 'K'
'Λ' => 'L'
'Μ' => 'M'
'Ν' => 'N'
'Ξ' => '3'
'Ο' => 'O'
'Π' => 'P'
'Ρ' => 'R'
'Σ' => 'S'
'Τ' => 'T'
'Υ' => 'Y'
'Φ' => 'F'
'Χ' => 'X'
'Ψ' => 'PS'
'Ω' => 'W'
'Ά' => 'A'
'Έ' => 'E'
'Ί' => 'I'
'Ό' => 'O'
'Ύ' => 'Y'
'Ή' => 'H'
'Ώ' => 'W'
'Ϊ' => 'I'
'Ϋ' => 'Y
```

fig s3 Turkish character conversion
```
'ş' => 's'
'Ş' => 'S'
'ı' => 'i'
'İ' => 'I'
'ğ' => 'g'
'Ğ' => 'G'
```

fig s4 Russian character conversion
```
'а' => 'a'
'б' => 'b'
'в' => 'v'
'г' => 'g'
'д' => 'd'
'е' => 'e'
'ё' => 'yo'
'ж' => 'zh'
'з' => 'z'
'и' => 'i'
'й' => 'j'
'к' => 'k'
'л' => 'l'
'м' => 'm'
'н' => 'n'
'о' => 'o'
'п' => 'p'
'р' => 'r'
'с' => 's'
'т' => 't'
'у' => 'u'
'ф' => 'f'
'х' => 'h'
'ц' => 'c',
'ч' => 'ch'
'ш' => 'sh'
'щ' => 'sh'
'ъ' => 'u'
'ы' => 'y'
'э' => 'e'
'ю' => 'yu'
'я' => 'ya'
'А' => 'A'
'Б' => 'B'
'В' => 'V'
'Г' => 'G'
'Д' => 'D'
'Е' => 'E'
'Ё' => 'Yo'
'Ж' => 'Zh'
'З' => 'Z'
'И' => 'I'
'Й' => 'J'
'К' => 'K'
'Л' => 'L'
'М' => 'M'
'Н' => 'N'
'О' => 'O'
'П' => 'P'
'Р' => 'R'
'С' => 'S'
'Т' => 'T'
'У' => 'U'
'Ф' => 'F'
'Х' => 'H'
'Ц' => 'C'
'Ч' => 'Ch'
'Ш' => 'Sh'
'Щ' => 'Sh'
'Ъ' => 'U'
'Ы' => 'Y'
'Ь' => 'Ь'
'Э' => 'E'
'Ю' => 'Yu'
'Я' => 'Ya'
```
