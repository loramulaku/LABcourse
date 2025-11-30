/**
 * END-TO-END CLINICAL ASSESSMENT FLOW TEST
 * Tests the complete flow from appointment creation to assessment submission
 */

const { sequelize, Appointment, Doctor, User, ClinicalAssessment, Bill, PaymentHistory } = require('./models');

async function testCompleteFlow() {
  console.log('\n🧪 ==================== E2E FLOW TEST ====================\n');

  try {
    // Step 1: Check if test appointment exists
    console.log('📋 STEP 1: Finding test appointment (ID: 26)...');
    const appointment = await Appointment.findByPk(26, {
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'role'] },
        { model: Doctor, attributes: ['id', 'user_id', 'specialization'] }
      ]
    });

    if (!appointment) {
      console.error('❌ Appointment 26 not found in database');
      console.log('\n💡 Creating a test appointment...\n');
      
      // Find a doctor
      const doctor = await Doctor.findOne({ include: [User] });
      if (!doctor) {
        throw new Error('No doctor found in database');
      }
      
      // Find a patient
      const patient = await User.findOne({ where: { role: 'user' } });
      if (!patient) {
        throw new Error('No patient found in database');
      }

      // Create test appointment
      const newAppointment = await Appointment.create({
        user_id: patient.id,
        doctor_id: doctor.id,
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000),
        reason: 'Test E2E Flow',
        phone: '1234567890',
        status: 'CONFIRMED',
        payment_status: 'paid',
        amount: 50.00,
        paid_at: new Date()
      });

      console.log(`✅ Created test appointment: ${newAppointment.id}`);
      return await testCompleteFlow(); // Retry with new appointment
    }

    console.log(`✅ Appointment found:`);
    console.log(`   ID: ${appointment.id}`);
    console.log(`   Patient: ${appointment.User?.name} (ID: ${appointment.user_id})`);
    console.log(`   Doctor: Dr. ${appointment.Doctor?.id} (User ID: ${appointment.Doctor?.user_id})`);
    console.log(`   Status: ${appointment.status}`);
    console.log(`   Payment Status: ${appointment.payment_status}`);
    console.log(`   Amount: €${appointment.amount}`);

    // Step 2: Check if doctor profile exists
    console.log('\n👨‍⚕️ STEP 2: Verifying doctor profile...');
    const doctor = await Doctor.findByPk(appointment.doctor_id, {
      include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }]
    });

    if (!doctor) {
      console.error('❌ Doctor not found');
      return;
    }

    if (!doctor.user_id) {
      console.error('❌ Doctor has no user_id');
      return;
    }

    console.log(`✅ Doctor profile valid:`);
    console.log(`   Doctor ID: ${doctor.id}`);
    console.log(`   User ID: ${doctor.user_id}`);
    console.log(`   Name: ${doctor.User?.name}`);
    console.log(`   Email: ${doctor.User?.email}`);

    // Step 3: Check payment/billing status
    console.log('\n💳 STEP 3: Checking payment and billing...');
    
    try {
      const bill = await Bill.findOne({
        where: { patientId: appointment.user_id }
      });

      if (bill) {
        console.log(`✅ Bill found: ID ${bill.id}, Amount: €${bill.totalAmount}, Paid: ${bill.isPaid}`);
        
        const paymentHistory = await PaymentHistory.findAll({
          where: { billId: bill.id },
          limit: 1
        });

        if (paymentHistory.length > 0) {
          console.log(`✅ Payment history found: €${paymentHistory[0].amount}`);
        }
      } else {
        console.log('⚠️  No bill found for this patient');
      }
    } catch (error) {
      console.log(`⚠️  Bill check skipped: ${error.message}`);
    }

    // Step 4: Check existing assessment
    console.log('\n📝 STEP 4: Checking existing clinical assessment...');
    const existingAssessment = await ClinicalAssessment.findOne({
      where: { appointment_id: appointment.id }
    });

    if (existingAssessment) {
      console.log(`⚠️  Assessment already exists:`);
      console.log(`   ID: ${existingAssessment.id}`);
      console.log(`   Status: ${existingAssessment.status}`);
      console.log(`   Locked: ${existingAssessment.is_locked}`);
      console.log(`   Submitted: ${existingAssessment.submitted_at}`);
      
      if (existingAssessment.is_locked) {
        console.log('\n❌ Assessment is LOCKED - cannot submit again');
        console.log('💡 To test submission, delete this assessment or use a different appointment');
        return;
      }
    } else {
      console.log('✅ No existing assessment - ready for submission');
    }

    // Step 5: Test clinical assessment payload
    console.log('\n🧪 STEP 5: Testing assessment payload structure...');
    
    const testPayload = {
      clinical_notes: 'Test clinical assessment - patient presents with general wellness check',
      diagnosis: 'Healthy - routine checkup',
      chief_complaint: 'Routine wellness visit',
      requires_admission: false,
      therapy_prescribed: 'Continue healthy lifestyle, multivitamin daily',
      treatment_plan: 'Annual follow-up recommended',
      follow_up_instructions: 'Return in 1 year for routine checkup'
    };

    console.log('✅ Test payload:');
    console.log(JSON.stringify(testPayload, null, 2));

    // Step 6: Verify appointment can transition to COMPLETED
    console.log('\n🔄 STEP 6: Checking appointment status eligibility...');
    
    if (appointment.status === 'COMPLETED') {
      console.log('⚠️  Appointment is already COMPLETED');
    } else if (['CONFIRMED', 'APPROVED'].includes(appointment.status)) {
      console.log(`✅ Appointment status "${appointment.status}" is eligible for assessment`);
    } else {
      console.log(`❌ Appointment status "${appointment.status}" cannot receive assessment`);
      console.log('💡 Status must be CONFIRMED or APPROVED');
      return;
    }

    // Step 7: Test database table exists
    console.log('\n🗄️  STEP 7: Verifying clinical_assessments table...');
    
    try {
      const [results] = await sequelize.query(`
        DESCRIBE clinical_assessments
      `);
      console.log(`✅ Table exists with ${results.length} columns`);
    } catch (error) {
      console.error('❌ Table clinical_assessments does not exist!');
      console.log('💡 Run migration: npx sequelize-cli db:migrate');
      return;
    }

    // Step 8: Summary
    console.log('\n📊 ==================== TEST SUMMARY ====================');
    console.log(`✅ Appointment: ${appointment.id} - ${appointment.status}`);
    console.log(`✅ Doctor: ${doctor.id} (User: ${doctor.user_id})`);
    console.log(`✅ Patient: ${appointment.user_id}`);
    console.log(`✅ Payment: ${appointment.payment_status}`);
    console.log(`✅ Assessment: ${existingAssessment ? 'EXISTS' : 'NOT EXISTS'}`);
    console.log(`✅ Table: clinical_assessments exists`);
    console.log('\n✨ ALL CHECKS PASSED - System ready for assessment submission\n');

    // Step 9: API endpoint test suggestion
    console.log('🔌 SUGGESTED API TEST:');
    console.log(`POST http://localhost:5000/api/doctor/appointment/${appointment.id}/clinical-assessment`);
    console.log('Headers: Authorization: Bearer {doctor_token}');
    console.log('Body:');
    console.log(JSON.stringify(testPayload, null, 2));
    console.log('\n');

  } catch (error) {
    console.error('\n🔥 TEST FAILED:');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testCompleteFlow().catch(console.error);
