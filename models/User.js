// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Doctor', 'Patient'],
    default: 'Patient'
  },
  firstName: String,
  lastName: String,
  authMethods: [
    {
      type: {
        type: String,
        enum: ['Google', 'Facebook', 'Local']
      },
      id: {
        type: String,
        unique: true,
        required: true
      }
    }
  ],
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    expires: {
      type: Date,
      required: true
    }
  }],
  admin : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

}, { timestamps: true });
  
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
