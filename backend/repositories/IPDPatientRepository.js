const BaseRepository = require('../core/BaseRepository');
const { IPDPatient, User, Doctor, Ward, Room, Bed, DailyDoctorNote } = require('../models');
const { Op } = require('sequelize');

/**
 * IPDPatientRepository - Handles all IPD patient database operations
 */
class IPDPatientRepository extends BaseRepository {
  constructor() {
    super(IPDPatient);
  }

  /**
   * Find all IPD patients with full details
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>}
   */
  async findAllWithDetails(status = null) {
    const where = {};
    if (status) {
      where.status = status;
    } else {
      where.status = { [Op.ne]: 'Discharged' };
    }

    return await this.findAll({
      where,
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: Doctor,
          as: 'doctor',
          attributes: ['id', 'first_name', 'last_name', 'specialization'],
          required: false,
        },
        {
          model: Ward,
          as: 'ward',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: Room,
          as: 'room',
          attributes: ['id', 'room_number', 'room_type'],
          required: false,
        },
        {
          model: Bed,
          as: 'bed',
          attributes: ['id', 'bed_number', 'status'],
          required: false,
        },
      ],
      order: [['admission_date', 'DESC']],
    });
  }

  /**
   * Find IPD patients by doctor
   * @param {number} doctorId - Doctor ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>}
   */
  async findByDoctor(doctorId, status = null) {
    const where = { doctor_id: doctorId };
    
    if (status) {
      where.status = status;
    } else {
      where.status = { [Op.ne]: 'Discharged' };
    }

    return await this.findAll({
      where,
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: Ward,
          as: 'ward',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: Room,
          as: 'room',
          attributes: ['id', 'room_number', 'room_type'],
          required: false,
        },
        {
          model: Bed,
          as: 'bed',
          attributes: ['id', 'bed_number', 'status'],
          required: false,
        },
      ],
      order: [['admission_date', 'DESC']],
    });
  }

  /**
   * Find IPD patient with complete details including notes
   * @param {number} id - IPD patient ID
   * @returns {Promise<Object|null>}
   */
  async findByIdWithNotes(id) {
    const patient = await this.findById(id, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Ward,
          as: 'ward',
          attributes: ['id', 'name'],
        },
        {
          model: Room,
          as: 'room',
          attributes: ['id', 'room_number', 'room_type'],
        },
        {
          model: Bed,
          as: 'bed',
          attributes: ['id', 'bed_number', 'status'],
        },
      ],
    });

    if (patient) {
      // Fetch notes separately to avoid complex query issues
      const notes = await DailyDoctorNote.findAll({
        where: { ipd_id: id },
        include: [
          {
            model: Doctor,
            as: 'doctor',
            attributes: ['id', 'first_name', 'last_name'],
          },
        ],
        order: [['created_at', 'DESC']],
      });
      patient.daily_notes = notes;
    }

    return patient;
  }

  /**
   * Count current IPD patients
   * @returns {Promise<number>}
   */
  async countCurrent() {
    return await this.count({
      where: {
        status: {
          [Op.in]: ['Admitted', 'UnderCare', 'TransferRequested', 'DischargeRequested'],
        },
      },
    });
  }
}

module.exports = IPDPatientRepository;
