const BaseDTO = require('../BaseDTO');

/**
 * LoginDTO - Data transfer object for user login
 */
class LoginDTO extends BaseDTO {
  constructor(data = {}) {
    super(data);
  }

  fromObject(data) {
    this.email = data.email;
    this.password = data.password;
  }
}

module.exports = LoginDTO;

