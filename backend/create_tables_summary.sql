-- Database Schema Changes Applied
-- This file contains the CREATE TABLE statements for new tables added

-- 1. Notifications table for user notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sent_by_user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('result_ready', 'appointment_confirmed', 'appointment_cancelled', 'general_message', 'system_alert') DEFAULT 'general_message',
    is_read BOOLEAN DEFAULT FALSE,
    optional_link VARCHAR(500) NULL,
    attachment_path VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sent_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Messages table for admin/lab/doctor messaging
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    recipient_id INT NULL, -- NULL means broadcast to all users
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    message_type ENUM('broadcast', 'individual', 'group') DEFAULT 'individual',
    attachment_path VARCHAR(500) NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Columns added to existing patient_analyses table
ALTER TABLE patient_analyses 
ADD COLUMN result_pdf_path VARCHAR(500) NULL AFTER result,
ADD COLUMN result_note TEXT NULL AFTER result_pdf_path;

-- 4. Column added to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE AFTER profile_image;

-- 5. Indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
