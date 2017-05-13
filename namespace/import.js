let GladString = require('../namespace/string');
let path = require('path');
let { decamelizeToArray } = new GladString();
let base = process.cwd();
/**
 * Glad.import
 * requires a module using a path that canonicalizes to the project root.
 * Examples with  `const { imports, grab } = Glad;
 * EX: From a controller: imports('models/user')     === require('../models/user')
 * EX: From a controller: grab('UserModel')          === require('../models/user')
 * EX: From a controller: grab('UserQueries')        === require('../queries/user')
 * EX: From a controller: grab('UserMapQueries')     === require('../queries/map/user')
 * EX: From a controller: grab('UserPolygonQueries') === require('../queries/polygon/user')
 */

function fetch (file) {

  if (/\//.test(file)) {
    return require(path.join(base, file));
  }

  let filePath = decamelizeToArray(file).reverse();
  // Allow UserModel or UserRoute or UserController
  if (filePath[0] === 'model') {
    filePath[0] = 'models';
  } else if (filePath[0] === 'controller') {
    filePath[0] = 'controllers'
  } else if (filePath[0] === 'route') {
    filePath[0] = 'routes'
  }
  return require(path.join(base, filePath.join('/')));
}

function retrieve (files) {
  return files.map(file => fetch(file));
}

module.exports = function importer (...args) {
  if (args.length > 1) {
    return retrieve(args);
  } else {
    return fetch(args[0]);
  }
}
