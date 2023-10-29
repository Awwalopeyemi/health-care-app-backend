// models\Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  type: {
    type: String,
    enum: ['Appointment', 'Update']
  },
  message: String,
  isRead: Boolean,
  timestamp: Date
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
