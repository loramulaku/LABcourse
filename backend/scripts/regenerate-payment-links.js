const { Appointment, Doctor } = require('../models');
const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function regeneratePaymentLinks() {
  console.log('🔧 Regenerating payment links for APPROVED appointments...\n');
  
  try {
    // Find all APPROVED appointments without payment_link
    const appointments = await Appointment.findAll({
      where: {
        status: 'APPROVED',
        payment_link: null
      },
      include: [{ model: Doctor }]
    });
    
    if (appointments.length === 0) {
      console.log('✅ No appointments need payment link regeneration');
      process.exit(0);
    }
    
    console.log(`Found ${appointments.length} appointment(s) without payment link\n`);
    
    for (const appointment of appointments) {
      console.log(`Processing Appointment #${appointment.id}...`);
      
      const doctor = appointment.Doctor;
      const consultationFee = doctor.consultation_fee || doctor.fees || 60.0;
      const amountInCents = Math.round(consultationFee * 100);
      
      // Create Stripe session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Medical Appointment #${appointment.id}`,
                description: `Consultation Fee - Appointment on ${appointment.scheduled_for}`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/my-appointments`,
        metadata: {
          appointment_id: appointment.id.toString(),
          user_id: appointment.user_id.toString(),
          doctor_id: appointment.doctor_id.toString(),
        },
      });
      
      // Calculate deadline (24 hours from now)
      const paymentDeadline = new Date();
      paymentDeadline.setHours(paymentDeadline.getHours() + 24);
      
      // Update appointment with payment link
      await appointment.update({
        stripe_session_id: session.id,
        payment_link: session.url,
        payment_deadline: paymentDeadline
      });
      
      console.log(`✅ Payment link generated for Appointment #${appointment.id}`);
      console.log(`   Link: ${session.url}`);
      console.log(`   Deadline: ${paymentDeadline.toISOString()}\n`);
    }
    
    console.log('🎉 All payment links regenerated successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

regeneratePaymentLinks();
