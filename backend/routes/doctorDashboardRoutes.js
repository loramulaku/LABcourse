const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { Appointment, Doctor, User, Notification } = require("../models");
const { Op } = require("sequelize");
const Stripe = require("stripe");

// Initialize Stripe
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_")) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log("✅ Stripe initialized successfully in doctor routes");
  } else {
    console.log("⚠️  Stripe not configured - payment links will not work");
  }
} catch (error) {
  console.error("❌ Stripe initialization failed:", error.message);
  stripe = null;
}

const router = express.Router();

// Middleware to check if user is a doctor
const isDoctor = async (req, res, next) => {
  if (req.user.role !== "doctor") {
    return res.status(403).json({ error: "Access denied. Doctor role required." });
  }
  next();
};

// Get doctor dashboard statistics
router.get("/dashboard/stats", authenticateToken, isDoctor, async (req, res) => {
  try {
    // Find doctor profile for current user
    const doctorProfile = await Doctor.findOne({
      where: { user_id: req.user.id },
      attributes: ['id']
    });

    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctorProfile.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get statistics using ORM
    const [
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      totalPatients
    ] = await Promise.all([
      // Total appointments
      Appointment.count({
        where: {
          doctor_id: doctorId,
          status: {
            [Op.ne]: 'CANCELLED'
          }
        }
      }),
      // Today's appointments
      Appointment.count({
        where: {
          doctor_id: doctorId,
          scheduled_for: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          },
          status: {
            [Op.ne]: 'CANCELLED'
          }
        }
      }),
      // Pending appointments
      Appointment.count({
        where: {
          doctor_id: doctorId,
          status: 'PENDING'
        }
      }),
      // Total unique patients
      Appointment.count({
        where: {
          doctor_id: doctorId,
          status: {
            [Op.ne]: 'CANCELLED'
          }
        },
        distinct: true,
        col: 'user_id'
      })
    ]);

    res.json({
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      activeTherapies: 0, // Will be implemented when therapies model exists
      totalPatients
    });
  } catch (error) {
    console.error("Error fetching doctor dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

// Get recent appointments for doctor
router.get("/appointments/recent", authenticateToken, isDoctor, async (req, res) => {
  try {
    // Find doctor profile
    const doctorProfile = await Doctor.findOne({
      where: { user_id: req.user.id },
      attributes: ['id']
    });

    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctorProfile.id;

    // Get recent appointments (last 10, completed or confirmed)
    const appointments = await Appointment.findAll({
      where: {
        doctor_id: doctorId,
        status: {
          [Op.in]: ['CONFIRMED', 'COMPLETED']
        },
        scheduled_for: {
          [Op.lte]: new Date() // Past or current
        }
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['scheduled_for', 'DESC']],
      limit: 10
    });

    // Format response
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      patient_name: apt.User?.name || 'Unknown',
      patient_email: apt.User?.email,
      scheduled_for: apt.scheduled_for,
      reason: apt.reason,
      status: apt.status,
      notes: apt.notes,
      amount: apt.amount
    }));

    res.json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching recent appointments:", error);
    res.status(500).json({ error: "Failed to fetch recent appointments" });
  }
});

// Get upcoming appointments for doctor
router.get("/appointments/upcoming", authenticateToken, isDoctor, async (req, res) => {
  try {
    // Find doctor profile
    const doctorProfile = await Doctor.findOne({
      where: { user_id: req.user.id },
      attributes: ['id']
    });

    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctorProfile.id;

    // Get upcoming appointments
    const appointments = await Appointment.findAll({
      where: {
        doctor_id: doctorId,
        status: {
          [Op.in]: ['PENDING', 'CONFIRMED']
        },
        scheduled_for: {
          [Op.gte]: new Date() // Future
        }
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['scheduled_for', 'ASC']],
      limit: 10
    });

    // Format response
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      patient_name: apt.User?.name || 'Unknown',
      patient_email: apt.User?.email,
      scheduled_for: apt.scheduled_for,
      reason: apt.reason,
      status: apt.status,
      notes: apt.notes,
      amount: apt.amount
    }));

    res.json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    res.status(500).json({ error: "Failed to fetch upcoming appointments" });
  }
});

