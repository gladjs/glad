export default {
  "port": 4242,
  "host": "0.0.0.0",
  "logHTTP": true,
  "defaultBodyParser": "json",
  "defaultBodyParserOptions": {
    "limit": "0.3mb",
    "type": "json"
  },
  "exposeModelsGlobally": true,
  "redis_env": {
    "host": "localhost",
    "port": 6379
  },
  "cookie_env": {
    "name": "glad.sid",
    "secret": "change-this-tosomethingthatlooksuglyandmakeitprettylongandrandomtoo",
    "options": {
      "maxAge": 86400000
    }
  },
  "session": {
    "storage": "redis"
  },
  "mongodb": {
    "host": "MONGODB_HOST",
    "port": "MONGODB_PORT",
    "database": "MONGODB_DATABASE"
  },
  "defaultViewEngine" : "pug",
  "orm": "mongoose"
}
