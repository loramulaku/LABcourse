const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Get my notifications
router.get('/my-notifications', authenticateToken, notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);

// Mark notification as read
router.post('/mark-read/:id', authenticateToken, notificationController.markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', authenticateToken, notificationController.markAllAsRead);

// Get notification preferences
router.get('/preferences', authenticateToken, notificationController.getPreferences);

// Update notification preferences
router.post('/preferences', authenticateToken, notificationController.updatePreferences);

// Admin: Send message to users
router.post('/send-message', authenticateToken, isAdmin, notificationController.upload.single('attachment'), notificationController.sendMessage);

// Get messages for current user
router.get('/my-messages', authenticateToken, notificationController.getMyMessages);

// Mark message as read
router.post('/mark-message-read/:id', authenticateToken, notificationController.markMessageAsRead);

// Admin: Send broadcast notification
router.post('/broadcast', authenticateToken, isAdmin, notificationController.sendBroadcast);

// Export router and helper function
module.exports = { 
  router, 
  createNotification: notificationController.createNotificationHelper 
};
