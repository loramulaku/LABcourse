/**
 * NotificationService
 * 
 * Service layer for notification business logic
 * Handles notification creation, retrieval, and management
 * Following clean MVC architecture - separates business logic from controllers
 */

const { Notification, User } = require('../models');
const { Op } = require('sequelize');

class NotificationService {
  /**
   * Get user's notifications with pagination and filtering
   * @param {number} userId - User ID
   * @param {object} options - Query options (limit, offset, unreadOnly)
   * @returns {Promise<{notifications: Array, unreadCount: number}>}
   */
  async getUserNotifications(userId, options = {}) {
    const { limit = 50, offset = 0, unreadOnly = false } = options;

    const whereClause = { user_id: userId };
    if (unreadOnly) {
      whereClause.is_read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.findAll({
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
      }),
      Notification.count({
        where: {
          user_id: userId,
          is_read: false,
        },
      }),
    ]);

    // Format response with sender name
    const formattedNotifications = notifications.map(notification => {
      const notifData = notification.toJSON();
      notifData.sender_name = notifData.Sender?.name || 'System';
      return notifData;
    });

    return {
      notifications: formattedNotifications,
      unreadCount,
    };
  }

  /**
   * Get single notification by ID
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for authorization)
   * @param {string} userRole - User role (for authorization)
   * @returns {Promise<object>}
   */
  async getNotificationById(notificationId, userId, userRole) {
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
      throw new Error('Notification not found');
    }

    // Authorization check
    if (notification.user_id !== userId && userRole !== 'admin') {
      throw new Error('Unauthorized');
    }

    return notification;
  }

  /**
   * Create a new notification
   * @param {object} notificationData - Notification data
   * @returns {Promise<object>}
   */
  async createNotification(notificationData) {
    const notification = await Notification.create(notificationData);
    return notification;
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for authorization)
   * @param {string} userRole - User role (for authorization)
   * @returns {Promise<object>}
   */
  async markAsRead(notificationId, userId, userRole) {
    const notification = await Notification.findByPk(notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Authorization check
    if (notification.user_id !== userId && userRole !== 'admin') {
      throw new Error('Unauthorized');
    }

    await notification.update({ is_read: true });
    return notification;
  }

  /**
   * Mark all user notifications as read
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Number of notifications updated
   */
  async markAllAsRead(userId) {
    const [updateCount] = await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false,
        },
      }
    );

    return updateCount;
  }

  /**
   * Delete notification
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for authorization)
   * @param {string} userRole - User role (for authorization)
   * @returns {Promise<boolean>}
   */
  async deleteNotification(notificationId, userId, userRole) {
    const notification = await Notification.findByPk(notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Authorization check
    if (notification.user_id !== userId && userRole !== 'admin') {
      throw new Error('Unauthorized');
    }

    await notification.destroy();
    return true;
  }

  /**
   * Get unread notification count for user
   * @param {number} userId - User ID
   * @returns {Promise<number>}
   */
  async getUnreadCount(userId) {
    const count = await Notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });

    return count;
  }

  /**
   * Send broadcast notification to multiple users
   * @param {object} data - Broadcast data (title, message, notification_type, role)
   * @param {number} senderId - Sender user ID
   * @returns {Promise<{count: number, notifications: Array}>}
   */
  async sendBroadcast(data, senderId) {
    const { title, message, notification_type, role } = data;

    if (!title || !message) {
      throw new Error('Title and message are required');
    }

    // Get target users
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
      sent_by_user_id: senderId,
      title,
      message,
      notification_type: notification_type || 'system_alert',
    }));

    const createdNotifications = await Notification.bulkCreate(notifications);

    return {
      count: users.length,
      notifications: createdNotifications,
    };
  }

  /**
   * Helper method: Create notification (for use by other services)
   * @param {object} params - Notification parameters
   * @returns {Promise<object>}
   */
  async createNotificationHelper({
    userId,
    sentByUserId = null,
    title,
    message,
    type = 'general_message',
    optionalLink = null,
    attachmentPath = null,
    appointmentId = null,
  }) {
    try {
      const notification = await Notification.create({
        user_id: userId,
        sent_by_user_id: sentByUserId,
        title,
        message,
        notification_type: type,
        optional_link: optionalLink,
        attachment_path: attachmentPath,
        appointment_id: appointmentId,
      });

      console.log(`✅ Notification created: ID ${notification.id}, User ${userId}, Type: ${type}`);
      return notification;
    } catch (error) {
      console.error('❌ Failed to create notification:', error.message);
      throw error;
    }
  }

  /**
   * Get recent notifications (last 24 hours)
   * @param {number} userId - User ID
   * @param {number} limit - Maximum number of notifications
   * @returns {Promise<Array>}
   */
  async getRecentNotifications(userId, limit = 10) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const notifications = await Notification.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: yesterday,
        },
      },
      include: [
        {
          model: User,
          as: 'Sender',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
    });

    return notifications;
  }

  /**
   * Delete old read notifications (cleanup)
   * @param {number} daysOld - Delete notifications older than X days
   * @returns {Promise<number>} - Number of deleted notifications
   */
  async cleanupOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deletedCount = await Notification.destroy({
      where: {
        is_read: true,
        created_at: {
          [Op.lt]: cutoffDate,
        },
      },
    });

    console.log(`🗑️  Deleted ${deletedCount} old read notifications (older than ${daysOld} days)`);
    return deletedCount;
  }
}

// Export singleton instance
module.exports = new NotificationService();
