// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { check, validationResult } = require('express-validator');
const { userValidation } = require('../shared/userValidations');
const sendResponse = require('../utils/responseHandler');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: __dirname + '/../.env' });

// Async Middleware to handle exceptions in async functions
const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next))
    .catch(next);
};

router.use((req, res, next) => {
    // console.log(`Received request - Method: ${req.method}, Path: ${req.path}`);
    next();
});


// Register new user
router.post('/register', userValidation, asyncMiddleware(async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, { errors: errors.array() });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, { message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      email,
      password: hashedPassword,
      role,
      firstName,
      lastName,
      authMethods: [{ type: 'Local', id: email }]
    });

    // Save the new user
    await newUser.save();

    // Create a new Doctor or Patient or Admin model based on the role
    if (role === 'Doctor') {
      const newDoctor = new Doctor({
        _id: newUser._id,
        ...req.body
      });
      await newDoctor.save();
    } else if (role === 'Patient') {
      const newPatient = new Patient({
        _id: newUser._id,
        ...req.body
      });
      await newPatient.save();
    } else if (role === 'Admin') {
      const newAdmin = new Admin({
        _id: newUser._id,
        ...req.body
      });
      await newAdmin.save();
    }

    // Update the Admin model if the new user reference
    const admin = await Admin.findOne();

    // Add the new user to the Admin model
    if (Admin) {
      admin.managedUsers.push(newUser._id);
      await admin.save();
    }

    sendResponse(res, 201, { message: 'User registered successfully' });
  } catch (error) {
    // console.error("Registration Error:", error.message);
    sendResponse(res, 500, { message: 'Registration failed', error: error.message });
  }
}));

// Login validation middleware - check if email and password are valid
const loginValidation = [
  check('email').isEmail().withMessage('Enter a valid email'),
  check('password').isLength({ min: 6 }).withMessage('Password should be at least 6 characters long')
];

// Login rate limiter middleware - 5 requests per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again in 15 minutes."
})

// Login route - Authenticate user and generate JWT token, Refresh token 
router.post('/login', loginLimiter, loginValidation, asyncMiddleware(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendResponse(res, 400, null, { errors: errors.array() });
    }

    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return sendResponse(res, 500, null, 'Server error during authentication');
        }
        if (!user) {
            return sendResponse(res, 401, null, info.message);
        }
        req.logIn(user, { session: false }, async (err) => {
            if (err) {
                return sendResponse(res, 500, null, 'Server error during authentication');
            }

            try {
                // Generate Refresh Token
                const refreshToken = jwt.sign({ id: user._id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
                
                // Invalidate old refresh tokens
                await User.findByIdAndUpdate(user._id, { $pull: { refreshTokens: {} } });
                
                // Add the new refresh token
                await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: { token: refreshToken, expires: new Date(Date.now() + 7*24*60*60*1000) } } });

                return sendResponse(res, 200, {
                    message: 'Logged in successfully',
                    token: user.token,
                    refreshToken: refreshToken,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                });
            } catch (error) {
                // console.error("Login Error:", error.message);
                sendResponse(res, 500, { message: 'Login failed', error: error.message });
            }
        });
    })(req, res, next);
}));

// Refresh Token
router.post('/token', asyncMiddleware(async (req, res) => {
  try {
    const refreshToken = req.body.token;
    if (!refreshToken) return res.sendStatus(401);

    const user = await User.findOne({ "refreshTokens.token": refreshToken });
    if (!user) return res.sendStatus(403);

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, userData) => {
      if (err) return res.sendStatus(403);
      const accessToken = jwt.sign({ id: userData.id, role: userData.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
      res.json({ accessToken });
    });
  } catch (error) {
    // console.error('Error in token refresh:', error.message);
    sendResponse(res, 500, { message: 'Token refresh failed', error: error.message });
  }
}));

// Logout user - Remove refresh token from database
router.post('/logout', asyncMiddleware(async (req, res) => {
    const refreshToken = req.body.token;
    if (!refreshToken) return res.sendStatus(400);  // Bad Request

    // Remove the refresh token from the database
    await User.updateOne({ "refreshTokens.token": refreshToken }, { $pull: { refreshTokens: { token: refreshToken } } });

    return sendResponse(res, 200, { message: 'Logged out successfully' });
}));


// Fetch User Profile from the database, if authenticated
router.get('/dashboard', passport.authenticate('jwt', { session: false }), asyncMiddleware(async (req, res) => {
  // console.log("Dashboard route accessed");
  try {
    const user = await User.findById(req.user._id).select('email role firstName lastName'); // Explicitly select fields
    if (user) {
      sendResponse(res, 200, {
        message: "You are authenticated from /dashboard route",
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } else {
      sendResponse(res, 404, { message: "User not found" });
    }
  } catch (error) {
    sendResponse(res, 500, { message: error.message });
  }
}));


router.delete('/deleteUser/:userId', asyncMiddleware(async (req, res) => {
    const userId = req.params.userId;

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Remove the user's reference from the Admin model
    const admin = await Admin.findOne();
    if (admin) {
        const index = admin.managedUsers.indexOf(userId);
        if (index > -1) {
            admin.managedUsers.splice(index, 1);
            await admin.save();
        }
    }

    sendResponse(res, 200, { message: 'User deleted successfully' });
}));

module.exports = router;
