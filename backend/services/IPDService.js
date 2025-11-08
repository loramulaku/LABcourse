const BaseService = require('../core/BaseService');
const WardRepository = require('../repositories/WardRepository');
const RoomRepository = require('../repositories/RoomRepository');
const BedRepository = require('../repositories/BedRepository');
const IPDPatientRepository = require('../repositories/IPDPatientRepository');
const AdmissionRequestRepository = require('../repositories/AdmissionRequestRepository');
const DailyDoctorNoteRepository = require('../repositories/DailyDoctorNoteRepository');
const { NotFoundError, ConflictError, BadRequestError } = require('../core/errors');

/**
 * IPDService - Handles IPD business logic
 * Manages ward-room-bed hierarchy and patient admission workflow
 */
class IPDService extends BaseService {
  constructor() {
    super();
    this.wardRepo = new WardRepository();
    this.roomRepo = new RoomRepository();
    this.bedRepo = new BedRepository();
    this.ipdPatientRepo = new IPDPatientRepository();
    this.admissionRequestRepo = new AdmissionRequestRepository();
    this.noteRepo = new DailyDoctorNoteRepository();
  }

  /**
   * =================================
   * WARD MANAGEMENT
   * =================================
   */

  /**
   * Get all wards with occupancy statistics
   * @returns {Promise<Array>}
   */
  async getAllWards() {
    this.log('Fetching all wards with statistics');
    
    const wards = await this.wardRepo.findAllWithStats();
    
    // Calculate statistics for each ward
    return wards.map(ward => {
      const wardData = ward.toJSON();
      const allBeds = wardData.rooms.flatMap(room => room.beds);
      
      return {
        ...wardData,
        totalBeds: allBeds.length,
        occupiedBeds: allBeds.filter(bed => bed.status === 'Occupied').length,
        availableBeds: allBeds.filter(bed => bed.status === 'Available').length,
        occupancyRate: allBeds.length > 0 
          ? ((allBeds.filter(bed => bed.status === 'Occupied').length / allBeds.length) * 100).toFixed(2) 
          : 0,
      };
    });
  }

  /**
   * Create new ward
   * @param {Object} wardData - Ward data
   * @returns {Promise<Object>}
   */
  async createWard(wardData) {
    this.validateRequired(wardData, ['name']);
    this.log(`Creating ward: ${wardData.name}`);

    // Check if ward already exists
    console.log('🔍 [IPDService] Checking if ward exists:', wardData.name);
    const existing = await this.wardRepo.findByName(wardData.name);
    if (existing) {
      console.log('⚠️ [IPDService] Ward already exists:', existing.id);
      throw new ConflictError('Ward with this name already exists');
    }
    console.log('✓ [IPDService] Ward name is unique');

    const dataToCreate = {
      name: wardData.name,
      description: wardData.description,
      total_beds: wardData.total_beds,
      is_active: wardData.is_active !== undefined ? wardData.is_active : true,
    };
    console.log('💾 [IPDService] Creating ward with data:', JSON.stringify(dataToCreate, null, 2));
    
    const result = await this.wardRepo.create(dataToCreate);
    console.log('✅ [IPDService] Ward created in repository, result:', JSON.stringify(result, null, 2));
    
    // Verify the ward was actually saved by fetching it
    console.log('🔍 [IPDService] Verifying ward was saved, fetching by ID:', result.id);
    const verification = await this.wardRepo.findById(result.id);
    if (!verification) {
      console.error('❌ [IPDService] CRITICAL: Ward was not saved to database!');
      throw new Error('Ward creation failed - record not found after creation');
    }
    console.log('✅ [IPDService] Verified ward exists in database:', JSON.stringify(verification.toJSON(), null, 2));
    
    return result;
  }

  /**
   * Update ward
   * @param {number} wardId - Ward ID
   * @param {Object} wardData - Updated data
   * @returns {Promise<Object>}
   */
  async updateWard(wardId, wardData) {
    this.log(`Updating ward: ${wardId}`);

    const ward = await this.wardRepo.findById(wardId);
    if (!ward) {
      throw new NotFoundError('Ward');
    }

    // Check name uniqueness if changing
    if (wardData.name && wardData.name !== ward.name) {
      const existing = await this.wardRepo.findByName(wardData.name);
      if (existing) {
        throw new ConflictError('Ward with this name already exists');
      }
    }

    return await this.wardRepo.update(wardId, wardData);
  }

