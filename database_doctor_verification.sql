-- Database Schema for Doctor Verification System
-- Copy and paste these commands into MySQL Workbench

-- 1. Add verification fields to users table
ALTER TABLE users 
ADD COLUMN account_status ENUM('active', 'pending', 'rejected', 'suspended') DEFAULT 'active',
ADD COLUMN verification_notes TEXT,
ADD COLUMN verified_at TIMESTAMP NULL,
ADD COLUMN verified_by INT NULL;

-- 2. Create doctor applications table
CREATE TABLE doctor_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  license_number VARCHAR(50) NOT NULL,
  medical_field VARCHAR(100) NOT NULL,
  specialization VARCHAR(100),
  experience_years INT,
  education VARCHAR(500),
  previous_clinic VARCHAR(200),
  license_upload_path VARCHAR(255),
  cv_upload_path VARCHAR(255),
  additional_documents TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_application (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create doctor profiles table (for approved doctors)
CREATE TABLE doctor_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  specialization VARCHAR(100),
  bio TEXT,
  avatar_path VARCHAR(255) DEFAULT '/uploads/avatars/default.png',
  facebook VARCHAR(255),
  x VARCHAR(255),
  linkedin VARCHAR(255),
  instagram VARCHAR(255),
  country VARCHAR(100),
  city_state VARCHAR(100),
  postal_code VARCHAR(20),
  license_number VARCHAR(50),
  experience_years INT,
  consultation_fee DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_doctor_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Create uploads directory structure (run this in your backend)
-- This will be handled by your Node.js server, but you can create the folders manually:
-- backend/uploads/doctor-documents/
-- backend/uploads/doctor-documents/licenses/
-- backend/uploads/doctor-documents/cvs/

-- 5. Test data - Create a pending doctor application
INSERT INTO users (name, email, password, role, account_status) 
VALUES ('Dr. Jane Doe', 'jane.doctor@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor', 'pending');

-- Get the user ID (replace 1 with the actual ID returned)
SET @doctor_user_id = LAST_INSERT_ID();

INSERT INTO doctor_applications (
  user_id, 
  license_number, 
  medical_field, 
  specialization, 
  experience_years, 
  education, 
  previous_clinic
) VALUES (
  @doctor_user_id,
  'MED123456',
  'Cardiology',
  'Interventional Cardiology',
  8,
  'MD from Harvard Medical School, Residency at Johns Hopkins',
  'Mayo Clinic'
);

-- 6. Verify the data
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.account_status,
  da.license_number,
  da.medical_field,
  da.specialization,
  da.experience_years,
  da.status as application_status
FROM users u
LEFT JOIN doctor_applications da ON u.id = da.user_id
WHERE u.role = 'doctor';
