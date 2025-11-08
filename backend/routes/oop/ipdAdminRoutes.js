const express = require('express');
const router = express.Router();
const IPDController = require('../../controllers/oop/IPDController');
const { authenticateToken, isAdmin } = require('../../middleware/auth');

// Initialize controller
const ipdController = new IPDController();

// All routes require admin authentication
router.use(authenticateToken, isAdmin);

/**
 * WARD MANAGEMENT
 */
router.get('/wards', ipdController.getAllWards);
router.post('/wards', ipdController.createWard);
router.put('/wards/:id', ipdController.updateWard);
router.delete('/wards/:id', ipdController.deleteWard);

/**
 * ROOM MANAGEMENT
 */
router.get('/rooms', ipdController.getAllRooms);
router.post('/rooms', ipdController.createRoom);
router.put('/rooms/:id', ipdController.updateRoom);
router.delete('/rooms/:id', ipdController.deleteRoom);

/**
 * BED MANAGEMENT
 */
router.get('/beds', ipdController.getAllBeds);
router.post('/beds', ipdController.createBed);
router.put('/beds/:id', ipdController.updateBed);
router.delete('/beds/:id', ipdController.deleteBed);

/**
 * ADMISSION REQUEST MANAGEMENT
 */
router.get('/admission-requests', ipdController.getAdmissionRequests);
router.put('/admission-requests/:id/approve', ipdController.approveAdmissionRequest);
router.put('/admission-requests/:id/reject', ipdController.rejectAdmissionRequest);

/**
 * IPD PATIENT MANAGEMENT
 */
router.get('/patients', ipdController.getAllIPDPatients);
router.put('/transfers/:id', ipdController.transferPatient);
router.put('/discharges/:id', ipdController.approveDischarge);

/**
 * BED OCCUPANCY DASHBOARD
 */
router.get('/bed-occupancy-stats', ipdController.getBedOccupancyStats);

module.exports = router;
