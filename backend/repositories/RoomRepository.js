const BaseRepository = require('../core/BaseRepository');
const { Room, Ward, Bed } = require('../models');

/**
 * RoomRepository - Handles all room-related database operations
 */
class RoomRepository extends BaseRepository {
  constructor() {
    super(Room);
  }

  /**
   * Find all rooms with ward and bed information
   * @param {number} wardId - Optional ward filter
   * @returns {Promise<Array>}
   */
  async findAllWithDetails(wardId = null) {
    const where = {};
    if (wardId) {
      where.ward_id = wardId;
    }

    return await this.findAll({
      where,
      include: [
        { model: Ward, as: 'ward', attributes: ['id', 'name'] },
        { model: Bed, as: 'beds' },
      ],
      order: [['room_number', 'ASC']],
    });
  }

  /**
   * Find rooms by ward
   * @param {number} wardId - Ward ID
   * @returns {Promise<Array>}
   */
  async findByWard(wardId) {
    return await this.findAll({
      where: { ward_id: wardId, is_active: true },
      order: [['room_number', 'ASC']],
    });
  }

  /**
   * Check if room exists in ward
   * @param {number} wardId - Ward ID
   * @param {string} roomNumber - Room number
   * @returns {Promise<boolean>}
   */
  async existsInWard(wardId, roomNumber) {
    return await this.exists({ ward_id: wardId, room_number: roomNumber });
  }
}

module.exports = RoomRepository;
