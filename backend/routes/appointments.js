const express = require('express');
const Stripe = require('stripe');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

// Create appointment and Stripe checkout session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { doctor_id, scheduled_for, reason, price_cents = 2000, currency = 'eur' } = req.body;
    const userId = req.user.id;

    if (!doctor_id || !scheduled_for || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure time slot availability (exact)
    const mysqlDateTime = new Date(scheduled_for).toISOString().slice(0,19).replace('T',' ');
    const [conflict] = await db.promise().query(
      `SELECT COUNT(*) as count FROM doctor_appointments WHERE doctor_id=? AND scheduled_for=? AND status <> 'CANCELLED'`,
      [doctor_id, mysqlDateTime]
    );
    if (conflict[0].count > 0) {
      return res.status(400).json({ error: 'TIME_SLOT_BOOKED' });
    }

    // Create pending appointment row
    const [ins] = await db.promise().query(
      `INSERT INTO doctor_appointments (user_id, doctor_id, scheduled_for, reason) VALUES (?,?,?,?)`,
      [userId, doctor_id, mysqlDateTime, reason]
    );
    const appointmentId = ins.insertId;

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
      `UPDATE doctor_appointments SET stripe_session_id=? WHERE id=?`,
      [session.id, appointmentId]
    );

    res.json({ url: session.url, session_id: session.id, appointment_id: appointmentId });
  } catch (err) {
    console.error('Stripe session error:', err);
    res.status(500).json({ error: 'Failed to create checkout session', details: err.message });
  }
});

// Webhook to confirm payment
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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
          `UPDATE doctor_appointments SET status='CONFIRMED', payment_status='paid' WHERE id=?`,
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
      `SELECT * FROM doctor_appointments WHERE user_id=? ORDER BY scheduled_for DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

module.exports = router;


