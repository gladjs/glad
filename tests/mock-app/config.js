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
    "host": "localhost",
    "port": 27017,
    "database": "testdb123456789"
  },
  "orm": "mongoose"
}
