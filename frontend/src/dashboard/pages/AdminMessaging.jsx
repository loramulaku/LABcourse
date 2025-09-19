import React, { useState, useEffect } from 'react';
import apiFetch, { API_URL } from '../../../api';

export default function AdminMessaging() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [messageForm, setMessageForm] = useState({
    subject: '',
    content: '',
    message_type: 'individual'
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`${API_URL}/api/users`);
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    if (messageForm.message_type === 'broadcast') {
      return; // Don't allow individual selection for broadcast
    }
    
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleMessageTypeChange = (type) => {
    setMessageForm(prev => ({ ...prev, message_type: type }));
    if (type === 'broadcast') {
      setSelectedUsers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (messageForm.message_type === 'individual' && selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }
    
    if (!messageForm.subject.trim() || !messageForm.content.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSending(true);
      
      const formData = new FormData();
      formData.append('subject', messageForm.subject);
      formData.append('content', messageForm.content);
      formData.append('message_type', messageForm.message_type);
      
      if (messageForm.message_type === 'individual') {
        selectedUsers.forEach(userId => {
          formData.append('recipient_ids', userId);
        });
      }

      await apiFetch(`${API_URL}/api/notifications/send-message`, {
        method: 'POST',
        body: formData
      });

      alert(`Message sent successfully to ${messageForm.message_type === 'broadcast' ? 'all users' : selectedUsers.length + ' user(s)'}`);
      
      // Reset form
      setMessageForm({
        subject: '',
        content: '',
        message_type: 'individual'
      });
      setSelectedUsers([]);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Send Message</h2>
        <p className="text-gray-600">Send messages or notifications to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Message Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Message Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="message_type"
                      value="individual"
                      checked={messageForm.message_type === 'individual'}
                      onChange={(e) => handleMessageTypeChange(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-gray-700">Individual Message</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="message_type"
                      value="broadcast"
                      checked={messageForm.message_type === 'broadcast'}
                      onChange={(e) => handleMessageTypeChange(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-gray-700">Broadcast to All Users</span>
                  </label>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter message subject"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Content
                </label>
                <textarea
                  value={messageForm.content}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={6}
                  placeholder="Enter your message..."
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        {/* User Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {messageForm.message_type === 'broadcast' ? 'Broadcast Message' : 'Select Users'}
            </h3>
            
            {messageForm.message_type === 'broadcast' ? (
              <div className="text-center text-gray-600 py-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <p>This message will be sent to all users in the system.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center text-gray-500 py-4">
                    Loading users...
                  </div>
                ) : (
                  users
                    .filter(user => user.role === 'user') // Only show regular users
                    .map(user => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelect(user.id)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-800">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      </label>
                    ))
                )}
                
                {selectedUsers.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      {selectedUsers.length} user(s) selected
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
