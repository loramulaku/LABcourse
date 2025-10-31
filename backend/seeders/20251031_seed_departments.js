'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const departments = [
      ['Cardiology', 'Heart and cardiovascular diseases', 'Building A, Floor 2', '+1-555-0101', 'cardiology@hospital.com', 500000.00, true, now, now],
      ['Neurology', 'Nervous system and brain disorders', 'Building B, Floor 3', '+1-555-0102', 'neurology@hospital.com', 450000.00, true, now, now],
      ['Orthopedics', 'Bone and joint disorders', 'Building A, Floor 1', '+1-555-0103', 'orthopedics@hospital.com', 400000.00, true, now, now],
      ['Pediatrics', 'Children and infant care', 'Building C, Floor 2', '+1-555-0104', 'pediatrics@hospital.com', 350000.00, true, now, now],
      ['General Surgery', 'Surgical procedures and operations', 'Building B, Floor 1', '+1-555-0105', 'surgery@hospital.com', 600000.00, true, now, now],
      ['Emergency Medicine', 'Emergency and trauma care', 'Building A, Ground Floor', '+1-555-0106', 'emergency@hospital.com', 550000.00, true, now, now],
      ['Radiology', 'Medical imaging and diagnostics', 'Building B, Ground Floor', '+1-555-0107', 'radiology@hospital.com', 380000.00, true, now, now],
      ['Psychiatry', 'Mental health and psychological disorders', 'Building C, Floor 1', '+1-555-0108', 'psychiatry@hospital.com', 320000.00, true, now, now],
    ];

    return queryInterface.sequelize.query(
      `INSERT INTO departments (name, description, location, phone, email, budget, is_active, created_at, updated_at) VALUES ${departments
        .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .join(', ')}`,
      { replacements: departments.flat() }
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('departments', null, {});
  },
};
