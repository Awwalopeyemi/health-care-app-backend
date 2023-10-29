// routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorize = require('../middleware/authorize');
const { userValidation } = require('../shared/userValidations');
const { updateUserValidation } = require('../shared/updateUserValidations');
const handleMongoError = require('../shared/handleMongoError');

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next))
    .catch(next);
};

const patientValidation = [
    ...userValidation,
  check('age', 'Age is required').isNumeric(),
  check('gender', 'Gender is required').isIn(['Male', 'Female', 'Other']),
  check('medicalHistory', 'Medical History is required').isArray({ min: 1 }),
  check('medicalHistory.*.condition', 'Condition is required').notEmpty(),
  check('medicalHistory.*.treatment', 'Treatment is required').notEmpty(),
  check('medicalHistory.*.notes', 'Notes is required').notEmpty()
];

const patientValidationForUpdate = [
    check('age', 'Age is required').isNumeric(),
    check('gender', 'Gender is required').isIn(['Male', 'Female', 'Other']),
    check('medicalHistory', 'Medical History is required').optional().isArray({ min: 1 }),
    check('medicalHistory.*.condition', 'Condition is required').optional().notEmpty(),
    check('medicalHistory.*.treatment', 'Treatment is required').optional().notEmpty(),
    check('medicalHistory.*.notes', 'Notes is required').optional().notEmpty()
];

// Create a new patient (Authenticate and Authorize as Admin or Doctor)
router.post('/', authenticateJWT, authorize(['Admin', 'Doctor']), [...userValidation, ...patientValidation], asyncMiddleware(async (req, res) => {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const patient = new Patient({
        _id: new mongoose.Types.ObjectId(),
        ...req.body
    });

    try {
        const savedPatient = await patient.save();
        res.status(201).json(savedPatient);
    } catch (error) {
        const { message, status } = handleMongoError(error);
        res.status(status).json({ message });
    }
}));

// Get all patients (Authenticate and Authorize as Admin or Doctor)
router.get('/', authenticateJWT, authorize(['Admin', 'Doctor']), asyncMiddleware(async (req, res) => {
    if(req.user.role !== 'Admin' && req.user.role !== 'Doctor'){
        return res.status(403).json({ message: 'Unauthorized' });
    }

    try {
        const patients = await Patient.find();
        res.status(200).json(patients);
    } catch (error) {
        const { message, status } = handleMongoError(error);
        res.status(status).json({ message });
    }
}));

// Get a single patient by ID (Authenticate and Authorize as Admin, Doctor or Patient)
router.get('/:id', authenticateJWT, authorize(['Admin', 'Doctor', 'Patient']), asyncMiddleware(async (req, res) => {

    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.status(200).json(patient);
    } catch (error) {
        const { message, status } = handleMongoError(error);
        res.status(status).json({ message });
    }
}));

// Update a patient by ID (Authenticate and Authorize as Admin or Doctor)
router.put('/:id', authenticateJWT, authorize(['Patient','Admin', 'Doctor']), [...updateUserValidation, ...patientValidationForUpdate], asyncMiddleware(async (req, res) => {
    // console.log("Received ID from Frontend:", req.params.id);
    // console.log("User ID from token:", req.user.id);
    // console.log("User ID from request:", req.params.id);

  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role === 'Patient' && req.user.id !== req.params.id) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    try {
        const patient = await Patient.findById(req.params.id)
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        const updatePatient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatePatient);
    } catch (error) {
        const { message, status } = handleMongoError(error);
        res.status(status).json({ message });
    }
}));

// Delete a patient by ID (Authenticate and Authorize as Admin or Doctor)
router.delete('/:id', authenticateJWT, authorize(['Admin', 'Doctor']), asyncMiddleware(async (req, res) => {
    
        try {
            const deletedPatient = await Patient.findByIdAndDelete(req.params.id);
            if (!deletedPatient) {
                return res.status(404).json({ message: 'Patient not found' });
            }
            res.status(200).json({ message: 'Patient deleted successfully'});
        } catch (error) {
            const { message, status } = handleMongoError(error);
            res.status(status).json({ message });
        }
}));

module.exports = router;
