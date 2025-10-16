const AppError = require('./AppError');

/**
 * ConflictError - Thrown when there's a conflict (e.g., duplicate entry)
 */
class ConflictError extends AppError {
  /**
   * @param {string} message - Error message
   */
  constructor(message = 'Conflict detected') {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = ConflictError;

