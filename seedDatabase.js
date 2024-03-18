
// Desc: Script to seed the database with mock data
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const User = require('./models/User');
const Admin = require('./models/Admin');
require('dotenv').config();

const email = 'admin@example.com';
const password = 'y8wstJWPg5Tfh3W';

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = await User.create({
      email: email,
      password: hashedPassword,
      role: 'Admin',
      firstName: 'Admin',
      lastName: 'User',
      authMethods: [
        {
          type: 'Local',
          id: email
        }
      ]
    });

    // Create admin specific data
    await Admin.create({ _id: adminUser._id });

    console.log('Admin user created');
  } catch (error) {
    if (error.code === 11000) {
      console.log("Duplicate key error:", error.message);
    } else {
      throw error;
    }
  }

  process.exit();
});