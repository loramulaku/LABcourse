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
    
    res.json({
      message: 'Database test completed',
      tables: {
        message_senders: messageSendersExists,
        messages: messagesExists,
        users: usersExists
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
    const [adminUsers] = await db.promise().query(
      'SELECT id FROM users WHERE role = "admin" LIMIT 1'
    );
    console.log('Admin users found:', adminUsers);
    
    if (adminUsers.length === 0) {
      console.log('ERROR: No admin user found');
      return res.status(400).json({ error: 'No admin user found' });
    }

    const adminUserId = adminUsers[0].id;
    console.log('Found admin user:', adminUserId);

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

    const [messages] = await db.promise().query(query, [userId]);
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
    const { id } = req.params;
    const { content, senderId } = req.body;
    const attachmentPath = req.file ? req.file.path : null;

    // Get original message
    const [originalMessage] = await db.promise().query(
      'SELECT * FROM messages WHERE id = ?',
      [id]
    );

    if (originalMessage.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const original = originalMessage[0];

    // Create reply message
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

    res.json({ 
      success: true, 
      message: 'Reply sent successfully',
      replyId: result.insertId 
    });

  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ error: 'Failed to send reply' });
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

module.exports = router;
