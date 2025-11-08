const BaseRepository = require('../core/BaseRepository');
const { DailyDoctorNote, Doctor } = require('../models');

/**
 * DailyDoctorNoteRepository - Handles all daily doctor note database operations
 */
class DailyDoctorNoteRepository extends BaseRepository {
  constructor() {
    super(DailyDoctorNote);
  }

  /**
   * Find notes by IPD patient
   * @param {number} ipdId - IPD patient ID
   * @returns {Promise<Array>}
   */
  async findByIPDPatient(ipdId) {
    return await this.findAll({
      where: { ipd_id: ipdId },
      include: [
        {
          model: Doctor,
          as: 'doctor',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Create note with validation
   * @param {number} ipdId - IPD patient ID
   * @param {number} doctorId - Doctor ID
   * @param {string} note - Note content
   * @returns {Promise<Object>}
   */
  async createNote(ipdId, doctorId, note) {
    return await this.create({
      ipd_id: ipdId,
      doctor_id: doctorId,
      note,
    });
  }

  /**
   * Find notes by doctor
   * @param {number} doctorId - Doctor ID
   * @param {number} limit - Optional limit
   * @returns {Promise<Array>}
   */
  async findByDoctor(doctorId, limit = null) {
    const options = {
      where: { doctor_id: doctorId },
      order: [['created_at', 'DESC']],
    };

    if (limit) {
      options.limit = limit;
    }

    return await this.findAll(options);
  }
}

module.exports = DailyDoctorNoteRepository;
