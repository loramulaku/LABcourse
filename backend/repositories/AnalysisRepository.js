const BaseRepository = require('../core/BaseRepository');
const { AnalysisType, PatientAnalysis, Laboratory, User } = require('../models');

/**
 * AnalysisRepository - Handles database operations for analysis-related entities
 */
class AnalysisRepository extends BaseRepository {
  constructor() {
    super(PatientAnalysis);
    this.AnalysisType = AnalysisType;
  }

  /**
   * Get all analysis types
   * @returns {Promise<Array>}
   */
  async getAllTypes() {
    return await this.AnalysisType.findAll({
      include: [
        {
          model: Laboratory,
          include: [{ model: User, attributes: ['id', 'name', 'email'] }],
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  /**
   * Get analysis types by laboratory
   * @param {number} labId - Laboratory ID
   * @returns {Promise<Array>}
   */
  async getTypesByLaboratory(labId) {
    return await this.AnalysisType.findAll({
      where: { laboratory_id: labId },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Get analysis type by ID
   * @param {number} typeId - Analysis type ID
   * @returns {Promise<Object|null>}
   */
  async getTypeById(typeId) {
    return await this.AnalysisType.findByPk(typeId);
  }

  /**
   * Create a new patient analysis request
   * @param {Object} data - Analysis data
   * @param {Object} transaction - Sequelize transaction (optional)
   * @returns {Promise<Object>}
   */
  async createPatientAnalysis(data, transaction = null) {
    const options = transaction ? { transaction } : {};
    return await this.model.create(data, options);
  }

  /**
   * Get patient analyses with full details
   * @param {number} userId - User ID
   * @returns {Promise<Array>}
   */
  async getPatientAnalyses(userId) {
    return await this.model.findAll({
      where: { user_id: userId },
      include: [
        {
          model: AnalysisType,
          attributes: ['id', 'name', 'description', 'price', 'unit', 'normal_range'],
        },
        {
          model: Laboratory,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get patient analysis by ID
   * @param {number} analysisId - Patient analysis ID
   * @returns {Promise<Object|null>}
   */
  async getPatientAnalysisById(analysisId) {
    return await this.model.findByPk(analysisId, {
      include: [
        {
          model: AnalysisType,
          attributes: ['id', 'name', 'description', 'price', 'unit', 'normal_range'],
        },
        {
          model: Laboratory,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });
  }

  /**
   * Check if a time slot is available
   * @param {number} laboratoryId - Laboratory ID
   * @param {Date|string} appointmentDate - Appointment date
   * @param {Object} transaction - Sequelize transaction (optional)
   * @returns {Promise<boolean>}
   */
  async isTimeSlotAvailable(laboratoryId, appointmentDate, transaction = null) {
    const options = {
      where: {
        laboratory_id: laboratoryId,
        appointment_date: appointmentDate,
        status: {
          [require('sequelize').Op.ne]: 'cancelled',
        },
      },
    };

    if (transaction) {
      options.transaction = transaction;
      options.lock = transaction.LOCK.UPDATE; // Lock for update in transaction
    }

    const count = await this.model.count(options);
    return count === 0;
  }

  /**
   * Update analysis result
   * @param {number} analysisId - Patient analysis ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>}
   */
  async updateAnalysisResult(analysisId, updateData) {
    const analysis = await this.model.findByPk(analysisId);
    
    if (!analysis) {
      return null;
    }

    return await analysis.update({
      ...updateData,
      completion_date: updateData.status === 'completed' ? new Date() : analysis.completion_date,
    });
  }

  /**
   * Get analyses by laboratory
   * @param {number} labId - Laboratory ID
   * @param {Object} filters - Optional filters (status, date range, etc.)
   * @returns {Promise<Array>}
   */
  async getAnalysesByLaboratory(labId, filters = {}) {
    const where = { laboratory_id: labId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      const { Op } = require('sequelize');
      where.appointment_date = {
        [Op.between]: [filters.startDate, filters.endDate],
      };
    }

    return await this.model.findAll({
      where,
      include: [
        {
          model: AnalysisType,
          attributes: ['id', 'name', 'description', 'price'],
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
      order: [['appointment_date', 'ASC']],
    });
  }

  /**
   * Cancel an analysis
   * @param {number} analysisId - Patient analysis ID
   * @returns {Promise<Object|null>}
   */
  async cancelAnalysis(analysisId) {
    const analysis = await this.model.findByPk(analysisId);
    
    if (!analysis) {
      return null;
    }

    return await analysis.update({ status: 'cancelled' });
  }

  /**
   * Update analysis status
   * @param {number} analysisId - Patient analysis ID
   * @param {string} status - New status
   * @returns {Promise<Object|null>}
   */
  async updateStatus(analysisId, status) {
    const analysis = await this.model.findByPk(analysisId);
    
    if (!analysis) {
      return null;
    }

    return await analysis.update({ status });
  }
}

module.exports = AnalysisRepository;