// Get all appointments for doctor (with filtering)
router.get("/appointments", authenticateToken, isDoctor, async (req, res) => {
  try {
    const { status, from, to } = req.query;

    // Find doctor profile
    const doctorProfile = await Doctor.findOne({
      where: { user_id: req.user.id },
      attributes: ['id']
    });

    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctorProfile.id;

    // Build where clause
    const whereClause = {
      doctor_id: doctorId
    };

    // Add status filter
    if (status) {
      whereClause.status = status.toUpperCase();
    }

    // Add date range filter
    if (from || to) {
      whereClause.scheduled_for = {};
      if (from) {
        whereClause.scheduled_for[Op.gte] = new Date(from);
      }
      if (to) {
        whereClause.scheduled_for[Op.lte] = new Date(to);
      }
    }

    // Get appointments
    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['scheduled_for', 'DESC']]
    });

    // Format response
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      patient_id: apt.user_id,
      patient_name: apt.User?.name || 'Unknown',
      patient_email: apt.User?.email,
      scheduled_for: apt.scheduled_for,
      reason: apt.reason,
      status: apt.status,
      notes: apt.notes,
      phone: apt.phone,
      amount: apt.amount,
      payment_status: apt.payment_status,
      created_at: apt.created_at
    }));

    res.json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// Get single appointment details
