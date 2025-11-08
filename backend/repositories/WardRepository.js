const BaseRepository = require('../core/BaseRepository');
const { Ward, Room, Bed } = require('../models');

/**
 * WardRepository - Handles all ward-related database operations
 */
class WardRepository extends BaseRepository {
  constructor() {
    super(Ward);
  }

  /**
   * Find all wards with room and bed statistics
   * @returns {Promise<Array>}
   */
  async findAllWithStats() {
    return await this.findAll({
      include: [
        {
          model: Room,
          as: 'rooms',
          include: [{ model: Bed, as: 'beds' }],
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  /**
   * Find ward by name
   * @param {string} name - Ward name
   * @returns {Promise<Object|null>}
   */
  async findByName(name) {
    return await this.findOne({ where: { name } });
  }

  /**
   * Find active wards only
   * @returns {Promise<Array>}
   */
  async findActive() {
    return await this.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Update ward status
   * @param {number} wardId - Ward ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<Object|null>}
   */
  async updateStatus(wardId, isActive) {
    return await this.update(wardId, { is_active: isActive });
  }
}

module.exports = WardRepository;
