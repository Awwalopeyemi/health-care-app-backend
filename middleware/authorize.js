// middleware/authorize.js
const Appointment = require('../models/Appointment');

const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    const { role, id } = req.user;

    if (role === 'Admin') {
      return next();
    }

    if (role === 'Doctor') {
      if (id.toString() === req.params.id.toString()) {
        return next();
      }
    }

    try {
      const appointment = await Appointment.findById(req.params.appointmentId);

      if (role === 'Doctor') {
        if (appointment && appointment.doctorId.toString() === id.toString()) {
          return next();
        }
      }

      if (role === 'Patient') {
        if (appointment && appointment.patientId.toString() === id.toString()) {
          return next();
        }
      }

      if (allowedRoles.includes(role)) {
        return next();
      }

      res.status(403).json({ message: 'Access forbidden: You do not have permission' });

    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
};

module.exports = authorize;
