const { Appointment, Doctor, User, Notification, ClinicalAssessment } = require("../models");
const { Op } = require("sequelize");
const paymentService = require("../services/PaymentService");

// Stripe is now handled by PaymentService
// This keeps the controller thin and maintains clean MVC architecture

// Helper function to get doctor ID from user
const getDoctorId = async (userId) => {
  const doctorProfile = await Doctor.findOne({
    where: { user_id: userId },
    attributes: ['id']
  });
  return doctorProfile ? doctorProfile.id : null;
};

// Helper function to validate status transitions
const validateStatusTransition = (oldStatus, newStatus) => {
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
};

// Get doctor dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

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
};

// Get recent appointments for doctor
exports.getRecentAppointments = async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

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
};

// Get upcoming appointments for doctor
exports.getUpcomingAppointments = async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

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
};

// Get all appointments for doctor (with filtering)
exports.getAllAppointments = async (req, res) => {
  try {
    const { status, from, to } = req.query;

    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

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
};

// Get single appointment details
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

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
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
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

    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

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
};

// Approve appointment (Doctor confirms -> Patient pays)
exports.approveAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

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
    if (!paymentService.isConfigured()) {
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

    // Create FRESH Stripe payment link using PaymentService
    console.log(`🔧 Creating NEW payment link for appointment ${id}`);
    console.log(`   Amount: €${appointment.amount}`);
    console.log(`   Patient: ${appointment.User?.email}`);
    
    if (appointment.stripe_session_id) {
      console.log(`   ⚠️  Existing session found: ${appointment.stripe_session_id}, creating new one...`);
    }

    try {
      const scheduledDisplay = new Date(appointment.scheduled_for).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      
      const session = await paymentService.createCheckoutSession({
        appointmentId: appointment.id,
        userId: appointment.user_id,
        doctorId: appointment.doctor_id,
        amount: appointment.amount,
        scheduledFor: appointment.scheduled_for,
        customerEmail: appointment.User?.email,
        description: `Doctor Appointment - Approved for ${scheduledDisplay}`,
        successUrl: `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/payment-cancelled?appointment_id=${appointment.id}`,
        expiresInHours: 24
      });

      // Update appointment: approved, payment pending, save payment link and deadline
      await appointment.update({
        status: 'APPROVED',
        stripe_session_id: session.sessionId,
        payment_link: session.url,
        payment_deadline: session.expiresAtDate,
        approved_at: new Date()
      });

      console.log(`✅ Appointment ${id} approved by doctor ${doctorId}`);
      console.log(`   Payment link: ${session.url}`);
      console.log(`   Session ID: ${session.sessionId}`);

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
        console.log(`Notification sent to patient ${appointment.user_id}`);
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
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
};

// Reject appointment
exports.rejectAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

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
};

// Get pending appointments (for doctor to review)
exports.getPendingAppointments = async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

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
};

// Check appointment payment link status
exports.getPaymentStatus = async (req, res) => {
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
};

// Get doctor's unique patients (from appointments)
exports.getDoctorPatients = async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    // Get unique patients from appointments
    const appointments = await Appointment.findAll({
      where: {
        doctor_id: doctorId,
        status: {
          [Op.ne]: 'CANCELLED'
        }
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      attributes: ['user_id'],
      group: ['user_id', 'User.id', 'User.name', 'User.email'],
    });

    // Extract unique patients
    const patients = appointments
      .filter(apt => apt.User)
      .map(apt => ({
        id: apt.User.id,
        name: apt.User.name,
        email: apt.User.email,
      }))
      .filter((patient, index, self) =>
        index === self.findIndex(p => p.id === patient.id)
      );

    res.json(patients);
  } catch (error) {
    console.error("Error fetching doctor patients:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
};

// Get doctor's prescriptions (clinical assessments with therapy)
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const assessments = await ClinicalAssessment.findAll({
      where: {
        doctor_id: doctorId,
      },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['id', 'scheduled_for', 'reason']
        }
      ],
      order: [['created_at', 'DESC']],
    });

    const prescriptions = assessments.map(a => ({
      id: a.id,
      patient_name: a.patient?.name || 'Unknown',
      patient_email: a.patient?.email || '',
      diagnosis: a.diagnosis || a.clinical_notes || '',
      medications: a.therapy_prescribed
        ? [{ name: a.therapy_prescribed }]
        : [],
      therapy_prescribed: a.therapy_prescribed,
      follow_up_date: a.follow_up_date,
      created_at: a.created_at,
      appointment_id: a.appointment_id,
    }));

    res.json(prescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch prescriptions" });
  }
};

// Create a prescription (stores as clinical assessment)
exports.createPrescription = async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const { patient_id, medications, diagnosis, notes, follow_up_date } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: "Patient is required" });
    }

    // Build therapy text from medications array
    const therapyText = medications
      ?.filter(m => m.name?.trim())
      .map(m => {
        let line = m.name;
        if (m.dosage) line += ` - ${m.dosage}`;
        if (m.frequency) line += ` (${m.frequency})`;
        if (m.duration) line += ` for ${m.duration}`;
        if (m.instructions) line += `\nInstructions: ${m.instructions}`;
        return line;
      })
      .join('\n\n') || '';

    // Find the most recent appointment for this patient+doctor
    const appointment = await Appointment.findOne({
      where: {
        doctor_id: doctorId,
        user_id: patient_id,
      },
      order: [['scheduled_for', 'DESC']],
    });

    if (!appointment) {
      return res.status(404).json({ error: "No appointment found for this patient" });
    }

    // Check if assessment already exists for this appointment
    const existingAssessment = await ClinicalAssessment.findOne({
      where: { appointment_id: appointment.id }
    });

    if (existingAssessment) {
      // Update existing
      await existingAssessment.update({
        therapy_prescribed: therapyText,
        diagnosis: diagnosis || existingAssessment.diagnosis,
        follow_up_instructions: notes || existingAssessment.follow_up_instructions,
        follow_up_date: follow_up_date || existingAssessment.follow_up_date,
      });
      return res.json({ message: 'Prescription updated successfully', id: existingAssessment.id });
    }

    // Create new assessment as prescription
    const assessment = await ClinicalAssessment.create({
      appointment_id: appointment.id,
      doctor_id: doctorId,
      patient_id: parseInt(patient_id),
      clinical_notes: diagnosis || 'Prescription',
      diagnosis: diagnosis || null,
      requires_admission: false,
      therapy_prescribed: therapyText,
      treatment_plan: notes || null,
      follow_up_instructions: notes || null,
      follow_up_date: follow_up_date || null,
      status: 'submitted',
      is_locked: true,
      submitted_at: new Date(),
      submitted_by: req.user.id,
    });

    res.status(201).json({ message: 'Prescription created successfully', id: assessment.id });
  } catch (error) {
    console.error("Error creating prescription:", error);
    res.status(500).json({ error: "Failed to create prescription" });
  }
};
