const BaseRepository = require('../core/BaseRepository');
const { RefreshToken } = require('../models');

/**
 * RefreshTokenRepository - Handles refresh token database operations
 */
class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken);
  }

  /**
   * Find token
   * @param {string} token - Refresh token
   * @returns {Promise<Object|null>}
   */
  async findByToken(token) {
    return await this.findOne({ where: { token } });
  }

  /**
   * Create refresh token
   * @param {number} userId - User ID
   * @param {string} token - Refresh token
   * @returns {Promise<Object>}
   */
  async createToken(userId, token) {
    return await this.create({
      user_id: userId,
      token,
    });
  }

  /**
   * Delete token
   * @param {string} token - Refresh token to delete
   * @returns {Promise<boolean>}
   */
  async deleteByToken(token) {
    const tokenRecord = await this.findByToken(token);
    if (!tokenRecord) {
      return false;
    }
    await tokenRecord.destroy();
    return true;
  }

  /**
   * Delete all tokens for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of deleted tokens
   */
  async deleteAllForUser(userId) {
    const result = await RefreshToken.destroy({
      where: { user_id: userId },
    });
    return result;
  }

  /**
   * Rotate token (delete old, create new)
   * @param {string} oldToken - Old refresh token
   * @param {number} userId - User ID
   * @param {string} newToken - New refresh token
   * @returns {Promise<Object>}
   */
  async rotateToken(oldToken, userId, newToken) {
    await this.deleteByToken(oldToken);
    return await this.createToken(userId, newToken);
  }
}

module.exports = RefreshTokenRepository;

