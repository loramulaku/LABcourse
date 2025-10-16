# Notification System Integration

## Overview
This notification system provides a complete solution for displaying and managing notifications in the LABcourse application.

## Components

### 1. NotificationBell
- Shows notification count badge
- Opens notification center on click
- Auto-refreshes unread count

### 2. NotificationCenter
- Lists all notifications
- Shows detailed message views
- Handles reply notifications with special styling

### 3. NotificationDetail
- Detailed view for individual notifications
- Enhanced UI for reply messages
- Quick actions (copy, mark as read, etc.)

### 4. notificationService
- Centralized API calls
- Fallback to test endpoints
- Error handling

## Integration Steps

### 1. Add to Header Component
```jsx
import NotificationBell from './components/notifications/NotificationBell';

// In your header component:
<NotificationBell />
```

### 2. Add Routes (if needed)
```jsx
// In App.jsx or your router
import NotificationDemo from './pages/NotificationDemo';

// Add route:
<Route path="/notification-demo" element={<NotificationDemo />} />
```

### 3. Test the System
1. Visit `/notification-demo` to see the notification system
2. Click on reply notifications to see detailed views
3. Test the notification bell and center

## Features

### Reply Notifications
- Special green styling for reply messages
- Enhanced UI with reply icons
- Copy reply content functionality
- Clear visual distinction from other notifications

### Message Details
- Full message content display
- Sender information
- Timestamp formatting
- Attachment support
- Quick actions

### Responsive Design
- Mobile-friendly interface
- Clean, modern styling
- Accessible color schemes

## API Endpoints

### Test Endpoints (No Auth Required)
- `GET /api/contact/test-notifications` - Mock notifications
- `GET /api/contact/test-unread-count` - Mock unread count

### Production Endpoints (Auth Required)
- `GET /api/notifications/my-notifications` - User notifications
- `GET /api/notifications/unread-count` - Unread count
- `POST /api/notifications/:id/mark-read` - Mark as read

## Usage Examples

### Basic Integration
```jsx
import { NotificationBell } from './components/notifications/NotificationBell';

function Header() {
  return (
    <header>
      <NotificationBell />
    </header>
  );
}
```

### Custom Styling
The components use Tailwind CSS and can be customized by modifying the className props.

## Testing

1. **Demo Page**: Visit `/notification-demo` for full testing
2. **API Testing**: Use the test endpoints for development
3. **Integration**: Add to your main application header

## Troubleshooting

### Common Issues
1. **403 Forbidden**: Use test endpoints for development
2. **No Notifications**: Check API_URL configuration
3. **Styling Issues**: Ensure Tailwind CSS is properly configured

### Debug Mode
Enable console logging by setting `localStorage.setItem('debug', 'true')` in browser console.

