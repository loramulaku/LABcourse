const express = require("express");
const Stripe = require("stripe");
const { authenticateToken } = require("../middleware/auth");
const db = require("../db");
const { Appointment, Doctor, User } = require("../models");
const { Op } = require("sequelize");

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
  console.log("🚀 ==================== NEW APPOINTMENT REQUEST ====================");
  console.log("⏰ Time:", new Date().toISOString());
  
  // Safety check
  if (!req.user) {
    console.error("❌ No user found in request - authentication failed");
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
    console.log("👤 User:", req.user ? req.user.id : "NOT AUTHENTICATED");

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

    console.log("📋 Parsed data:", {
      doctor_id,
      scheduled_for,
      reason,
      userId,
      phone,
      notes
    });

    // Validate required fields
    if (!doctor_id || !scheduled_for || !reason) {
      console.error("❌ Missing required fields:", { doctor_id, scheduled_for, reason });
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
      console.error("Invalid date format received:", scheduled_for);
      return res
        .status(400)
        .json({ error: "Invalid date format. Please select a valid date and time." });
    }

    // Check if the appointment is in the future (with a small buffer)
    const now = new Date();
    const bufferMinutes = 5; // Allow 5 minutes buffer
    const minDate = new Date(now.getTime() + bufferMinutes * 60000);
    
    if (scheduledDate <= minDate) {
      console.log("Appointment time validation failed:", {
        received: scheduledDate.toISOString(),
        receivedLocal: scheduledDate.toLocaleString(),
        now: now.toISOString(),
        minRequired: minDate.toISOString(),
        difference: (scheduledDate - now) / 60000 + " minutes"
      });
      return res
        .status(400)
        .json({
          error: "Appointment must be scheduled at least 5 minutes in the future. Please select a later time slot.",
        });
    }

    // Format datetime for MySQL (keep local timezone)
    // Don't convert to UTC - keep the time as-is
    const scheduledDateTime = new Date(scheduled_for);
    const year = scheduledDateTime.getFullYear();
    const month = String(scheduledDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(scheduledDateTime.getDate()).padStart(2, '0');
    const hours = String(scheduledDateTime.getHours()).padStart(2, '0');
    const minutes = String(scheduledDateTime.getMinutes()).padStart(2, '0');
    const seconds = String(scheduledDateTime.getSeconds()).padStart(2, '0');
    const mysqlDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // Check if user exists using ORM
    console.log("🔍 Checking user...");
    const user = await User.findByPk(userId);
    if (!user) {
      console.error("❌ User not found:", userId);
      return res.status(404).json({ error: "User not found" });
    }
    console.log("✅ User found:", user.id);

    // Check if doctor exists and get consultation fee using ORM
    console.log("🔍 Checking doctor:", doctor_id);
    const doctor = await Doctor.findByPk(doctor_id, {
      attributes: ['id', 'consultation_fee', 'fees', 'available']
    });
    
    if (!doctor) {
      console.error("❌ Doctor not found:", doctor_id);
      return res
        .status(404)
        .json({ error: "Doctor not found" });
    }
    console.log("✅ Doctor found:", doctor.id, "Fee:", doctor.consultation_fee || doctor.fees);
    
    // Optional: Check if doctor is available (if field exists)
    if (doctor.available === false) {
      console.log("⚠️  Doctor unavailable");
      return res
        .status(400)
        .json({ error: "Doctor is not currently accepting appointments" });
    }
    
    const consultationFee = doctor.consultation_fee || doctor.fees || 60.0;
    const amountInCents = Math.round(consultationFee * 100); // Convert to cents for Stripe

    // Check for time slot conflicts using ORM
    console.log("🔍 Checking time slot conflicts for:", mysqlDateTime);
    const existingAppointment = await Appointment.findOne({
      where: {
        doctor_id: doctor_id,
        scheduled_for: mysqlDateTime,
        status: {
          [Op.ne]: 'CANCELLED'
        }
      }
    });
    
    if (existingAppointment) {
      console.log("❌ Time slot already booked");
      return res.status(400).json({ error: "TIME_SLOT_BOOKED" });
    }
    console.log("✅ Time slot available");

    // Create pending appointment using ORM
    console.log("💾 Creating appointment...");
    const appointment = await Appointment.create({
      user_id: userId,
      doctor_id: doctor_id,
      scheduled_for: mysqlDateTime,
      reason: reason,
      phone: phone || null,
      notes: notes || null,
      amount: consultationFee,
      status: 'PENDING',
      payment_status: 'unpaid'
    });
    console.log("✅ Appointment created:", appointment.id);
    
    const appointmentId = appointment.id;
    console.log(`Appointment request created with ID ${appointmentId}, status: PENDING, awaiting doctor approval`);

    // NEW FLOW: Just return success, doctor needs to approve first
    // Payment will happen AFTER doctor approval
    res.json({
      success: true,
      message: "Appointment request submitted successfully. Waiting for doctor approval.",
      appointment_id: appointmentId,
      status: "PENDING",
      doctor_approval_required: true,
      scheduled_for: mysqlDateTime,
      amount: consultationFee
    });
  } catch (err) {
    console.error("🔥 ==================== APPOINTMENT ERROR ====================");
    console.error("❌ Error Type:", err.name);
    console.error("❌ Error Message:", err.message);
    console.error("❌ Error Stack:", err.stack);
    console.error("📍 Request Data:", {
      doctor_id: req.body?.doctor_id,
      scheduled_for: req.body?.scheduled_for,
      userId: req.user?.id,
      reason: req.body?.reason,
    });
    console.error("🔥 ================================================================");
    
    res.status(500).json({
      error: "Failed to create appointment",
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
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
        const paidAmount = session.metadata?.amount || (session.amount_total / 100);
        
        if (appointmentId) {
          console.log(`Payment confirmed for appointment ${appointmentId}, amount: €${paidAmount}`);
          
          // Get current appointment to check status
          const appointment = await Appointment.findByPk(appointmentId);
          
          if (appointment) {
            // Update appointment: APPROVED or PENDING -> CONFIRMED + PAID
            await appointment.update({
              status: 'CONFIRMED',
              payment_status: 'paid',
              amount: paidAmount,
              paid_at: new Date()
            });
            
            console.log(`Appointment ${appointmentId} payment completed. Status: ${appointment.status} -> CONFIRMED`);
            // TODO: Send notification to doctor and patient
          }
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
    // Get appointments using ORM with eager loading
    const appointments = await Appointment.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Doctor,
          attributes: ['id', 'specialization', 'image', 'consultation_fee'],
          include: [
            {
              model: User,
              attributes: ['name', 'email']
            }
          ]
        }
      ],
      order: [['scheduled_for', 'DESC']]
    });
    
    // Format response to match expected structure
    const formattedAppointments = appointments.map(apt => ({
      ...apt.toJSON(),
      doctor_name: apt.Doctor?.User?.name,
      doctor_email: apt.Doctor?.User?.email,
      doctor_image: apt.Doctor?.image,
      specialization: apt.Doctor?.specialization,
      therapy_text: null // Therapies table doesn't exist yet
    }));
    
    res.json(formattedAppointments);
  } catch (e) {
    console.error("Error fetching my appointments:", e);
    res.status(500).json({ error: "Failed to fetch appointments", details: e.message });
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

    // Find doctor using ORM
    const doctorProfile = await Doctor.findOne({
      where: { user_id: req.user.id },
      attributes: ['id']
    });
    
    if (!doctorProfile) {
      return res
        .status(404)
        .json({ error: "Doctor profile not found for this user" });
    }
    const doctorId = doctorProfile.id;

    // Get refused/cancelled appointments using ORM
    const appointments = await Appointment.findAll({
      where: {
        doctor_id: doctorId,
        status: {
          [Op.in]: ['CANCELLED', 'DECLINED']
        }
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['scheduled_for', 'DESC']],
      raw: false
    });
    
    // Format response to match expected structure
    const formattedRows = await Promise.all(appointments.map(async (apt) => {
      // Get refusal count for this patient-doctor combination
      const refusalCount = await Appointment.count({
        where: {
          user_id: apt.user_id,
          doctor_id: apt.doctor_id,
          status: {
            [Op.in]: ['CANCELLED', 'DECLINED']
          }
        }
      });
      
      return {
        appointment_id: apt.id,
        patient_id: apt.user_id,
        scheduled_for: apt.scheduled_for,
        reason: apt.reason,
        status: apt.status,
        notes: apt.notes,
        patient_name: apt.User?.name,
        patient_email: apt.User?.email,
        patient_phone: '', // UserProfile not in models yet
        refusal_count: refusalCount
      };
    }));

    res.json(formattedRows);
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

    // Resolve doctor id for current user using ORM
    const doctorProfile = await Doctor.findOne({
      where: { user_id: req.user.id },
      attributes: ['id']
    });
    
    if (!doctorProfile) {
      return res
        .status(404)
        .json({ error: "Doctor profile not found for this user" });
    }
    const doctorId = doctorProfile.id;

    // Verify appointment exists and belongs to this doctor using ORM
    const appointment = await Appointment.findOne({
      where: { id: appointmentId },
      attributes: ['id', 'user_id', 'doctor_id']
    });
    
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    
    if (Number(appointment.doctor_id) !== Number(doctorId)) {
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

// Verify payment status
router.get("/verify-payment/:session_id", authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.params;
    
    if (!stripe) {
      return res.status(400).json({ error: "Stripe not configured" });
    }
    
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const appointmentId = session.metadata?.appointment_id;
    
    if (!appointmentId) {
      return res.status(404).json({ error: "No appointment associated with this session" });
    }
    
    // Get appointment using ORM
    const appointment = await Appointment.findByPk(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    
    // Update appointment if payment succeeded but status not updated yet using ORM
    if (session.payment_status === 'paid' && appointment.payment_status !== 'paid') {
      const paidAmount = session.metadata?.amount || (session.amount_total / 100);
      await appointment.update({
        status: 'CONFIRMED',
        payment_status: 'paid',
        amount: paidAmount
      });
      
      return res.json({
        success: true,
        status: 'CONFIRMED',
        payment_status: 'paid',
        appointment_id: appointmentId,
        amount: paidAmount
      });
    }
    
    res.json({
      success: session.payment_status === 'paid',
      status: appointment.status,
      payment_status: appointment.payment_status,
      appointment_id: appointmentId,
      amount: appointment.amount
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Handle cancelled payments
router.post("/cancel-payment/:appointment_id", authenticateToken, async (req, res) => {
  try {
    const { appointment_id } = req.params;
    
    // Check if appointment exists and belongs to user using ORM
    const appointment = await Appointment.findOne({
      where: {
        id: appointment_id,
        user_id: req.user.id
      }
    });
    
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    
    // Only cancel if payment is unpaid and status is pending using ORM
    if (appointment.payment_status === 'unpaid' && appointment.status === 'PENDING') {
      await appointment.update({
        status: 'CANCELLED'
      });
      
      return res.json({ 
        success: true, 
        message: 'Appointment cancelled due to payment cancellation' 
      });
    }
    
    res.json({ 
      success: false, 
      message: 'Appointment cannot be cancelled',
      status: appointment.status,
      payment_status: appointment.payment_status
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Auto-cancel expired approved appointments (cron job endpoint)
router.post("/cancel-expired", authenticateToken, async (req, res) => {
  try {
    // Only allow admin or system to run this
    if (req.user.role !== 'admin' && req.user.role !== 'system') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const now = new Date();

    // Find all APPROVED appointments where payment_deadline has passed
    const expiredAppointments = await Appointment.findAll({
      where: {
        status: 'APPROVED',
        payment_status: 'unpaid',
        payment_deadline: {
          [Op.lt]: now // Deadline is in the past
        }
      }
    });

    if (expiredAppointments.length === 0) {
      return res.json({
        success: true,
        message: 'No expired appointments to cancel',
        cancelled_count: 0
      });
    }

    // Cancel all expired appointments
    const cancelledIds = [];
    for (const appointment of expiredAppointments) {
      await appointment.update({
        status: 'CANCELLED',
        payment_status: 'expired',
        cancelled_at: now
      });
      cancelledIds.push(appointment.id);
      console.log(`Auto-cancelled appointment ${appointment.id} - payment deadline expired`);
      // TODO: Send notification to patient and doctor
    }

    res.json({
      success: true,
      message: `Cancelled ${expiredAppointments.length} expired appointment(s)`,
      cancelled_count: expiredAppointments.length,
      cancelled_ids: cancelledIds
    });
  } catch (error) {
    console.error('Error auto-cancelling expired appointments:', error);
    res.status(500).json({ error: 'Failed to cancel expired appointments' });
  }
});

// Cron job endpoint - can be called without authentication (but should be secured by IP/secret)
router.post("/cron/cancel-expired", async (req, res) => {
  try {
    // Check for cron secret
    const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
    if (cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Invalid cron secret' });
    }

    const now = new Date();

    // Find all APPROVED appointments where payment_deadline has passed
    const expiredAppointments = await Appointment.findAll({
      where: {
        status: 'APPROVED',
        payment_status: 'unpaid',
        payment_deadline: {
          [Op.lt]: now
        }
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        },
        {
          model: Doctor,
          attributes: ['id'],
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (expiredAppointments.length === 0) {
      return res.json({
        success: true,
        message: 'No expired appointments found',
        cancelled_count: 0
      });
    }

    // Cancel all expired appointments
    const results = [];
    for (const appointment of expiredAppointments) {
      await appointment.update({
        status: 'CANCELLED',
        payment_status: 'expired',
        cancelled_at: now
      });
      
      results.push({
        appointment_id: appointment.id,
        patient_email: appointment.User?.email,
        doctor_email: appointment.Doctor?.User?.email,
        scheduled_for: appointment.scheduled_for
      });
      
      console.log(`[CRON] Auto-cancelled appointment ${appointment.id} - payment deadline expired`);
      // TODO: Send notification emails to patient and doctor
    }

    res.json({
      success: true,
      message: `Auto-cancelled ${expiredAppointments.length} expired appointment(s)`,
      cancelled_count: expiredAppointments.length,
      results: results
    });
  } catch (error) {
    console.error('[CRON] Error auto-cancelling expired appointments:', error);
    res.status(500).json({ error: 'Failed to cancel expired appointments', details: error.message });
  }
});

module.exports = router;
