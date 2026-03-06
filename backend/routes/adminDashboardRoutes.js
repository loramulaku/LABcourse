const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.use(authenticateToken, isAdmin);

// GET /api/admin/dashboard/stats
router.get('/stats', adminDashboardController.getDashboardStats);

module.exports = router;
