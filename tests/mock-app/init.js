import mongoose from "mongoose";
import config from "./config.js";

export default async function (server, app, express) {
  await connectToMongoDB();
}

async function connectToMongoDB() {
  try {
    const { mongodb } = config;
    const url = `mongodb://${mongodb.host}:${mongodb.port}/${mongodb.database}`;
    mongoose.Promise = Promise;
    if (!mongoose.connection.db) {
      await mongoose.connect(mongodb.url || url);
    }
  } catch (err) {
    console.error(err)
  }
}
