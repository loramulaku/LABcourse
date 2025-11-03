'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if departments already exist
      const [existingDepts] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM departments'
      );
      
      if (existingDepts[0].count > 0) {
        console.log('ℹ️  Departments already seeded, skipping...');
        return Promise.resolve();
      }

      const now = new Date();
      const departments = [
        { name: 'Cardiology', description: 'Heart and cardiovascular diseases', location: 'Building A, Floor 2', phone: '+1-555-0101', email: 'cardiology@hospital.com', budget: 500000.00, is_active: true, created_at: now, updated_at: now },
        { name: 'Neurology', description: 'Nervous system and brain disorders', location: 'Building B, Floor 3', phone: '+1-555-0102', email: 'neurology@hospital.com', budget: 450000.00, is_active: true, created_at: now, updated_at: now },
        { name: 'Orthopedics', description: 'Bone and joint disorders', location: 'Building A, Floor 1', phone: '+1-555-0103', email: 'orthopedics@hospital.com', budget: 400000.00, is_active: true, created_at: now, updated_at: now },
        { name: 'Pediatrics', description: 'Children and infant care', location: 'Building C, Floor 2', phone: '+1-555-0104', email: 'pediatrics@hospital.com', budget: 350000.00, is_active: true, created_at: now, updated_at: now },
        { name: 'General Surgery', description: 'Surgical procedures and operations', location: 'Building B, Floor 1', phone: '+1-555-0105', email: 'surgery@hospital.com', budget: 600000.00, is_active: true, created_at: now, updated_at: now },
        { name: 'Emergency Medicine', description: 'Emergency and trauma care', location: 'Building A, Ground Floor', phone: '+1-555-0106', email: 'emergency@hospital.com', budget: 550000.00, is_active: true, created_at: now, updated_at: now },
        { name: 'Radiology', description: 'Medical imaging and diagnostics', location: 'Building B, Ground Floor', phone: '+1-555-0107', email: 'radiology@hospital.com', budget: 380000.00, is_active: true, created_at: now, updated_at: now },
        { name: 'Psychiatry', description: 'Mental health and psychological disorders', location: 'Building C, Floor 1', phone: '+1-555-0108', email: 'psychiatry@hospital.com', budget: 320000.00, is_active: true, created_at: now, updated_at: now },
      ];

      await queryInterface.bulkInsert('departments', departments);
      console.log('✅ Departments seeded successfully');
      console.log(`ℹ️  ${departments.length} departments added to the database`);
      
    } catch (error) {
      console.error('❌ Error seeding departments:', error.message);
      // Don't throw error if it's just a duplicate
      if (error.message.includes('Duplicate entry') || error.message.includes('Validation error')) {
        console.log('ℹ️  Departments may already exist, skipping...');
        return Promise.resolve();
      }
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('departments', null, {});
  },
};
