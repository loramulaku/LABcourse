const AppError = require('./AppError');

/**
 * NotFoundError - Thrown when a resource is not found
 */
class NotFoundError extends AppError {
  /**
   * @param {string} resource - Name of the resource not found
   */
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

module.exports = NotFoundError;

