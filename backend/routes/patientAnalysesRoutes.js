const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const patientAnalysisController = require('../controllers/patientAnalysisController');

const router = express.Router();

// Get patient's analyses (root route for backwards compatibility)
router.get('/', authenticateToken, patientAnalysisController.getMyAnalyses);

// Get patient's analyses (explicit path)
router.get('/my-analyses', authenticateToken, patientAnalysisController.getMyAnalyses);

// Get specific analysis by ID
router.get('/:id', authenticateToken, patientAnalysisController.getAnalysisById);

// Create new analysis request
router.post('/', authenticateToken, patientAnalysisController.createAnalysisRequest);

// Update analysis request
router.put('/:id', authenticateToken, patientAnalysisController.updateAnalysisRequest);

// Cancel analysis request
router.patch('/:id/cancel', authenticateToken, patientAnalysisController.cancelAnalysisRequest);

module.exports = router;
