const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const doctorApplicationController = require('../controllers/doctorApplicationController');

const router = express.Router();

// Register new doctor (no authentication required)
router.post('/register', doctorApplicationController.register);

// Apply for doctor verification (for new doctors)
router.post('/apply', authenticateToken, doctorApplicationController.apply);

// Get doctor application status (for the doctor)
router.get('/my-application', authenticateToken, doctorApplicationController.getMyApplication);

// Get all pending applications (admin only)
router.get('/pending', authenticateToken, isAdmin, doctorApplicationController.getPendingApplications);

// Approve doctor application (admin only)
router.post('/approve/:applicationId', authenticateToken, isAdmin, doctorApplicationController.approveApplication);

// Reject doctor application (admin only)
router.post('/reject/:applicationId', authenticateToken, isAdmin, doctorApplicationController.rejectApplication);

// Get all applications with status (admin only)
router.get('/all', authenticateToken, isAdmin, doctorApplicationController.getAllApplications);

module.exports = router;
