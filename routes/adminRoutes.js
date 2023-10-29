// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const { check, validationResult } = require('express-validator');
const authenticateJWT = require('../middleware/authenticateJWT');
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const authorize = require('../middleware/authorize');
const { userValidation } = require('../shared/userValidations');
const handleMongoError = require('../shared/handleMongoError');

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next))
    .catch(next);
};

const adminValidation = [
  ...userValidation,
  check('managedDoctors').custom(async (value) => {
    for (let id of value) {
      const doctor = await Doctor.findById(id);
      if (!doctor) {
        throw new Error(`Doctor ID ${id} does not exist`);
      }
    }
  }),
  check('managedPatients').custom(async (value) => {
    for (let id of value) {
      const patient = await Patient.findById(id);
      if (!patient) {
        throw new Error(`Patient ID ${id} does not exist`);
      }
    }
  }),
  check('managedUsers').custom(async (value) => {
    for (let id of value) {
      const user = await UserActivation.findById(id);
      if (!user) {
        throw new Error(`User ID ${id} does not exist`);
      }
    }
  }),
  check('managedAppointments').custom(async (value) => {
    for (let id of value) {
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        throw new Error(`Appointment ID ${id} does not exist`);
      }
    }
  }),
  check('managedNotifications').custom(async (value) => {
    for (let id of value) {
      const notification = await Notification.findById(id);
      if (!notification) {
        throw new Error(`Notification ID ${id} does not exist`);
      }
    }
  })
];

// Create a new admin (Authenticate and Authorize as Admin)
router.post('/', authenticateJWT, authorize(['Admin']), [...userValidation, ...adminValidation], asyncMiddleware(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const admin = new Admin({
    _id: new mongoose.Types.ObjectId(),
    ...req.body
  });

  try {
    const savedAdmin = await admin.save();
    res.status(201).json(savedAdmin);
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Get all admins (Authenticate and Authorize as Admin)
router.get('/', authenticateJWT, authorize(['Admin']), asyncMiddleware(async (req, res) => {
  try {
    const admins = await Admin.find()
                              .populate('managedDoctors', 'specialty')
                              .populate('managedPatients', 'age gender')
                              .populate('managedUsers', 'firstName lastName email role')
                              .populate('managedAppointments')
                              .populate('managedNotifications');
    res.status(200).json(admins);
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Get a single admin by ID (Authenticate and Authorize as Admin)
router.get('/:id', authenticateJWT, authorize(['Admin']), asyncMiddleware(async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id)
                             .populate('managedDoctors', 'specialty')
                             .populate('managedPatients', 'age gender')
                             .populate('managedUsers', 'firstName lastName email role')
                             .populate('managedAppointments')
                             .populate('managedNotifications');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.status(200).json(admin);
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Update a single admin by ID (Authenticate and Authorize as Admin)
router.put('/:id', authenticateJWT, authorize(['Admin']), [...userValidation, ...adminValidation], asyncMiddleware(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedAdmin);
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Delete a single admin by ID (Authenticate and Authorize as Admin)
router.delete('/:id', authenticateJWT, authorize(['Admin']), asyncMiddleware(async (req, res) => {

  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Admin deleted succesfully' });
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

module.exports = router;