  /**
   * Delete ward
   * @param {number} wardId - Ward ID
   * @returns {Promise<boolean>}
   */
  async deleteWard(wardId) {
    this.log(`Deleting ward: ${wardId}`);

    const rooms = await this.roomRepo.findByWard(wardId);
    if (rooms.length > 0) {
      throw new BadRequestError(`Cannot delete ward with ${rooms.length} rooms. Please remove rooms first.`);
    }

    return await this.wardRepo.delete(wardId);
  }

  /**
   * =================================
   * ROOM MANAGEMENT
   * =================================
   */

  /**
   * Get all rooms with hierarchy
   * @param {number} wardId - Optional ward filter
   * @returns {Promise<Array>}
   */
  async getAllRooms(wardId = null) {
    this.log(`Fetching rooms${wardId ? ` for ward ${wardId}` : ''}`);
    return await this.roomRepo.findAllWithDetails(wardId);
  }

  /**
   * Create new room
   * @param {Object} roomData - Room data
   * @returns {Promise<Object>}
   */
  async createRoom(roomData) {
    this.validateRequired(roomData, ['ward_id', 'room_number']);
    this.log(`Creating room ${roomData.room_number} in ward ${roomData.ward_id}`);

    // Verify ward exists
    const ward = await this.wardRepo.findById(roomData.ward_id);
    if (!ward) {
      throw new NotFoundError('Ward');
    }

    // Check room uniqueness within ward
    const exists = await this.roomRepo.existsInWard(roomData.ward_id, roomData.room_number);
    if (exists) {
      throw new ConflictError('Room number already exists in this ward');
    }

    const room = await this.roomRepo.create({
      ward_id: roomData.ward_id,
      room_number: roomData.room_number,
      room_type: roomData.room_type || 'General',
      is_active: roomData.is_active !== undefined ? roomData.is_active : true,
    });

    // Return with ward info
    return await this.roomRepo.findById(room.id, {
      include: [{ model: require('../models').Ward, as: 'ward', attributes: ['id', 'name'] }],
    });
  }

  /**
   * Update room
   * @param {number} roomId - Room ID
   * @param {Object} roomData - Updated data
   * @returns {Promise<Object>}
   */
  async updateRoom(roomId, roomData) {
    this.log(`Updating room: ${roomId}`);

    const room = await this.roomRepo.findById(roomId);
    if (!room) {
      throw new NotFoundError('Room');
    }

    // Verify ward if changing
    if (roomData.ward_id && roomData.ward_id !== room.ward_id) {
      const ward = await this.wardRepo.findById(roomData.ward_id);
      if (!ward) {
        throw new NotFoundError('Ward');
      }
    }

    return await this.roomRepo.update(roomId, roomData);
  }

  /**
   * Delete room
   * @param {number} roomId - Room ID
   * @returns {Promise<boolean>}
   */
  async deleteRoom(roomId) {
    this.log(`Deleting room: ${roomId}`);

    const beds = await this.bedRepo.count({ where: { room_id: roomId } });
    if (beds > 0) {
      throw new BadRequestError(`Cannot delete room with ${beds} beds. Please remove beds first.`);
    }

    return await this.roomRepo.delete(roomId);
  }

  /**
   * =================================
   * BED MANAGEMENT (Hierarchical)
   * =================================
   */

  /**
   * Get all beds with Ward → Room → Bed hierarchy
   * @param {number} roomId - Optional room filter
   * @returns {Promise<Array>}
   */
  async getAllBeds(roomId = null) {
    this.log(`Fetching beds${roomId ? ` for room ${roomId}` : ''} with hierarchy`);
    return await this.bedRepo.findAllWithHierarchy(roomId);
  }

  /**
   * Create new bed
   * @param {Object} bedData - Bed data
   * @returns {Promise<Object>}
   */
  async createBed(bedData) {
    this.validateRequired(bedData, ['room_id', 'bed_number']);
    this.log(`Creating bed ${bedData.bed_number} in room ${bedData.room_id}`);

    // Verify room exists
    const room = await this.roomRepo.findById(bedData.room_id);
    if (!room) {
      throw new NotFoundError('Room');
    }

    const bed = await this.bedRepo.create({
      room_id: bedData.room_id,
      bed_number: bedData.bed_number,
      status: bedData.status || 'Available',
    });

    // Return with full hierarchy
    return await this.bedRepo.findAllWithHierarchy(null).then(beds => 
      beds.find(b => b.id === bed.id)
    );
  }

