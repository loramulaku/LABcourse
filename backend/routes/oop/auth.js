const express = require('express');
const AuthController = require('../../controllers/oop/AuthController');
const { authenticateToken, isAdmin } = require('../../middleware/auth');

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/signup', authController.asyncHandler(authController.signup));
router.post('/login', authController.asyncHandler(authController.login));
router.post('/refresh', authController.asyncHandler(authController.refresh));
router.post('/logout', authController.asyncHandler(authController.logout));
router.post('/forgot-password', authController.asyncHandler(authController.forgotPassword));
router.post('/reset-password', authController.asyncHandler(authController.resetPassword));

// Test routes
router.get('/test-cookie', authController.testCookie);

// Protected routes
router.get('/me', authenticateToken, authController.asyncHandler(authController.getMe));
router.get('/navbar-info', authenticateToken, authController.asyncHandler(authController.getNavbarInfo));

// Admin-only routes
router.get('/dashboard', authenticateToken, isAdmin, (req, res) => {
  res.json({ message: 'Kjo është dashboard, vetëm admin e sheh' });
});

module.exports = router;

