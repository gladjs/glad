module.exports = {
  "port": 4242,
  "host": "0.0.0.0",
  "logHTTP": true,
  "defaultBodyParser": "json",
  "defaultBodyParserOptions": {
    "limit": "0.3mb",
    "type": "json"
  },
  "exposeModelsGlobally": true,
  "redis": {
    "host": "localhost",
    "port": 6379
  },
  "cookie": {
    "name": "glad.sid",
    "secret": "change-this-tosomethingthatlooksuglyandmakeitprettylongandrandomtoo",
    "maxAge": 86400000
  },
  "session": {
    "storage": "redis"
  },
  "mongodb": {
    "url": 'mongodb://localhost:27017/testdb123456789',
    "host": "localhost",
    "port": 27017,
    "database": "testdb123456789"
  },
  "defaultViewEngine" : "pug",
  "orm": "mongoose"
}
