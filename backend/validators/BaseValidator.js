const { ValidationError } = require('../core/errors');

/**
 * BaseValidator - Base class for all validators
 */
class BaseValidator {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @param {Object} options - Validation options
   * @returns {boolean}
   */
  static isValidPassword(password, options = {}) {
    const {
      minLength = 8,
      requireUppercase = false,
      requireLowercase = false,
      requireNumbers = false,
      requireSpecialChars = false,
    } = options;

    if (!password || password.length < minLength) {
      return false;
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      return false;
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      return false;
    }

    if (requireNumbers && !/\d/.test(password)) {
      return false;
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return false;
    }

    return true;
  }

  /**
   * Check if value is not empty
   * @param {*} value - Value to check
   * @returns {boolean}
   */
  static isNotEmpty(value) {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return false;
    }
    return true;
  }

  /**
   * Validate required fields
   * @param {Object} data - Data to validate
   * @param {Array<string>} requiredFields - Required field names
   * @throws {ValidationError}
   */
  static validateRequired(data, requiredFields) {
    const errors = [];

    requiredFields.forEach(field => {
      if (!this.isNotEmpty(data[field])) {
        errors.push({
          field,
          message: `${field} is required`,
        });
      }
    });

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }

  /**
   * Collect validation errors
   * @param {Array} errors - Array of errors
   * @throws {ValidationError}
   */
  static throwIfErrors(errors) {
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }
}

module.exports = BaseValidator;

