const BaseValidator = require('./BaseValidator');
const { ValidationError } = require('../core/errors');

/**
 * AuthValidator - Validates authentication-related data
 */
class AuthValidator extends BaseValidator {
  /**
   * Validate signup data
   * @param {Object} data - Signup data
   * @throws {ValidationError}
   */
  static validateSignup(data) {
    const errors = [];

    // Check required fields
    if (!this.isNotEmpty(data.name)) {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    if (!this.isNotEmpty(data.email)) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!this.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (!this.isNotEmpty(data.password)) {
      errors.push({ field: 'password', message: 'Password is required' });
    } else if (!this.isValidPassword(data.password, { minLength: 6 })) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
    }

    // Validate role if provided
    if (data.role && !['user', 'doctor', 'admin', 'lab'].includes(data.role)) {
      errors.push({ field: 'role', message: 'Invalid role' });
    }

    this.throwIfErrors(errors);
  }

  /**
   * Validate login data
   * @param {Object} data - Login data
   * @throws {ValidationError}
   */
  static validateLogin(data) {
    const errors = [];

    if (!this.isNotEmpty(data.email)) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!this.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (!this.isNotEmpty(data.password)) {
      errors.push({ field: 'password', message: 'Password is required' });
    }

    this.throwIfErrors(errors);
  }

  /**
   * Validate password reset request
   * @param {Object} data - Reset request data
   * @throws {ValidationError}
   */
  static validateForgotPassword(data) {
    const errors = [];

    if (!this.isNotEmpty(data.email)) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!this.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    this.throwIfErrors(errors);
  }

  /**
   * Validate password reset
   * @param {Object} data - Reset data
   * @throws {ValidationError}
   */
  static validateResetPassword(data) {
    const errors = [];

    if (!this.isNotEmpty(data.token)) {
      errors.push({ field: 'token', message: 'Reset token is required' });
    }

    if (!this.isNotEmpty(data.newPassword)) {
      errors.push({ field: 'newPassword', message: 'New password is required' });
    } else if (!this.isValidPassword(data.newPassword, { minLength: 6 })) {
      errors.push({ field: 'newPassword', message: 'Password must be at least 6 characters' });
    }

    this.throwIfErrors(errors);
  }
}

module.exports = AuthValidator;

