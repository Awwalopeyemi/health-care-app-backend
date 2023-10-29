// jest.setup.js
const { connectDB, closeDB } = require('./config/db');


beforeAll(async () => {
  await connectDB();  // Use connectDB here
});

afterAll(async () => {
  await closeDB();  // Use closeDB here
});

afterEach(async () => {
  const mongoose = require('mongoose');
  await mongoose.connection.db.dropDatabase();
});




