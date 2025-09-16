CREATE DATABASE menaxhimi_pacienteve;
USE menaxhimi_pacienteve;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'doctor', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    phone VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    gender ENUM('Male','Female','Other'),
    dob DATE,
    profile_image VARCHAR(255) NOT NULL DEFAULT 'uploads/default.png',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE admin_profiles (
  user_id INT PRIMARY KEY,
  first_name VARCHAR(100) DEFAULT '',
  last_name  VARCHAR(100) DEFAULT '',
  phone      VARCHAR(30)  DEFAULT '',
  bio        VARCHAR(255) DEFAULT '',
  avatar_path VARCHAR(255) NOT NULL DEFAULT '/uploads/avatars/default.png',
  facebook  VARCHAR(255) DEFAULT '',
  x         VARCHAR(255) DEFAULT '',
  linkedin  VARCHAR(255) DEFAULT '',
  instagram VARCHAR(255) DEFAULT '',
  country     VARCHAR(100) DEFAULT '',
  city_state  VARCHAR(150) DEFAULT '',
  postal_code VARCHAR(50)  DEFAULT '',
  tax_id      VARCHAR(100) DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  image VARCHAR(255),
  speciality VARCHAR(255),
  degree VARCHAR(255),
  experience VARCHAR(255),
  about TEXT,
  fees DECIMAL(10,2),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE laboratories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    description TEXT,
    working_hours TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE analysis_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    normal_range VARCHAR(255),
    unit VARCHAR(50),
    price DECIMAL(10,2),
    laboratory_id INT,
    FOREIGN KEY (laboratory_id) REFERENCES laboratories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE patient_analyses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    analysis_type_id INT NOT NULL,
    laboratory_id INT NOT NULL,
    result TEXT,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    appointment_date DATETIME,
    completion_date DATETIME,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (analysis_type_id) REFERENCES analysis_types(id),
    FOREIGN KEY (laboratory_id) REFERENCES laboratories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- PERFORMANCE INDEXES
-- Users table indexes (for login and role-based queries)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Patient analyses indexes (most frequently queried)
CREATE INDEX idx_patient_analyses_user_id ON patient_analyses(user_id);
CREATE INDEX idx_patient_analyses_status ON patient_analyses(status);
CREATE INDEX idx_patient_analyses_appointment_date ON patient_analyses(appointment_date);
CREATE INDEX idx_patient_analyses_laboratory_id ON patient_analyses(laboratory_id);

-- Analysis types indexes (for lab booking)
CREATE INDEX idx_analysis_types_laboratory_id ON analysis_types(laboratory_id);
CREATE INDEX idx_analysis_types_name ON analysis_types(name);

-- Doctors table indexes (for doctor search and filtering)
CREATE INDEX idx_doctors_speciality ON doctors(speciality);
CREATE INDEX idx_doctors_available ON doctors(available);
CREATE INDEX idx_doctors_user_id ON doctors(user_id);

-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Refresh tokens index (for authentication)
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Laboratories indexes
CREATE INDEX idx_laboratories_name ON laboratories(name);

-- Composite indexes for complex queries
CREATE INDEX idx_doctors_speciality_available ON doctors(speciality, available);
CREATE INDEX idx_patient_analyses_user_status ON patient_analyses(user_id, status);
CREATE INDEX idx_patient_analyses_lab_date ON patient_analyses(laboratory_id, appointment_date);

-- DATA VALIDATION CONSTRAINTS
-- Ensure positive fees for doctors
ALTER TABLE doctors ADD CONSTRAINT chk_fees_positive CHECK (fees >= 0);

-- Ensure positive prices for analysis types
ALTER TABLE analysis_types ADD CONSTRAINT chk_price_positive CHECK (price >= 0);

-- SAMPLE DATA
-- Insert sample laboratories
INSERT INTO laboratories (name, address, phone, email, description, working_hours) VALUES
('Medica Laboratory Center', 'Rr. Agim Ramadani p.n., Prishtinë', '+383 44 123 456', 'info@medica-lab.com', 'Full service medical laboratory offering comprehensive diagnostic testing including blood work, urinalysis, and specialized tests.', 'Monday-Friday: 07:00-20:00, Saturday: 08:00-16:00'),

('BioMed Diagnostics', 'Rr. Bill Clinton 234, Prishtinë', '+383 45 234 567', 'contact@biomed-ks.com', 'Advanced diagnostic center with state-of-the-art equipment. Specializing in molecular diagnostics and genetic testing.', 'Monday-Saturday: 07:00-19:00, Sunday: 08:00-14:00'),

('LabCor Analytics', 'Rr. Fehmi Agani 21, Prishtinë', '+383 49 345 678', 'info@labcor.com', 'Leading laboratory in biochemical analysis and pathology testing. Quick and accurate results with online reporting.', 'Monday-Sunday: 00:00-24:00'),

('Prima Laboratory', 'Rr. UÇK 25, Prishtinë', '+383 44 456 789', 'info@primalab.com', 'Specialized in clinical chemistry, hematology, and immunology testing. Family-friendly environment with pediatric services.', 'Monday-Friday: 07:30-19:30, Saturday: 08:00-15:00'),

('ProHealth Labs', 'Rr. Gazmend Zajmi 32, Prishtinë', '+383 45 567 890', 'contact@prohealth-lab.com', 'Modern medical laboratory offering routine and specialized testing services. Same-day results for most common tests.', 'Monday-Saturday: 07:00-20:00'),

('City Medical Laboratory', 'Rr. Xhorxh Bush 45, Prishtinë', '+383 49 678 901', 'info@citymedlab.com', 'Comprehensive medical testing facility with focus on preventive health screening and diagnostic services.', 'Monday-Friday: 08:00-18:00, Saturday: 09:00-14:00');

-- Insert analysis types for each laboratory
INSERT INTO analysis_types (name, description, normal_range, unit, price, laboratory_id) VALUES
-- For Medica Laboratory Center (lab_id: 1)
('Complete Blood Count', 'Measures different components of blood including red cells, white cells, and platelets', 'Varies by component', 'Varies', 35.00, 1),
('Lipid Panel', 'Measures cholesterol and triglycerides', 'HDL: >40mg/dL, LDL: <100mg/dL', 'mg/dL', 45.00, 1),
('Thyroid Function', 'Measures thyroid hormones (TSH, T3, T4)', 'TSH: 0.4-4.0 mIU/L', 'mIU/L', 55.00, 1),
('Glucose Test', 'Measures blood sugar levels', '70-99 mg/dL (fasting)', 'mg/dL', 25.00, 1),

-- For BioMed Diagnostics (lab_id: 2)
('COVID-19 PCR Test', 'Molecular test for COVID-19 detection', 'Negative/Positive', 'N/A', 80.00, 2),
('Vitamin D Test', 'Measures vitamin D levels in blood', '20-50 ng/mL', 'ng/mL', 40.00, 2),
('Hormone Panel', 'Comprehensive hormone level testing', 'Varies by hormone', 'Varies', 120.00, 2),
('Allergy Panel', 'Tests for common allergies', 'Negative/Positive', 'kU/L', 150.00, 2),

-- For LabCor Analytics (lab_id: 3)
('Liver Function Test', 'Comprehensive liver health assessment', 'ALT: 7-55 U/L', 'U/L', 60.00, 3),
('Kidney Function Test', 'Measures kidney function markers', 'Creatinine: 0.7-1.3 mg/dL', 'mg/dL', 50.00, 3),
('Electrolyte Panel', 'Measures blood electrolyte levels', 'Sodium: 135-145 mEq/L', 'mEq/L', 35.00, 3),
('Hemoglobin A1C', 'Measures average blood sugar over 3 months', '4.0-5.6%', '%', 45.00, 3),

-- For Prima Laboratory (lab_id: 4)
('Urine Analysis', 'Complete urine examination', 'Varies by component', 'Varies', 30.00, 4),
('Stool Analysis', 'Comprehensive stool examination', 'Normal/Abnormal', 'N/A', 40.00, 4),
('Blood Type Test', 'Determines blood type and Rh factor', 'N/A', 'N/A', 25.00, 4),
('Iron Studies', 'Measures iron levels and storage', 'Ferritin: 20-250 ng/mL', 'ng/mL', 55.00, 4),

-- For ProHealth Labs (lab_id: 5)
('STD Panel', 'Comprehensive STD testing', 'Negative/Positive', 'N/A', 180.00, 5),
('Drug Screening', 'Tests for common drugs', 'Negative/Positive', 'N/A', 100.00, 5),
('Testosterone Level', 'Measures testosterone in blood', '300-1000 ng/dL', 'ng/dL', 65.00, 5),
('Vitamin B12', 'Measures B12 levels', '200-900 pg/mL', 'pg/mL', 45.00, 5),

-- For City Medical Laboratory (lab_id: 6)
('PSA Test', 'Prostate-specific antigen test', '0-4 ng/mL', 'ng/mL', 70.00, 6),
('CBC with Differential', 'Detailed blood cell analysis', 'Varies by component', 'Varies', 45.00, 6),
('Pregnancy Test (Blood)', 'Measures HCG levels', '<5 mIU/mL (negative)', 'mIU/mL', 35.00, 6),
('CRP Test', 'Measures inflammation marker', '<10 mg/L', 'mg/L', 40.00, 6);

-- VERIFICATION
-- Show database structure
SHOW TABLES;

-- Show key indexes
SELECT 'USERS TABLE INDEXES:' as Info;
SHOW INDEXES FROM users;

SELECT 'PATIENT_ANALYSES TABLE INDEXES:' as Info;
SHOW INDEXES FROM patient_analyses;

SELECT 'DOCTORS TABLE INDEXES:' as Info;
SHOW INDEXES FROM doctors;