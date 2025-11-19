'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get existing users and doctors
    const users = await queryInterface.sequelize.query(
      `SELECT id, name FROM users WHERE role = 'user' LIMIT 10`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const doctors = await queryInterface.sequelize.query(
      `SELECT id, first_name, last_name FROM doctors LIMIT 5`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0 || doctors.length === 0) {
      console.log('⚠️ No users or doctors found. Please seed users and doctors first.');
      return;
    }

    console.log(`📋 Found ${users.length} patients and ${doctors.length} doctors`);

    const wardCountRows = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as cnt FROM wards`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const wardCount = Array.isArray(wardCountRows) && wardCountRows[0] && (wardCountRows[0].cnt || wardCountRows[0]['COUNT(*)']) || 0;
    if (Number(wardCount) > 0) {
      console.log('ℹ️ IPD sample data seems already seeded. Skipping.');
      return;
    }

    // 1. Create Wards
    const wards = await queryInterface.bulkInsert('wards', [
      {
        name: 'General Ward',
        description: 'General medical and surgical ward for routine care',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'ICU Ward',
        description: 'Intensive Care Unit for critical patients',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Maternity Ward',
        description: 'Ward for maternity and postnatal care',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Pediatric Ward',
        description: 'Ward dedicated to children and adolescents',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Emergency Ward',
        description: 'Emergency and trauma care ward',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], { returning: true });

    console.log('✅ Created 5 wards');

    // Get ward IDs
    const wardRecords = await queryInterface.sequelize.query(
      `SELECT id, name FROM wards ORDER BY id DESC LIMIT 5`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // 2. Create Rooms for each ward
    const rooms = [];
    wardRecords.forEach((ward, wardIndex) => {
      const roomTypes = ['Single', 'Double', 'ICU', 'General'];
      const roomCount = wardIndex === 0 ? 8 : wardIndex === 1 ? 6 : 5; // More rooms in general ward
      
      for (let i = 1; i <= roomCount; i++) {
        rooms.push({
          ward_id: ward.id,
          room_number: `${wardIndex + 1}${i.toString().padStart(2, '0')}`,
          room_type: roomTypes[i % roomTypes.length],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    });

    await queryInterface.bulkInsert('rooms', rooms);
    console.log(`✅ Created ${rooms.length} rooms`);

    // Get room IDs
    const roomRecords = await queryInterface.sequelize.query(
      `SELECT id, ward_id, room_number FROM rooms ORDER BY id DESC LIMIT 50`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // 3. Create Beds for each room
    const beds = [];
    const bedStatuses = ['Available', 'Occupied', 'Maintenance', 'Cleaning'];
    
    roomRecords.forEach((room, roomIndex) => {
      const bedsPerRoom = roomIndex % 3 === 0 ? 2 : roomIndex % 2 === 0 ? 3 : 1;
      
      for (let i = 1; i <= bedsPerRoom; i++) {
        // Most beds available, some occupied
        let status = 'Available';
        if (roomIndex < 10 && i === 1) {
          status = 'Occupied'; // First 10 rooms have occupied first bed
        } else if (roomIndex === 15) {
          status = 'Maintenance';
        } else if (roomIndex === 20) {
          status = 'Cleaning';
        }
        
        beds.push({
          room_id: room.id,
          bed_number: `${room.room_number}-${String.fromCharCode(64 + i)}`, // 101-A, 101-B, etc.
          status: status,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    });

    await queryInterface.bulkInsert('beds', beds);
    console.log(`✅ Created ${beds.length} beds`);

    // Get occupied bed IDs
    const occupiedBeds = await queryInterface.sequelize.query(
      `SELECT id, room_id, bed_number FROM beds WHERE status = 'Occupied' ORDER BY id LIMIT 10`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get rooms for occupied beds to get ward_id
    const bedsWithWards = await queryInterface.sequelize.query(
      `SELECT b.id as bed_id, b.room_id, r.ward_id 
       FROM beds b 
       JOIN rooms r ON b.room_id = r.id 
       WHERE b.status = 'Occupied' 
       ORDER BY b.id LIMIT 10`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // 4. Create Admission Requests (some pending, some approved, some rejected)
    const admissionRequests = [];
    const urgencies = ['Normal', 'Emergency'];
    const statuses = ['Pending', 'Approved', 'Rejected'];
    const diagnoses = [
      'Acute Appendicitis - requires surgical intervention',
      'Pneumonia - needs IV antibiotics and monitoring',
      'Diabetes complications - blood sugar management required',
      'Post-operative care - recovering from surgery',
      'Fracture of femur - requires immobilization and pain management',
      'Cardiac arrhythmia - needs continuous cardiac monitoring',
      'Severe dehydration - requires IV fluid therapy',
      'Gastroenteritis - needs observation and hydration',
    ];

    for (let i = 0; i < Math.min(8, users.length); i++) {
      const status = i < 3 ? 'Pending' : i < 6 ? 'Approved' : 'Rejected';
      const urgency = i % 3 === 0 ? 'Emergency' : 'Normal';
      
      admissionRequests.push({
        doctor_id: doctors[i % doctors.length].id,
        patient_id: users[i].id,
        requested_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
        recommended_ward_id: wardRecords[i % wardRecords.length].id,
        recommended_room_type: ['Single', 'Double', 'ICU', 'General'][i % 4],
        diagnosis: diagnoses[i % diagnoses.length],
        treatment_plan: `Treatment plan for ${diagnoses[i % diagnoses.length].split(' - ')[0]}`,
        urgency: urgency,
        status: status,
        rejection_reason: status === 'Rejected' ? 'No available beds in requested ward' : null,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      });
    }

    await queryInterface.bulkInsert('admission_requests', admissionRequests);
    console.log(`✅ Created ${admissionRequests.length} admission requests`);

    // 5. Create IPD Patients (admitted patients)
    const ipdPatients = [];
    const ipdStatuses = ['Admitted', 'UnderCare', 'TransferRequested', 'DischargeRequested'];
    const primaryDiagnoses = [
      'Acute Appendicitis with post-operative recovery',
      'Pneumonia with respiratory distress',
      'Type 2 Diabetes with hyperglycemia',
      'Post-surgical wound care and monitoring',
      'Fracture of right femur with internal fixation',
      'Atrial fibrillation requiring rate control',
      'Severe dehydration secondary to gastroenteritis',
      'Chronic obstructive pulmonary disease exacerbation',
      'Acute myocardial infarction - recovering',
      'Sepsis - under intensive antibiotic therapy',
    ];

    for (let i = 0; i < Math.min(occupiedBeds.length, users.length); i++) {
      const bedInfo = bedsWithWards[i];
      const admissionDate = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000); // Last 14 days
      const status = ipdStatuses[i % ipdStatuses.length];
      
      ipdPatients.push({
        patient_id: users[i].id,
        doctor_id: doctors[i % doctors.length].id,
        ward_id: bedInfo.ward_id,
        room_id: bedInfo.room_id,
        bed_id: bedInfo.bed_id,
        admission_date: admissionDate,
        discharge_date: null,
        status: status,
        primary_diagnosis: primaryDiagnoses[i % primaryDiagnoses.length],
        treatment_plan: `Comprehensive treatment for ${primaryDiagnoses[i % primaryDiagnoses.length].split(' - ')[0]}`,
        urgency: i % 3 === 0 ? 'Emergency' : 'Normal',
        created_at: admissionDate,
        updated_at: new Date(),
      });
    }

    await queryInterface.bulkInsert('ipd_patients', ipdPatients);
    console.log(`✅ Created ${ipdPatients.length} IPD patients`);

    // 6. Create Daily Doctor Notes for some patients
    const ipdPatientRecords = await queryInterface.sequelize.query(
      `SELECT id FROM ipd_patients ORDER BY id DESC LIMIT 10`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const dailyNotes = [];
    const notesTemplates = [
      'Patient showing good progress. Vitals stable. Continue current medication.',
      'Slight fever observed. Increased monitoring required. Adjusted antibiotics.',
      'Patient comfortable. Pain well managed. Plan for discharge in 2-3 days.',
      'Wound healing well. No signs of infection. Physiotherapy started.',
      'Patient reported improved breathing. Continue respiratory therapy.',
      'Blood sugar levels stabilizing. Insulin dosage adjusted.',
      'Patient ambulatory. Good appetite. Recovery progressing as expected.',
      'Requested transfer to step-down unit. Will reassess tomorrow.',
    ];

    ipdPatientRecords.forEach((patient, index) => {
      // Add 2-3 notes per patient
      const noteCount = 2 + (index % 2);
      for (let i = 0; i < noteCount; i++) {
        dailyNotes.push({
          ipd_id: patient.id,
          doctor_id: doctors[index % doctors.length].id,
          note: notesTemplates[(index + i) % notesTemplates.length],
          created_at: new Date(Date.now() - (noteCount - i) * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - (noteCount - i) * 24 * 60 * 60 * 1000),
        });
      }
    });

    await queryInterface.bulkInsert('daily_doctor_notes', dailyNotes);
    console.log(`✅ Created ${dailyNotes.length} daily doctor notes`);

    console.log('✅ IPD sample data seeded successfully!');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('daily_doctor_notes', null, {});
    await queryInterface.bulkDelete('ipd_patients', null, {});
    await queryInterface.bulkDelete('admission_requests', null, {});
    await queryInterface.bulkDelete('beds', null, {});
    await queryInterface.bulkDelete('rooms', null, {});
    await queryInterface.bulkDelete('wards', null, {});
    console.log('✅ IPD sample data removed');
  }
};
