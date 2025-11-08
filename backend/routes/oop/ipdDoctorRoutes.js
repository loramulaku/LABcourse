const express = require('express');
const router = express.Router();
const IPDDoctorController = require('../../controllers/oop/IPDDoctorController');
const { authenticateToken, isDoctor } = require('../../middleware/auth');

// Initialize controller
const ipdDoctorController = new IPDDoctorController();

// All routes require doctor authentication
router.use(authenticateToken, isDoctor);

/**
 * DOCTOR IPD PATIENT MANAGEMENT
 */
router.get('/my-patients', ipdDoctorController.getMyIPDPatients);
router.get('/patients/:id', ipdDoctorController.getIPDPatientDetails);

/**
 * ADMISSION REQUESTS
 */
router.get('/wards', ipdDoctorController.getAvailableWards);
router.post('/admission-request', ipdDoctorController.createAdmissionRequest);

/**
 * DAILY NOTES
 */
router.post('/notes/:ipdId', ipdDoctorController.addDailyNote);
router.get('/notes/:ipdId', ipdDoctorController.getIPDPatientNotes);

/**
 * TREATMENT PLAN
 */
router.put('/patients/:id/treatment-plan', ipdDoctorController.updateTreatmentPlan);

/**
 * TRANSFER & DISCHARGE REQUESTS
 */
router.put('/patients/:id/request-transfer', ipdDoctorController.requestTransfer);
router.put('/patients/:id/request-discharge', ipdDoctorController.requestDischarge);

module.exports = router;
