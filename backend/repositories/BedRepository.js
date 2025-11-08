const BaseRepository = require('../core/BaseRepository');
const { Bed, Room, Ward } = require('../models');
const { Op } = require('sequelize');

/**
 * BedRepository - Handles all bed-related database operations
 */
class BedRepository extends BaseRepository {
  constructor() {
    super(Bed);
  }

  /**
   * Find all beds with room and ward hierarchy
   * @param {number} roomId - Optional room filter
   * @returns {Promise<Array>}
   */
  async findAllWithHierarchy(roomId = null) {
    const where = {};
    if (roomId) {
      where.room_id = roomId;
    }

    return await this.findAll({
      where,
      include: [
        {
          model: Room,
          as: 'room',
          attributes: ['id', 'room_number', 'room_type'],
          include: [
            {
              model: Ward,
              as: 'ward',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['bed_number', 'ASC']],
    });
  }

  /**
   * Find available beds by room
   * @param {number} roomId - Room ID
   * @returns {Promise<Array>}
   */
  async findAvailableByRoom(roomId) {
    return await this.findAll({
      where: {
        room_id: roomId,
        status: 'Available',
      },
      order: [['bed_number', 'ASC']],
    });
  }

  /**
   * Update bed status
   * @param {number} bedId - Bed ID
   * @param {string} status - New status
   * @returns {Promise<Object|null>}
   */
  async updateStatus(bedId, status) {
    return await this.update(bedId, { status });
  }

  /**
   * Count beds by status
   * @param {string} status - Bed status
   * @returns {Promise<number>}
   */
  async countByStatus(status) {
    return await this.count({ where: { status } });
  }

  /**
   * Check if bed is available
   * @param {number} bedId - Bed ID
   * @returns {Promise<boolean>}
   */
  async isAvailable(bedId) {
    const bed = await this.findById(bedId);
    return bed && bed.status === 'Available';
  }
}

module.exports = BedRepository;
