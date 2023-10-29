// routes\doctorRoutes.js
const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorize = require('../middleware/authorize');
const Patient = require('../models/Patient');
const { userValidation } = require('../shared/userValidations');
const { updateUserValidation } = require('../shared/updateUserValidations');
const handleMongoError = require('../shared/handleMongoError');

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next))
    .catch(next);
};

// Validation Array
const doctorValidation = [
  ...userValidation,
  check('specialty', 'Specialty is required').notEmpty(),
  check('qualifications', 'Qualifications are required').isArray({ min: 1 }),
  check('qualifications.*.degree', 'Degree is required').notEmpty(),
  check('qualifications.*.institution', 'Institution is required').notEmpty(),
  check('qualifications.*.year', 'Year is required').notEmpty().isInt(),
  check('availability', 'Availability is required').isArray({ min: 1 }),
  check('availability.*.day', 'Day is required').notEmpty(),
  check('availability.*.timeSlots', 'Time Slots are required').isArray({ min: 1 }),
  check('availability.*.timeSlots.*.start', 'Start Time is required').notEmpty().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  check('availability.*.timeSlots.*.end', 'End Time is required').notEmpty().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  check('managedPatients').custom(async (value) => {
    for (let id of value) {
      const patient = await Patient.findById(id);
      if (!patient) {
        throw new Error(`Patient ID ${id} does not exist`);
      }
    }
  }),
];

const doctorValidationForUpdate = [
  check('specialty', 'Specialty is required').notEmpty(),
  check('qualifications', 'Qualifications are required').isArray({ min: 1 }),
  check('qualifications.*.degree', 'Degree is required').notEmpty(),
  check('qualifications.*.institution', 'Institution is required').notEmpty(),
  check('qualifications.*.year', 'Year is required').notEmpty().isInt(),
  check('availability', 'Availability is required').optional().isArray(),
  check('availability.*.day', 'Day is required').optional().notEmpty(),
  check('availability.*.timeSlots', 'Time Slots are required').optional().isArray(),
  check('availability.*.timeSlots.*.start', 'Start Time is required').optional().notEmpty().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  check('availability.*.timeSlots.*.end', 'End Time is required').optional().notEmpty().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
];

// Create a new doctor (Authenticate and Authorize as Admin)
router.post('/', authenticateJWT, authorize(['Admin']), [...userValidation, ...doctorValidation], asyncMiddleware(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const doctor = new Doctor({
    _id: new mongoose.Types.ObjectId(),
    ...req.body
  });
  
  try {
    const savedDoctor = await doctor.save();
    res.status(201).json(savedDoctor);
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Get all doctors (Open for all)
router.get('/', asyncMiddleware(async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json(doctors);
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Get a single doctor by ID (Open for all)
router.get('/:id', asyncMiddleware(async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(200).json(doctor);
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Get all patients managed by a specific doctor
router.get('/:id/patients', authenticateJWT, authorize(['Doctor']), asyncMiddleware(async (req, res) => {
  // Check if logged-in doctor is the same as the doctor in the route
  if (req.user._id !== req.params.id) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const doctor = await Doctor.findById(req.params.id).populate('appointments.patient', 'age gender');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    const patients = doctor.appointments.map(appointment => ({
      ...appointment.patient._doc,
      date: appointment.date,
      notes: appointment.notes,
      diagnosis: appointment.diagnosis,
      prescription: appointment.prescription
    }));
    res.status(200).json(patients);
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Update a doctor by ID (Authenticate and Authorize as Admin, or as Doctor for own profile only)
router.put('/:id', authenticateJWT, authorize(['Doctor', 'Admin']), [...updateUserValidation, ...doctorValidationForUpdate], async (req, res) => {
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Check if the doctor is trying to update their own profile and prevent if not authorized
    if (req.user.role === 'Doctor' && req.user.id !== req.params.id) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Handle updates to other fields
        if (req.body.specialty) {
            doctor.specialty = req.body.specialty;
        }

        if (req.body.qualifications) {
            doctor.qualifications = req.body.qualifications;
        }

        /// Handle time slot updates
        if (req.body.availability) {
            for (const avail of req.body.availability) {
                const existingDay = doctor.availability.find(a => a.day === avail.day);
                if (!existingDay) {
                    doctor.availability.push(avail);
                } else {
                    // Replace existing timeslots for the day with the new timeslots
                    existingDay.timeSlots = avail.timeSlots;
                }
            }
        }

        await doctor.save();
        res.status(200).json(doctor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a doctor by ID (Authenticate and Authorize as Admin)
router.delete('/:id', authenticateJWT, authorize(['Admin']), asyncMiddleware(async (req, res) => {

  try {
    const deletedDoctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!deletedDoctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(200).json({ message: 'Doctor deleted' });
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

module.exports = router;
