const BaseRepository = require('../core/BaseRepository');
const { AdmissionRequest, Doctor, User, Ward, Appointment } = require('../models');

/**
 * AdmissionRequestRepository - Handles all admission request database operations
 */
class AdmissionRequestRepository extends BaseRepository {
  constructor() {
    super(AdmissionRequest);
  }

  /**
   * Find all admission requests with full details
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>}
   */
  async findAllWithDetails(status = null) {
    const where = status ? { status } : {};

    return await this.findAll({
      where,
      include: [
        {
          model: Doctor,
          as: 'doctor',
          attributes: ['id', 'first_name', 'last_name', 'specialization'],
          required: false,
        },
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: Ward,
          as: 'recommended_ward',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'scheduled_for', 'status'],
          required: false,
        },
      ],
      order: [
        ['urgency', 'DESC'],
        ['requested_date', 'DESC'],
      ],
    });
  }

  /**
   * Find pending admission requests
   * @returns {Promise<Array>}
   */
  async findPending() {
    return await this.findAllWithDetails('Pending');
  }

  /**
   * Check if patient has pending request
   * @param {number} patientId - Patient ID
   * @returns {Promise<boolean>}
   */
  async hasPendingRequest(patientId) {
    return await this.exists({
      patient_id: patientId,
      status: 'Pending',
    });
  }

  /**
   * Update request status
   * @param {number} id - Request ID
   * @param {string} status - New status
   * @param {string} rejectionReason - Optional rejection reason
   * @returns {Promise<Object|null>}
   */
  async updateStatus(id, status, rejectionReason = null) {
    const data = { status };
    if (rejectionReason) {
      data.rejection_reason = rejectionReason;
    }
    return await this.update(id, data);
  }
}

module.exports = AdmissionRequestRepository;
