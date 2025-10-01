import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CheckReplies = () => {
  const [email, setEmail] = useState('');
  const [replies, setReplies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReply, setSelectedReply] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' or 'replies'

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleCheckReplies = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setReplies([]);
    setNotifications([]);

    try {
      // Fetch both notifications and replies
      const [notificationsRes, repliesRes] = await Promise.all([
        fetch(`${API_URL}/api/contact/external-notifications/${encodeURIComponent(email)}`),
        fetch(`${API_URL}/api/contact/external-replies/${encodeURIComponent(email)}`)
      ]);
      
      if (notificationsRes.ok && repliesRes.ok) {
        const notificationsData = await notificationsRes.json();
        const repliesData = await repliesRes.json();
        
        setNotifications(notificationsData);
        setReplies(repliesData);
        
        if (notificationsData.length === 0 && repliesData.length === 0) {
          setError('No notifications or replies found for this email address');
        }
      } else {
        setError('Failed to fetch data. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (replyId) => {
    try {
      await fetch(`${API_URL}/api/contact/external-replies/${replyId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
      });
      
      // Update local state
      setReplies(replies.map(reply => 
        reply.id === replyId ? { ...reply, is_read: true } : reply
      ));
      
      if (selectedReply && selectedReply.id === replyId) {
        setSelectedReply({ ...selectedReply, is_read: true });
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  return (
    <>
      <Helmet>
        <title>Check Your Messages & Replies - Lab Course</title>
        <meta name="description" content="Check for notifications and replies to your contact messages from our medical team. Enter your email to view detailed responses." />
        <meta name="keywords" content="contact messages, replies, notifications, medical support, patient communication" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Check Your Messages & Replies
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter your email address to check for notifications and replies to your contact messages from our team.
          </p>
        </div>

        {/* Email Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <form onSubmit={handleCheckReplies} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Your Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter the email address you used to contact us"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Checking for Messages...' : 'Check for Messages & Replies'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Tabs and Content */}
        {(notifications.length > 0 || replies.length > 0) && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'notifications'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Notifications ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('replies')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'replies'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Detailed Replies ({replies.length})
              </button>
            </div>

            {/* Notifications Tab */}
            {activeTab === 'notifications' && notifications.length > 0 && (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-green-50 border-l-4 border-green-400' : ''
                    }`}
                    onClick={() => setSelectedNotification(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">🔔</span>
                          <h3 className="text-lg font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-gray-600">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Replies Tab */}
            {activeTab === 'replies' && replies.length > 0 && (
              <div className="divide-y divide-gray-200">
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !reply.is_read ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                    }`}
                    onClick={() => {
                      setSelectedReply(reply);
                      if (!reply.is_read) {
                        markAsRead(reply.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {reply.title}
                        </h3>
                        <p className="text-gray-600 mb-2 line-clamp-2">
                          {reply.message || reply.message_content}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>From: {reply.sender_name || 'Admin'}</span>
                          <span>Date: {formatDate(reply.created_at)}</span>
                          {!reply.is_read && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                          ↩️
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reply Detail Modal */}
        {selectedReply && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-lg">
                      ↩️
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedReply.title}
                      </h3>
                      <p className="text-sm text-green-600 font-medium">Reply Message</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReply(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                <div className="space-y-6">
                  {/* Reply Content */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        ↩️
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Reply Message
                      </h4>
                    </div>
                    
                    <div className="p-6 rounded-lg border-l-4 bg-green-50 border-green-400">
                      <div className="prose max-w-none">
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                          {selectedReply.message || selectedReply.message_content}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h5>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedReply.message || selectedReply.message_content);
                          alert('Reply content copied to clipboard!');
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        📋 Copy Reply
                      </button>
                      
                      {!selectedReply.is_read && (
                        <button
                          onClick={() => markAsRead(selectedReply.id)}
                          className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          ✓ Mark as Read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Close Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelectedReply(null)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Detail Modal */}
        {selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    🔔
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedNotification.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedNotification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400 mb-6">
                  <p className="text-gray-800 leading-relaxed">
                    {selectedNotification.message}
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setSelectedNotification(null);
                      setActiveTab('replies');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    View Detailed Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default CheckReplies;
