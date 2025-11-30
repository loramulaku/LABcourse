/**
 * Test Appointment 27 specifically
 */

const { sequelize, Appointment, Doctor, User, ClinicalAssessment } = require('./models');

async function testAppointment27() {
  console.log('\n🔍 Testing Appointment 27\n');

  try {
    const appointment = await Appointment.findByPk(27, {
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'role'] },
        { model: Doctor, attributes: ['id', 'user_id', 'specialization'] }
      ]
    });

    if (!appointment) {
      console.error('❌ Appointment 27 NOT FOUND');
      return;
    }

    console.log('✅ Appointment 27 Found:');
    console.log(`   Patient: ${appointment.User?.name} (ID: ${appointment.user_id})`);
    console.log(`   Doctor ID: ${appointment.doctor_id}`);
    console.log(`   Status: ${appointment.status}`);
    console.log(`   Payment: ${appointment.payment_status}`);
    console.log(`   Amount: €${appointment.amount}`);
    console.log(`   Scheduled: ${appointment.scheduled_for}`);

    // Check doctor
    if (appointment.Doctor) {
      console.log('\n👨‍⚕️ Doctor Info:');
      console.log(`   Doctor ID: ${appointment.Doctor.id}`);
      console.log(`   User ID: ${appointment.Doctor.user_id}`);
      console.log(`   Specialization: ${appointment.Doctor.specialization}`);

      const doctorUser = await User.findByPk(appointment.Doctor.user_id);
      if (doctorUser) {
        console.log(`   Name: ${doctorUser.name}`);
        console.log(`   Email: ${doctorUser.email}`);
      }
    } else {
      console.error('❌ Doctor not found for this appointment');
    }

    // Check existing assessment
    const existingAssessment = await ClinicalAssessment.findOne({
      where: { appointment_id: 27 }
    });

    console.log('\n📝 Clinical Assessment:');
    if (existingAssessment) {
      console.log(`   ⚠️  Assessment EXISTS (ID: ${existingAssessment.id})`);
      console.log(`   Status: ${existingAssessment.status}`);
      console.log(`   Locked: ${existingAssessment.is_locked}`);
      console.log(`   Submitted: ${existingAssessment.submitted_at}`);
    } else {
      console.log('   ✅ No assessment - ready for submission');
    }

    // Check if appointment is in valid status
    console.log('\n🔍 Status Check:');
    const validStatuses = ['CONFIRMED', 'APPROVED', 'COMPLETED'];
    const isValidStatus = validStatuses.includes(appointment.status);
    console.log(`   Valid for assessment: ${isValidStatus ? '✅ YES' : '❌ NO'}`);
    console.log(`   Current: ${appointment.status}`);
    console.log(`   Accepted: ${validStatuses.join(', ')}`);

    // Test payload
    console.log('\n🧪 Test Payload:');
    const testPayload = {
      clinical_notes: 'Test assessment for appointment 27',
      requires_admission: false,
      therapy_prescribed: 'lora',
      diagnosis: null,
      chief_complaint: 'Routine checkup',
      treatment_plan: 'Follow up in 6 months',
      follow_up_instructions: 'Continue current medications'
    };
    console.log(JSON.stringify(testPayload, null, 2));

    console.log('\n📊 SUMMARY:');
    console.log(`   Appointment: ${appointment.id}`);
    console.log(`   Status: ${appointment.status} ${isValidStatus ? '✅' : '❌'}`);
    console.log(`   Doctor: ${appointment.doctor_id} ${appointment.Doctor ? '✅' : '❌'}`);
    console.log(`   Assessment: ${existingAssessment ? 'EXISTS' : 'NONE'}`);
    console.log(`   Ready: ${isValidStatus && !existingAssessment ? '✅ YES' : '⚠️ CHECK'}`);

  } catch (error) {
    console.error('\n🔥 ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

testAppointment27().catch(console.error);
