'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Insert demo analysis types
    await queryInterface.bulkInsert('analysis_types', [
      {
        name: 'Complete Blood Count (CBC)',
        description: 'Measures different components and features of blood including red blood cells, white blood cells, and platelets',
        normal_range: 'RBC: 4.5-5.5 million cells/mcL, WBC: 4,500-11,000 cells/mcL',
        unit: 'cells/mcL',
        price: 25.00,
        laboratory_id: null, // Available to all laboratories
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Blood Glucose (Fasting)',
        description: 'Measures blood sugar levels after fasting',
        normal_range: '70-100 mg/dL',
        unit: 'mg/dL',
        price: 15.00,
        laboratory_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Lipid Panel',
        description: 'Measures cholesterol and triglycerides levels',
        normal_range: 'Total Cholesterol: <200 mg/dL, LDL: <100 mg/dL, HDL: >40 mg/dL',
        unit: 'mg/dL',
        price: 35.00,
        laboratory_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Liver Function Test (LFT)',
        description: 'Measures liver enzyme levels to assess liver health',
        normal_range: 'ALT: 7-56 U/L, AST: 10-40 U/L',
        unit: 'U/L',
        price: 45.00,
        laboratory_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Kidney Function Test',
        description: 'Measures creatinine and BUN levels to assess kidney function',
        normal_range: 'Creatinine: 0.6-1.2 mg/dL, BUN: 7-20 mg/dL',
        unit: 'mg/dL',
        price: 40.00,
        laboratory_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Thyroid Function Test (TSH)',
        description: 'Measures thyroid stimulating hormone levels',
        normal_range: '0.4-4.0 mIU/L',
        unit: 'mIU/L',
        price: 50.00,
        laboratory_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Urinalysis',
        description: 'Complete urine analysis for various health indicators',
        normal_range: 'pH: 4.5-8.0, Specific Gravity: 1.005-1.030',
        unit: 'various',
        price: 20.00,
        laboratory_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Hemoglobin A1C',
        description: 'Measures average blood sugar levels over 3 months',
        normal_range: '<5.7% (Normal), 5.7-6.4% (Prediabetes), >6.5% (Diabetes)',
        unit: '%',
        price: 55.00,
        laboratory_id: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
    
    console.log('✅ Demo analysis types seeded successfully');
    console.log('ℹ️  8 analysis types added to the database');
  },

  async down (queryInterface, Sequelize) {
    // Remove the seeded analysis types
    await queryInterface.bulkDelete('analysis_types', {
      name: [
        'Complete Blood Count (CBC)',
        'Blood Glucose (Fasting)',
        'Lipid Panel',
        'Liver Function Test (LFT)',
        'Kidney Function Test',
        'Thyroid Function Test (TSH)',
        'Urinalysis',
        'Hemoglobin A1C'
      ]
    }, {});
    
    console.log('⚠️  Demo analysis types removed');
  }
};
