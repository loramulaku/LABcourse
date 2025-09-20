const express = require("express");
const Stripe = require("stripe");
const { authenticateToken } = require("../middleware/auth");
const db = require("../db");

const router = express.Router();

// Initialize Stripe only if secret key is provided
let stripe = null;
try {
  if (
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_SECRET_KEY.startsWith("sk_")
  ) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    });
    console.log("✅ Stripe initialized successfully");
  } else {
    console.log(
      "⚠️  Stripe not configured - appointments will be confirmed directly",
    );
  }
} catch (error) {
  console.log("⚠️  Stripe initialization failed:", error.message);
  stripe = null;
}

// Create appointment and Stripe checkout session
router.post("/create-checkout-session", authenticateToken, async (req, res) => {
  try {
    console.log("Appointment creation request received:", {
      body: req.body,
      user: req.user,
    });

    const {
      doctor_id,
      scheduled_for,
      reason,
      phone,
      notes,
      price_cents = 2000,
      currency = "eur",
    } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!doctor_id || !scheduled_for || !reason) {
      return res
        .status(400)
        .json({
          error:
            "Missing required fields: doctor_id, scheduled_for, and reason are required",
        });
    }

    // Validate doctor_id is a number
    if (isNaN(Number(doctor_id))) {
      return res.status(400).json({ error: "Invalid doctor_id format" });
    }

    // Validate scheduled_for is a valid date
    const scheduledDate = new Date(scheduled_for);
    if (isNaN(scheduledDate.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid scheduled_for date format" });
    }

    // Check if the appointment is in the future
    if (scheduledDate <= new Date()) {
      return res
        .status(400)
        .json({
          error: "Appointment must be scheduled for a future date and time",
        });
    }

    // Ensure time slot availability (exact)
    const mysqlDateTime = new Date(scheduled_for)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    // Check if user exists
    const [userCheck] = await db
      .promise()
      .query(`SELECT id FROM users WHERE id=?`, [userId]);
    if (userCheck.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if doctor exists
    const [doctorCheck] = await db
      .promise()
      .query(`SELECT id FROM doctors WHERE id=? AND available=1`, [doctor_id]);
    if (doctorCheck.length === 0) {
      return res
        .status(404)
        .json({ error: "Doctor not found or not available" });
    }

    // Check for time slot conflicts
    const [conflict] = await db
      .promise()
      .query(
        `SELECT COUNT(*) as count FROM appointments WHERE doctor_id=? AND scheduled_for=? AND status <> 'CANCELLED'`,
        [doctor_id, mysqlDateTime],
      );
    if (conflict[0].count > 0) {
      return res.status(400).json({ error: "TIME_SLOT_BOOKED" });
    }

    // Create pending appointment row
    const [ins] = await db
      .promise()
      .query(
        `INSERT INTO appointments (user_id, doctor_id, scheduled_for, reason, phone, notes, amount) VALUES (?,?,?,?,?,?,?)`,
        [
          userId,
          doctor_id,
          mysqlDateTime,
          reason,
          phone || null,
          notes || null,
          20.0,
        ],
      );
    const appointmentId = ins.insertId;

    // Check if Stripe is configured
    if (!stripe) {
      console.log("Stripe not configured, confirming appointment directly");
      // If Stripe is not configured, just confirm the appointment directly
      await db
        .promise()
        .query(
          `UPDATE appointments SET status='CONFIRMED', payment_status='paid' WHERE id=?`,
          [appointmentId],
        );
      return res.json({
        message: "Appointment booked successfully (payment not configured)",
        appointment_id: appointmentId,
        status: "confirmed",
        payment_required: false,
      });
    }

    try {
      // Create Stripe Checkout session
      console.log("Creating Stripe checkout session...");
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: Number(price_cents),
              product_data: {
                name: "Doctor Appointment",
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
        success_url: `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/payment-cancelled`,
      });

      // Save session id
      await db
        .promise()
        .query(`UPDATE appointments SET stripe_session_id=? WHERE id=?`, [
          session.id,
          appointmentId,
        ]);

      console.log("Stripe session created successfully:", session.id);
      res.json({
        url: session.url,
        session_id: session.id,
        appointment_id: appointmentId,
      });
    } catch (stripeError) {
      console.error("Stripe error:", stripeError);
      // If Stripe fails, still confirm the appointment
      await db
        .promise()
        .query(
          `UPDATE appointments SET status='CONFIRMED', payment_status='paid' WHERE id=?`,
          [appointmentId],
        );
      return res.json({
        message: "Appointment booked successfully (payment not configured)",
        appointment_id: appointmentId,
        status: "confirmed",
        payment_required: false,
      });
    }
  } catch (err) {
    console.error("Appointment booking error:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      doctor_id: req.body?.doctor_id,
      scheduled_for: req.body?.scheduled_for,
      userId: req.user?.id,
    });
    res
      .status(500)
      .json({
        error: "Failed to create checkout session",
        details: err.message,
      });
  }
});

