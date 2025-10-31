const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

/**
 * Public routes
 */

// Get all departments
router.get('/', departmentController.getAllDepartments);

// Get department by ID
router.get('/:id', departmentController.getDepartmentById);

// Get doctors by department
router.get('/:id/doctors', departmentController.getDoctorsByDepartment);

/**
 * Protected routes (Admin only)
 */

// Create department
router.post('/', authenticateToken, isAdmin, departmentController.createDepartment);

// Update department
router.put('/:id', authenticateToken, isAdmin, departmentController.updateDepartment);

// Delete department
router.delete('/:id', authenticateToken, isAdmin, departmentController.deleteDepartment);

// Assign doctor to department
router.post('/assign-doctor', authenticateToken, isAdmin, departmentController.assignDoctorToDepartment);

module.exports = router;
