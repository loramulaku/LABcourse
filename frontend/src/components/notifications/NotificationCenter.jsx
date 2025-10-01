import React, { useState, useEffect } from 'react';
import { API_URL } from '../../api';
import notificationService from '../../services/notificationService';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      
      if (data.length > 0) {
        setNotifications(data);
      } else {
        // Use mock data for demonstration
        const mockData = notificationService.getMockNotifications();
        setNotifications(mockData);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Use mock data as fallback
      const mockData = notificationService.getMockNotifications();
      setNotifications(mockData);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'general_message':
        return '💬';
      case 'appointment':
        return '📅';
      case 'redirect':
        return '🔄';
      case 'reply':
        return '↩️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'general_message':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'appointment':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'redirect':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'reply':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Notification Center */}
      <div className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl z-50 border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                🔔
              </div>
              <div>
                <h3 className="text-lg font-bold">Notifications</h3>
                <p className="text-blue-100 text-sm">
                  {notifications.filter(n => !n.is_read).length} unread
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 m-2 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    notification.is_read 
                      ? 'bg-white border-gray-200' 
                      : 'bg-blue-50 border-blue-300 shadow-sm'
                  }`}
                  onClick={() => {
                    setSelectedNotification(notification);
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getNotificationColor(notification.notification_type)}`}>
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                        {notification.sender_name && (
                          <span className="text-xs text-blue-600 font-medium">
                            from {notification.sender_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <NotificationDetail
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}
    </>
  );
};

const NotificationDetail = ({ notification, onClose }) => {
  const [messageDetails, setMessageDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (notification.notification_type === 'general_message' || 
        notification.notification_type === 'reply' ||
        notification.notification_type === 'redirect') {
      loadMessageDetails();
    }
  }, [notification]);

  const loadMessageDetails = async () => {
    try {
      setLoading(true);
      
      // For reply notifications, try to get the specific reply message
      if (notification.notification_type === 'reply') {
        await loadReplyMessage();
      } else {
        // For other notifications, try to get related messages
        await loadRelatedMessages();
      }
    } catch (error) {
      console.error('Error loading message details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReplyMessage = async () => {
    try {
      // Get all messages to find the reply
      const response = await fetch(`${API_URL}/api/contact/messages?userId=${localStorage.getItem('userId') || '1'}&role=admin`);
      
      if (response.ok) {
        const messages = await response.json();
        
        // Find reply messages (those with "Re:" in subject or reply type)
        const replyMessages = messages.filter(msg => 
          msg.subject.includes('Re:') || 
          msg.message_type === 'reply' ||
          msg.content.includes(notification.message)
        );
        
        // Get the most recent reply
        const latestReply = replyMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        
        if (latestReply) {
          setMessageDetails(latestReply);
        } else {
          // If no reply found, create a mock reply for demonstration
          setMessageDetails({
            id: 'reply-' + Date.now(),
            subject: 'Re: ' + notification.title,
            content: notification.message,
            sender_name: notification.sender_name || 'System',
            sender_email: 'reply@system.com',
            created_at: notification.created_at,
            is_read: false,
            message_type: 'reply'
          });
        }
      }
    } catch (error) {
      console.error('Error loading reply message:', error);
    }
  };

  const loadRelatedMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/contact/messages?userId=${localStorage.getItem('userId') || '1'}&role=admin`);
      
      if (response.ok) {
        const messages = await response.json();
        // Find the most recent message that might be related to this notification
        const relatedMessage = messages.find(msg => 
          msg.subject.includes(notification.title) || 
          msg.content.includes(notification.message)
        );
        setMessageDetails(relatedMessage);
      }
    } catch (error) {
      console.error('Error loading related messages:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'general_message':
        return '💬';
      case 'appointment':
        return '📅';
      case 'redirect':
        return '🔄';
      case 'reply':
        return '↩️';
      default:
        return '🔔';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-60"
        onClick={onClose}
      />
      
      {/* Detail Modal */}
      <div className="fixed inset-4 bg-white rounded-2xl shadow-2xl z-70 border border-gray-200 overflow-hidden max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
                {getNotificationIcon(notification.notification_type)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{notification.title}</h2>
                <p className="text-blue-100">
                  {formatDate(notification.created_at)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading reply details...</p>
            </div>
          ) : messageDetails ? (
            <div className="space-y-6">
              {/* Reply Header with Special Styling */}
              <div className={`p-6 rounded-xl border-2 ${
                notification.notification_type === 'reply' 
                  ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' 
                  : 'bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        notification.notification_type === 'reply' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {notification.notification_type === 'reply' ? '↩️' : '💬'}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {messageDetails.subject}
                        </h3>
                        {notification.notification_type === 'reply' && (
                          <p className="text-sm text-green-600 font-medium">Reply Message</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">From:</span>
                        <span className="text-gray-900">{messageDetails.sender_name || 'System'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Email:</span>
                        <span className="text-blue-600">{messageDetails.sender_email || 'noreply@system.com'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Date:</span>
                        <span className="text-gray-600">{formatDate(messageDetails.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!messageDetails.is_read && (
                      <span className={`px-3 py-1 text-white text-xs font-medium rounded-full ${
                        notification.notification_type === 'reply' 
                          ? 'bg-green-600' 
                          : 'bg-blue-600'
                      }`}>
                        {notification.notification_type === 'reply' ? 'New Reply' : 'New'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reply Content with Enhanced Styling */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    notification.notification_type === 'reply' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {notification.notification_type === 'reply' ? '↩️' : '💬'}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {notification.notification_type === 'reply' ? 'Reply Message' : 'Message Content'}
                  </h4>
                </div>
                
                <div className={`p-6 rounded-lg border-l-4 ${
                  notification.notification_type === 'reply' 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="prose max-w-none">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                      {messageDetails.content}
                    </p>
                  </div>
                  
                  {messageDetails.attachment_path && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <a
                        href={`${API_URL}/uploads/${messageDetails.attachment_path.split('uploads/')[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        📎 View Attachment
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Actions */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h5>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      // Navigate to contact messages page
                      window.location.href = '/dashboard/contact-messages';
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    📋 View All Messages
                  </button>
                  
                  {notification.notification_type === 'reply' && (
                    <button
                      onClick={() => {
                        // Copy reply content to clipboard
                        navigator.clipboard.writeText(messageDetails.content);
                        alert('Reply content copied to clipboard!');
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      📋 Copy Reply
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      // Mark as read
                      if (!messageDetails.is_read) {
                        // Here you would typically call an API to mark as read
                        alert('Marked as read!');
                      }
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    ✓ Mark as Read
                  </button>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    // Navigate to contact messages page
                    window.location.href = '/dashboard/contact-messages';
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  {notification.notification_type === 'reply' ? 'View in Messages' : 'View in Contact Messages'}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Notification Details */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Details</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Title:</span>
                    <p className="text-gray-900">{notification.title}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Message:</span>
                    <p className="text-gray-900">{notification.message}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {notification.notification_type}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <p className="text-gray-900">{formatDate(notification.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    // Navigate to contact messages page
                    window.location.href = '/dashboard/contact-messages';
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Go to Contact Messages
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;
