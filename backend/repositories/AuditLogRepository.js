const BaseRepository = require('../core/BaseRepository');
const { AuditLog } = require('../models');

/**
 * AuditLogRepository - Handles audit log database operations
 */
class AuditLogRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }

  /**
   * Log an action
   * @param {Object} logData - Log data
   * @returns {Promise<Object>}
   */
  async log(logData) {
    return await this.create({
      user_id: logData.userId,
      action: logData.action,
      details: logData.details,
      ip_address: logData.ipAddress,
      created_by: logData.createdBy,
    });
  }

  /**
   * Get logs for user
   * @param {number} userId - User ID
   * @param {number} limit - Max records to return
   * @returns {Promise<Array>}
   */
  async getLogsForUser(userId, limit = 50) {
    return await this.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
    });
  }

  /**
   * Get logs by action type
   * @param {string} action - Action type
   * @param {number} limit - Max records to return
   * @returns {Promise<Array>}
   */
  async getLogsByAction(action, limit = 50) {
    return await this.findAll({
      where: { action },
      order: [['created_at', 'DESC']],
      limit,
    });
  }
}

module.exports = AuditLogRepository;

