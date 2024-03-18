// config/db.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("Already connected to MongoDB.");
    return;
  }
  
  try {
    let uri;
    if (process.env.NODE_ENV === 'test') {
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    } else {
      uri = process.env.MONGODB_URI;
    }
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
  } catch (error) {
  }
};

const closeDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    await mongoServer.stop();
  }
  await mongoose.connection.close();
};

module.exports = { connectDB, closeDB };