// Webhook to confirm payment
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // Skip webhook processing if Stripe is not configured
    if (!stripe) {
      return res.json({ received: true, message: "Stripe not configured" });
    }

    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
      if (!endpointSecret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
      event = Stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const appointmentId = session.metadata?.appointment_id;
        if (appointmentId) {
          await db
            .promise()
            .query(
              `UPDATE appointments SET status='CONFIRMED', payment_status='paid' WHERE id=?`,
              [appointmentId],
            );
        }
      }
      res.json({ received: true });
    } catch (e) {
      console.error("Webhook handler error:", e);
      res.status(500).json({ error: "Webhook handling failed" });
    }
  },
);

// Get my appointments (as patient)
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT 
         a.*, 
         d.speciality, 
         u.name as doctor_name,
         (
           SELECT t.therapy_text 
           FROM therapies t 
           WHERE t.appointment_id = a.id 
           ORDER BY t.created_at DESC 
           LIMIT 1
         ) AS therapy_text
       FROM appointments a 
       JOIN doctors d ON a.doctor_id = d.id 
       JOIN users u ON d.user_id = u.id 
       WHERE a.user_id=? 
       ORDER BY a.scheduled_for DESC`,
      [req.user.id],
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// Get refused/cancelled appointments for the authenticated doctor
router.get("/doctor/refused", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res
        .status(403)
        .json({ error: "Only doctors can access this resource" });
    }

    // Find doctor id by current user id
    const [docRows] = await db
      .promise()
      .query(`SELECT id FROM doctors WHERE user_id = ? LIMIT 1`, [req.user.id]);
    if (docRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Doctor profile not found for this user" });
    }
    const doctorId = docRows[0].id;

    const [rows] = await db.promise().query(
      `SELECT 
         a.id AS appointment_id,
         a.user_id AS patient_id,
         a.scheduled_for,
         a.reason,
         a.status,
         a.notes,
         u.name AS patient_name,
         u.email AS patient_email,
         COALESCE(up.phone, '') AS patient_phone,
         (
           SELECT COUNT(*) FROM appointments a2
           WHERE a2.user_id = a.user_id AND a2.doctor_id = a.doctor_id 
             AND a2.status IN ('CANCELLED','DECLINED')
         ) AS refusal_count
       FROM appointments a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE a.doctor_id = ? AND a.status IN ('CANCELLED','DECLINED')
       ORDER BY a.scheduled_for DESC`,
      [doctorId],
    );

    res.json(rows);
  } catch (e) {
    console.error("Failed to fetch refused appointments for doctor:", e);
    res.status(500).json({ error: "Failed to fetch refused appointments" });
  }
});

// Submit therapy for an appointment by doctor
router.post("/:id/therapy", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ error: "Only doctors can submit therapy" });
    }

    const appointmentId = Number(req.params.id);
    const { therapy_text } = req.body || {};
    if (
      !appointmentId ||
      !therapy_text ||
      String(therapy_text).trim().length === 0
    ) {
      return res.status(400).json({ error: "therapy_text is required" });
    }

    // Resolve doctor id for current user
    const [docRows] = await db
      .promise()
      .query(`SELECT id FROM doctors WHERE user_id = ? LIMIT 1`, [req.user.id]);
    if (docRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Doctor profile not found for this user" });
    }
    const doctorId = docRows[0].id;

    // Verify appointment exists and belongs to this doctor
    const [apptRows] = await db
      .promise()
      .query(
        `SELECT id, user_id, doctor_id FROM appointments WHERE id = ? LIMIT 1`,
        [appointmentId],
      );
    if (apptRows.length === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    const appt = apptRows[0];
    if (Number(appt.doctor_id) !== Number(doctorId)) {
      return res
        .status(403)
        .json({ error: "You can only add therapy to your own appointments" });
    }

    // Insert therapy record
    await db
      .promise()
      .query(
        `INSERT INTO therapies (appointment_id, doctor_id, user_id, therapy_text) VALUES (?,?,?,?)`,
        [appointmentId, doctorId, appt.user_id, therapy_text],
      );

    res.json({ message: "Therapy saved successfully" });
  } catch (e) {
    console.error("Failed to submit therapy:", e);
    res.status(500).json({ error: "Failed to submit therapy" });
  }
});

module.exports = router;
