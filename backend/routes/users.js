const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// Get current user info
router.get('/me', authenticateToken, userController.getUserById);

// Get all users (admin only)
router.get('/', authenticateToken, isAdmin, userController.getAllUsers);

// Get user by ID (admin only)
router.get('/:id', authenticateToken, isAdmin, userController.getUserById);

// Get users by role (admin only)
router.get('/role/:role', authenticateToken, isAdmin, userController.getUsersByRole);

// Update user (admin only)
router.put('/:id', authenticateToken, isAdmin, userController.updateUser);

// Update user status (admin only)
router.patch('/:id/status', authenticateToken, isAdmin, userController.updateUserStatus);

// Delete user (admin only)
router.delete('/:id', authenticateToken, isAdmin, userController.deleteUser);

module.exports = router;
