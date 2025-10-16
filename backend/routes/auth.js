const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const authController = require('../controllers/authController');
const router = express.Router();

// SIGN UP (Only for regular users, doctors are added by admin)
router.post('/signup', authController.signup);

// LOGIN
router.post('/login', authController.login);

// REFRESH TOKEN
router.post('/refresh', authController.refresh);

// LOGOUT
router.post('/logout', authController.logout);

// Protected route (example) - Only for admin
router.get('/dashboard', authenticateToken, isAdmin, (req, res) => {
  res.json({ message: 'Kjo është dashboard, vetëm admin e sheh' });
});

// Get current user info from access token
router.get('/me', authenticateToken, authController.getMe);

// Test endpoint to check if cookies are working
router.get('/test-cookie', authController.testCookie);

// Get user profile info for navbar (photo, name, role)
router.get('/navbar-info', authenticateToken, authController.getNavbarInfo);

// FORGOT PASSWORD
router.post('/forgot-password', authController.forgotPassword);

// RESET PASSWORD
router.post('/reset-password', authController.resetPassword);

module.exports = router;
