const BaseDTO = require('../BaseDTO');
const UserResponseDTO = require('./UserResponseDTO');

/**
 * AuthResponseDTO - Data transfer object for authentication responses
 */
class AuthResponseDTO extends BaseDTO {
  constructor(data = {}) {
    super(data);
  }

  fromObject(data) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.user = data.user instanceof UserResponseDTO 
      ? data.user 
      : new UserResponseDTO(data.user || {});
  }

  /**
   * Get public response (without refresh token for body)
   * @returns {Object}
   */
  toPublicResponse() {
    return {
      accessToken: this.accessToken,
      user: this.user.toObject(),
    };
  }
}

module.exports = AuthResponseDTO;

