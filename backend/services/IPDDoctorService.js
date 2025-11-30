const BaseService = require('../core/BaseService');
const IPDPatientRepository = require('../repositories/IPDPatientRepository');
const AdmissionRequestRepository = require('../repositories/AdmissionRequestRepository');
const DailyDoctorNoteRepository = require('../repositories/DailyDoctorNoteRepository');
const WardRepository = require('../repositories/WardRepository');
const { Appointment } = require('../models');
const { NotFoundError, BadRequestError, ConflictError, ValidationError } = require('../core/errors');
const notificationService = require('./NotificationService');

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
    const wards = await this.wardRepo.findActive();
    // Ensure we always return an array
    return Array.isArray(wards) ? wards : [];
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
   * Submit clinical assessment with comprehensive data storage, locking, and notifications
   * @param {number} appointmentId - Appointment ID
   * @param {number} doctorId - Doctor ID
   * @param {Object} assessmentData - Assessment data
   * @returns {Promise<Object>}
   */
  async submitClinicalAssessment(appointmentId, doctorId, assessmentData) {
    const requestId = `CA-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    console.log(`\n📝 ==================== CLINICAL ASSESSMENT [${requestId}] ====================`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log(`🆔 Appointment ID: ${appointmentId}`);
    console.log(`👨‍⚕️ Doctor ID: ${doctorId}`);

    // Validate required fields
    this.validateRequired(assessmentData, ['clinical_notes', 'requires_admission']);
    
    if (assessmentData.requires_admission === false && !assessmentData.therapy_prescribed) {
      throw new ValidationError('Therapy prescription is required when admission is not needed');
    }

    if (assessmentData.requires_admission === true && !assessmentData.diagnosis) {
      throw new ValidationError('Diagnosis is required for admission');
    }

    console.log(`🔍 Fetching appointment...`);

    // Find appointment - only allow CONFIRMED or APPROVED
    // Assessment submission should happen BEFORE marking as COMPLETED
    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        doctor_id: doctorId,
        status: {
          [require('sequelize').Op.in]: ['CONFIRMED', 'APPROVED']
        },
      },
    });

    if (!appointment) {
      // Check if appointment exists but is already COMPLETED
      const completedAppointment = await Appointment.findOne({
        where: {
          id: appointmentId,
          doctor_id: doctorId,
          status: 'COMPLETED'
        }
      });
      
      if (completedAppointment) {
        console.error(`❌ Appointment already COMPLETED - cannot submit new assessment`);
        throw new ValidationError('This appointment is already completed. Clinical assessment can only be submitted for CONFIRMED or APPROVED appointments.');
      }
      
      console.error(`❌ Appointment not found or not in valid status`);
      throw new NotFoundError('Appointment not found or you are not authorized. Only CONFIRMED or APPROVED appointments can have assessments submitted.');
    }

    console.log(`✅ Appointment found:`);
    console.log(`   Patient ID: ${appointment.user_id}`);
    console.log(`   Status: ${appointment.status} (valid for assessment)`);
    console.log(`   Payment: ${appointment.payment_status}`);

    // Check if assessment already exists (prevent duplicate)
    const { ClinicalAssessment, Doctor, User } = require('../models');
    
    const existingAssessment = await ClinicalAssessment.findOne({
      where: { appointment_id: appointmentId }
    });

    if (existingAssessment && existingAssessment.is_locked) {
      console.error(`❌ Assessment is locked - cannot edit`);
      throw new ValidationError('This assessment is locked and cannot be modified');
    }

    if (existingAssessment && !existingAssessment.is_locked) {
      console.log(`⚠️  Updating existing unlocked assessment (ID: ${existingAssessment.id})`);
    }

    // Get doctor's user_id for audit trail
    const doctorProfile = await Doctor.findByPk(doctorId, { 
      attributes: ['user_id'],
      include: [{ model: User, attributes: ['name'] }]
    });
    const doctorUserId = doctorProfile?.user_id || null;
    const doctorName = doctorProfile?.User?.name || 'Doctor';

    console.log(`👨‍⚕️ Doctor: ${doctorName} (User ID: ${doctorUserId})`);

    // Create or update comprehensive clinical assessment
    console.log(`💾 Saving comprehensive clinical assessment...`);
    
    const now = new Date();
    const assessmentRecord = existingAssessment || ClinicalAssessment.build({});
    
    // Build comprehensive assessment data
    const assessmentFields = {
      appointment_id: appointmentId,
      doctor_id: doctorId,
      patient_id: appointment.user_id,
      clinical_notes: assessmentData.clinical_notes || assessmentData.clinical_assessment,
      diagnosis: assessmentData.diagnosis || null,
      chief_complaint: assessmentData.chief_complaint || appointment.reason,
      vitals: assessmentData.vitals || null,
      physical_examination: assessmentData.physical_examination || null,
      requires_admission: assessmentData.requires_admission,
      therapy_prescribed: assessmentData.requires_admission ? null : assessmentData.therapy_prescribed,
      treatment_plan: assessmentData.treatment_plan || null,
      follow_up_instructions: assessmentData.follow_up_instructions || null,
      follow_up_date: assessmentData.follow_up_date || null,
      admission_details: assessmentData.requires_admission ? assessmentData.admission_details : null,
      lab_tests_ordered: assessmentData.lab_tests_ordered || null,
      imaging_ordered: assessmentData.imaging_ordered || null,
      status: 'submitted',
      is_locked: true, // Lock immediately after submission
      locked_at: now,
      locked_by: doctorUserId,
      submitted_at: now,
      submitted_by: doctorUserId,
      last_modified_by: doctorUserId,
      version: existingAssessment ? existingAssessment.version + 1 : 1,
      internal_notes: assessmentData.internal_notes || null,
    };

    if (existingAssessment) {
      await existingAssessment.update(assessmentFields);
      console.log(`✅ Assessment updated (version ${existingAssessment.version})`);
    } else {
      await ClinicalAssessment.create(assessmentFields);
      console.log(`✅ New assessment created`);
    }

    // Update appointment: mark as COMPLETED with timestamp (if not already)
    console.log(`🔄 Updating appointment...`);
    const updateData = {
      requires_admission: assessmentData.requires_admission,
      therapy_prescribed: assessmentData.requires_admission ? null : assessmentData.therapy_prescribed,
      clinical_assessment: assessmentData.clinical_notes || assessmentData.clinical_assessment,
    };

    // Only update status and completed_at if not already COMPLETED
    if (appointment.status !== 'COMPLETED') {
      updateData.status = 'COMPLETED';
      updateData.completed_at = now;
      console.log(`   Setting status to COMPLETED`);
    } else {
      console.log(`   Status already COMPLETED - preserving existing completed_at`);
    }

    await appointment.update(updateData);
    console.log(`✅ Appointment updated`);

    let admissionRequest = null;

    // If requires admission, create admission request
    if (assessmentData.requires_admission && assessmentData.admission_details) {
      console.log(`🏥 Creating admission request...`);
      try {
        admissionRequest = await this.createAdmissionRequest(
          {
            appointment_id: appointmentId,
            patient_id: appointment.user_id,
            ...assessmentData.admission_details,
          },
          doctorId
        );
        console.log(`✅ Admission request created: ${admissionRequest.id}`);
      } catch (admissionError) {
        console.error(`❌ Error creating admission request:`, admissionError.message);
        // Continue even if admission request fails
      }
    }

    // Send notifications
    console.log(`🔔 Sending notifications...`);
    
    try {
      // Notification to patient
      const patientMessage = assessmentData.requires_admission
        ? `Your appointment with ${doctorName} has been completed. Based on the clinical assessment, you require hospital admission. An admission request has been submitted for approval. You can view the complete assessment details in your appointment history.`
        : `Your appointment with ${doctorName} has been completed. ${doctorName} has prescribed therapy for you. You can view your prescribed therapy and follow-up instructions in your appointment details.`;

      await notificationService.createNotificationHelper({
        userId: appointment.user_id,
        sentByUserId: doctorUserId,
        title: assessmentData.requires_admission 
          ? '🏥 Clinical Assessment Complete - Admission Required'
          : '✅ Clinical Assessment Complete - Therapy Prescribed',
        message: patientMessage,
        type: 'appointment_completed',
        appointmentId: appointmentId,
        optionalLink: `/my-appointments/${appointmentId}/assessment`,
      });

      console.log(`✅ Patient notification sent`);

      // Notify reception/admin staff
      const adminUsers = await User.findAll({
        where: { role: { [require('sequelize').Op.in]: ['admin', 'reception'] } },
        attributes: ['id', 'name']
      });

      for (const admin of adminUsers) {
        await notificationService.createNotificationHelper({
          userId: admin.id,
          sentByUserId: doctorUserId,
          title: '📝 Appointment Completed',
          message: `Dr. ${doctorName} has completed appointment #${appointmentId}. Patient ${assessmentData.requires_admission ? 'requires admission' : 'discharged with therapy'}.`,
          type: 'appointment_completed',
          appointmentId: appointmentId,
          optionalLink: `/admin/appointments/${appointmentId}`,
        });
      }

      console.log(`✅ Staff notifications sent to ${adminUsers.length} users`);

    } catch (notifError) {
      console.error(`⚠️  Failed to send notifications:`, notifError.message);
      // Continue even if notifications fail
    }

    console.log(`🎉 Clinical assessment submission complete`);
    console.log(`📝 ==================== END ASSESSMENT [${requestId}] ====================\n`);

    return {
      success: true,
      appointment,
      assessment: await ClinicalAssessment.findOne({ where: { appointment_id: appointmentId } }),
      admission_request: admissionRequest,
      message: assessmentData.requires_admission 
        ? 'Clinical assessment saved and admission request created. Appointment marked as completed.'
        : 'Clinical assessment saved with therapy prescription. Appointment marked as completed.',
    };
  }

  /**
   * Get clinical assessment for an appointment (for viewing)
   * @param {number} appointmentId - Appointment ID
   * @param {number} userId - User ID requesting the assessment
   * @param {string} userRole - User role (doctor, patient, admin)
   * @returns {Promise<Object>}
   */
  async getClinicalAssessment(appointmentId, userId, userRole) {
    console.log(`\n🔍 Fetching clinical assessment for appointment ${appointmentId}`);
    
    const { ClinicalAssessment, Appointment, Doctor, User } = require('../models');
    
    // Fetch assessment with related data
    const assessment = await ClinicalAssessment.findOne({
      where: { appointment_id: appointmentId },
      include: [
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'user_id', 'doctor_id', 'scheduled_for', 'status', 'reason']
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [{ model: User, attributes: ['name', 'email'] }]
        },
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['name', 'email']
        }
      ]
    });

    if (!assessment) {
      throw new NotFoundError('Clinical assessment');
    }

    // Authorization check
    const appointment = assessment.appointment;
    const isPatient = appointment.user_id === userId;
    const isDoctor = await Doctor.findOne({ where: { user_id: userId } })
      .then(doc => doc && doc.id === appointment.doctor_id);
    const isAdmin = userRole === 'admin' || userRole === 'reception';

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new ValidationError('You do not have permission to view this assessment');
    }

    console.log(`✅ Assessment found and authorized`);
    
    return assessment;
  }

  /**
   * Check if clinical assessment exists and is locked for an appointment
   * @param {number} appointmentId - Appointment ID
   * @returns {Promise<Object>} - { exists: boolean, isLocked: boolean, assessment: Object }
   */
  async checkAssessmentStatus(appointmentId) {
    const { ClinicalAssessment } = require('../models');
    
    const assessment = await ClinicalAssessment.findOne({
      where: { appointment_id: appointmentId },
      attributes: ['id', 'status', 'is_locked', 'submitted_at', 'locked_at']
    });

    if (!assessment) {
      return { exists: false, isLocked: false, assessment: null };
    }

    return {
      exists: true,
      isLocked: assessment.is_locked,
      status: assessment.status,
      submittedAt: assessment.submitted_at,
      lockedAt: assessment.locked_at,
      assessment: assessment
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
