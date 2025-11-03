const { Appointment, Doctor, User } = require('../models');
require('dotenv').config();

async function testPaymentLinks() {
  console.log('🧪 ==================== TESTING PAYMENT LINKS ====================');
  console.log('⏰ Test started at:', new Date().toISOString());
  console.log('');
  
  try {
    // Get all APPROVED appointments
    const approvedAppointments = await Appointment.findAll({
      where: { status: 'APPROVED' },
      include: [
        { 
          model: User,
          attributes: ['id', 'name', 'email']
        },
        {
          model: Doctor,
          attributes: ['id']
        }
      ],
      attributes: [
        'id',
        'status',
        'payment_link',
        'payment_deadline',
        'stripe_session_id',
        'amount',
        'scheduled_for'
      ],
      order: [['id', 'ASC']]
    });
    
    if (approvedAppointments.length === 0) {
      console.log('ℹ️  No APPROVED appointments found in the database');
      process.exit(0);
    }
    
    console.log(`📊 Found ${approvedAppointments.length} APPROVED appointment(s):\n`);
    
    let withPaymentLink = 0;
    let withoutPaymentLink = 0;
    
    approvedAppointments.forEach((apt, index) => {
      const hasLink = !!apt.payment_link;
      const status = hasLink ? '✅' : '❌';
      
      console.log(`${status} Appointment #${apt.id}`);
      console.log(`   Patient: ${apt.User?.name || 'Unknown'} (${apt.User?.email || 'N/A'})`);
      console.log(`   Amount: €${apt.amount || 60.00}`);
      console.log(`   Scheduled: ${new Date(apt.scheduled_for).toLocaleString()}`);
      console.log(`   Payment Link: ${hasLink ? '✅ YES' : '❌ MISSING'}`);
      
      if (hasLink) {
        const deadline = apt.payment_deadline ? new Date(apt.payment_deadline) : null;
        const now = new Date();
        const hoursLeft = deadline ? Math.max(0, Math.floor((deadline - now) / (1000 * 60 * 60))) : 0;
        
        console.log(`   Link: ${apt.payment_link.substring(0, 60)}...`);
        console.log(`   Session ID: ${apt.stripe_session_id || 'N/A'}`);
        console.log(`   Deadline: ${deadline ? deadline.toISOString() : 'N/A'}`);
        console.log(`   Time Left: ${hoursLeft}h`);
        withPaymentLink++;
      } else {
        withoutPaymentLink++;
      }
      
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY:');
    console.log(`   Total APPROVED appointments: ${approvedAppointments.length}`);
    console.log(`   ✅ With payment links: ${withPaymentLink}`);
    console.log(`   ❌ Without payment links: ${withoutPaymentLink}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    if (withoutPaymentLink > 0) {
      console.log('⚠️  ACTION NEEDED:');
      console.log('   Run: node scripts/fix-missing-payment-links.js');
      console.log('');
      process.exit(1);
    } else {
      console.log('🎉 SUCCESS!');
      console.log('   All APPROVED appointments have payment links!');
      console.log('   Patients can now pay for their appointments.');
      console.log('');
      console.log('📱 Next Steps:');
      console.log('   1. Login as patient (admin@labcourse.com)');
      console.log('   2. Go to "My Appointments"');
      console.log('   3. Click "Pay Now - €60.00"');
      console.log('   4. Enter test card: 4242 4242 4242 4242');
      console.log('   5. Complete payment ✅');
      console.log('');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testPaymentLinks();
