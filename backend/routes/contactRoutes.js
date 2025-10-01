const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Contact routes are working!' });
});

// Test database tables
router.get('/test-db', async (req, res) => {
  try {
    console.log('Testing database tables...');
    
    // Test if message_senders table exists
    const [tables] = await db.promise().query(
      "SHOW TABLES LIKE 'message_senders'"
    );
    
    const messageSendersExists = tables.length > 0;
    console.log('message_senders table exists:', messageSendersExists);
    
    // Test if messages table exists
    const [messagesTable] = await db.promise().query(
      "SHOW TABLES LIKE 'messages'"
    );
    
    const messagesExists = messagesTable.length > 0;
    console.log('messages table exists:', messagesExists);
    
    // Test if users table exists
    const [usersTable] = await db.promise().query(
      "SHOW TABLES LIKE 'users'"
    );
    
    const usersExists = usersTable.length > 0;
    console.log('users table exists:', usersExists);
    
    // Debug: Check what's actually in the database
    const [messages] = await db.promise().query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 5');
    const [users] = await db.promise().query('SELECT id, name, email, role FROM users');
    const [messageSenders] = await db.promise().query('SELECT * FROM message_senders ORDER BY created_at DESC LIMIT 5');
    
    res.json({
      message: 'Database test completed',
      tables: {
        message_senders: messageSendersExists,
        messages: messagesExists,
        users: usersExists
      },
      debug: {
        messages: messages,
        users: users,
        messageSenders: messageSenders
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: 'Database test failed: ' + error.message });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/contact-attachments');
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

// Send contact message - ALWAYS goes to Admin first
router.post('/send-message', upload.single('attachment'), async (req, res) => {
  try {
    console.log('=== CONTACT MESSAGE RECEIVED ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const { firstName, lastName, email, message } = req.body;
    const attachmentPath = req.file ? req.file.path : null;

    console.log('Processing contact message from:', firstName, lastName, email);

    // Test database connection first
    console.log('Testing database connection...');
    const [testResult] = await db.promise().query('SELECT 1 as test');
    console.log('Database connection OK:', testResult);

    // Find admin user - ALL contact messages go to admin first
    console.log('Looking for admin user...');
    let [adminUsers] = await db.promise().query(
      'SELECT id FROM users WHERE role = "admin" LIMIT 1'
    );
    console.log('Admin users found:', adminUsers);
    
    let adminUserId;
    
    if (adminUsers.length === 0) {
      console.log('No admin user found, creating one...');
      // Create an admin user if none exists
      const [newAdmin] = await db.promise().query(
        `INSERT INTO users (name, email, password, role, account_status, created_at) 
         VALUES ('System Admin', 'admin@labcourse.com', '$2b$10$dummy.hash.for.admin', 'admin', 'active', NOW())`
      );
      adminUserId = newAdmin.insertId;
      
      // Create admin profile
      await db.promise().query(
        `INSERT INTO admin_profiles (user_id, first_name, last_name, bio, avatar_path) 
         VALUES (?, 'System', 'Admin', 'System administrator for LabCourse', '/uploads/avatars/default.png')`,
        [adminUserId]
      );
      
      console.log('Created admin user with ID:', adminUserId);
    } else {
      adminUserId = adminUsers[0].id;
      console.log('Found admin user:', adminUserId);
    }

    console.log('Inserting message into database...');
    
    // First, ensure we have a system user for external contacts
    let systemUserId;
    try {
      const [systemUser] = await db.promise().query(
        'SELECT id FROM users WHERE email = "system@external.contact" LIMIT 1'
      );
      
      if (systemUser.length === 0) {
        console.log('Creating system user for external contacts...');
        const [newSystemUser] = await db.promise().query(
          `INSERT INTO users (name, email, password, role, created_at) 
           VALUES ('External Contact', 'system@external.contact', 'system_password', 'admin', NOW())`
        );
        systemUserId = newSystemUser.insertId;
        console.log('System user created with ID:', systemUserId);
      } else {
        systemUserId = systemUser[0].id;
        console.log('Using existing system user ID:', systemUserId);
      }
    } catch (systemError) {
      console.log('Error with system user:', systemError.message);
      // Fallback: use admin as sender
      systemUserId = adminUserId;
    }
    
    // Insert message into database - always goes to admin
    const [result] = await db.promise().query(
      `INSERT INTO messages (sender_id, recipient_id, subject, content, message_type, attachment_path, is_read, created_at) 
       VALUES (?, ?, ?, ?, 'individual', ?, FALSE, NOW())`,
      [systemUserId, adminUserId, `Contact from ${firstName} ${lastName}`, message, attachmentPath]
    );

    const messageId = result.insertId;
    console.log('Message inserted with ID:', messageId);

    console.log('Creating notification for admin...');
    // Create notification for admin
    await db.promise().query(
      `INSERT INTO notifications (user_id, sent_by_user_id, title, message, notification_type, is_read, created_at) 
       VALUES (?, ?, 'New Contact Message', 'You have received a new contact message from ${firstName} ${lastName}', 'general_message', FALSE, NOW())`,
      [adminUserId, systemUserId]
    );

    console.log('Notification created');

    // Store sender info for reply purposes
    try {
      console.log('Storing sender info...');
      await db.promise().query(
        `INSERT INTO message_senders (message_id, sender_name, sender_email) 
         VALUES (?, ?, ?)`,
        [messageId, `${firstName} ${lastName}`, email]
      );
      console.log('Sender info stored');
    } catch (senderError) {
      console.log('Could not store sender info (table may not exist):', senderError.message);
      // Continue without failing
    }

    console.log('=== MESSAGE SENT TO ADMIN SUCCESSFULLY ===');
    res.json({ 
      success: true, 
      message: 'Message sent successfully to admin',
      messageId: messageId 
    });

  } catch (error) {
    console.error('=== ERROR SENDING CONTACT MESSAGE ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to send message: ' + error.message });
  }
});

// Get contact messages for admin/doctor/lab
router.get('/messages', async (req, res) => {
  try {
    const { userId, role } = req.query;

    let adminUserId = userId;
    
    // If no userId provided, find admin user automatically
    if (!adminUserId) {
      const [adminUsers] = await db.promise().query(
        'SELECT id FROM users WHERE role = "admin" LIMIT 1'
      );
      
      if (adminUsers.length === 0) {
        return res.status(400).json({ error: 'No admin user found' });
      }
      
      adminUserId = adminUsers[0].id;
    }

    let query = `
      SELECT m.*, ms.sender_name, ms.sender_email, 
             u.name as recipient_name, u.email as recipient_email,
             cmr.id as redirect_id, cmr.status as redirect_status,
             cmr.redirected_to_user_id, cmr.redirected_by_admin_id
      FROM messages m
      LEFT JOIN message_senders ms ON m.id = ms.message_id
      LEFT JOIN users u ON m.recipient_id = u.id
      LEFT JOIN contact_message_redirects cmr ON m.id = cmr.original_message_id
      WHERE m.recipient_id = ?
      ORDER BY m.created_at DESC
    `;

    const [messages] = await db.promise().query(query, [adminUserId]);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Admin redirect message to doctor/lab
router.post('/redirect-message', async (req, res) => {
  try {
    const { messageId, redirectToUserId, redirectReason, adminId } = req.body;

    console.log('Redirecting message:', messageId, 'to user:', redirectToUserId);

    // Create redirect record
    const [redirectResult] = await db.promise().query(
      `INSERT INTO contact_message_redirects (original_message_id, redirected_to_user_id, redirected_by_admin_id, redirect_reason, status, created_at) 
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [messageId, redirectToUserId, adminId, redirectReason]
    );

    // Create notification for the redirected user
    await db.promise().query(
      `INSERT INTO notifications (user_id, sent_by_user_id, title, message, notification_type, is_read, created_at) 
       VALUES (?, ?, 'Message Redirected to You', 'Admin has redirected a contact message to you for review', 'general_message', FALSE, NOW())`,
      [redirectToUserId, adminId]
    );

    res.json({ 
      success: true, 
      message: 'Message redirected successfully',
      redirectId: redirectResult.insertId 
    });

  } catch (error) {
    console.error('Error redirecting message:', error);
    res.status(500).json({ error: 'Failed to redirect message' });
  }
});

// Mark message as read
router.put('/messages/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    await db.promise().query(
      'UPDATE messages SET is_read = TRUE WHERE id = ?',
      [id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Reply to message
router.post('/messages/:id/reply', upload.single('attachment'), async (req, res) => {
  try {
    console.log('=== REPLY MESSAGE RECEIVED ===');
    const { id } = req.params;
    
    // Handle both FormData and JSON requests
    let content, senderId;
    if (req.body.content && req.body.senderId) {
      // FormData request
      content = req.body.content;
      senderId = parseInt(req.body.senderId) || 1; // Convert to integer, fallback to admin ID 1
    } else {
      // JSON request
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      content = body.content;
      senderId = parseInt(body.senderId) || 1; // Convert to integer, fallback to admin ID 1
    }
    
    const attachmentPath = req.file ? req.file.path : null;

    console.log('Reply params:', { id, content, senderId, attachmentPath });

    // Get original message with sender info
    const [originalMessage] = await db.promise().query(
      `SELECT m.*, ms.sender_email, ms.sender_name 
       FROM messages m 
       LEFT JOIN message_senders ms ON m.id = ms.message_id 
       WHERE m.id = ?`,
      [id]
    );

    if (originalMessage.length === 0) {
      console.log('Message not found for ID:', id);
      return res.status(404).json({ error: 'Message not found' });
    }

    const original = originalMessage[0];
    console.log('Original message:', original);

    // Check if this is an external contact (system user or sender_id 0)
    const [systemUserCheck] = await db.promise().query(
      'SELECT id, email FROM users WHERE id = ? AND email = "system@external.contact"',
      [original.sender_id]
    );

    // For external contacts, create a reply that can be delivered via email
    if (systemUserCheck.length > 0 || original.sender_id === 0 || original.sender_id === null) {
      console.log('External contact - creating reply for email delivery');
      
      // Store the reply in the database with special handling for external contacts
      const [result] = await db.promise().query(
        `INSERT INTO messages (sender_id, recipient_id, subject, content, message_type, attachment_path, is_read, created_at) 
         VALUES (?, ?, ?, ?, 'individual', ?, FALSE, NOW())`,
        [senderId, original.sender_id, `Re: ${original.subject || 'Contact Message'}`, content, attachmentPath]
      );

      // Create a special notification for the admin indicating a reply is ready for email delivery
      await db.promise().query(
        `INSERT INTO notifications (user_id, sent_by_user_id, title, message, notification_type, is_read, created_at) 
         VALUES (?, ?, 'Reply Ready for Email Delivery', 'Reply to ${original.sender_email} is ready. You can now send it via email to the original sender.', 'general_message', FALSE, NOW())`,
        [senderId, senderId]
      );

      // Create a notification entry for external user (stored in a special way for external access)
      // We'll store this in the notifications table with a special marker for external users
      await db.promise().query(
        `INSERT INTO notifications (user_id, sent_by_user_id, title, message, notification_type, is_read, optional_link, created_at) 
         VALUES (?, ?, 'Check Your Replies on Contact', 'You have received a reply to your contact message. Click to view the detailed response.', 'general_message', FALSE, '/check-replies', NOW())`,
        [original.sender_id, senderId] // Use sender_id as user_id for external notification tracking
      );

      // Store reply information in message_senders for external contact tracking
      try {
        await db.promise().query(
          `INSERT INTO message_senders (message_id, sender_name, sender_email) 
           VALUES (?, ?, ?)`,
          [result.insertId, 'Admin Reply', original.sender_email]
        );
        console.log('Reply sender info stored for external contact tracking');
      } catch (replyError) {
        console.log('Could not store reply sender info:', replyError.message);
      }

      console.log('Reply created for external contact with email delivery notification');
      res.json({ 
        success: true, 
        message: 'Reply created successfully. You can now send it to the original sender via email.',
        replyId: result.insertId,
        emailDelivery: true,
        recipientEmail: original.sender_email
      });
    } else {
      // Internal user - send reply directly
      console.log('Internal user - sending reply directly');
      
      const [result] = await db.promise().query(
        `INSERT INTO messages (sender_id, recipient_id, subject, content, message_type, attachment_path, is_read, created_at) 
         VALUES (?, ?, ?, ?, 'individual', ?, FALSE, NOW())`,
        [senderId, original.sender_id, `Re: ${original.subject}`, content, attachmentPath]
      );

      // Create notification for original sender
      await db.promise().query(
        `INSERT INTO notifications (user_id, sent_by_user_id, title, message, notification_type, is_read, created_at) 
         VALUES (?, ?, 'Reply to your message', 'You have received a reply to your message', 'general_message', FALSE, NOW())`,
        [original.sender_id, senderId]
      );

      console.log('Reply sent to internal user');
      res.json({ 
        success: true, 
        message: 'Reply sent successfully',
        replyId: result.insertId 
      });
    }

  } catch (error) {
    console.error('=== ERROR SENDING REPLY ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to send reply: ' + error.message });
  }
});

// Forward message to email
router.post('/messages/:id/forward', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, subject, message } = req.body;

    // Get message details
    const [messages] = await db.promise().query(
      'SELECT * FROM messages WHERE id = ?',
      [id]
    );

    if (messages.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const messageData = messages[0];

    // Here you would integrate with your email service (e.g., SendGrid, Nodemailer)
    // For now, we'll just log the email details
    console.log('Email forwarding:', {
      to: email,
      subject: subject || `Forwarded: ${messageData.subject}`,
      content: message || messageData.content,
      attachment: messageData.attachment_path
    });

    // TODO: Implement actual email sending
    // await sendEmail({
    //   to: email,
    //   subject: subject || `Forwarded: ${messageData.subject}`,
    //   content: message || messageData.content,
    //   attachment: messageData.attachment_path
    // });

    res.json({ 
      success: true, 
      message: 'Message forwarded successfully' 
    });

  } catch (error) {
    console.error('Error forwarding message:', error);
    res.status(500).json({ error: 'Failed to forward message' });
  }
});

// Simple notification endpoints for testing (without auth)
router.get('/test-notifications', async (req, res) => {
  try {
    // Return mock notifications for testing
    const mockNotifications = [
      {
        id: 1,
        title: 'New Contact Message',
        message: 'You have received a new contact message from John Doe',
        notification_type: 'general_message',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        sender_name: 'System'
      },
      {
        id: 2,
        title: 'Reply from Dr. Smith',
        message: 'Dr. Smith has replied to your message: "Thank you for your inquiry about the blood test results. I have reviewed your case and all values are within normal ranges. Please schedule a follow-up appointment if you have any concerns."',
        notification_type: 'reply',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        sender_name: 'Dr. Smith',
        sender_email: 'dr.smith@labcourse.com'
      },
      {
        id: 3,
        title: 'Lab Results Reply',
        message: 'Laboratory has provided results: "Your test results are ready. All blood work shows normal values. Please contact your doctor if you have any questions about the results."',
        notification_type: 'reply',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        sender_name: 'Lab Technician',
        sender_email: 'lab@labcourse.com'
      },
      {
        id: 4,
        title: 'Message Redirected',
        message: 'Admin has redirected a message to you for review',
        notification_type: 'redirect',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        sender_name: 'Admin'
      }
    ];
    
    res.json(mockNotifications);
  } catch (error) {
    console.error('Error fetching test notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/test-unread-count', async (req, res) => {
  try {
    // Return mock unread count
    res.json({ count: 2 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Get notifications for external users
router.get('/external-notifications/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Fetching notifications for external user:', email);

    // Find notifications for external users by looking for notifications that reference their email
    const [notifications] = await db.promise().query(
      `SELECT 
         n.id,
         n.title,
         n.message,
         n.notification_type,
         n.is_read,
         n.optional_link,
         n.created_at,
         'Admin' as sender_name
       FROM notifications n
       WHERE n.message LIKE ? 
       OR n.title = 'Check Your Replies on Contact'
       ORDER BY n.created_at DESC`,
      [`%${email}%`]
    );

    console.log('Total notifications found:', notifications.length);
    res.json(notifications);

  } catch (error) {
    console.error('Error fetching external notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get replies for external users (by email)
router.get('/external-replies/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Fetching replies for external user:', email);

    // Find replies by looking for messages where the sender_email in message_senders matches the user's email
    // These are replies that were sent TO the external user
    const [replies] = await db.promise().query(
      `SELECT 
         m.id,
         m.subject,
         m.content as message_content,
         m.created_at,
         m.is_read,
         ms_original.sender_name as original_sender_name,
         ms_original.sender_email as original_sender_email,
         ms_reply.sender_name as reply_sender_name,
         ms_reply.sender_email as reply_sender_email,
         'general_message' as notification_type,
         CONCAT('Reply to: ', m.subject) as title
       FROM messages m
       LEFT JOIN message_senders ms_reply ON m.id = ms_reply.message_id
       LEFT JOIN message_senders ms_original ON m.id = ms_original.message_id
       WHERE m.message_type = 'individual' 
       AND m.subject LIKE 'Re: %'
       AND (
         ms_reply.sender_email = ? 
         OR m.content LIKE ?
       )
       ORDER BY m.created_at DESC`,
      [email, `%${email}%`]
    );

    // Also find replies by looking for messages that were sent as replies to original messages from this email
    const [additionalReplies] = await db.promise().query(
      `SELECT 
         m.id,
         m.subject,
         m.content as message_content,
         m.created_at,
         m.is_read,
         ms_original.sender_name as original_sender_name,
         ms_original.sender_email as original_sender_email,
         'Admin' as reply_sender_name,
         'admin@system.com' as reply_sender_email,
         'general_message' as notification_type,
         CONCAT('Reply to: ', m.subject) as title
       FROM messages m
       LEFT JOIN message_senders ms_original ON m.id = ms_original.message_id
       WHERE m.message_type = 'individual' 
       AND m.subject LIKE 'Re: %'
       AND m.id IN (
         SELECT DISTINCT m2.id 
         FROM messages m2
         LEFT JOIN message_senders ms2 ON m2.id = ms2.message_id
         WHERE ms2.sender_email = ?
         AND m2.message_type = 'individual'
       )
       ORDER BY m.created_at DESC`,
      [email]
    );

    // Merge and deduplicate replies
    const allReplies = [...replies, ...additionalReplies];
    const uniqueReplies = allReplies.filter((reply, index, self) => 
      index === self.findIndex(r => r.id === reply.id)
    );

    console.log('Total replies found:', uniqueReplies.length);
    res.json(uniqueReplies);

  } catch (error) {
    console.error('Error fetching external replies:', error);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

// Mark external reply as read
router.put('/external-replies/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    
    // Mark the message as read in the messages table
    await db.promise().query(
      'UPDATE messages SET is_read = TRUE WHERE id = ?',
      [id]
    );
    
    console.log('Reply marked as read in messages table');
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking reply as read:', error);
    res.status(500).json({ error: 'Failed to mark reply as read' });
  }
});

module.exports = router;
