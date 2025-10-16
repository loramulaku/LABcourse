const BaseDTO = require('../BaseDTO');

/**
 * SignupDTO - Data transfer object for user signup
 */
class SignupDTO extends BaseDTO {
  constructor(data = {}) {
    super(data);
  }

  fromObject(data) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'user';
  }

  /**
   * Get sanitized data (without password for logging)
   * @returns {Object}
   */
  getSanitized() {
    return {
      name: this.name,
      email: this.email,
      role: this.role,
    };
  }
}

module.exports = SignupDTO;

