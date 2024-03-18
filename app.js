// app.js
require("dotenv").config();
const express = require("express");
const passport = require('passport');
const bodyParser = require("body-parser");
const cors = require("cors");
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const dbConnectionCheck = require('./config/dbConnectionCheck');

require('./config/passport');

if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
  console.error('Essential environment variables are missing. Ensure JWT_SECRET and MONGODB_URI are set.');
  process.exit(1);
}

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Add Middleware
const allowedOrigins = ['http://localhost:3000', process.env.FRONTEND_URL];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};


// Trust the proxy to get the real client IP
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later."
});

if (process.env.NODE_ENV !== 'test') {
  app.use(limiter);
}
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(helmet());

// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use('/auth', dbConnectionCheck, authRoutes);
app.use('/api/doctors', dbConnectionCheck, doctorRoutes);
app.use('/api/patients', dbConnectionCheck, patientRoutes);
app.use('/api/appointments', dbConnectionCheck, appointmentRoutes);
app.use('/api/notifications', dbConnectionCheck, notificationRoutes);
app.use('/api/admins', dbConnectionCheck, adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Error:", err.message, "\n", err.stack);
    res.status(500).send('Something went wrong!');
});


// Sample Route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Server Initialization
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, server};