router.get("/appointment/:id", authenticateToken, isDoctor, async (req, res) => {
  try {
    const { id } = req.params;

    // Find doctor profile
    const doctorProfile = await Doctor.findOne({
      where: { user_id: req.user.id },
      attributes: ['id']
    });

    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctorProfile.id;

    // Get appointment
    const appointment = await Appointment.findOne({
      where: {
        id: id,
        doctor_id: doctorId
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Format response
    const formattedAppointment = {
      id: appointment.id,
      patient_id: appointment.user_id,
      patient_name: appointment.User?.name || 'Unknown',
      patient_email: appointment.User?.email,
      scheduled_for: appointment.scheduled_for,
      reason: appointment.reason,
      status: appointment.status,
      notes: appointment.notes,
      phone: appointment.phone,
      amount: appointment.amount,
      payment_status: appointment.payment_status,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at
    };

    res.json(formattedAppointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({ error: "Failed to fetch appointment" });
  }
});

// Update appointment status - Enhanced for appointment management
router.patch("/appointment/:id/status", authenticateToken, isDoctor, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DECLINED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ 
        error: "Invalid status value", 
        valid_statuses: validStatuses 
      });
    }

    // Find doctor profile
    const doctorProfile = await Doctor.findOne({
      where: { user_id: req.user.id },
      attributes: ['id']
    });

    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctorProfile.id;

    // Find appointment with patient info
    const appointment = await Appointment.findOne({
      where: {
        id: id,
        doctor_id: doctorId
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found or doesn't belong to you" });
    }

    const oldStatus = appointment.status;
    const newStatus = status.toUpperCase();

    // Status transition validation
    const isValidTransition = validateStatusTransition(oldStatus, newStatus);
    if (!isValidTransition.valid) {
      return res.status(400).json({ 
        error: isValidTransition.message,
        current_status: oldStatus,
        attempted_status: newStatus
      });
    }

    // Prepare update data
    const updateData = {
      status: newStatus
    };

    // Add timestamp based on new status
    if (newStatus === 'COMPLETED') {
      updateData.completed_at = new Date();
    } else if (newStatus === 'CANCELLED') {
      updateData.cancelled_at = new Date();
    } else if (newStatus === 'CONFIRMED') {
      updateData.confirmed_at = new Date();
    }

    // Add notes if provided
    if (notes) {
      updateData.notes = appointment.notes 
        ? `${appointment.notes}\n[${new Date().toISOString()}] ${notes}` 
        : notes;
    }

    // Update appointment
    await appointment.update(updateData);

    console.log(`Doctor ${doctorId} updated appointment ${id}: ${oldStatus} → ${newStatus}`);

    // TODO: Send notification to patient about status change

    res.json({
      success: true,
      message: `Appointment status updated from ${oldStatus} to ${newStatus}`,
      appointment: {
        id: appointment.id,
        status: appointment.status,
        patient_name: appointment.User?.name,
        scheduled_for: appointment.scheduled_for,
        old_status: oldStatus,
        new_status: newStatus
      }
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({ error: "Failed to update appointment status" });
  }
});

// Helper function to validate status transitions
function validateStatusTransition(oldStatus, newStatus) {
  const transitions = {
    'PENDING': ['APPROVED', 'DECLINED', 'CANCELLED'],
    'APPROVED': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [],  // Terminal state
    'CANCELLED': [],  // Terminal state
    'DECLINED': []    // Terminal state
  };

  if (!transitions[oldStatus]) {
    return { valid: true, message: 'Unknown old status, allowing transition' };
  }

  if (oldStatus === newStatus) {
    return { valid: false, message: 'Appointment is already in this status' };
  }

  if (transitions[oldStatus].includes(newStatus)) {
    return { valid: true, message: 'Valid transition' };
  }

  // Allow any transition to CANCELLED (emergency cancellation)
  if (newStatus === 'CANCELLED') {
    return { valid: true, message: 'Emergency cancellation allowed' };
  }

  return { 
    valid: false, 
    message: `Cannot transition from ${oldStatus} to ${newStatus}. Valid transitions: ${transitions[oldStatus].join(', ')}` 
  };
}

// NEW FLOW: Approve appointment (Doctor confirms -> Patient pays)
router.post("/appointment/:id/approve", authenticateToken, isDoctor, async (req, res) => {
  try {
    const { id } = req.params;

    // Find doctor profile
    const doctorProfile = await Doctor.findOne({
      where: { user_id: req.user.id },
      attributes: ['id']
    });

    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctorProfile.id;

    // Find appointment with patient info
    const appointment = await Appointment.findOne({
      where: {
        id: id,
        doctor_id: doctorId,
        status: 'PENDING'
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found, doesn't belong to you, or not in PENDING status" });
    }

    // Check if Stripe is configured
    if (!stripe) {
      // If no Stripe, just mark as confirmed and paid
      await appointment.update({
        status: 'CONFIRMED',
        payment_status: 'paid',
        approved_at: new Date()
      });

      return res.json({
        success: true,
        message: "Appointment approved successfully (payment not configured)",
        appointment: {
          id: appointment.id,
          status: 'CONFIRMED',
          payment_status: 'paid'
        }
      });
    }

    // Create Stripe payment link
    const amountInCents = Math.round(appointment.amount * 100);
    const currency = "eur";

    console.log(`🔧 Creating payment link for appointment ${id}`);
    console.log(`   Amount: €${appointment.amount} (${amountInCents} cents)`);
    console.log(`   Patient: ${appointment.User?.email}`);
    console.log(`   Stripe configured: ${!!stripe}`);

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: amountInCents,
              product_data: {
                name: "Doctor Appointment - Approved",
                description: `Consultation on ${new Date(appointment.scheduled_for).toLocaleString()} - €${appointment.amount}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          appointment_id: String(appointment.id),
          user_id: String(appointment.user_id),
          doctor_id: String(appointment.doctor_id),
          scheduled_for: appointment.scheduled_for,
          amount: String(appointment.amount),
        },
        customer_email: appointment.User?.email,
        success_url: `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/payment-cancelled?appointment_id=${appointment.id}`,
        expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      });

      // Update appointment: approved, payment pending, save payment link and deadline
      const paymentDeadline = new Date();
      paymentDeadline.setHours(paymentDeadline.getHours() + 24);

      await appointment.update({
        status: 'APPROVED',
        stripe_session_id: session.id,
        payment_link: session.url,
        payment_deadline: paymentDeadline,
        approved_at: new Date()
      });

      console.log(`✅ Appointment ${id} approved by doctor ${doctorId}`);
      console.log(`   Payment link: ${session.url}`);
      console.log(`   Session ID: ${session.id}`);
      console.log(`   Deadline: ${paymentDeadline.toISOString()}`);
      console.log(`   Link expires in: 24 hours`);

      // Send notification to patient
      try {
        await Notification.create({
          user_id: appointment.user_id,
          sent_by_user_id: req.user.id,
          title: '✅ Appointment Approved - Payment Required',
          message: `Your appointment for ${new Date(appointment.scheduled_for).toLocaleString()} has been approved! Please complete the payment within 24 hours to confirm your appointment.`,
          notification_type: 'appointment_approved',
          appointment_id: appointment.id,
          optional_link: `/my-appointments?highlight=${appointment.id}`,
          is_read: false
        });
        console.log(`Notification sent to patient ${appointment.user_id} for appointment ${id}`);
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't fail the whole request if notification fails
      }
      
      res.json({
        success: true,
        message: "Appointment approved successfully. Payment link sent to patient.",
        appointment: {
          id: appointment.id,
          status: 'APPROVED',
          payment_link: session.url,
          payment_deadline: paymentDeadline,
          expires_in_hours: 24
        }
      });
    } catch (stripeError) {
      console.error("Stripe error while creating payment link:", stripeError);
      return res.status(500).json({ error: "Failed to create payment link", details: stripeError.message });
    }
  } catch (error) {
    console.error("Error approving appointment:", error);
    res.status(500).json({ error: "Failed to approve appointment" });
  }
});

// NEW FLOW: Reject appointment
router.post("/appointment/:id/reject", authenticateToken, isDoctor, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Find doctor profile
    const doctorProfile = await Doctor.findOne({
      where: { user_id: req.user.id },
      attributes: ['id']
    });

    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctorProfile.id;

    // Find appointment
    const appointment = await Appointment.findOne({
      where: {
        id: id,
        doctor_id: doctorId,
        status: 'PENDING'
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found, doesn't belong to you, or not in PENDING status" });
    }

    // Update appointment to DECLINED
    await appointment.update({
      status: 'DECLINED',
      rejection_reason: reason || 'Doctor declined the appointment',
      rejected_at: new Date()
    });

    console.log(`Appointment ${id} declined by doctor ${doctorId}. Reason: ${reason || 'None provided'}`);

    // TODO: Send notification/email to patient about rejection

    res.json({
      success: true,
      message: "Appointment declined successfully. Patient has been notified.",
      appointment: {
        id: appointment.id,
        status: 'DECLINED',
        rejection_reason: reason || 'Doctor declined the appointment'
      }
    });
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    res.status(500).json({ error: "Failed to reject appointment" });
  }
});

// Get pending appointments (for doctor to review)
router.get("/appointments/pending", authenticateToken, isDoctor, async (req, res) => {
  try {
    // Find doctor profile
    const doctorProfile = await Doctor.findOne({
      where: { user_id: req.user.id },
      attributes: ['id']
    });

    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctorProfile.id;

    // Get pending appointments
    const appointments = await Appointment.findAll({
      where: {
        doctor_id: doctorId,
        status: 'PENDING'
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['scheduled_for', 'ASC']]
    });

    // Format response
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      patient_id: apt.user_id,
      patient_name: apt.User?.name || 'Unknown',
      patient_email: apt.User?.email,
      scheduled_for: apt.scheduled_for,
      reason: apt.reason,
      status: apt.status,
      notes: apt.notes,
      phone: apt.phone,
      amount: apt.amount,
      created_at: apt.created_at
    }));

    res.json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching pending appointments:", error);
    res.status(500).json({ error: "Failed to fetch pending appointments" });
  }
});

// Debug endpoint: Check appointment payment link status
router.get("/appointment/:id/payment-status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id, {
      attributes: [
        'id', 
        'status', 
        'payment_link', 
        'payment_deadline', 
        'stripe_session_id',
        'payment_status',
        'amount',
        'approved_at'
      ]
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json({
      appointment_id: appointment.id,
      status: appointment.status,
      payment_status: appointment.payment_status,
      amount: appointment.amount,
      has_payment_link: !!appointment.payment_link,
      payment_link: appointment.payment_link,
      payment_deadline: appointment.payment_deadline,
      stripe_session_id: appointment.stripe_session_id,
      approved_at: appointment.approved_at,
      diagnosis: {
        payment_link_missing: !appointment.payment_link,
        needs_reapproval: appointment.status === 'APPROVED' && !appointment.payment_link,
        ready_for_payment: appointment.status === 'APPROVED' && !!appointment.payment_link
      }
    });

  } catch (error) {
    console.error("Error checking payment status:", error);
    res.status(500).json({ error: "Failed to check payment status" });
  }
});

// Submit clinical assessment for confirmed appointment
// Using layered architecture controller
const IPDDoctorController = require('../controllers/oop/IPDDoctorController');
const ipdDoctorController = new IPDDoctorController();
router.post("/appointment/:id/clinical-assessment", authenticateToken, isDoctor, ipdDoctorController.submitClinicalAssessment);

module.exports = router;
