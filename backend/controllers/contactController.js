const { Message, User, Notification, MessageSender, ContactMessageRedirect } = require('../models');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/contact-attachments');
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

// Test endpoint
exports.test = (req, res) => {
  res.json({ message: 'Contact routes are working!' });
};

// Test database tables
exports.testDatabase = async (req, res) => {
  try {
    console.log('Testing database tables...');
    
    // Check if models exist by querying them
    const messagesCount = await Message.count();
    const usersCount = await User.count();
    const messageSendersCount = await MessageSender.count();
    
    // Get sample data
    const messages = await Message.findAll({ 
      limit: 5, 
      order: [['created_at', 'DESC']] 
    });
    
    const users = await User.findAll({ 
      attributes: ['id', 'name', 'email', 'role'],
      limit: 10
    });
    
    const messageSenders = await MessageSender.findAll({ 
      limit: 5, 
      order: [['created_at', 'DESC']] 
    });
    
    res.json({
      message: 'Database test completed',
      tables: {
        messages: messagesCount > 0 || messages.length >= 0,
        users: usersCount > 0 || users.length >= 0,
        message_senders: messageSendersCount > 0 || messageSenders.length >= 0
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
};

// Send contact message - ALWAYS goes to Admin first
exports.sendMessage = async (req, res) => {
  try {
    console.log('=== CONTACT MESSAGE RECEIVED ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const { firstName, lastName, email, message } = req.body;
    const attachmentPath = req.file ? req.file.path : null;

    console.log('Processing contact message from:', firstName, lastName, email);

    // Find admin user - ALL contact messages go to admin first
    console.log('Looking for admin user...');
    let admin = await User.findOne({
      where: { role: 'admin' }
    });
    
    let adminUserId;
    
    if (!admin) {
      console.log('No admin user found, creating one...');
      // Create an admin user if none exists
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@labcourse.com',
        password: hashedPassword,
        role: 'admin',
        account_status: 'active'
      });
      
      adminUserId = admin.id;
      console.log('Created admin user with ID:', adminUserId);
    } else {
      adminUserId = admin.id;
      console.log('Found admin user:', adminUserId);
    }

    console.log('Inserting message into database...');
    
    // First, ensure we have a system user for external contacts
    let systemUser = await User.findOne({
      where: { email: 'system@external.contact' }
    });
    
    if (!systemUser) {
      console.log('Creating system user for external contacts...');
      systemUser = await User.create({
        name: 'External Contact',
        email: 'system@external.contact',
        password: 'system_password',
        role: 'admin'
      });
      console.log('System user created with ID:', systemUser.id);
    } else {
      console.log('Using existing system user ID:', systemUser.id);
    }
    
    // Insert message into database - always goes to admin
    const newMessage = await Message.create({
      sender_id: systemUser.id,
      recipient_id: adminUserId,
      subject: `Contact from ${firstName} ${lastName}`,
      content: message,
      message_type: 'individual',
      attachment_path: attachmentPath,
      is_read: false
    });

    const messageId = newMessage.id;
    console.log('Message inserted with ID:', messageId);

    console.log('Creating notification for admin...');
    // Create notification for admin
    await Notification.create({
      user_id: adminUserId,
      sent_by_user_id: systemUser.id,
      title: 'New Contact Message',
      message: `You have received a new contact message from ${firstName} ${lastName}`,
      notification_type: 'general_message',
      is_read: false
    });

    console.log('Notification created');

    // Store sender info for reply purposes
    try {
      console.log('Storing sender info...');
      await MessageSender.create({
        message_id: messageId,
        sender_name: `${firstName} ${lastName}`,
        sender_email: email
      });
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
};

// Get contact messages for admin/doctor/lab
exports.getMessages = async (req, res) => {
  try {
    const { userId, role } = req.query;

    let adminUserId = userId;
    
    // If no userId provided, find admin user automatically
    if (!adminUserId) {
      const admin = await User.findOne({
        where: { role: 'admin' }
      });
      
      if (!admin) {
        return res.status(400).json({ error: 'No admin user found' });
      }
      
      adminUserId = admin.id;
    }

    const messages = await Message.findAll({
      where: { recipient_id: adminUserId },
      include: [
        {
          model: MessageSender,
          required: false
        },
        {
          model: User,
          as: 'Sender',
          attributes: ['name', 'email'],
          required: false
        },
        {
          model: User,
          as: 'Recipient',
          attributes: ['name', 'email']
        },
        {
          model: ContactMessageRedirect,
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Admin redirect message to doctor/lab
exports.redirectMessage = async (req, res) => {
  try {
    const { messageId, redirectToUserId, redirectReason, adminId } = req.body;

    console.log('Redirecting message:', messageId, 'to user:', redirectToUserId);

    // Create redirect record
    const redirect = await ContactMessageRedirect.create({
      original_message_id: messageId,
      redirected_to_user_id: redirectToUserId,
      redirected_by_admin_id: adminId,
      redirect_reason: redirectReason,
      status: 'pending'
    });

    // Create notification for the redirected user
    await Notification.create({
      user_id: redirectToUserId,
      sent_by_user_id: adminId,
      title: 'Message Redirected to You',
      message: 'Admin has redirected a contact message to you for review',
      notification_type: 'general_message',
      is_read: false
    });

    res.json({ 
      success: true, 
      message: 'Message redirected successfully',
      redirectId: redirect.id 
    });

  } catch (error) {
    console.error('Error redirecting message:', error);
    res.status(500).json({ error: 'Failed to redirect message' });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await Message.update(
      { is_read: true },
      { where: { id: id } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

// Reply to message
exports.replyToMessage = async (req, res) => {
  try {
    console.log('=== REPLY MESSAGE RECEIVED ===');
    const { id } = req.params;
    
    // Handle both FormData and JSON requests
    let content, senderId;
    if (req.body.content && req.body.senderId) {
      content = req.body.content;
      senderId = parseInt(req.body.senderId) || 1;
    } else {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      content = body.content;
      senderId = parseInt(body.senderId) || 1;
    }
    
    const attachmentPath = req.file ? req.file.path : null;

    console.log('Reply params:', { id, content, senderId, attachmentPath });

    // Get original message with sender info
    const originalMessage = await Message.findOne({
      where: { id: id },
      include: [
        {
          model: MessageSender,
          as: 'sender_info',
          required: false
        }
      ]
    });

    if (!originalMessage) {
      console.log('Message not found for ID:', id);
      return res.status(404).json({ error: 'Message not found' });
    }

    console.log('Original message:', originalMessage);

    // Check if this is an external contact (system user)
    const systemUser = await User.findOne({
      where: { 
        id: originalMessage.sender_id,
        email: 'system@external.contact'
      }
    });

    // For external contacts, create a reply that can be delivered via email
    if (systemUser || originalMessage.sender_id === 0 || originalMessage.sender_id === null) {
      console.log('External contact - creating reply for email delivery');
      
      const reply = await Message.create({
        sender_id: senderId,
        recipient_id: originalMessage.sender_id,
        subject: `Re: ${originalMessage.subject || 'Contact Message'}`,
        content: content,
        message_type: 'individual',
        attachment_path: attachmentPath,
        is_read: false
      });

      // Create notification for admin
      await Notification.create({
        user_id: senderId,
        sent_by_user_id: senderId,
        title: 'Reply Ready for Email Delivery',
        message: `Reply to ${originalMessage.sender_info?.sender_email} is ready. You can now send it via email to the original sender.`,
        notification_type: 'general_message',
        is_read: false
      });

      // Store reply information
      if (originalMessage.sender_info) {
        await MessageSender.create({
          message_id: reply.id,
          sender_name: 'Admin Reply',
          sender_email: originalMessage.sender_info.sender_email
        });
      }

      console.log('Reply created for external contact with email delivery notification');
      res.json({ 
        success: true, 
        message: 'Reply created successfully. You can now send it to the original sender via email.',
        replyId: reply.id,
        emailDelivery: true,
        recipientEmail: originalMessage.sender_info?.sender_email
      });
    } else {
      // Internal user - send reply directly
      console.log('Internal user - sending reply directly');
      
      const reply = await Message.create({
        sender_id: senderId,
        recipient_id: originalMessage.sender_id,
        subject: `Re: ${originalMessage.subject}`,
        content: content,
        message_type: 'individual',
        attachment_path: attachmentPath,
        is_read: false
      });

      // Create notification for original sender
      await Notification.create({
        user_id: originalMessage.sender_id,
        sent_by_user_id: senderId,
        title: 'Reply to your message',
        message: 'You have received a reply to your message',
        notification_type: 'general_message',
        is_read: false
      });

      console.log('Reply sent to internal user');
      res.json({ 
        success: true, 
        message: 'Reply sent successfully',
        replyId: reply.id 
      });
    }

  } catch (error) {
    console.error('=== ERROR SENDING REPLY ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to send reply: ' + error.message });
  }
};

// Forward message to email
exports.forwardMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, subject, message } = req.body;

    // Get message details
    const messageData = await Message.findByPk(id);

    if (!messageData) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Here you would integrate with your email service (e.g., SendGrid, Nodemailer)
    console.log('Email forwarding:', {
      to: email,
      subject: subject || `Forwarded: ${messageData.subject}`,
      content: message || messageData.content,
      attachment: messageData.attachment_path
    });

    // TODO: Implement actual email sending
    // await sendEmail({ ... });

    res.json({ 
      success: true, 
      message: 'Message forwarded successfully' 
    });

  } catch (error) {
    console.error('Error forwarding message:', error);
    res.status(500).json({ error: 'Failed to forward message' });
  }
};

// Test notifications endpoint
exports.getTestNotifications = async (req, res) => {
  try {
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
        message: 'Dr. Smith has replied to your message',
        notification_type: 'reply',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        sender_name: 'Dr. Smith'
      }
    ];
    
    res.json(mockNotifications);
  } catch (error) {
    console.error('Error fetching test notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Test unread count endpoint
exports.getTestUnreadCount = async (req, res) => {
  try {
    res.json({ count: 2 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Get notifications for external users
exports.getExternalNotifications = async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Fetching notifications for external user:', email);

    // Find notifications that reference the email
    const notifications = await Notification.findAll({
      where: {
        message: { [require('sequelize').Op.like]: `%${email}%` }
      },
      order: [['created_at', 'DESC']]
    });

    console.log('Total notifications found:', notifications.length);
    res.json(notifications);

  } catch (error) {
    console.error('Error fetching external notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Get replies for external users
exports.getExternalReplies = async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Fetching replies for external user:', email);

    const replies = await Message.findAll({
      where: {
        message_type: 'individual',
        subject: { [require('sequelize').Op.like]: 'Re: %' }
      },
      include: [
        {
          model: MessageSender,
          as: 'sender_info',
          where: { sender_email: email },
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log('Total replies found:', replies.length);
    res.json(replies);

  } catch (error) {
    console.error('Error fetching external replies:', error);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
};

// Mark external reply as read
exports.markExternalReplyAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Message.update(
      { is_read: true },
      { where: { id: id } }
    );
    
    console.log('Reply marked as read');
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking reply as read:', error);
    res.status(500).json({ error: 'Failed to mark reply as read' });
  }
};

// Export upload middleware
exports.upload = upload;
