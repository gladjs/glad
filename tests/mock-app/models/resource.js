/**
 * The User Model
 *
 * @module models/user
 * @version 0.0.1
 */

let mongoose = require('mongoose');
let { Schema } = mongoose;

let resource = new Schema({
  name  : String,
  email : String,
  phone : String
});

mongoose.model('resource', resource);
module.exports = mongoose.model('resource');
