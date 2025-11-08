-- Add new fields to bills table (will ignore if column already exists)
ALTER TABLE bills 
ADD COLUMN paidAmount DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN paymentMethod ENUM('cash', 'card', 'insurance', 'bank_transfer', 'online', 'other') NULL,
ADD COLUMN paymentDate DATETIME NULL,
ADD COLUMN billType ENUM('consultation', 'treatment', 'lab_test', 'package', 'other') DEFAULT 'other',
ADD COLUMN packageId INT NULL;

-- Create billing_packages table
CREATE TABLE IF NOT EXISTS billing_packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  packageType ENUM('maternity', 'surgery', 'diagnostic', 'wellness', 'emergency', 'other') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration INT COMMENT 'Duration in days',
  isActive BOOLEAN DEFAULT true,
  includedServices JSON COMMENT 'Array of included services/items',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  billId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paymentMethod ENUM('cash', 'card', 'insurance', 'bank_transfer', 'online', 'other') NOT NULL,
  transactionRef VARCHAR(200) COMMENT 'Transaction reference number',
  receivedBy INT,
  notes TEXT,
  paymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (billId) REFERENCES bills(id) ON DELETE CASCADE,
  FOREIGN KEY (receivedBy) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add foreign key for packageId in bills table
ALTER TABLE bills 
ADD CONSTRAINT fk_bills_package 
FOREIGN KEY (packageId) REFERENCES billing_packages(id) 
ON DELETE SET NULL;
