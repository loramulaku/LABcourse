-- Create analysis_history table for audit logging
CREATE TABLE analysis_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_analysis_id INT NOT NULL,
    action_type ENUM('created', 'status_changed', 'result_uploaded', 'result_updated', 'cancelled', 'confirmed') NOT NULL,
    old_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NULL,
    performed_by_user_id INT NOT NULL,
    notes TEXT NULL,
    result_pdf_path VARCHAR(500) NULL,
    result_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_analysis_id) REFERENCES patient_analyses(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add index for better performance
CREATE INDEX idx_analysis_history_patient_analysis_id ON analysis_history(patient_analysis_id);
CREATE INDEX idx_analysis_history_created_at ON analysis_history(created_at);
