/**
 * BaseService - Abstract base class for all service classes
 * Services contain business logic and orchestrate between repositories
 */
class BaseService {
  constructor() {
    if (new.target === BaseService) {
      throw new Error('BaseService is abstract and cannot be instantiated directly');
    }
  }

  /**
   * Log service activity
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  log(message, data = null) {
    const serviceName = this.constructor.name;
    console.log(`📋 [${serviceName}] ${message}`, data || '');
  }

  /**
   * Log error
   * @param {string} message - Error message
   * @param {Error} error - Error object
   */
  logError(message, error) {
    const serviceName = this.constructor.name;
    console.error(`❌ [${serviceName}] ${message}`, error);
  }

  /**
   * Validate required fields
   * @param {Object} data - Data to validate
   * @param {Array} requiredFields - Array of required field names
   * @throws {Error} If validation fails
   */
  validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Execute operation with error handling
   * @param {Function} operation - Async operation to execute
   * @param {string} errorMessage - Error message if operation fails
   */
  async executeOperation(operation, errorMessage) {
    try {
      return await operation();
    } catch (error) {
      this.logError(errorMessage, error);
      throw error;
    }
  }
}

module.exports = BaseService;

