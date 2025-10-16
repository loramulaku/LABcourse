const BaseService = require('../core/BaseService');
const AnalysisRepository = require('../repositories/AnalysisRepository');
const LaboratoryRepository = require('../repositories/LaboratoryRepository');
const { ValidationError, NotFoundError, ConflictError } = require('../core/errors');
const { sequelize } = require('../models');

/**
 * AnalysisService - Handles business logic for analysis operations
 */
class AnalysisService extends BaseService {
  constructor() {
    super();
    this.analysisRepository = new AnalysisRepository();
    this.laboratoryRepository = new LaboratoryRepository();
  }

  /**
   * Get all analysis types
   * @returns {Promise<Array>}
   */
  async getAllTypes() {
    this.log('Fetching all analysis types');
    return await this.analysisRepository.getAllTypes();
  }

  /**
   * Get analysis types by laboratory
   * @param {number} labId - Laboratory ID
   * @returns {Promise<Array>}
   */
  async getTypesByLaboratory(labId) {
    this.log(`Fetching analysis types for laboratory: ${labId}`);
    
    // Verify laboratory exists
    const laboratory = await this.laboratoryRepository.findById(labId);
    if (!laboratory) {
      throw new NotFoundError('Laboratory');
    }

    return await this.analysisRepository.getTypesByLaboratory(labId);
  }

  /**
   * Create analysis request with validation and transaction
   * @param {Object} data - Analysis request data
   * @returns {Promise<number>} Created analysis ID
   */
  async createRequest(data) {
    this.log('Creating analysis request', data);

    // Validate required fields
    this.validateRequired(data, [
      'user_id',
      'analysis_type_id',
      'laboratory_id',
      'appointment_date',
    ]);

    const {
      user_id,
      analysis_type_id,
      laboratory_id,
      appointment_date,
      notes,
    } = data;

    // Verify analysis type exists
    const analysisType = await this.analysisRepository.getTypeById(analysis_type_id);
    if (!analysisType) {
      throw new NotFoundError('Analysis type');
    }

    // Verify laboratory exists
    const laboratory = await this.laboratoryRepository.findById(laboratory_id);
    if (!laboratory) {
      throw new NotFoundError('Laboratory');
    }

    // Normalize datetime to MySQL format
    const mysqlDateTime = this._normalizeDateTime(appointment_date);
    this.log('Normalized datetime', mysqlDateTime);

    // Use transaction to prevent race conditions
    const transaction = await sequelize.transaction();

    try {
      // Check availability within transaction (with lock)
      const isAvailable = await this.analysisRepository.isTimeSlotAvailable(
        laboratory_id,
        mysqlDateTime,
        transaction
      );

      if (!isAvailable) {
        await transaction.rollback();
        throw new ConflictError('Time slot is already booked');
      }

      // Create the analysis request
      const analysis = await this.analysisRepository.createPatientAnalysis(
        {
          user_id,
          analysis_type_id,
          laboratory_id,
          appointment_date: mysqlDateTime,
          notes: notes || null,
          status: 'unconfirmed',
        },
        transaction
      );

      await transaction.commit();
      this.log(`Analysis request created with ID: ${analysis.id}`);

      return analysis.id;
    } catch (error) {
      await transaction.rollback();
      this.logError('Error creating analysis request', error);
      throw error;
    }
  }

  /**
   * Get patient analyses with full details
   * @param {number} userId - User ID
   * @returns {Promise<Array>}
   */
  async getPatientAnalyses(userId) {
    this.log(`Fetching analyses for user: ${userId}`);

    const analyses = await this.analysisRepository.getPatientAnalyses(userId);

    // Transform to maintain backward compatibility with old format
    return analyses.map(analysis => ({
      id: analysis.id,
      user_id: analysis.user_id,
      analysis_type_id: analysis.analysis_type_id,
      laboratory_id: analysis.laboratory_id,
      result: analysis.result,
      status: analysis.status,
      appointment_date: this._formatDateTime(analysis.appointment_date),
      completion_date: analysis.completion_date ? this._formatDateTime(analysis.completion_date) : null,
      notes: analysis.notes,
      created_at: this._formatDateTime(analysis.created_at),
      updated_at: this._formatDateTime(analysis.updated_at),
      analysis_name: analysis.AnalysisType?.name || null,
      laboratory_name: analysis.Laboratory?.User?.name || null,
    }));
  }

  /**
   * Update analysis result
   * @param {number} analysisId - Analysis ID
   * @param {string} result - Result data
   * @param {string} status - Status (default: 'completed')
   * @returns {Promise<Object>}
   */
  async updateResult(analysisId, result, status = 'completed') {
    this.log(`Updating result for analysis: ${analysisId}`);

    // Verify analysis exists
    const analysis = await this.analysisRepository.getPatientAnalysisById(analysisId);
    if (!analysis) {
      throw new NotFoundError('Analysis');
    }

    // Update the result
    const updated = await this.analysisRepository.updateAnalysisResult(analysisId, {
      result,
      status,
    });

    this.log(`Analysis ${analysisId} updated to status: ${status}`);

    return updated;
  }

