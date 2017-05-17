module.exports = function (server, app, express) {
  return new Promise (function (resolve, reject) {
    let mongoose = require('mongoose');
    let config = require('./config');
    mongoose.Promise = Promise;
    mongoose.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database);
    resolve();
  });
};
