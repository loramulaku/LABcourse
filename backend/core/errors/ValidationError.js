const AppError = require('./AppError');

/**
 * ValidationError - Thrown when input validation fails
 */
class ValidationError extends AppError {
  /**
   * @param {string|Array} errors - Validation error message or array of errors
   */
  constructor(errors) {
    const message = Array.isArray(errors) 
      ? 'Validation failed' 
      : errors;
    
    super(message, 422, 'VALIDATION_ERROR');
    
    this.errors = Array.isArray(errors) ? errors : [errors];
  }
}

module.exports = ValidationError;

