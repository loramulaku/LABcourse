// routes/notificationRoutes.js
const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const db = require('../db');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/reports/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Helper function to create notification
async function createNotification(userId, sentByUserId, title, message, type = 'general_message', optionalLink = null) {
    try {
        await db.promise().query(
            'INSERT INTO notifications (user_id, sent_by_user_id, title, message, notification_type, optional_link) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, sentByUserId, title, message, type, optionalLink]
        );
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
}

// Get notifications for current user
router.get('/my-notifications', authenticateToken, async (req, res) => {
    try {
        const [notifications] = await db.promise().query(
            `SELECT n.*, u.name as sender_name 
             FROM notifications n 
             JOIN users u ON u.id = n.sent_by_user_id 
             WHERE n.user_id = ? 
             ORDER BY n.created_at DESC 
             LIMIT 50`,
            [req.user.id]
        );
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const [result] = await db.promise().query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [req.user.id]
        );
        res.json({ count: result[0].count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// Mark notification as read
router.post('/mark-read/:id', authenticateToken, async (req, res) => {
    try {
        await db.promise().query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Mark all notifications as read
router.post('/mark-all-read', authenticateToken, async (req, res) => {
    try {
        await db.promise().query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
            [req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

// Update notification preferences
router.post('/preferences', authenticateToken, async (req, res) => {
    try {
        const { notifications_enabled } = req.body;
        await db.promise().query(
            'UPDATE user_profiles SET notifications_enabled = ? WHERE user_id = ?',
            [notifications_enabled, req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update notification preferences' });
    }
});

// Get notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
    try {
        const [result] = await db.promise().query(
            'SELECT notifications_enabled FROM user_profiles WHERE user_id = ?',
            [req.user.id]
        );
        res.json({ notifications_enabled: result[0]?.notifications_enabled ?? true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
});

// Admin: Send message to users
router.post('/send-message', authenticateToken, isAdmin, upload.single('attachment'), async (req, res) => {
    try {
        const { recipient_ids, subject, content, message_type = 'individual' } = req.body;
        const senderId = req.user.id;
        
        let userIds = [];
        
        if (message_type === 'broadcast') {
            // Send to all users
            const [users] = await db.promise().query(
                'SELECT id FROM users WHERE role = "user"'
            );
            userIds = users.map(u => u.id);
        } else if (recipient_ids) {
            userIds = Array.isArray(recipient_ids) ? recipient_ids : [recipient_ids];
        }
        
        // Create messages for each recipient
        for (const userId of userIds) {
            await db.promise().query(
                'INSERT INTO messages (sender_id, recipient_id, subject, content, message_type, attachment_path) VALUES (?, ?, ?, ?, ?, ?)',
                [senderId, userId, subject, content, message_type, req.file?.path || null]
            );
            
            // Create notification for the user
            await createNotification(
                userId,
                senderId,
                subject,
                content,
                'general_message'
            );
        }
        
        res.json({ success: true, message: `Message sent to ${userIds.length} users` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get messages for current user
router.get('/my-messages', authenticateToken, async (req, res) => {
    try {
        const [messages] = await db.promise().query(
            `SELECT m.*, u.name as sender_name 
             FROM messages m 
             JOIN users u ON u.id = m.sender_id 
             WHERE m.recipient_id = ? OR m.message_type = 'broadcast'
             ORDER BY m.created_at DESC 
             LIMIT 50`,
            [req.user.id]
        );
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Mark message as read
router.post('/mark-message-read/:id', authenticateToken, async (req, res) => {
    try {
        await db.promise().query(
            'UPDATE messages SET is_read = TRUE WHERE id = ? AND (recipient_id = ? OR message_type = "broadcast")',
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
});

// Export the createNotification function for use in other routes
module.exports = { router, createNotification };
