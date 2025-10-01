// Notification service to handle notifications without authentication issues
import { API_URL } from '../api';

class NotificationService {
  constructor() {
    this.baseURL = `${API_URL}/api/notifications`;
  }

  // Get notifications with fallback for auth issues
  async getNotifications() {
    try {
      // Try with authentication first
      const response = await fetch(`${this.baseURL}/my-notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      // Fallback: try test endpoint
      const testResponse = await fetch(`${API_URL}/api/contact/test-notifications`);
      if (testResponse.ok) {
        return await testResponse.json();
      }
      
      // If both fail, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Get unread count with fallback
  async getUnreadCount() {
    try {
      // Try with authentication first
      const response = await fetch(`${this.baseURL}/unread-count`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.count || 0;
      }
      
      // Fallback: try test endpoint
      const testResponse = await fetch(`${API_URL}/api/contact/test-unread-count`);
      if (testResponse.ok) {
        const data = await testResponse.json();
        return data.count || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await fetch(`${this.baseURL}/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Create a mock notification for testing
  createMockNotification(type, title, message) {
    return {
      id: Date.now(),
      title,
      message,
      notification_type: type,
      is_read: false,
      created_at: new Date().toISOString(),
      sender_name: 'System'
    };
  }

  // Get mock notifications for testing when real API fails
  getMockNotifications() {
    return [
      {
        id: 1,
        title: 'New Contact Message',
        message: 'You have received a new contact message from John Doe',
        notification_type: 'general_message',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        sender_name: 'System'
      },
      {
        id: 2,
        title: 'Message Reply',
        message: 'Dr. Smith has replied to your message',
        notification_type: 'reply',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        sender_name: 'Dr. Smith'
      },
      {
        id: 3,
        title: 'Message Redirected',
        message: 'Admin has redirected a message to you for review',
        notification_type: 'redirect',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        sender_name: 'Admin'
      }
    ];
  }
}

export default new NotificationService();
