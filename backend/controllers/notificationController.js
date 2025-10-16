const { Notification, User } = require('../models');

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
};

module.exports = notificationController;

