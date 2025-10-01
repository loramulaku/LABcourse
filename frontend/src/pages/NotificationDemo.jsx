import React, { useState } from 'react';
import NotificationBell from '../components/notifications/NotificationBell';
import notificationService from '../services/notificationService';

const NotificationDemo = () => {
  const [notifications, setNotifications] = useState([]);

  const addMockNotification = (type, title, message) => {
    const newNotification = notificationService.createMockNotification(type, title, message);
    setNotifications(prev => [newNotification, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🔔 Notification System Demo
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Notification Bell */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🔔 Notification Bell
              </h2>
              <p className="text-gray-600 mb-4">
                Click the bell icon to open the notification center and see detailed message views.
              </p>
              
              <div className="flex justify-center">
                <NotificationBell />
              </div>
              
              <div className="mt-4 text-sm text-gray-500 text-center">
                The bell shows unread count and opens the notification center
              </div>
            </div>

            {/* Demo Controls */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🎮 Demo Controls
              </h2>
              <p className="text-gray-600 mb-4">
                Add mock notifications to test the system:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => addMockNotification('general_message', 'New Contact Message', 'You have received a new contact message from Sarah Johnson')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  📧 Add Contact Message
                </button>
                
                <button
                  onClick={() => addMockNotification('reply', 'Message Reply', 'Dr. Anderson has replied to your message about the test results')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  ↩️ Add Reply Notification
                </button>
                
                <button
                  onClick={() => addMockNotification('redirect', 'Message Redirected', 'Admin has redirected a message to you for review')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  🔄 Add Redirect Notification
                </button>
                
                <button
                  onClick={() => addMockNotification('appointment', 'New Appointment', 'You have a new appointment scheduled for tomorrow at 2:00 PM')}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  📅 Add Appointment Notification
                </button>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-8 bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">✨ Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl">🎨</span>
                <div>
                  <h4 className="font-medium text-gray-900">Attractive UI</h4>
                  <p className="text-sm text-gray-600">Modern design with gradients, animations, and smooth transitions</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-xl">📱</span>
                <div>
                  <h4 className="font-medium text-gray-900">Responsive Design</h4>
                  <p className="text-sm text-gray-600">Works perfectly on desktop, tablet, and mobile devices</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-purple-600 text-xl">🔍</span>
                <div>
                  <h4 className="font-medium text-gray-900">Detailed Views</h4>
                  <p className="text-sm text-gray-600">Click notifications to see full message details and content</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-orange-600 text-xl">⚡</span>
                <div>
                  <h4 className="font-medium text-gray-900">Real-time Updates</h4>
                  <p className="text-sm text-gray-600">Automatic refresh and live notification counts</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-red-600 text-xl">🎯</span>
                <div>
                  <h4 className="font-medium text-gray-900">Smart Categorization</h4>
                  <p className="text-sm text-gray-600">Different icons and colors for different notification types</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-indigo-600 text-xl">🔗</span>
                <div>
                  <h4 className="font-medium text-gray-900">Direct Navigation</h4>
                  <p className="text-sm text-gray-600">Quick access to related pages and message details</p>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Instructions */}
          <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Integration Instructions</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p><strong>1.</strong> Add the NotificationBell component to your header/navigation</p>
              <p><strong>2.</strong> Import: <code className="bg-gray-200 px-2 py-1 rounded">import NotificationBell from './components/notifications/NotificationBell'</code></p>
              <p><strong>3.</strong> Use: <code className="bg-gray-200 px-2 py-1 rounded">&lt;NotificationBell /&gt;</code></p>
              <p><strong>4.</strong> The system automatically handles authentication and fallbacks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;
