'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const db = require('../models');

    const users = [
      // Admins
      {
        name: 'Admin One',
        email: 'admin1@hospital.com',
        password: 'Admin1234!',
        role: 'admin',
        phone: '+38344100001',
      },
      {
        name: 'Admin Two',
        email: 'admin2@hospital.com',
        password: 'Admin1234!',
        role: 'admin',
        phone: '+38344100002',
      },
      // Patients
      {
        name: 'Patient One',
        email: 'patient1@hospital.com',
        password: 'Patient1234!',
        role: 'user',
        phone: '+38344200001',
      },
      {
        name: 'Patient Two',
        email: 'patient2@hospital.com',
        password: 'Patient1234!',
        role: 'user',
        phone: '+38344200002',
      },
      // Doctors
      {
        name: 'Dr. Arben Krasniqi',
        email: 'doctor1@hospital.com',
        password: 'Doctor1234!',
        role: 'doctor',
        phone: '+38344300001',
        doctor: {
          first_name: 'Arben',
          last_name: 'Krasniqi',
          specialization: 'Cardiology',
          department_id: 1,
          degree: 'MD, PhD',
          license_number: 'LIC-001',
          experience_years: 10,
          consultation_fee: 30.00,
          fees: 30.00,
          available: true,
          about: 'Specialist in cardiology with 10 years of experience.',
        },
      },
      {
        name: 'Dr. Blerina Morina',
        email: 'doctor2@hospital.com',
        password: 'Doctor1234!',
        role: 'doctor',
        phone: '+38344300002',
        doctor: {
          first_name: 'Blerina',
          last_name: 'Morina',
          specialization: 'Neurology',
          department_id: 2,
          degree: 'MD',
          license_number: 'LIC-002',
          experience_years: 7,
          consultation_fee: 25.00,
          fees: 25.00,
          available: true,
          about: 'Neurologist with expertise in brain and nerve disorders.',
        },
      },
    ];

    for (const u of users) {
      const existing = await db.User.findOne({ where: { email: u.email } });
      if (existing) {
        console.log(`ℹ️  Already exists, skipping: ${u.email}`);
        continue;
      }

      const user = await db.User.create({
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
        account_status: 'active',
      });

      await db.UserProfile.create({
        user_id: user.id,
        phone: u.phone,
        notifications_enabled: true,
      });

      if (u.doctor) {
        await db.Doctor.create({ user_id: user.id, ...u.doctor });
      }

      console.log(`✅ Created ${u.role}: ${u.email}`);
    }

    console.log('\n📋 Login credentials:');
    console.log('  admin1@hospital.com   / Admin1234!');
    console.log('  admin2@hospital.com   / Admin1234!');
    console.log('  patient1@hospital.com / Patient1234!');
    console.log('  patient2@hospital.com / Patient1234!');
    console.log('  doctor1@hospital.com  / Doctor1234!');
    console.log('  doctor2@hospital.com  / Doctor1234!');
  },

  async down(queryInterface, Sequelize) {
    const db = require('../models');
    const emails = [
      'admin1@hospital.com',
      'admin2@hospital.com',
      'patient1@hospital.com',
      'patient2@hospital.com',
      'doctor1@hospital.com',
      'doctor2@hospital.com',
    ];
    for (const email of emails) {
      await db.User.destroy({ where: { email } });
    }
    console.log('⚠️  Demo users removed');
  },
};
