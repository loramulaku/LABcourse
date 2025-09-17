CREATE DATABASE menaxhimi_pacienteve;
USE menaxhimi_pacienteve;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'doctor', 'admin', 'lab') DEFAULT 'user',
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
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,  -- lidhja me user-in
  address VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255), -- email për kontakt në front qe shfaqet
  description TEXT,
  working_hours TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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