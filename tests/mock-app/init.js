import mongoose from "mongoose";

export default async function (server, app, express) {
  await connectToMongoDB();
}

async function connectToMongoDB() {
  try {
    const {
      MONGODB_DATABASE = "development",
      MONGODB_HOST = "127.0.0.1",
      MONGODB_PORT = "27017"
    } = process.env

    const url = `mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`;
    mongoose.Promise = Promise;
    if (!mongoose.connection.db) {
      await mongoose.connect(url);
    }
  } catch (err) {
    console.error(err)
  }
}
