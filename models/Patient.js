// models\Patient.js
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  appointments: [{
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
  }],
  age: { type: Number, default: 0 },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Prefer not to say'],
    default: 'Prefer not to say'
  },
  medicalHistory: [
    {
      condition: { type: String, default: "" },
      treatment: { type: String, default: "" },
      notes: { type:String, default: "" }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
