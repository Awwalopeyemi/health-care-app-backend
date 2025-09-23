// models/Sos.js
const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // assuming user is logged in
    required: true,
  },
  location: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    }
  },
  message: {
    type: String,
    default: 'Emergency SOS triggered',
  },
  isSynced: {
    type: Boolean,
    default: false, // useful for offline sync
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Sos', sosSchema);
