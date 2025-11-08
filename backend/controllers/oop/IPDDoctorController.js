const BaseController = require('../../core/BaseController');
const IPDDoctorService = require('../../services/IPDDoctorService');
const { AppError } = require('../../core/errors');

/**
 * IPDDoctorController - Handles HTTP requests for doctor IPD operations
 * Follows layered architecture: Controller → Service → Repository
 */
class IPDDoctorController extends BaseController {
  constructor() {
    super();
    this.ipdDoctorService = new IPDDoctorService();
    this.bindMethods();
  }

  /**
   * Extract doctor ID from authenticated user
   * Assumes doctor profile has user_id matching req.user.id
   */
  async getDoctorId(userId) {
    const { Doctor } = require('../../models');
    const doctor = await Doctor.findOne({
      where: { user_id: userId },
      attributes: ['id'],
    });
    return doctor ? doctor.id : null;
  }

  /**
   * =================================
   * DOCTOR IPD PATIENT MANAGEMENT
   * =================================
   */

  /**
   * GET /api/ipd/doctor/my-patients
   */
  async getMyIPDPatients(req, res) {
    try {
      const doctorId = await this.getDoctorId(req.user.id);
      if (!doctorId) {
        return this.notFound(res, 'Doctor profile not found');
      }

      const status = req.query.status || null;
      const patients = await this.ipdDoctorService.getDoctorIPDPatients(doctorId, status);
      
      return this.success(res, {
        data: patients,
        count: patients.length,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * GET /api/ipd/doctor/patients/:id
   */
  async getIPDPatientDetails(req, res) {
    try {
      const doctorId = await this.getDoctorId(req.user.id);
      if (!doctorId) {
        return this.notFound(res, 'Doctor profile not found');
      }

      const patient = await this.ipdDoctorService.getIPDPatientDetails(req.params.id, doctorId);
      
      return this.success(res, { data: patient });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * =================================
   * ADMISSION REQUESTS
   * =================================
   */

  /**
   * GET /api/ipd/doctor/wards
   */
  async getAvailableWards(req, res) {
    try {
      const wards = await this.ipdDoctorService.getAvailableWards();
      
      return this.success(res, {
        data: wards,
        count: wards.length,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * POST /api/ipd/doctor/admission-request
   */
  async createAdmissionRequest(req, res) {
    try {
      const doctorId = await this.getDoctorId(req.user.id);
      if (!doctorId) {
        return this.notFound(res, 'Doctor profile not found');
      }

      const request = await this.ipdDoctorService.createAdmissionRequest(req.body, doctorId);
      
      return this.created(res, {
        data: request,
        message: 'Admission request created successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * =================================
   * CLINICAL ASSESSMENT (CONFIRMED APPOINTMENTS)
   * =================================
   */

  /**
   * POST /api/doctor/appointment/:id/clinical-assessment
   * This endpoint replaces the one in doctorDashboardRoutes
   */
  async submitClinicalAssessment(req, res) {
    try {
      const doctorId = await this.getDoctorId(req.user.id);
      if (!doctorId) {
        return this.notFound(res, 'Doctor profile not found');
      }

      const result = await this.ipdDoctorService.submitClinicalAssessment(
        req.params.id,
        doctorId,
        req.body
      );
      
      return this.success(res, result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * =================================
   * DAILY NOTES
   * =================================
   */

  /**
   * POST /api/ipd/doctor/notes/:ipdId
   */
  async addDailyNote(req, res) {
    try {
      const doctorId = await this.getDoctorId(req.user.id);
      if (!doctorId) {
        return this.notFound(res, 'Doctor profile not found');
      }

      const note = await this.ipdDoctorService.addDailyNote(
        req.params.ipdId,
        doctorId,
        req.body.note
      );
      
      return this.created(res, {
        data: note,
        message: 'Daily note added successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * GET /api/ipd/doctor/notes/:ipdId
   */
  async getIPDPatientNotes(req, res) {
    try {
      const doctorId = await this.getDoctorId(req.user.id);
      if (!doctorId) {
        return this.notFound(res, 'Doctor profile not found');
      }

      const notes = await this.ipdDoctorService.getIPDPatientNotes(req.params.ipdId, doctorId);
      
      return this.success(res, {
        data: notes,
        count: notes.length,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * =================================
   * TREATMENT PLAN
   * =================================
   */

  /**
   * PUT /api/ipd/doctor/patients/:id/treatment-plan
   */
  async updateTreatmentPlan(req, res) {
    try {
      const doctorId = await this.getDoctorId(req.user.id);
      if (!doctorId) {
        return this.notFound(res, 'Doctor profile not found');
      }

      const patient = await this.ipdDoctorService.updateTreatmentPlan(
        req.params.id,
        doctorId,
        req.body.treatment_plan
      );
      
      return this.success(res, {
        data: patient,
        message: 'Treatment plan updated successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * =================================
   * TRANSFER & DISCHARGE REQUESTS
   * =================================
   */

  /**
   * PUT /api/ipd/doctor/patients/:id/request-transfer
   */
  async requestTransfer(req, res) {
    try {
      const doctorId = await this.getDoctorId(req.user.id);
      if (!doctorId) {
        return this.notFound(res, 'Doctor profile not found');
      }

      const patient = await this.ipdDoctorService.requestTransfer(
        req.params.id,
        doctorId,
        req.body
      );
      
      return this.success(res, {
        data: patient,
        message: 'Transfer request submitted successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * PUT /api/ipd/doctor/patients/:id/request-discharge
   */
  async requestDischarge(req, res) {
    try {
      const doctorId = await this.getDoctorId(req.user.id);
      if (!doctorId) {
        return this.notFound(res, 'Doctor profile not found');
      }

      const patient = await this.ipdDoctorService.requestDischarge(
        req.params.id,
        doctorId,
        req.body.discharge_summary
      );
      
      return this.success(res, {
        data: patient,
        message: 'Discharge request submitted successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }
}

module.exports = IPDDoctorController;
