-- Create analysis_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS analysis_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    normal_range VARCHAR(255),
    unit VARCHAR(50),
    price DECIMAL(10,2),
    laboratory_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (laboratory_id) REFERENCES laboratories(id)
);