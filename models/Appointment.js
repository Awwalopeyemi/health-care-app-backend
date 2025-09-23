// models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
        return this.isAdmin; 
    }
},
  scheduledTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },

  isSynced: {
  type: Boolean,
  default: false,
},

  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

