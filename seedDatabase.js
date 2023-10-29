
// Desc: Script to seed the database with mock data
const mongoose = require('mongoose');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Admin = require('./models/Admin');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB!');

  const userExists = await User.findOne({ email: 'admin@example.com' });
  if (!userExists) {
    try {
       // Create users first
      const users = await User.insertMany([
        {
          email: 'john.doe@example.com',
          password: 'password123',
          role: 'Patient',
          firstName: 'John',
          lastName: 'Doe',
          authMethods: [
            {
              type: 'Local',
              id: 'john.doe@example.com'
            }
          ],
        },
        {
          email: 'jane.smith@example.com',
          password: 'password123',
          role: 'Patient',
          firstName: 'Jane',
          lastName: 'Smith',
          authMethods: [
            {
              type: 'Local',
              id: 'jane.smith@example.com'
            }
          ],
        },
        {
          email: 'alan.grant@example.com',
          password: 'password123',
          role: 'Doctor',
          firstName: 'Dr. Alan',
          lastName: 'Grant',
          authMethods: [
            {
              type: 'Local',
              id: 'alan.grant@example.com'
            }
          ],
        },
        {
          email: 'ellie.sattler@example.com',
          password: 'password123',
          role: 'Doctor',
          firstName: 'Dr. Ellie',
          lastName: 'Sattler',
          authMethods: [
            {
              type: 'Local',
              id: 'doctor2@example.com'
            }
          ],
        },
        {
          email: 'admin@example.com',
          password: 'password123',
          role: 'Admin',
          firstName: 'Admin',
          lastName: 'User',
          authMethods: [
            {
              type: 'Local',
              id: 'admin@example.com'
            }
          ],
        }
      ]);

      // Create role-specific data based on user id
      await Promise.all(users.map(async (user) => {
        switch(user.role) {
          case 'Patient':
            await Patient.create({ _id: user._id, age: Math.floor(Math.random() * 50 + 20), gender: 'Male' });
            break;
          case 'Doctor':
            await Doctor.create({ _id: user._id, specialty: 'Cardiology' });
            break;
          case 'Admin':
            await Admin.create({ _id: user._id });
            break;
        }
      }));

    } catch (error) {
      if (error.code === 11000) {
        console.log('Duplicate key error:', error.message);
      } else {
        throw error;
      }
    }
  }

  console.log('Database seeded successfully!');
  process.exit();
});