const BaseRepository = require('../core/BaseRepository');
const { User, UserProfile, RefreshToken } = require('../models');

/**
 * UserRepository - Handles all user database operations
 */
class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return await this.findOne({ where: { email } });
  }

  /**
   * Find user with profile
   * @param {number} id - User ID
   * @returns {Promise<Object|null>}
   */
  async findWithProfile(id) {
    return await this.findById(id, {
      include: [{ model: UserProfile }],
      attributes: { exclude: ['password'] },
    });
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    return await this.exists({ email });
  }

  /**
   * Create user with profile
   * @param {Object} userData - User data
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>}
   */
  async createWithProfile(userData, profileData = {}) {
    const user = await this.create(userData);
    
    await UserProfile.create({
      user_id: user.id,
      profile_image: profileData.profile_image || 'uploads/default.png',
      ...profileData,
    });

    return user;
  }

  /**
   * Update user status
   * @param {number} userId - User ID
   * @param {string} status - New status
   * @param {number} verifiedBy - ID of user who verified
   * @returns {Promise<Object|null>}
   */
  async updateStatus(userId, status, verifiedBy) {
    return await this.update(userId, {
      account_status: status,
      verified_by: verifiedBy,
      verified_at: new Date(),
    });
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Promise<Array>}
   */
  async findByRole(role) {
    return await this.findAll({
      where: { role },
      attributes: { exclude: ['password'] },
      include: [{ model: UserProfile }],
    });
  }

  /**
   * Get safe user data (without password)
   * @param {number} id - User ID
   * @returns {Promise<Object|null>}
   */
  async findSafeById(id) {
    return await this.findById(id, {
      attributes: { exclude: ['password'] },
    });
  }
}

module.exports = UserRepository;