  /**
   * Update bed status (enforces business rules)
   * @param {number} bedId - Bed ID
   * @param {Object} bedData - Updated data
   * @returns {Promise<Object>}
   */
  async updateBed(bedId, bedData) {
    this.log(`Updating bed: ${bedId}`);

    const bed = await this.bedRepo.findById(bedId);
    if (!bed) {
      throw new NotFoundError('Bed');
    }

    // Business rule: Cannot change occupied bed to maintenance without admin override
    if (bed.status === 'Occupied' && ['Maintenance', 'Cleaning'].includes(bedData.status)) {
      throw new BadRequestError('Cannot set occupied bed to maintenance/cleaning status');
    }

    return await this.bedRepo.update(bedId, bedData);
  }

  /**
   * Delete bed
   * @param {number} bedId - Bed ID
   * @returns {Promise<boolean>}
   */
  async deleteBed(bedId) {
    this.log(`Deleting bed: ${bedId}`);

    const bed = await this.bedRepo.findById(bedId);
    if (!bed) {
      throw new NotFoundError('Bed');
    }

    // Business rule: Cannot delete occupied bed
    if (bed.status === 'Occupied') {
      throw new BadRequestError('Cannot delete an occupied bed');
    }

    return await this.bedRepo.delete(bedId);
  }

  /**
   * =================================
   * BED OCCUPANCY STATISTICS
   * =================================
   */

  /**
   * Get comprehensive bed occupancy statistics
   * @returns {Promise<Object>}
   */
  async getBedOccupancyStats() {
    this.log('Calculating bed occupancy statistics');

    const wards = await this.wardRepo.findAllWithStats();
    
    const wardStats = wards.map(ward => {
      const wardData = ward.toJSON();
      const allBeds = wardData.rooms.flatMap(room => room.beds);
      const totalBeds = allBeds.length;
      const occupiedBeds = allBeds.filter(bed => bed.status === 'Occupied').length;
      const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(2) : 0;

      return {
        ward_id: wardData.id,
        ward_name: wardData.name,
        total_beds: totalBeds,
        occupied_beds: occupiedBeds,
        available_beds: allBeds.filter(bed => bed.status === 'Available').length,
        reserved_beds: allBeds.filter(bed => bed.status === 'Reserved').length,
        maintenance_beds: allBeds.filter(bed => ['Maintenance', 'Cleaning'].includes(bed.status)).length,
        occupancy_rate: parseFloat(occupancyRate),
        alert: occupancyRate >= 90 ? 'critical' : occupancyRate >= 75 ? 'warning' : 'normal',
      };
    });

    // Overall statistics
    const overallStats = {
      total_wards: wards.length,
      total_beds: wardStats.reduce((sum, s) => sum + s.total_beds, 0),
      total_occupied: wardStats.reduce((sum, s) => sum + s.occupied_beds, 0),
      total_available: wardStats.reduce((sum, s) => sum + s.available_beds, 0),
      overall_occupancy_rate: 0,
    };

    if (overallStats.total_beds > 0) {
      overallStats.overall_occupancy_rate = parseFloat(
        ((overallStats.total_occupied / overallStats.total_beds) * 100).toFixed(2)
      );
    }

    const currentPatientCount = await this.ipdPatientRepo.countCurrent();

    return {
      wards: wardStats,
      overall: overallStats,
      current_patient_count: currentPatientCount,
    };
  }

  /**
   * =================================
   * ADMISSION REQUEST WORKFLOW
   * =================================
   */

  /**
   * Get all admission requests
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>}
   */
  async getAdmissionRequests(status = null) {
    this.log(`Fetching admission requests${status ? ` with status ${status}` : ''}`);
    return await this.admissionRequestRepo.findAllWithDetails(status);
  }

