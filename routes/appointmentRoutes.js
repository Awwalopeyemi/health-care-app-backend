// routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const moment = require('moment-timezone');
const authenticateJWT = require('../middleware/authenticateJWT');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const authorize = require('../middleware/authorize');
const handleMongoError = require('../shared/handleMongoError');
const Admin = require('../models/Admin');

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next))
    .catch(next);
};

// This utility function logs and identifies the function name and the message
function logFunctionTrace(funcName, message) {
    console.log(`[${funcName}] - ${message}`);
}

// Appointment Validation
const appointmentValidation = [
  check('doctorId', 'Doctor ID is required').notEmpty(),
  check('patientId', 'Patient ID is required').notEmpty(),
  check('doctorId').custom(async (value) => {
    const doctor = await Doctor.findById(value);
    console.log("Fetched Doctor Details:", doctor);
    if (!doctor) {
      throw new Error('Doctor ID does not exist');
    }
  }),
  check('patientId').custom(async (value) => {
    const patient = await Patient.findById(value);
    if (!patient) {
      throw new Error('Patient ID does not exist');
    }
  }),
  check('scheduledTime', 'Scheduled Time is required').notEmpty(),
  check('status', 'Status is required').isIn(['Scheduled', 'Completed', 'Cancelled']),
  check('notes', 'Notes is required').notEmpty()
];

// This function checks if the doctor is available at the desired time
async function isDoctorAvailable(doctorId, desiredTime) {
  try {
    logFunctionTrace("isDoctorAvailable", "Function called");
    
    const doctor = await Doctor.findById(doctorId);
    // console.log("Fetched Doctor Details:", doctor);

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Convert to Johannesburg time ONLY for checking availability
    const saTime = moment.utc(desiredTime).tz('Africa/Johannesburg');
    const desiredDay = saTime.format('dddd');  // This should return 'Wednesday' for example

    // console.log("Desired Day:", desiredDay);
    // console.log("Desired Time UTC:", desiredTime.toISOString());

    const dayAvailability = doctor.availability.find(day => day.day === desiredDay);
    console.log("Day availability:", JSON.stringify(dayAvailability));

    if (!dayAvailability) {
      // console.log("No availability found for the desired day:", desiredDay);
      return false;
    }

    // Check if the desired time falls within any of the doctor's available time slots for that day
    const isTimeAvailable = dayAvailability.timeSlots.some(slot => {
      const slotStartDate = new Date(`${desiredTime.toISOString().split('T')[0]}T${slot.start}:00Z`).getTime(); 
      const slotEndDate = new Date(`${desiredTime.toISOString().split('T')[0]}T${slot.end}:00Z`).getTime();
      const desiredTimeValue = desiredTime.getTime();

      // console.log("Slot Start Date:", slotStartDate);
      // console.log("Slot End Date:", slotEndDate);
          
      return (desiredTimeValue >= slotStartDate && desiredTimeValue < slotEndDate);
    });

    if (!isTimeAvailable) {
      // logFunctionTrace("isDoctorAvailable", "Time Slot Not Available!");
      return false;
    }

    const desiredEndTime = new Date(desiredTime);
    desiredEndTime.setMinutes(desiredEndTime.getMinutes() + 90);  // Assuming each slot is 90 minutes

    const existingAppointment = await Appointment.findOne({
        doctorId: doctorId,
        scheduledTime: { $lt: desiredEndTime, $gt: desiredTime }
    });

    if(existingAppointment) {
        // console.log("Existing appointment found:", existingAppointment);
    }

    return !existingAppointment;
  } catch (error) {
     console.error("Error in isDoctorAvailable:", error);
    return false;
  }
}

