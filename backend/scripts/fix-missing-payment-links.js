const { Appointment, Doctor, User } = require('../models');
const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixMissingPaymentLinks() {
  console.log('🔧 ==================== FIX MISSING PAYMENT LINKS ====================');
  console.log('⏰ Started at:', new Date().toISOString());
  console.log('');
  
  try {
    // Find all APPROVED appointments without payment_link
    const appointments = await Appointment.findAll({
      where: {
        status: 'APPROVED',
        payment_link: null
      },
      include: [
        { 
          model: Doctor,
          attributes: ['id', 'consultation_fee', 'fees']
        },
        {
          model: User,
          attributes: ['id', 'email', 'name']
        }
      ]
    });
    
    if (appointments.length === 0) {
      console.log('✅ No appointments need payment link regeneration');
      console.log('All APPROVED appointments already have payment links!');
      process.exit(0);
    }
    
    console.log(`📋 Found ${appointments.length} appointment(s) without payment link:`);
    appointments.forEach(apt => {
      console.log(`   - Appointment #${apt.id} (Patient: ${apt.User?.name || 'Unknown'})`);
    });
    console.log('');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const appointment of appointments) {
      try {
        console.log(`\n🔧 Processing Appointment #${appointment.id}...`);
        
        // Get doctor's consultation fee
        const doctor = appointment.Doctor;
        if (!doctor) {
          console.error(`   ❌ Doctor not found for appointment #${appointment.id}`);
          failCount++;
          continue;
        }
        
        const consultationFee = doctor.consultation_fee || doctor.fees || appointment.amount || 60.0;
        const amountInCents = Math.round(consultationFee * 100);
        
        console.log(`   💰 Amount: €${consultationFee} (${amountInCents} cents)`);
        console.log(`   👤 Patient: ${appointment.User?.email || 'Unknown'}`);
        
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `Medical Appointment #${appointment.id}`,
                  description: `Consultation on ${new Date(appointment.scheduled_for).toLocaleString()}`,
                },
                unit_amount: amountInCents,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/my-appointments`,
          customer_email: appointment.User?.email,
          metadata: {
            appointment_id: appointment.id.toString(),
            user_id: appointment.user_id.toString(),
            doctor_id: appointment.doctor_id.toString(),
          },
          expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        });
        
        // Calculate payment deadline
        const paymentDeadline = new Date();
        paymentDeadline.setHours(paymentDeadline.getHours() + 24);
        
        // Update appointment with payment link
        await appointment.update({
          stripe_session_id: session.id,
          payment_link: session.url,
          payment_deadline: paymentDeadline
        });
        
        console.log(`   ✅ Payment link generated!`);
        console.log(`   🔗 Link: ${session.url}`);
        console.log(`   ⏰ Deadline: ${paymentDeadline.toISOString()}`);
        
        successCount++;
        
      } catch (error) {
        console.error(`   ❌ Failed to process appointment #${appointment.id}:`);
        console.error(`   Error: ${error.message}`);
        failCount++;
      }
    }
    
    console.log('\n');
    console.log('🎉 ==================== SUMMARY ====================');
    console.log(`✅ Successfully fixed: ${successCount} appointment(s)`);
    if (failCount > 0) {
      console.log(`❌ Failed: ${failCount} appointment(s)`);
    }
    console.log(`⏰ Completed at: ${new Date().toISOString()}`);
    console.log('====================================================');
    console.log('');
    
    if (successCount > 0) {
      console.log('📱 Next Steps:');
      console.log('   1. Refresh the patient\'s "My Appointments" page');
      console.log('   2. Click "Pay Now" button');
      console.log('   3. Enter test card: 4242 4242 4242 4242');
      console.log('   4. Complete payment ✅');
    }
    
    process.exit(failCount > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ ==================== ERROR ====================');
    console.error('Script failed:', error.message);
    console.error('Stack:', error.stack);
    console.error('====================================================');
    process.exit(1);
  }
}

// Run the script
fixMissingPaymentLinks();
