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
      // console.log("MongoDB Connected to test environment.");
    } else {
      uri = process.env.MONGODB_URI;
      // console.log("MongoDB Connected to production environment.");
    }
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // console.log("MongoDB Connected");
    isConnected = true;
  } catch (error) {
    // console.error("MongoDB Connection Failed:", error.message, "\n", error.stack);
  }
};

const closeDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    await mongoServer.stop();
  }
  await mongoose.connection.close();
};

module.exports = { connectDB, closeDB };





