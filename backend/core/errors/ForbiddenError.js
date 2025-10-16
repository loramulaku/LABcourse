const AppError = require('./AppError');

/**
 * ForbiddenError - Thrown when user doesn't have permission
 */
class ForbiddenError extends AppError {
  /**
   * @param {string} message - Error message
   */
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

module.exports = ForbiddenError;

