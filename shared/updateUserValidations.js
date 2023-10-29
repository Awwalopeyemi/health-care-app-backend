// shared\updateUserValidations.js
const { check } = require('express-validator');

const updateUserValidation = [
  check('email', 'Email is required').optional().isEmail(),
  check('password', 'Password is required').optional().isLength({ min: 8 }),
  check('firstName', 'First name is required').optional().notEmpty(),
  check('lastName', 'Last name is required').optional().notEmpty(),
  check('role', 'Role is required').optional().isIn(['Admin', 'Doctor', 'Patient'])
];

module.exports = {
    updateUserValidation
};
