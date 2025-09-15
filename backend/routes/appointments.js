const express = require('express');
const Stripe = require('stripe');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Initialize Stripe only if secret key is provided
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
}) : null;

// Create appointment and Stripe checkout session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { doctor_id, scheduled_for, reason, phone, notes, price_cents = 2000, currency = 'eur' } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!doctor_id || !scheduled_for || !reason) {
      return res.status(400).json({ error: 'Missing required fields: doctor_id, scheduled_for, and reason are required' });
    }

    // Validate doctor_id is a number
    if (isNaN(Number(doctor_id))) {
      return res.status(400).json({ error: 'Invalid doctor_id format' });
    }

    // Validate scheduled_for is a valid date
    const scheduledDate = new Date(scheduled_for);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduled_for date format' });
    }

    // Check if the appointment is in the future
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Appointment must be scheduled for a future date and time' });
    }

    // Ensure time slot availability (exact)
    const mysqlDateTime = new Date(scheduled_for).toISOString().slice(0,19).replace('T',' ');
    
    // Check if user exists
    const [userCheck] = await db.promise().query(
      `SELECT id FROM users WHERE id=?`,
      [userId]
    );
    if (userCheck.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if doctor exists
    const [doctorCheck] = await db.promise().query(
      `SELECT id FROM doctors WHERE id=? AND available=1`,
      [doctor_id]
    );
    if (doctorCheck.length === 0) {
      return res.status(404).json({ error: 'Doctor not found or not available' });
    }

    // Check for time slot conflicts
    const [conflict] = await db.promise().query(
      `SELECT COUNT(*) as count FROM appointments WHERE doctor_id=? AND scheduled_for=? AND status <> 'CANCELLED'`,
      [doctor_id, mysqlDateTime]
    );
    if (conflict[0].count > 0) {
      return res.status(400).json({ error: 'TIME_SLOT_BOOKED' });
    }

    // Create pending appointment row
    const [ins] = await db.promise().query(
      `INSERT INTO appointments (user_id, doctor_id, scheduled_for, reason, phone, notes, amount) VALUES (?,?,?,?,?,?,?)`,
      [userId, doctor_id, mysqlDateTime, reason, phone || null, notes || null, 20.00]
    );
    const appointmentId = ins.insertId;

    // Check if Stripe is configured
    if (!stripe) {
      // If Stripe is not configured, just confirm the appointment directly
      await db.promise().query(
        `UPDATE appointments SET status='CONFIRMED', payment_status='paid' WHERE id=?`,
        [appointmentId]
      );
      return res.json({ 
        message: 'Appointment booked successfully (payment not configured)', 
        appointment_id: appointmentId,
        status: 'confirmed'
      });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: Number(price_cents),
            product_data: {
              name: 'Doctor Appointment',
              description: `Doctor #${doctor_id} at ${mysqlDateTime}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        appointment_id: String(appointmentId),
        user_id: String(userId),
        doctor_id: String(doctor_id),
        scheduled_for: mysqlDateTime,
      },
      success_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/payment-cancelled` ,
    });

    // Save session id
    await db.promise().query(
      `UPDATE appointments SET stripe_session_id=? WHERE id=?`,
      [session.id, appointmentId]
    );

    res.json({ url: session.url, session_id: session.id, appointment_id: appointmentId });
  } catch (err) {
    console.error('Appointment booking error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      doctor_id,
      scheduled_for,
      userId,
      mysqlDateTime
    });
    res.status(500).json({ error: 'Failed to create checkout session', details: err.message });
  }
});

// Webhook to confirm payment
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Skip webhook processing if Stripe is not configured
  if (!stripe) {
    return res.json({ received: true, message: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    if (!endpointSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
    event = Stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const appointmentId = session.metadata?.appointment_id;
      if (appointmentId) {
        await db.promise().query(
          `UPDATE appointments SET status='CONFIRMED', payment_status='paid' WHERE id=?`,
          [appointmentId]
        );
      }
    }
    res.json({ received: true });
  } catch (e) {
    console.error('Webhook handler error:', e);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

// Get my appointments
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT a.*, d.speciality, u.name as doctor_name 
       FROM appointments a 
       JOIN doctors d ON a.doctor_id = d.id 
       JOIN users u ON d.user_id = u.id 
       WHERE a.user_id=? 
       ORDER BY a.scheduled_for DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

module.exports = router;


