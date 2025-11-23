const { Notification, User, Message, UserProfile } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/reports');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
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
  },
});

const notificationController = {
  // Get user's notifications
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0, unreadOnly = false } = req.query;

      const whereClause = { user_id: userId };
      if (unreadOnly === 'true') {
        whereClause.is_read = false;
      }

      const notifications = await Notification.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'Sender',
            attributes: ['id', 'name', 'email'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const unreadCount = await Notification.count({
        where: {
          user_id: userId,
          is_read: false,
        },
      });

      res.json({
        notifications,
        unreadCount,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  },

  // Get notification by ID
  async getNotificationById(req, res) {
    try {
      const notificationId = req.params.id;

      const notification = await Notification.findByPk(notificationId, {
        include: [
          {
            model: User,
            as: 'Sender',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: User,
            as: 'Recipient',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Check if user is authorized to view this notification
      if (notification.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      res.json(notification);
    } catch (error) {
      console.error('Error fetching notification:', error);
      res.status(500).json({ error: 'Failed to fetch notification' });
    }
  },

  // Create notification
  async createNotification(req, res) {
    try {
      const notificationData = {
        ...req.body,
        sent_by_user_id: req.user.id,
      };

      const notification = await Notification.create(notificationData);

      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ error: 'Failed to create notification' });
    }
  },

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const notificationId = req.params.id;

      const notification = await Notification.findByPk(notificationId);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Check if user is authorized
      if (notification.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await notification.update({ is_read: true });

      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
  },

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await Notification.update(
        { is_read: true },
        {
          where: {
            user_id: userId,
            is_read: false,
          },
        }
      );

      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to update notifications' });
    }
  },

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const notificationId = req.params.id;

      const notification = await Notification.findByPk(notificationId);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Check if user is authorized
      if (notification.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await notification.destroy();

      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  },

  // Get unread count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const unreadCount = await Notification.count({
        where: {
          user_id: userId,
          is_read: false,
        },
      });

      res.json({ unreadCount });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  },

  // Send broadcast notification (admin only)
  async sendBroadcast(req, res) {
    try {
      const { title, message, notification_type, role } = req.body;

      if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required' });
      }

      // Get all users or users by role
      const whereClause = {};
      if (role) {
        whereClause.role = role;
      }

      const users = await User.findAll({
        where: whereClause,
        attributes: ['id'],
      });

      // Create notifications for all users
      const notifications = users.map(user => ({
        user_id: user.id,
        sent_by_user_id: req.user.id,
        title,
        message,
        notification_type: notification_type || 'system_alert',
      }));

      await Notification.bulkCreate(notifications);

      res.json({
        message: 'Broadcast sent successfully',
        recipientCount: users.length,
      });
    } catch (error) {
      console.error('Error sending broadcast:', error);
      res.status(500).json({ error: 'Failed to send broadcast' });
    }
  },

  // Get notification preferences
  async getPreferences(req, res) {
    try {
      const profile = await UserProfile.findOne({
        where: { user_id: req.user.id },
        attributes: ['notifications_enabled']
      });

      res.json({
        notifications_enabled: profile?.notifications_enabled ?? true,
      });
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
  },

  // Update notification preferences
  async updatePreferences(req, res) {
    try {
      const { notifications_enabled } = req.body;

      await UserProfile.update(
        { notifications_enabled },
        { where: { user_id: req.user.id } }
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  },

  // Send message (admin only)
  async sendMessage(req, res) {
    try {
      const { recipient_ids, subject, content, message_type = 'individual' } = req.body;
      const senderId = req.user.id;

      let userIds = [];

      if (message_type === 'broadcast') {
        // Send to all users
        const users = await User.findAll({
          where: { role: 'user' },
          attributes: ['id']
        });
        userIds = users.map(u => u.id);
      } else if (recipient_ids) {
        userIds = Array.isArray(recipient_ids) ? recipient_ids : [recipient_ids];
      }

      // Create messages for each recipient
      for (const userId of userIds) {
        await Message.create({
          sender_id: senderId,
          recipient_id: userId,
          subject,
          content,
          message_type,
          attachment_path: req.file?.path || null,
        });

        // Create notification for the user
        await Notification.create({
          user_id: userId,
          sent_by_user_id: senderId,
          title: subject,
          message: content,
          notification_type: 'general_message',
        });
      }

      res.json({
        success: true,
        message: `Message sent to ${userIds.length} users`,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  },

  // Get messages for current user
  async getMyMessages(req, res) {
    try {
      const messages = await Message.findAll({
        where: {
          [require('sequelize').Op.or]: [
            { recipient_id: req.user.id },
            { message_type: 'broadcast' }
          ]
        },
        include: [{
          model: User,
          as: 'sender',
          attributes: ['name', 'email']
        }],
        order: [['created_at', 'DESC']],
        limit: 50
      });

      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  },

  // Mark message as read
  async markMessageAsRead(req, res) {
    try {
      await Message.update(
        { is_read: true },
        {
          where: {
            id: req.params.id,
            [require('sequelize').Op.or]: [
              { recipient_id: req.user.id },
              { message_type: 'broadcast' }
            ]
          }
        }
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ error: 'Failed to mark message as read' });
    }
  },

  // Helper method to create notification (for use by other controllers)
  async createNotificationHelper(userId, sentByUserId, title, message, type = 'general_message', optionalLink = null, attachmentPath = null) {
    try {
      await Notification.create({
        user_id: userId,
        sent_by_user_id: sentByUserId,
        title,
        message,
        notification_type: type,
        optional_link: optionalLink,
        attachment_path: attachmentPath,
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  },
};

// Export controller and upload middleware
notificationController.upload = upload;

module.exports = notificationController;

