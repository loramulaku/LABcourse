const AppError = require('./AppError');

/**
 * UnauthorizedError - Thrown when authentication fails
 */
class UnauthorizedError extends AppError {
  /**
   * @param {string} message - Error message
   */
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

module.exports = UnauthorizedError;

