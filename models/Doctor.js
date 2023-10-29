// models\Doctor.js
const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  specialty: { type: String, default: "" },
  managedPatients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: []
  }],
  appointments: [{
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
    diagnosis: { type: String, default: "" },
    prescription: {type: String, default: "" }
  }],
  qualifications: [
    {
      degree: {type: String, default: "" },
      institution: {type: String, default: "" },
      year: { type: Number, default: new Date().getFullYear() }
    }
  ],
  availability: [
    {
      day: {type: String, default: ""},
      timeSlots: [
        {
          start: {type: String, default: "" },
          end: {type: String, default: "" } 
        }
      ]
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
