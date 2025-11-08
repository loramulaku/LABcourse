const BaseService = require('../core/BaseService');
const IPDPatientRepository = require('../repositories/IPDPatientRepository');
const AdmissionRequestRepository = require('../repositories/AdmissionRequestRepository');
const DailyDoctorNoteRepository = require('../repositories/DailyDoctorNoteRepository');
const WardRepository = require('../repositories/WardRepository');
const { Appointment } = require('../models');
const { NotFoundError, BadRequestError, ConflictError } = require('../core/errors');

/**
 * IPDDoctorService - Handles doctor-specific IPD business logic
 * Manages doctor's IPD patients, notes, and admission requests
 */
class IPDDoctorService extends BaseService {
  constructor() {
    super();
    this.ipdPatientRepo = new IPDPatientRepository();
    this.admissionRequestRepo = new AdmissionRequestRepository();
    this.noteRepo = new DailyDoctorNoteRepository();
    this.wardRepo = new WardRepository();
  }

  /**
   * =================================
   * DOCTOR IPD PATIENT MANAGEMENT
   * =================================
   */

  /**
   * Get doctor's IPD patients
   * @param {number} doctorId - Doctor ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>}
   */
  async getDoctorIPDPatients(doctorId, status = null) {
    this.log(`Fetching IPD patients for doctor ${doctorId}`);
    return await this.ipdPatientRepo.findByDoctor(doctorId, status);
  }

  /**
   * Get IPD patient details (with authorization check)
   * @param {number} patientId - IPD patient ID
   * @param {number} doctorId - Doctor ID (for authorization)
   * @returns {Promise<Object>}
   */
  async getIPDPatientDetails(patientId, doctorId) {
    this.log(`Fetching details for IPD patient ${patientId}`);

    const patient = await this.ipdPatientRepo.findByIdWithNotes(patientId);
    
    if (!patient) {
      throw new NotFoundError('IPD patient');
    }

    // Authorization check
    if (patient.doctor_id !== doctorId) {
      throw new BadRequestError('You do not have access to this patient');
    }

    return patient;
  }

  /**
   * =================================
   * ADMISSION REQUEST CREATION
   * =================================
   */

  /**
   * Get available wards for admission requests
   * @returns {Promise<Array>}
   */
  async getAvailableWards() {
    this.log('Fetching available wards');
    return await this.wardRepo.findActive();
  }

