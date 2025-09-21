-- Database schema updates for simplified doctor authentication system
-- This script updates the existing database to support admin-managed doctor accounts

-- 1. Update users table to ensure account_status column exists with proper values
-- (This assumes the column already exists, if not, create it)
ALTER TABLE users 
MODIFY COLUMN account_status ENUM('active', 'inactive', 'pending', 'rejected') 
DEFAULT 'active';

-- 2. Ensure doctor_profiles table exists with required columns
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    specialization VARCHAR(255),
    experience_years VARCHAR(50),
    phone VARCHAR(20),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_doctor_profile (user_id)
);

-- 3. Update existing doctor accounts to have 'active' status
UPDATE users 
SET account_status = 'active' 
WHERE role = 'doctor' AND (account_status IS NULL OR account_status = 'pending');

-- 4. Optional: Clean up old doctor applications if they exist
-- (Uncomment the following lines if you want to remove the old application system)
-- DROP TABLE IF EXISTS doctor_applications;

-- 5. Create index for better performance
CREATE INDEX idx_users_role_status ON users(role, account_status);
CREATE INDEX idx_doctor_profiles_user_id ON doctor_profiles(user_id);

-- 6. Add any missing columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_status ENUM('active', 'inactive', 'pending', 'rejected') 
DEFAULT 'active' AFTER role;

-- 7. Update doctor_profiles table with all required fields
ALTER TABLE doctor_profiles 
ADD COLUMN IF NOT EXISTS department VARCHAR(255) AFTER specialization,
ADD COLUMN IF NOT EXISTS license_number VARCHAR(255) AFTER department,
ADD COLUMN IF NOT EXISTS degree VARCHAR(255) AFTER experience_years,
ADD COLUMN IF NOT EXISTS fees DECIMAL(10,2) AFTER bio;

-- 8. Create audit_logs table for tracking activities
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_user_action (user_id, action),
    INDEX idx_audit_created_at (created_at)
);

-- 9. Create password_reset_tokens table (optional, for enhanced security)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reset_token (token),
    INDEX idx_reset_user (user_id)
);

-- Note: This script is safe to run multiple times
-- It will only create tables/columns that don't exist and update existing ones