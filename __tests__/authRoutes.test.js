// __tests__\authRoutes.test.js
const request = require('supertest');
const { app, server } = require('../app')
const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

beforeAll(async () => {
  await connectDB();  // Use connectDB here
});

afterAll(async () => {
  await closeDB();  // Use closeDB here
  await server.close();  // Close the server
});

describe('Registration', () => {

  test('should register a new admin', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'Admin'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('data.message', 'User registered successfully');

    // Check if the user was saved to the database
    const user = await User.findOne({ email: 'admin@example.com' });
    expect(user).toBeDefined();
    expect(user.role).toEqual('Admin');
    expect(user.firstName).toEqual('Admin');
    expect(user.lastName).toEqual('User');

    // Check if the admin was saved to the database
    const admin = await Admin.findOne({ _id: user._id });
    expect(admin).toBeDefined();
  });

  test('should register a new patient', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'Patient'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('data.message', 'User registered successfully');

    // Check if the user was saved to the database
    const user = await User.findOne({ email: 'test@example.com' });
    expect(user).toBeDefined();
    expect(user.role).toEqual('Patient');
    expect(user.firstName).toEqual('Test');
    expect(user.lastName).toEqual('User');

    // Check if the patient was saved to the database
    const patient = await Patient.findOne({ _id: user._id });
    expect(patient).toBeDefined();
  });

  test('should register a new doctor', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'doctor@example.com',
        password: 'password123',
        firstName: 'Doctor',
        lastName: 'User',
        role: 'Doctor',
        specialty: 'Cardiology'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('data.message', 'User registered successfully');

    // Check if the user was saved to the database
    const user = await User.findOne({ email: 'doctor@example.com' });
    expect(user).toBeDefined();
    expect(user.role).toEqual('Doctor');
    expect(user.firstName).toEqual('Doctor');
    expect(user.lastName).toEqual('User');

    // Check if the doctor was saved to the database
    const doctor = await Doctor.findOne({ _id: user._id });
    expect(doctor).toBeDefined();
    expect(doctor.specialty).toEqual('Cardiology');
  });

  test('should fail to register a user with an already used email', async () => {
    const res = await request(app)
        .post('/auth/register')
        .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'Patient'
        });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('data.message', 'Email already exists');
  });
});

describe('Login', () => {
  test('should login successfully', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

      console.log('Login response:', res.body);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('data.message', 'Logged in successfully');
    expect(res.body).toHaveProperty('data.token');
    expect(res.body).toHaveProperty('data.refreshToken');
    expect(res.body).toHaveProperty('data.role', 'Patient');
    expect(res.body).toHaveProperty('data.firstName', 'Test');
    expect(res.body).toHaveProperty('data.lastName', 'User');
  });

  test('should fail to login with incorrect password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Email not registered or password incorrect');
  });

  test('should fail to login with non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123'
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Email not registered or password incorrect');
  });
});

describe('Token Refresh', () => {
  let refreshToken;

  beforeAll(async () => {
    // Login to get a refresh token
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    refreshToken = res.body.data.refreshToken;
  });

  test('should refresh access token', async () => {
    const res = await request(app)
      .post('/auth/token')
      .send({ token: refreshToken });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  test('should fail to refresh access token with invalid token', async () => {
    const res = await request(app)
      .post('/auth/token')
      .send({ token: 'invalidtoken' });
    expect(res.statusCode).toEqual(403);
  });

  test('should fail to refresh access token without token', async () => {
    const res = await request(app)
      .post('/auth/token')
      .send();
    expect(res.statusCode).toEqual(401);
  });
});

describe('Logout', () => {
  let refreshToken;

  beforeAll(async () => {
    // Login to get a refresh token
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    refreshToken = res.body.data.refreshToken;

  });

  test('should logout successfully', async () => {
    const res = await request(app)
      .post('/auth/logout')
      .send({ token: refreshToken });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('data.message', 'Logged out successfully');
  });

  test('should fail to logout without token', async () => {
    const res = await request(app)
      .post('/auth/logout')
      .send();
    expect(res.statusCode).toEqual(400);
  });
});

 


