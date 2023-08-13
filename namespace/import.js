import GladString from "./string.js";
import { join, extname } from "path";
let { decamelizeToArray } = new GladString();
let base = process.cwd();

function fileWithExtension(file, ext) {
  const existingExtension = extname(file);

  if (ext) {
    return `${file}.${ext}`;
  }

  return existingExtension ? file : `${file}.js`;
}

function fetch(file, ext) {
  if (/\//.test(file)) {
    file = fileWithExtension(file, ext);
    return join(base, file);
  }

  let filePath = decamelizeToArray(file).reverse();
  // Allow UserModel or UserRoute or UserController
  if (filePath[0] === "model") {
    filePath[0] = "models";
  } else if (filePath[0] === "controller") {
    filePath[0] = "controllers";
  } else if (filePath[0] === "route") {
    filePath[0] = "routes";
  }

  if (ext) {
    filePath = `${filePath.join("/")}.${ext}`;
  } else {
    filePath = `${filePath.join("/")}.js`;
  }

  return join(base, filePath);
}

function retrieve(files, defaultExtension) {
  return files.map(file => fetch(file, defaultExtension))
}

/**
 * Glad.import
 * returns a path that canonicalizes to the project root.
 * Examples with  `const { imports } = Glad;
 * EX: From a controller: imports('models/user')        === '../models/user.js'
 * EX: From a controller: imports('UserModel')          === '../models/user.js'
 * EX: From a controller: imports('UserQueries')        === '../queries/user.js'
 * EX: From a controller: imports('UserMapQueries')     === '../queries/map/user.js'
 * EX: From a controller: imports('UserPolygonQueries') === '../queries/polygon/user.js'
 *
 * EX: multiple files: imports(['models/user', 'models/user-preferences'])
 * EX: multiple files with a default extension: imports(['UserModel', 'User-PreferencesModel'], 'cjs')
 * EX: mixing extensions on multiple files with a default extension: imports(['models/user.js', 'models/user-preferences', 'models/user-admin'], 'cjs')
 * EX: single file with a different extension: imports('UserModel', 'cjs')
 * EX: single file with a different extension: imports('models/user-model.cjs')
 *
 * @param {string|array} fileOrFiles The file or files to import
 * @param {string} ext The default extension is "js", but you can specify something different here.
 * @returns {string} The full path to the module to be imported
 */
export default function importer(fileOrFiles, defaultExtension) {
  if (typeof fileOrFiles === typeof Array) {
    return retrieve(fileOrFiles, defaultExtension);
  } else {
    return fetch(fileOrFiles, defaultExtension);
  }
}
