const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const patientController = require('../controllers/patientController');

const router = express.Router();

// Get patient's own analyses
router.get('/my-analyses', authenticateToken, patientController.getMyAnalyses);

// Download result PDF (patient's own results only)
router.get('/download-result/:id', authenticateToken, patientController.downloadResult);

// View result PDF (inline)
router.get('/view-result/:id', authenticateToken, patientController.viewResult);

module.exports = router;
