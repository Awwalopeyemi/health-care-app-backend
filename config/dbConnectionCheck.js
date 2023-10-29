const mongoose = require('mongoose');

const dbConnectionCheck = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ message: 'Database connection lost. Please try again later.' });
  }
  next();
};

module.exports = dbConnectionCheck;
