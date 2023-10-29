// config\passport.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JwtExtract = require('passport-jwt').ExtractJwt;
const User = require('../models/User');
const JwtStrategy = require('passport-jwt').Strategy;

// JWT Extractor
const opts = {
  jwtFromRequest: JwtExtract.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

// JWT Strategy
passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  // console.log('JWT payload:', jwt_payload);
  // console.log('JWT Strategy triggered'); // 
  try {
    const user = await User.findById(jwt_payload.id);
    if (user) {
      // console.log('User found in JWT Strategy'); 
      return done(null, user);
    } else {
      // console.log('Token not matched in JWT Strategy'); 
      return done(null, false, { message: 'Token not matched' }); 
    }
  } catch (err) {
    // console.error('Error in JWT Strategy:', err); 
    return done(err, false);
  }
}));

// Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {
  // console.log('Local Strategy triggered');
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        // console.log('Email not registered or password incorrect in Local Strategy');
        return done(null, false, { message: 'Email not registered or password incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // console.log('Incorrect password in Local Strategy');
      return done(null, false, { message: 'Incorrect password' });
    }

    // console.log('User authenticated successfully in Local Strategy'); 
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    return done(null, { ...user._doc, token, role: user.role });
  } catch (err) {
    // console.error('Error in Local Strategy:', err); 
    return done(err, false);
  }
}));

module.exports = passport;