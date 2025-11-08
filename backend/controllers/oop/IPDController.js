const BaseController = require('../../core/BaseController');
const IPDService = require('../../services/IPDService');
const { AppError } = require('../../core/errors');

/**
 * IPDController - Handles HTTP requests for IPD admin operations
 * Follows layered architecture: Controller → Service → Repository
 */
class IPDController extends BaseController {
  constructor() {
    super();
    this.ipdService = new IPDService();
    this.bindMethods();
  }

  /**
   * =================================
   * WARD MANAGEMENT
   * =================================
   */

  /**
   * GET /api/ipd/admin/wards
   */
  async getAllWards(req, res) {
    try {
      console.log('📋 [IPDController] Fetching all wards');
      const wards = await this.ipdService.getAllWards();
      console.log(`✅ [IPDController] Found ${wards.length} wards`);
      console.log('📊 [IPDController] Ward IDs:', wards.map(w => ({ id: w.id, name: w.name })));
      return this.success(res, {
        data: wards,
        count: wards.length,
      });
    } catch (error) {
      console.error('❌ [IPDController] Error fetching wards:', error.message);
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * POST /api/ipd/admin/wards
   */
  async createWard(req, res) {
    try {
      console.log('📋 [IPDController] Creating ward with data:', JSON.stringify(req.body, null, 2));
      const ward = await this.ipdService.createWard(req.body);
      console.log('✅ [IPDController] Ward created successfully:', JSON.stringify(ward, null, 2));
      return this.created(res, {
        data: ward,
        message: 'Ward created successfully',
      });
    } catch (error) {
      console.error('❌ [IPDController] Error creating ward:', error.message);
      console.error('Stack:', error.stack);
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * PUT /api/ipd/admin/wards/:id
   */
  async updateWard(req, res) {
    try {
      const ward = await this.ipdService.updateWard(req.params.id, req.body);
      return this.success(res, {
        data: ward,
        message: 'Ward updated successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * DELETE /api/ipd/admin/wards/:id
   */
  async deleteWard(req, res) {
    try {
      await this.ipdService.deleteWard(req.params.id);
      return this.success(res, {
        message: 'Ward deleted successfully',
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
   * ROOM MANAGEMENT
   * =================================
   */

  /**
   * GET /api/ipd/admin/rooms
   */
  async getAllRooms(req, res) {
    try {
      const wardId = req.query.wardId ? parseInt(req.query.wardId) : null;
      const rooms = await this.ipdService.getAllRooms(wardId);
      return this.success(res, {
        data: rooms,
        count: rooms.length,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * POST /api/ipd/admin/rooms
   */
  async createRoom(req, res) {
    try {
      const room = await this.ipdService.createRoom(req.body);
      return this.created(res, {
        data: room,
        message: 'Room created successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * PUT /api/ipd/admin/rooms/:id
   */
  async updateRoom(req, res) {
    try {
      const room = await this.ipdService.updateRoom(req.params.id, req.body);
      return this.success(res, {
        data: room,
        message: 'Room updated successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * DELETE /api/ipd/admin/rooms/:id
   */
  async deleteRoom(req, res) {
    try {
      await this.ipdService.deleteRoom(req.params.id);
      return this.success(res, {
        message: 'Room deleted successfully',
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
   * BED MANAGEMENT (Hierarchical)
   * =================================
   */

  /**
   * GET /api/ipd/admin/beds
   */
  async getAllBeds(req, res) {
    try {
      const roomId = req.query.roomId ? parseInt(req.query.roomId) : null;
      const beds = await this.ipdService.getAllBeds(roomId);
      return this.success(res, {
        data: beds,
        count: beds.length,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * POST /api/ipd/admin/beds
   */
  async createBed(req, res) {
    try {
      const bed = await this.ipdService.createBed(req.body);
      return this.created(res, {
        data: bed,
        message: 'Bed created successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * PUT /api/ipd/admin/beds/:id
   */
  async updateBed(req, res) {
    try {
      const bed = await this.ipdService.updateBed(req.params.id, req.body);
      return this.success(res, {
        data: bed,
        message: 'Bed updated successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * DELETE /api/ipd/admin/beds/:id
   */
  async deleteBed(req, res) {
    try {
      await this.ipdService.deleteBed(req.params.id);
      return this.success(res, {
        message: 'Bed deleted successfully',
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
   * ADMISSION REQUEST MANAGEMENT
   * =================================
   */

  /**
   * GET /api/ipd/admin/admission-requests
   */
  async getAdmissionRequests(req, res) {
    try {
      console.log('📋 [IPDController] Getting admission requests');
      const status = req.query.status || null;
      const requests = await this.ipdService.getAdmissionRequests(status);
      console.log(`✅ [IPDController] Found ${requests.length} requests`);
      return this.success(res, {
        data: requests,
        count: requests.length,
      });
    } catch (error) {
      console.error('❌ [IPDController] Error fetching admission requests:', error.message);
      console.error('Stack:', error.stack);
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * PUT /api/ipd/admin/admission-requests/:id/approve
   */
  async approveAdmissionRequest(req, res) {
    try {
      const result = await this.ipdService.approveAdmissionRequest(req.params.id, req.body);
      return this.success(res, {
        data: result,
        message: 'Admission request approved and patient admitted successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * PUT /api/ipd/admin/admission-requests/:id/reject
   */
  async rejectAdmissionRequest(req, res) {
    try {
      const request = await this.ipdService.rejectAdmissionRequest(
        req.params.id,
        req.body.rejection_reason
      );
      return this.success(res, {
        data: request,
        message: 'Admission request rejected',
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
   * IPD PATIENT MANAGEMENT
   * =================================
   */

  /**
   * GET /api/ipd/admin/patients
   */
  async getAllIPDPatients(req, res) {
    try {
      console.log('📋 [IPDController] Getting all IPD patients');
      const status = req.query.status || null;
      const patients = await this.ipdService.getAllIPDPatients(status);
      console.log(`✅ [IPDController] Found ${patients.length} patients`);
      return this.success(res, {
        data: patients,
        count: patients.length,
      });
    } catch (error) {
      console.error('❌ [IPDController] Error fetching IPD patients:', error.message);
      console.error('Stack:', error.stack);
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * PUT /api/ipd/admin/transfers/:id
   */
  async transferPatient(req, res) {
    try {
      const patient = await this.ipdService.transferPatient(req.params.id, req.body);
      return this.success(res, {
        data: patient,
        message: 'Patient transferred successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * PUT /api/ipd/admin/discharges/:id
   */
  async approveDischarge(req, res) {
    try {
      const patient = await this.ipdService.approveDischarge(req.params.id);
      return this.success(res, {
        data: patient,
        message: 'Patient discharged successfully',
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
   * BED OCCUPANCY STATISTICS
   * =================================
   */

  /**
   * GET /api/ipd/admin/bed-occupancy-stats
   */
  async getBedOccupancyStats(req, res) {
    try {
      const stats = await this.ipdService.getBedOccupancyStats();
      return this.success(res, { data: stats });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }
}

module.exports = IPDController;
