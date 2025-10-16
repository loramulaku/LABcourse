const BaseDTO = require('../BaseDTO');

/**
 * UserResponseDTO - Data transfer object for user responses
 * Excludes sensitive information like password
 */
class UserResponseDTO extends BaseDTO {
  constructor(data = {}) {
    super(data);
  }

  fromObject(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.role = data.role;
    this.account_status = data.account_status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create from Sequelize model instance
   * @param {Object} user - User model instance
   * @returns {UserResponseDTO}
   */
  static fromModel(user) {
    if (!user) return null;
    
    const userData = user.toJSON ? user.toJSON() : user;
    delete userData.password; // Ensure password is never included
    
    return new UserResponseDTO(userData);
  }

  /**
   * Create array from Sequelize models
   * @param {Array} users - Array of user model instances
   * @returns {Array<UserResponseDTO>}
   */
  static fromModels(users) {
    return users.map(user => UserResponseDTO.fromModel(user));
  }
}

module.exports = UserResponseDTO;