  /**
   * Create admission request from confirmed appointment
   * @param {Object} requestData - Request data
   * @param {number} doctorId - Doctor ID
   * @returns {Promise<Object>}
   */
  async createAdmissionRequest(requestData, doctorId) {
    this.validateRequired(requestData, ['patient_id', 'diagnosis']);
    this.log(`Creating admission request for patient ${requestData.patient_id}`);

    // Verify appointment if provided
    if (requestData.appointment_id) {
      const appointment = await Appointment.findByPk(requestData.appointment_id);
      if (!appointment) {
        throw new NotFoundError('Appointment');
      }

      // Business rule: Only confirmed appointments can have admission requests
      if (appointment.status !== 'CONFIRMED') {
        throw new BadRequestError('Only confirmed appointments can create admission requests');
      }
    }

    // Verify recommended ward if provided
    if (requestData.recommended_ward_id) {
      const ward = await this.wardRepo.findById(requestData.recommended_ward_id);
      if (!ward) {
        throw new NotFoundError('Recommended ward');
      }
    }

    // Check for existing pending request
    const hasPending = await this.admissionRequestRepo.hasPendingRequest(requestData.patient_id);
    if (hasPending) {
      throw new ConflictError('There is already a pending admission request for this patient');
    }

    const request = await this.admissionRequestRepo.create({
      appointment_id: requestData.appointment_id || null,
      doctor_id: doctorId,
      patient_id: requestData.patient_id,
      recommended_ward_id: requestData.recommended_ward_id || null,
      recommended_room_type: requestData.recommended_room_type || null,
      diagnosis: requestData.diagnosis,
      treatment_plan: requestData.treatment_plan || null,
      urgency: requestData.urgency || 'Normal',
      status: 'Pending',
    });

    this.log(`Admission request created: ${request.id}`);

    // Return with patient details
    return await this.admissionRequestRepo.findById(request.id, {
      include: [
        {
          model: require('../models').User,
          as: 'patient',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
        {
          model: require('../models').Ward,
          as: 'recommended_ward',
          attributes: ['id', 'name'],
        },
      ],
    });
  }

  /**
   * =================================
   * CLINICAL ASSESSMENT FOR CONFIRMED APPOINTMENTS
   * =================================
   */

  /**
   * Submit clinical assessment and conditionally create admission request
   * @param {number} appointmentId - Appointment ID
   * @param {number} doctorId - Doctor ID
   * @param {Object} assessmentData - Assessment data
   * @returns {Promise<Object>}
   */
  async submitClinicalAssessment(appointmentId, doctorId, assessmentData) {
    this.validateRequired(assessmentData, ['clinical_assessment', 'requires_admission']);
    this.log(`Submitting clinical assessment for appointment ${appointmentId}`);

    // Find appointment
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        doctor_id: doctorId,
        status: 'CONFIRMED',
      },
    });

    if (!appointment) {
      throw new NotFoundError('Confirmed appointment');
    }

    // Update appointment with assessment
    await appointment.update({
      requires_admission: assessmentData.requires_admission,
      therapy_prescribed: assessmentData.requires_admission ? null : assessmentData.therapy_prescribed,
      clinical_assessment: assessmentData.clinical_assessment,
    });

    // If requires admission, create admission request
    if (assessmentData.requires_admission && assessmentData.admission_details) {
      const admissionRequest = await this.createAdmissionRequest(
        {
          appointment_id: appointmentId,
          patient_id: appointment.user_id,
          ...assessmentData.admission_details,
        },
        doctorId
      );

      this.log(`Clinical assessment saved and admission request created`);

      return {
        appointment,
        admission_request: admissionRequest,
        message: 'Clinical assessment saved and admission request created',
      };
    }

    // Therapy only
    this.log(`Clinical assessment saved - therapy prescribed`);

    return {
      appointment,
      message: 'Clinical assessment saved - therapy prescribed',
    };
  }

  /**
   * =================================
   * DAILY DOCTOR NOTES
   * =================================
   */

  /**
   * Add daily progress note
   * @param {number} ipdId - IPD patient ID
   * @param {number} doctorId - Doctor ID
   * @param {string} note - Note content
   * @returns {Promise<Object>}
   */
  async addDailyNote(ipdId, doctorId, note) {
    if (!note || !note.trim()) {
      throw new BadRequestError('Note content is required');
    }

    this.log(`Adding note to IPD patient ${ipdId}`);

    // Verify patient belongs to doctor
    const patient = await this.ipdPatientRepo.findOne({
      where: {
        id: ipdId,
        doctor_id: doctorId,
      },
    });

    if (!patient) {
      throw new NotFoundError('IPD patient or access denied');
    }

    const dailyNote = await this.noteRepo.createNote(ipdId, doctorId, note);

    // Return with doctor info
    return await this.noteRepo.findById(dailyNote.id, {
      include: [
        {
          model: require('../models').Doctor,
          as: 'doctor',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
    });
  }

  /**
   * Get IPD patient notes
   * @param {number} ipdId - IPD patient ID
   * @param {number} doctorId - Doctor ID (for authorization)
   * @returns {Promise<Array>}
   */
  async getIPDPatientNotes(ipdId, doctorId) {
    this.log(`Fetching notes for IPD patient ${ipdId}`);

    // Verify access
    const patient = await this.ipdPatientRepo.findOne({
      where: {
        id: ipdId,
        doctor_id: doctorId,
      },
    });

    if (!patient) {
      throw new NotFoundError('IPD patient or access denied');
    }

    return await this.noteRepo.findByIPDPatient(ipdId);
  }

  /**
   * =================================
   * TREATMENT PLAN MANAGEMENT
   * =================================
   */

  /**
   * Update treatment plan
   * @param {number} ipdId - IPD patient ID
   * @param {number} doctorId - Doctor ID
   * @param {string} treatmentPlan - Treatment plan
   * @returns {Promise<Object>}
   */
  async updateTreatmentPlan(ipdId, doctorId, treatmentPlan) {
    if (!treatmentPlan || !treatmentPlan.trim()) {
      throw new BadRequestError('Treatment plan is required');
    }

    this.log(`Updating treatment plan for IPD patient ${ipdId}`);

    const patient = await this.ipdPatientRepo.findOne({
      where: {
        id: ipdId,
        doctor_id: doctorId,
      },
    });

    if (!patient) {
      throw new NotFoundError('IPD patient or access denied');
    }

    // Update treatment plan
    await this.ipdPatientRepo.update(ipdId, { treatment_plan: treatmentPlan });

    // Also create a note about the update
    await this.noteRepo.createNote(
      ipdId,
      doctorId,
      `Treatment plan updated: ${treatmentPlan}`
    );

    return await this.ipdPatientRepo.findById(ipdId);
  }

  /**
   * =================================
   * TRANSFER & DISCHARGE REQUESTS
   * =================================
   */

  /**
   * Request patient transfer
   * @param {number} ipdId - IPD patient ID
   * @param {number} doctorId - Doctor ID
   * @param {Object} transferData - Transfer request data
   * @returns {Promise<Object>}
   */
  async requestTransfer(ipdId, doctorId, transferData) {
    this.log(`Requesting transfer for IPD patient ${ipdId}`);

    const patient = await this.ipdPatientRepo.findOne({
      where: {
        id: ipdId,
        doctor_id: doctorId,
      },
    });

    if (!patient) {
      throw new NotFoundError('IPD patient or access denied');
    }

    if (patient.status === 'TransferRequested') {
      throw new BadRequestError('Transfer has already been requested for this patient');
    }

    // Verify suggested ward if provided
    if (transferData.suggested_ward_id) {
      const ward = await this.wardRepo.findById(transferData.suggested_ward_id);
      if (!ward) {
        throw new NotFoundError('Suggested ward');
      }
    }

    // Update status
    await this.ipdPatientRepo.update(ipdId, { status: 'TransferRequested' });

    // Create note
    const noteContent = `Transfer requested. Reason: ${transferData.reason || 'Not specified'}. Suggested ward: ${transferData.suggested_ward_id || 'Not specified'}`;
    await this.noteRepo.createNote(ipdId, doctorId, noteContent);

    this.log(`Transfer request submitted for patient ${ipdId}`);

    return await this.ipdPatientRepo.findById(ipdId);
  }

  /**
   * Request patient discharge
   * @param {number} ipdId - IPD patient ID
   * @param {number} doctorId - Doctor ID
   * @param {string} dischargeSummary - Discharge summary
   * @returns {Promise<Object>}
   */
  async requestDischarge(ipdId, doctorId, dischargeSummary) {
    this.log(`Requesting discharge for IPD patient ${ipdId}`);

    const patient = await this.ipdPatientRepo.findOne({
      where: {
        id: ipdId,
        doctor_id: doctorId,
      },
    });

    if (!patient) {
      throw new NotFoundError('IPD patient or access denied');
    }

    if (['DischargeRequested', 'Discharged'].includes(patient.status)) {
      throw new BadRequestError('Discharge has already been requested or completed for this patient');
    }

    // Update status
    await this.ipdPatientRepo.update(ipdId, { status: 'DischargeRequested' });

    // Create note
    const noteContent = `Discharge requested. Summary: ${dischargeSummary || 'Patient recovered and ready for discharge'}`;
    await this.noteRepo.createNote(ipdId, doctorId, noteContent);

    this.log(`Discharge request submitted for patient ${ipdId}`);

    return await this.ipdPatientRepo.findById(ipdId);
  }
}

module.exports = IPDDoctorService;
