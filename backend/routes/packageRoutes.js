const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/packages - Get all packages
router.get('/', packageController.getPackages);

// GET /api/packages/:id - Get specific package
router.get('/:id', packageController.getPackage);

// POST /api/packages - Create new package (admin only)
router.post('/', isAdmin, packageController.createPackage);

// PUT /api/packages/:id - Update package (admin only)
router.put('/:id', isAdmin, packageController.updatePackage);

// DELETE /api/packages/:id - Delete package (admin only)
router.delete('/:id', isAdmin, packageController.deletePackage);

// PATCH /api/packages/:id/toggle-status - Toggle active status (admin only)
router.patch('/:id/toggle-status', isAdmin, packageController.togglePackageStatus);

module.exports = router;
