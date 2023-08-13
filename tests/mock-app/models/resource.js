/**
 * The User Model
 *
 * @module models/user
 * @version 0.0.1
 */

import mongoose from "mongoose";
let { Schema } = mongoose;

let resource = new Schema({
  name  : String,
  email : String,
  phone : String
});

mongoose.model('resource', resource);
export default mongoose.model('resource');