  /**
   * Get analysis by ID with full details
   * @param {number} analysisId - Analysis ID
   * @returns {Promise<Object>}
   */
  async getAnalysisById(analysisId) {
    this.log(`Fetching analysis: ${analysisId}`);

    const analysis = await this.analysisRepository.getPatientAnalysisById(analysisId);
    
    if (!analysis) {
      throw new NotFoundError('Analysis');
    }

    return analysis;
  }

  /**
   * Get analyses by laboratory
   * @param {number} labId - Laboratory ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>}
   */
  async getAnalysesByLaboratory(labId, filters = {}) {
    this.log(`Fetching analyses for laboratory: ${labId}`);

    // Verify laboratory exists
    const laboratory = await this.laboratoryRepository.findById(labId);
    if (!laboratory) {
      throw new NotFoundError('Laboratory');
    }

    return await this.analysisRepository.getAnalysesByLaboratory(labId, filters);
  }

  /**
   * Cancel analysis
   * @param {number} analysisId - Analysis ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object>}
   */
  async cancelAnalysis(analysisId, userId) {
    this.log(`Cancelling analysis: ${analysisId}`);

    const analysis = await this.analysisRepository.getPatientAnalysisById(analysisId);
    
    if (!analysis) {
      throw new NotFoundError('Analysis');
    }

    // Verify user owns this analysis
    if (analysis.user_id !== userId) {
      throw new ValidationError('You can only cancel your own analyses');
    }

    // Check if analysis can be cancelled
    if (analysis.status === 'completed') {
      throw new ValidationError('Cannot cancel completed analysis');
    }

    const updated = await this.analysisRepository.cancelAnalysis(analysisId);
    this.log(`Analysis ${analysisId} cancelled`);

    return updated;
  }

  /**
   * Update analysis status
   * @param {number} analysisId - Analysis ID
   * @param {string} status - New status
   * @returns {Promise<Object>}
   */
  async updateStatus(analysisId, status) {
    this.log(`Updating status for analysis ${analysisId} to: ${status}`);

    const validStatuses = ['unconfirmed', 'confirmed', 'pending_result', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const analysis = await this.analysisRepository.getPatientAnalysisById(analysisId);
    
    if (!analysis) {
      throw new NotFoundError('Analysis');
    }

    const updated = await this.analysisRepository.updateStatus(analysisId, status);
    this.log(`Analysis ${analysisId} status updated`);

    return updated;
  }

  /**
   * Check if time slot is available
   * @param {number} laboratoryId - Laboratory ID
   * @param {Date|string} appointmentDate - Appointment date
   * @returns {Promise<boolean>}
   */
  async checkTimeSlotAvailability(laboratoryId, appointmentDate) {
    const mysqlDateTime = this._normalizeDateTime(appointmentDate);
    return await this.analysisRepository.isTimeSlotAvailable(laboratoryId, mysqlDateTime);
  }

  /**
   * Get available time slots for a date
   * @param {number} laboratoryId - Laboratory ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>}
   */
  async getAvailableSlots(laboratoryId, date) {
    this.log(`Fetching available slots for laboratory ${laboratoryId} on ${date}`);

    // Verify laboratory exists
    const laboratory = await this.laboratoryRepository.findById(laboratoryId);
    if (!laboratory) {
      throw new NotFoundError('Laboratory');
    }

    return await this.laboratoryRepository.getAvailableSlots(laboratoryId, date);
  }

  /**
   * Normalize datetime to MySQL format
   * @private
   * @param {Date|string} appointmentDate - Appointment date
   * @returns {string} MySQL datetime format (YYYY-MM-DD HH:MM:SS)
   */
  _normalizeDateTime(appointmentDate) {
    if (typeof appointmentDate === 'string') {
      // Handle ISO format: YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS
      const hasSeconds = appointmentDate.match(/T\d{2}:\d{2}:\d{2}$/);
      const normalized = hasSeconds ? appointmentDate : `${appointmentDate}:00`;
      return normalized.replace('T', ' ');
    }

    // Handle Date object
    const d = new Date(appointmentDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    const second = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  /**
   * Format datetime for API response
   * @private
   * @param {Date} date - Date object
   * @returns {string} Formatted datetime (YYYY-MM-DD HH:MM:SS)
   */
  _formatDateTime(date) {
    if (!date) return null;
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    const second = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }
}

module.exports = AnalysisService;

