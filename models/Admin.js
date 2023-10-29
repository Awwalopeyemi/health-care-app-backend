// models\Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  managedDoctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: []
  }],
  managedPatients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: []
  }],
  managedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  managedAppointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: []
  }],
  managedNotifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    default: []
  }]
  
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