// Create a new appointment (Authenticate and Authorize as Patient, Doctor or Admin)
router.post('/book', authenticateJWT, authorize(['Patient', 'Doctor', 'Admin']), appointmentValidation, asyncMiddleware(async (req, res) => {
  logFunctionTrace("/book", "Endpoint hit");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if the doctor is available at the desired time
  const isAvailable = await isDoctorAvailable(req.body.doctorId, new Date(req.body.scheduledTime));
  if (!isAvailable) {
    return res.status(400).json({ message: 'The selected time slot is not available. Please choose a different slot.' });
  }

  // Convert the scheduled time to UTC
  const utcTime = moment.utc(req.body.scheduledTime);

  const appointment = new Appointment({
      _id: new mongoose.Types.ObjectId(),
      ...req.body,
      scheduledTime: utcTime.toDate()  // Convert moment object back to JavaScript Date
  });

  // If the user is an admin, set the virtual field `isAdmin` to true
  if (req.user.role === 'Admin') {
      appointment.admin = true;
  }

  try {
    const savedAppointment = await appointment.save();

    // Link the appointment to the doctor
    await Doctor.findByIdAndUpdate(req.body.doctorId, {
        $push: { appointments: savedAppointment._id }
    });

    // Link the appointment to the patient
    await Patient.findByIdAndUpdate(req.body.patientId, {
        $push: { appointments: savedAppointment._id }
    });

    // Link the appointment to the admin
    if (req.user.role === 'Admin') {
        await Admin.findByIdAndUpdate(req.user.id, {
            $push: { appointments: savedAppointment._id }
        });
    }

    // Create a notification for the doctor about the new appointment
    const doctorNotification = new Notification({
        _id: new mongoose.Types.ObjectId(),
        userId: savedAppointment.doctorId,
        type: 'Appointment',
        message: 'A new appointment has been booked with you.',
        isRead: false,
        timestamp: new Date()
    });
    await doctorNotification.save();

    // Create a notification for the patient about the new appointment
    const patientNotification = new Notification({
        _id: new mongoose.Types.ObjectId(),
        userId: savedAppointment.patientId,
        type: 'Appointment',
        message: 'Your appointment has been confirmed.',
        isRead: false,
        timestamp: new Date()
    });
    await patientNotification.save();

    logFunctionTrace("/book", "Appointment saved successfully");
    res.status(201).json(savedAppointment);
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Get all appointments (Authenticate and Authorize as Admin or Doctor)
router.get('/:id', authenticateJWT, authorize(['Admin', 'Doctor']), asyncMiddleware(async (req, res) => {
  try {
    const userId = req.user.id;
    const appointments = await Appointment.find({ doctorId: userId })
                                         .populate('doctorId')
                                         .populate('patientId')
                                         .populate('admin');

    console.log("Fetched Appointments:", appointments);
    
    if (!appointments) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.status(200).json(appointments);
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Get appointments for the logged-in patient (Authenticate and Authorize as Patient)
router.get('/:id/myAppointments', authenticateJWT, authorize(['Patient']), asyncMiddleware(async (req, res) => {
  try {
    const userId = req.user.id;  
    const appointments = await Appointment.find({ patientId: userId })
                                          .populate('doctorId')
                                          .populate('patientId')
                                          .populate('admin');

    if (!appointments.length) {
      return res.status(404).json({ message: 'No appointments for this patient found' });
    }
    res.status(200).json(appointments);
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Update an appointment by ID (Open for all)
router.put('/:id', authenticateJWT, authorize(['Admin', 'Doctor']), appointmentValidation,  asyncMiddleware(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
          return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check if appointment status is being changed to 'Cancelled'
      if (req.body.status === 'Cancelled' && appointment.status !== 'Cancelled') {
          // Send a notification to the patient about the cancellation
          const notification = new Notification({
              _id: new mongoose.Types.ObjectId(),
              userId: appointment.patientId,
              type: 'Appointment',
              message: 'Your appointment has been cancelled.',
              isRead: false,
              timestamp: new Date()
          });
          await notification.save();
      }

      // Check if appointment notes are updated
      if (req.body.notes && req.body.notes !== appointment.notes) {
          const notification = new Notification({
              _id: new mongoose.Types.ObjectId(),
              userId: appointment.patientId,
              type: 'Appointment',
              message: 'Notes from your recent appointment have been updated. Please review them.',
              isRead: false,
              timestamp: new Date()
          });
          await notification.save();
      }
      
      // Check if appointment status is being is being rescheduled
      if (req.body.scheduledTime !== appointment.scheduledTime) {
          const notification = new Notification({
              _id: new mongoose.Types.ObjectId(),
              userId: appointment.patientId,
              type: 'Appointment',
              message: 'Your appointment has been rescheduled.',
              isRead: false,
              timestamp: new Date()
          });
          await notification.save();
      }

      // Check if appointment status is being changed to 'Completed'
      if (req.body.status === 'Completed' && appointment.status !== 'Completed') {
          const notification = new Notification({
              _id: new mongoose.Types.ObjectId(),
              userId: appointment.patientId,
              type: 'Appointment',
              message: 'Your recent appointment has been marked as completed. Thank you!',
              isRead: false,
              timestamp: new Date()
          });
          await notification.save();
      }

      const updateAppointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.status(200).json(updateAppointment);
    } catch (error) {
      const { message, status } = handleMongoError(error);
      res.status(status).json({ message });
    }
}));

// This function checks for appointments in the next 24 hours and sends reminders
router.get('/sendReminders', authenticateJWT, authorize(['Admin']), asyncMiddleware(async (req, res) => {
    const currentTime = new Date();
    const reminderTime = new Date(currentTime);
    reminderTime.setHours(currentTime.getHours() + 24);  // 24 hours from now

    const upcomingAppointments = await Appointment.find({
        scheduledTime: { $gte: currentTime, $lte: reminderTime }
    });

    for (const appointment of upcomingAppointments) {
        const notification = new Notification({
            _id: new mongoose.Types.ObjectId(),
            userId: appointment.patientId,
            type: 'Appointment',
            message: 'Reminder: You have an appointment scheduled within the next 24 hours.',
            isRead: false,
            timestamp: new Date()
        });
        await notification.save();
    }

    res.status(200).json({ message: 'Reminders sent successfully.' });
}));

// if a doctor is unavailable, send notifications to affected patients
router.post('/doctorUnavailable', authenticateJWT, authorize(['Admin', 'Doctor']), asyncMiddleware(async (req, res) => {
    const { doctorId, startTime, endTime } = req.body;

    const affectedAppointments = await Appointment.find({
        doctorId: doctorId,
        scheduledTime: { $gte: startTime, $lte: endTime }
    });

    for (const appointment of affectedAppointments) {
        const notification = new Notification({
            _id: new mongoose.Types.ObjectId(),
            userId: appointment.patientId,
            type: 'Appointment',
            message: 'Your upcoming appointment has been affected due to changes in the doctor\'s schedule. Please check for rescheduling options.',
            isRead: false,
            timestamp: new Date()
        });
        await notification.save();
    }

    res.status(200).json({ message: 'Notifications sent to affected patients.' });
}));

// Delete an appointment by ID (Authenticate and Authorize as Admin)
router.delete('/:id', authenticateJWT, authorize(['Admin']), asyncMiddleware(async (req, res) => {
  try {
    const deletedAppointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!deletedAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    };

    const notification = new Notification({
        _id: new mongoose.Types.ObjectId(),
        userId: deletedAppointment.patientId,
        type: 'Appointment',
        message: 'Your upcoming appointment has been deleted. If you have questions, please contact us.',
        isRead: false,
        timestamp: new Date()
    });
    await notification.save();

    res.status(200).json({message: 'Appointment deleted successfully' });
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

module.exports = router;
