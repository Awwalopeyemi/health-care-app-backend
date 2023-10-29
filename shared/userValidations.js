const { check } = require('express-validator');

const userValidation = [
  check('email', 'Email is required').isEmail(),
  check('password', 'Password is required').isLength({ min: 8 }),
  check('firstName', 'First name is required').notEmpty(),
  check('lastName', 'Last name is required').notEmpty(),
  check('role', 'Role is required').isIn(['Admin', 'Doctor', 'Patient'])
];

module.exports = {
  userValidation
};