  /**
   * Approve admission request and assign bed
   * @param {number} requestId - Admission request ID
   * @param {Object} bedAssignment - { ward_id, room_id, bed_id }
   * @returns {Promise<Object>}
   */
  async approveAdmissionRequest(requestId, bedAssignment) {
    this.validateRequired(bedAssignment, ['ward_id', 'room_id', 'bed_id']);
    this.log(`Approving admission request ${requestId} with bed assignment`);

    const request = await this.admissionRequestRepo.findById(requestId);
    if (!request) {
      throw new NotFoundError('Admission request');
    }

    if (request.status !== 'Pending') {
      throw new BadRequestError('This request has already been processed');
    }

    // Verify bed availability
    const isAvailable = await this.bedRepo.isAvailable(bedAssignment.bed_id);
    if (!isAvailable) {
      throw new BadRequestError('Selected bed is not available');
    }

    // Create IPD patient record
    const ipdPatient = await this.ipdPatientRepo.create({
      patient_id: request.patient_id,
      doctor_id: request.doctor_id,
      ward_id: bedAssignment.ward_id,
      room_id: bedAssignment.room_id,
      bed_id: bedAssignment.bed_id,
      admission_date: new Date(),
      status: 'Admitted',
      primary_diagnosis: request.diagnosis,
      treatment_plan: request.treatment_plan,
      urgency: request.urgency,
    });

    // Update bed status
    await this.bedRepo.updateStatus(bedAssignment.bed_id, 'Occupied');

    // Update admission request status
    await this.admissionRequestRepo.updateStatus(requestId, 'Approved');

    this.log(`Admission approved: Patient ${request.patient_id} admitted to bed ${bedAssignment.bed_id}`);

    return { request, ipdPatient };
  }

  /**
   * Reject admission request
   * @param {number} requestId - Admission request ID
   * @param {string} rejectionReason - Reason for rejection
   * @returns {Promise<Object>}
   */
  async rejectAdmissionRequest(requestId, rejectionReason) {
    this.log(`Rejecting admission request ${requestId}`);

    const request = await this.admissionRequestRepo.findById(requestId);
    if (!request) {
      throw new NotFoundError('Admission request');
    }

    if (request.status !== 'Pending') {
      throw new BadRequestError('This request has already been processed');
    }

    return await this.admissionRequestRepo.updateStatus(requestId, 'Rejected', rejectionReason);
  }

  /**
   * =================================
   * IPD PATIENT MANAGEMENT
   * =================================
   */

  /**
   * Get all IPD patients
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>}
   */
  async getAllIPDPatients(status = null) {
    this.log(`Fetching IPD patients${status ? ` with status ${status}` : ''}`);
    return await this.ipdPatientRepo.findAllWithDetails(status);
  }

  /**
   * Transfer patient to new bed
   * @param {number} patientId - IPD patient ID
   * @param {Object} newLocation - { ward_id, room_id, bed_id }
   * @returns {Promise<Object>}
   */
  async transferPatient(patientId, newLocation) {
    this.validateRequired(newLocation, ['ward_id', 'room_id', 'bed_id']);
    this.log(`Transferring patient ${patientId} to new bed`);

    const patient = await this.ipdPatientRepo.findById(patientId);
    if (!patient) {
      throw new NotFoundError('IPD patient');
    }

    // Verify new bed is available
    const isAvailable = await this.bedRepo.isAvailable(newLocation.bed_id);
    if (!isAvailable) {
      throw new BadRequestError('Selected bed is not available');
    }

    // Free old bed
    await this.bedRepo.updateStatus(patient.bed_id, 'Available');

    // Update patient location
    await this.ipdPatientRepo.update(patientId, {
      ward_id: newLocation.ward_id,
      room_id: newLocation.room_id,
      bed_id: newLocation.bed_id,
      status: 'UnderCare',
    });

    // Occupy new bed
    await this.bedRepo.updateStatus(newLocation.bed_id, 'Occupied');

    this.log(`Patient ${patientId} transferred successfully`);

    return await this.ipdPatientRepo.findByIdWithNotes(patientId);
  }

  /**
   * Approve discharge
   * @param {number} patientId - IPD patient ID
   * @returns {Promise<Object>}
   */
  async approveDischarge(patientId) {
    this.log(`Approving discharge for patient ${patientId}`);

    const patient = await this.ipdPatientRepo.findById(patientId);
    if (!patient) {
      throw new NotFoundError('IPD patient');
    }

    if (patient.status !== 'DischargeRequested') {
      throw new BadRequestError('Patient discharge has not been requested');
    }

    // Free the bed
    await this.bedRepo.updateStatus(patient.bed_id, 'Available');

    // Update patient status
    return await this.ipdPatientRepo.update(patientId, {
      status: 'Discharged',
      discharge_date: new Date(),
    });
  }
}

module.exports = IPDService;
