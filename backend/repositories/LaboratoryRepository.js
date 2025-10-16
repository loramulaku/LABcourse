const BaseRepository = require('../core/BaseRepository');
const { Laboratory, User, AnalysisType, PatientAnalysis } = require('../models');

/**
 * LaboratoryRepository - Handles database operations for laboratories
 */
class LaboratoryRepository extends BaseRepository {
  constructor() {
    super(Laboratory);
  }

  /**
   * Get all laboratories with user info
   * @returns {Promise<Array>}
   */
  async getAllWithDetails() {
    return await this.model.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'image'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get laboratory by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async getByUserId(userId) {
    return await this.model.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'image'],
        },
      ],
    });
  }

  /**
   * Get laboratory with analysis types
   * @param {number} labId - Laboratory ID
   * @returns {Promise<Object|null>}
   */
  async getWithAnalysisTypes(labId) {
    return await this.model.findByPk(labId, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'image'],
        },
        {
          model: AnalysisType,
          order: [['name', 'ASC']],
        },
      ],
    });
  }

  /**
   * Create laboratory with user relationship
   * @param {Object} data - Laboratory data
   * @returns {Promise<Object>}
   */
  async createLaboratory(data) {
    return await this.model.create(data);
  }

  /**
   * Update laboratory info
   * @param {number} labId - Laboratory ID
   * @param {Object} data - Update data
   * @returns {Promise<Object|null>}
   */
  async updateLaboratory(labId, data) {
    const laboratory = await this.model.findByPk(labId);
    
    if (!laboratory) {
      return null;
    }

    return await laboratory.update(data);
  }

  /**
   * Check if time slot is available
   * @param {number} laboratoryId - Laboratory ID
   * @param {Date|string} appointmentDate - Appointment date
   * @returns {Promise<boolean>}
   */
  async isTimeSlotAvailable(laboratoryId, appointmentDate) {
    const { Op } = require('sequelize');
    
    const count = await PatientAnalysis.count({
      where: {
        laboratory_id: laboratoryId,
        appointment_date: appointmentDate,
        status: {
          [Op.ne]: 'cancelled',
        },
      },
    });

    return count === 0;
  }

  /**
   * Get available time slots for a laboratory on a specific date
   * @param {number} laboratoryId - Laboratory ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>}
   */
  async getAvailableSlots(laboratoryId, date) {
    const { Op } = require('sequelize');
    
    // Get all booked appointments for the date
    const bookedAppointments = await PatientAnalysis.findAll({
      where: {
        laboratory_id: laboratoryId,
        appointment_date: {
          [Op.startsWith]: date, // Matches all times on this date
        },
        status: {
          [Op.ne]: 'cancelled',
        },
      },
      attributes: ['appointment_date'],
    });

    // Convert to set of booked times for efficient lookup
    const bookedTimes = new Set(
      bookedAppointments.map(a => {
        const dateStr = a.appointment_date.toISOString().split('T')[0];
        const timeStr = a.appointment_date.toTimeString().split(' ')[0].slice(0, 5);
        return `${dateStr}T${timeStr}`;
      })
    );

    // Generate all possible slots (8:00 AM to 6:00 PM, 30-min intervals)
    const slots = [];
    const startHour = 8;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        slots.push({
          time: timeSlot,
          displayTime: this._formatDisplayTime(hour, minute),
          isAvailable: !bookedTimes.has(timeSlot),
        });
      }
    }

    return slots;
  }

  /**
   * Format time for display
   * @private
   * @param {number} hour - Hour (0-23)
   * @param {number} minute - Minute
   * @returns {string}
   */
  _formatDisplayTime(hour, minute) {
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }

  /**
   * Get laboratory statistics
   * @param {number} labId - Laboratory ID
   * @returns {Promise<Object>}
   */
  async getStatistics(labId) {
    const { Op } = require('sequelize');
    
    const totalAnalyses = await PatientAnalysis.count({
      where: { laboratory_id: labId },
    });

    const completedAnalyses = await PatientAnalysis.count({
      where: { 
        laboratory_id: labId,
        status: 'completed',
      },
    });

    const pendingAnalyses = await PatientAnalysis.count({
      where: { 
        laboratory_id: labId,
        status: {
          [Op.in]: ['unconfirmed', 'confirmed', 'pending_result'],
        },
      },
    });

    const upcomingAppointments = await PatientAnalysis.count({
      where: { 
        laboratory_id: labId,
        status: 'confirmed',
        appointment_date: {
          [Op.gte]: new Date(),
        },
      },
    });

    return {
      totalAnalyses,
      completedAnalyses,
      pendingAnalyses,
      upcomingAppointments,
    };
  }

  /**
   * Search laboratories by name or location
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  async searchLaboratories(query) {
    const { Op } = require('sequelize');
    
    return await this.model.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'image'],
          where: {
            [Op.or]: [
              { name: { [Op.like]: `%${query}%` } },
            ],
          },
        },
      ],
      where: {
        [Op.or]: [
          { address: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
        ],
      },
    });
  }
}

module.exports = LaboratoryRepository;

