const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const laboratoryController = require('../controllers/laboratoryController');

const router = express.Router();

// Middleware to ensure user is a lab
function requireLab(req, res, next) {
  if (!req.user || req.user.role !== 'lab') {
    return res.status(403).json({ error: 'Lab access required' });
  }
  next();
}

// ============ PUBLIC ROUTES ============

// Get all laboratories
router.get('/', laboratoryController.getAllLaboratories);

// Get laboratory by ID
router.get('/:id', laboratoryController.getLaboratoryById);

// Get analysis types by laboratory
router.get('/:id/analysis-types', laboratoryController.getAnalysisTypesByLab);

// ============ LAB DASHBOARD ROUTES ============

// Dashboard: Get patient history
router.get('/dashboard/history', authenticateToken, requireLab, laboratoryController.getDashboardHistory);

// Dashboard: Get appointments
router.get('/dashboard/appointments', authenticateToken, requireLab, laboratoryController.getDashboardAppointments);

// Dashboard: Get appointments grouped by date
router.get('/dashboard/appointments-by-date', authenticateToken, requireLab, laboratoryController.getAppointmentsByDate);

// Dashboard: Get lab profile
router.get('/dashboard/me', authenticateToken, requireLab, laboratoryController.getLabProfile);

// Dashboard: Update lab profile
router.put('/dashboard/me', authenticateToken, requireLab, laboratoryController.updateLabProfile);

// Dashboard: Get lab's analysis types
router.get('/dashboard/my-analysis-types', authenticateToken, requireLab, laboratoryController.getMyAnalysisTypes);

// Dashboard: Create analysis type
router.post('/dashboard/my-analysis-types', authenticateToken, requireLab, laboratoryController.createAnalysisType);

// Dashboard: Update analysis type
router.put('/dashboard/my-analysis-types/:id', authenticateToken, requireLab, laboratoryController.updateAnalysisType);

// Dashboard: Delete analysis type
router.delete('/dashboard/my-analysis-types/:id', authenticateToken, requireLab, laboratoryController.deleteAnalysisType);

// Dashboard: Get confirmed analyses
router.get('/dashboard/confirmed', authenticateToken, requireLab, laboratoryController.getConfirmedAnalyses);

// Dashboard: Get pending result analyses
router.get('/dashboard/pending', authenticateToken, requireLab, laboratoryController.getPendingResults);

// Dashboard: Update analysis status
router.post('/dashboard/update-status/:id', authenticateToken, requireLab, laboratoryController.updateStatus);

// Dashboard: Upload result PDF
router.post('/dashboard/upload-result/:id', authenticateToken, requireLab, laboratoryController.upload.single('result_pdf'), laboratoryController.uploadResult);

// Dashboard: Submit result (mark as completed)
router.post('/dashboard/submit-result/:id', authenticateToken, requireLab, laboratoryController.submitResult);

// Dashboard: Mark as pending
router.post('/dashboard/mark-pending/:id', authenticateToken, requireLab, laboratoryController.markAsPending);

// ============ ADMIN ROUTES ============

// Admin: Create laboratory
router.post('/', authenticateToken, isAdmin, laboratoryController.createLaboratory);

// Admin: Update laboratory
router.put('/:id', authenticateToken, isAdmin, laboratoryController.updateLaboratory);

// Admin: Delete laboratory
router.delete('/:id', authenticateToken, isAdmin, laboratoryController.deleteLaboratory);

// Admin: Create analysis type
router.post('/analysis-types', authenticateToken, isAdmin, laboratoryController.adminCreateAnalysisType);

// Admin: Get minimal labs list for dropdown
router.get('/_dropdown/minimal', authenticateToken, isAdmin, laboratoryController.getMinimalLabsList);

// ============ PATIENT ROUTES ============

// Request analysis (patient)
router.post('/request-analysis', authenticateToken, laboratoryController.requestAnalysis);

// Get my analyses (patient)
router.get('/my-analyses', authenticateToken, laboratoryController.getMyAnalyses);

module.exports = router;
