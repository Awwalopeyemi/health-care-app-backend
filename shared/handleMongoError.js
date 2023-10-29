// shared\sharedValidations.js
// Helper function to handle Mongoose errors
const handleMongoError = (error) => {
  let errorMessage = "An error occurred";
  let statusCode = 500; // Default to Internal Server Error

  if (error.name === 'ValidationError') {
    errorMessage = Object.values(error.errors).map(val => val.message).join(', ');
    statusCode = 400; // Bad Request
  } else if (error.code && error.code === 11000) {
    errorMessage = "Duplicate value detected";
    statusCode = 409; // Conflict
  } else if (error.name === 'CastError') {
    errorMessage = `Invalid ${error.path}: ${error.value}`;
    statusCode = 400; // Bad Request
  }

  return { message: errorMessage, status: statusCode };
};

module.exports = handleMongoError;

