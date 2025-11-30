const { Appointment, Doctor, User, Notification, Bill, BillItem, PaymentHistory, ClinicalAssessment } = require('../models');
const { Op } = require('sequelize');
const paymentService = require('../services/PaymentService');
const webhookEventHandler = require('../services/WebhookEventHandler');

// Payment and webhook logic handled by dedicated services
// This keeps the controller thin and maintains clean MVC architecture

const appointmentController = {
  // Create appointment with checkout session
  async createCheckoutSession(req, res) {
    console.log('🚀 ==================== NEW APPOINTMENT REQUEST ====================');
    console.log('⏰ Time:', new Date().toISOString());
    
    // Safety check
    if (!req.user) {
      console.error('❌ No user found in request - authentication failed');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
      console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
      console.log('👤 User:', req.user.id);

      const {
        doctor_id,
        scheduled_for,
        reason,
        phone,
        notes,
        price_cents = 2000,
        currency = 'eur',
      } = req.body;
      const userId = req.user.id;

      console.log('📋 Parsed data:', {
        doctor_id,
        scheduled_for,
        reason,
        userId,
        phone,
        notes
      });

      // Validate required fields
      if (!doctor_id || !scheduled_for || !reason) {
        console.error('❌ Missing required fields:', { doctor_id, scheduled_for, reason });
        return res.status(400).json({
          error: 'Missing required fields: doctor_id, scheduled_for, and reason are required',
        });
      }

      // Validate doctor_id is a number
      if (isNaN(Number(doctor_id))) {
        return res.status(400).json({ error: 'Invalid doctor_id format' });
      }

      // Validate scheduled_for is a valid date
      const scheduledDate = new Date(scheduled_for);
      if (isNaN(scheduledDate.getTime())) {
        console.error('Invalid date format received:', scheduled_for);
        return res.status(400).json({ error: 'Invalid date format. Please select a valid date and time.' });
      }

      // Check if the appointment is in the future (with a small buffer)
      const now = new Date();
      const bufferMinutes = 5; // Allow 5 minutes buffer
      const minDate = new Date(now.getTime() + bufferMinutes * 60000);
      
      if (scheduledDate <= minDate) {
        console.log('Appointment time validation failed:', {
          received: scheduledDate.toISOString(),
          receivedLocal: scheduledDate.toLocaleString(),
          now: now.toISOString(),
          minRequired: minDate.toISOString(),
          difference: (scheduledDate - now) / 60000 + ' minutes'
        });
        return res.status(400).json({
          error: 'Appointment must be scheduled at least 5 minutes in the future. Please select a later time slot.',
        });
      }

      // Format datetime for MySQL (keep local timezone)
      const scheduledDateTime = new Date(scheduled_for);
      const year = scheduledDateTime.getFullYear();
      const month = String(scheduledDateTime.getMonth() + 1).padStart(2, '0');
      const day = String(scheduledDateTime.getDate()).padStart(2, '0');
      const hours = String(scheduledDateTime.getHours()).padStart(2, '0');
      const minutes = String(scheduledDateTime.getMinutes()).padStart(2, '0');
      const seconds = String(scheduledDateTime.getSeconds()).padStart(2, '0');
      const mysqlDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      // Check if user exists
      console.log('🔍 Checking user...');
      const user = await User.findByPk(userId);
      if (!user) {
        console.error('❌ User not found:', userId);
        return res.status(404).json({ error: 'User not found' });
      }
      console.log('✅ User found:', user.id);

      // Check if doctor exists and get consultation fee
      console.log('🔍 Checking doctor:', doctor_id);
      const doctor = await Doctor.findByPk(doctor_id, {
        attributes: ['id', 'consultation_fee', 'fees', 'available']
      });
      
      if (!doctor) {
        console.error('❌ Doctor not found:', doctor_id);
        return res.status(404).json({ error: 'Doctor not found' });
      }
      console.log('✅ Doctor found:', doctor.id, 'Fee:', doctor.consultation_fee || doctor.fees);
      
      // Check if doctor is available
      if (doctor.available === false) {
        console.log('⚠️  Doctor unavailable');
        return res.status(400).json({ error: 'Doctor is not currently accepting appointments' });
      }
      
      const consultationFee = doctor.consultation_fee || doctor.fees || 60.0;
      const amountInCents = Math.round(consultationFee * 100);

      // Check for time slot conflicts
      console.log('🔍 Checking time slot conflicts for:', mysqlDateTime);
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
        console.log('❌ Time slot already booked');
        return res.status(400).json({ error: 'TIME_SLOT_BOOKED' });
      }
      console.log('✅ Time slot available');

      // Create pending appointment
      console.log('💾 Creating appointment...');
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
      console.log('✅ Appointment created:', appointment.id);
      
      const appointmentId = appointment.id;
      console.log(`Appointment request created with ID ${appointmentId}, status: PENDING, awaiting doctor approval`);

      // NEW FLOW: Just return success, doctor needs to approve first
      res.json({
        success: true,
        message: 'Appointment request submitted successfully. Waiting for doctor approval.',
        appointment_id: appointmentId,
        status: 'PENDING',
        doctor_approval_required: true,
        scheduled_for: mysqlDateTime,
        amount: consultationFee
      });
    } catch (err) {
      console.error('🔥 ==================== APPOINTMENT ERROR ====================');
      console.error('❌ Error Type:', err.name);
      console.error('❌ Error Message:', err.message);
      console.error('❌ Error Stack:', err.stack);
      console.error('📍 Request Data:', {
        doctor_id: req.body?.doctor_id,
        scheduled_for: req.body?.scheduled_for,
        userId: req.user?.id,
        reason: req.body?.reason,
      });
      console.error('🔥 ================================================================');
      
      res.status(500).json({
        error: 'Failed to create appointment',
        message: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  },

  // Webhook endpoint for Stripe events
  async webhookHandler(req, res) {
    // Verify webhook signature using PaymentService
    const verification = paymentService.verifyWebhookSignature(
      req.body, 
      req.headers['stripe-signature']
    );
    
    // Handle verification errors
    if (verification.error) {
      if (verification.skip) {
        return res.json({ received: true, message: verification.error });
      }
      return res.status(400).json({ error: verification.error });
    }
    
    const { event, requestId } = verification;

    try {
      // Delegate event processing to WebhookEventHandler service
      const result = await webhookEventHandler.processEvent(event, requestId);
      
      console.log('✅ Webhook processed successfully');
      console.log(`🔔 ==================== END WEBHOOK [${requestId}] ====================\n`);
      
      res.json({ 
        received: true, 
        event_id: event.id,
        event_type: event.type,
        ...result 
      });
    } catch (e) {
      console.error('🔥 ==================== WEBHOOK ERROR ====================');
      console.error('❌ Error Type:', e.name);
      console.error('❌ Error Message:', e.message);
      console.error('❌ Error Stack:', e.stack);
      console.error('📍 Event ID:', event?.id);
      console.error('📍 Event Type:', event?.type);
      console.error('🔥 ===========================================================\n');
      
      // Return 500 to trigger Stripe retry for critical errors
      res.status(500).json({ 
        error: 'Webhook handling failed', 
        details: e.message,
        event_type: event?.type 
      });
    }
  },

  // Regenerate payment link
  async regeneratePaymentLink(req, res) {
    const appointmentId = Number(req.params.id);
    console.log(`\n🔄 ==================== REGENERATE PAYMENT LINK ====================`);
    console.log('⏰ Time:', new Date().toISOString());
    console.log('🆔 Appointment ID:', appointmentId);
    console.log('👤 User ID:', req.user?.id);
    
    try {
      if (!paymentService.isConfigured()) {
        console.error('❌ Stripe not configured');
        return res.status(400).json({ error: 'Stripe not configured' });
      }
      
      if (isNaN(appointmentId) || appointmentId <= 0) {
        console.error('❌ Invalid appointment ID');
        return res.status(400).json({ error: 'Invalid appointment ID' });
      }
      
      console.log('🔍 Fetching appointment...');
      const appointment = await Appointment.findOne({ 
        where: { id: appointmentId, user_id: req.user.id },
        include: [{
          model: Doctor,
          attributes: ['id', 'user_id']
        }]
      });
      
      if (!appointment) {
        console.error(`❌ Appointment ${appointmentId} not found or doesn't belong to user`);
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      console.log('✅ Appointment found');
      console.log('   Status:', appointment.status);
      console.log('   Payment status:', appointment.payment_status);
      console.log('   Scheduled for:', appointment.scheduled_for);
      
      // Check if already paid
      if (appointment.payment_status === 'paid' || appointment.status === 'CONFIRMED') {
        console.log(`✅ Appointment ${appointmentId} already paid`);
        return res.status(400).json({ 
          error: 'Appointment already paid', 
          already_paid: true,
          appointment_status: appointment.status,
          payment_status: appointment.payment_status
        });
      }
      
      if (appointment.status !== 'APPROVED') {
        console.log(`⚠️  Appointment ${appointmentId} status is ${appointment.status}, not APPROVED`);
        return res.status(400).json({ 
          error: `Appointment is not in APPROVED status (current: ${appointment.status})`,
          current_status: appointment.status
        });
      }
      
      // Check if appointment is in the past
      const scheduledDate = new Date(appointment.scheduled_for);
      if (scheduledDate < new Date()) {
        console.error('❌ Appointment is in the past');
        return res.status(400).json({ 
          error: 'Cannot create payment link for past appointments',
          scheduled_for: appointment.scheduled_for
        });
      }
      
      // If there's an existing payment link, check if it's still valid using service
      if (appointment.stripe_session_id && appointment.payment_link) {
        const validation = await paymentService.isSessionValid(appointment.stripe_session_id);
        
        if (validation.valid) {
          console.log(`ℹ️  Existing session still valid (${validation.timeRemainingMinutes} minutes remaining)`);
          return res.json({
            success: true,
            payment_link: appointment.payment_link,
            expires_at: validation.session.expires_at,
            session_id: appointment.stripe_session_id,
            time_remaining_minutes: validation.timeRemainingMinutes,
            reused_existing: true
          });
        }
        
        console.log(`⚠️  Existing session not valid: ${validation.reason}`);
      }
      
      // Fetch doctor user separately
      let doctorName = 'Doctor';
      if (appointment.Doctor && appointment.Doctor.user_id) {
        const doctorUser = await User.findByPk(appointment.Doctor.user_id, {
          attributes: ['name']
        });
        doctorName = doctorUser?.name || 'Doctor';
      }
      
      // Create new Stripe checkout session using PaymentService
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
        customerEmail: req.user.email,
        description: `Consultation with ${doctorName} on ${scheduledDisplay}`,
        successUrl: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/payment-cancelled?appointment_id=${appointment.id}`,
        expiresInHours: 24
      });

      // Update appointment with new session details
      const paymentDeadline = session.expiresAtDate;
      await appointment.update({
        stripe_session_id: session.sessionId,
        payment_link: session.url,
        payment_deadline: paymentDeadline,
      });

      console.log('✅ Appointment updated with new payment link');
      console.log('🔄 ==================== END REGENERATE PAYMENT ====================\n');

      res.json({ 
        success: true, 
        payment_link: session.url, 
        expires_at: session.expires_at,
        session_id: session.id,
        expires_at_readable: paymentDeadline.toISOString(),
        time_remaining_hours: 24
      });
    } catch (error) {
      console.error('🔥 ==================== REGENERATE ERROR ====================');
      console.error('❌ Error:', error.message);
      console.error('❌ Stack:', error.stack);
      console.error('🔥 ============================================================\n');
      res.status(500).json({ 
        error: 'Failed to regenerate payment link',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Verify payment after Stripe checkout
  async verifyPayment(req, res) {
    const { sessionId } = req.params;
    console.log(`\n🔍 ==================== VERIFY PAYMENT ====================`);
    console.log('⏰ Time:', new Date().toISOString());
    console.log('🆔 Session ID:', sessionId);
    console.log('👤 User ID:', req.user?.id);
    
    try {
      if (!paymentService.isConfigured()) {
        console.error('❌ Stripe not configured');
        return res.status(400).json({ error: 'Stripe not configured' });
      }

      if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
        console.error('❌ Invalid session ID:', sessionId);
        return res.status(400).json({ error: 'Invalid session ID' });
      }

      // Retrieve session using PaymentService
      let session;
      try {
        session = await paymentService.retrieveSession(sessionId);
      } catch (error) {
        console.error('❌ Failed to retrieve session:', error.message);
        return res.status(404).json({ 
          error: 'Payment session not found or expired',
          details: 'The payment session may have expired. Please try creating a new payment.' 
        });
      }

      // Extract payment details using service
      const paymentDetails = paymentService.extractPaymentDetails(session);
      const appointmentId = paymentDetails.appointmentId;
      
      if (!appointmentId) {
        console.error('❌ No appointment_id in session metadata');
        console.error('   Metadata:', JSON.stringify(session.metadata, null, 2));
        return res.status(400).json({ error: 'No appointment associated with this payment' });
      }

      console.log('🔍 Fetching appointment:', appointmentId);
      // Get appointment details
      const appointment = await Appointment.findByPk(appointmentId, {
        include: [{
          model: Doctor,
          attributes: ['id', 'specialization', 'user_id']
        }]
      });

      if (!appointment) {
        console.error('❌ Appointment not found in database:', appointmentId);
        return res.status(404).json({ error: 'Appointment not found' });
      }

      console.log('✅ Appointment found');
      console.log('   Status:', appointment.status);
      console.log('   Payment status:', appointment.payment_status);
      console.log('   Owner:', appointment.user_id);

      // Check if user owns this appointment
      if (appointment.user_id !== req.user.id) {
        console.error('❌ Unauthorized access attempt');
        console.error('   Appointment owner:', appointment.user_id);
        console.error('   Request user:', req.user.id);
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Check payment status using PaymentService
      const isPaid = paymentService.isPaymentCompleted(session);
      console.log('💳 Payment status check:');
      console.log('   Stripe payment_status:', session.payment_status);
      console.log('   DB payment_status:', appointment.payment_status);
      console.log('   Is paid:', isPaid);

      // If payment is completed but appointment not updated, trigger update
      if (isPaid && appointment.payment_status !== 'paid') {
        console.log('⚠️  Payment completed but appointment not updated!');
        console.log('   This may indicate webhook failed. Updating now...');
        
        await appointment.update({
          status: 'CONFIRMED',
          payment_status: 'paid',
          paid_at: new Date(),
          stripe_session_id: sessionId
        });
        
        console.log('✅ Appointment updated to paid status');
      }

      // Fetch doctor user separately
      let doctorName = null;
      if (appointment.Doctor && appointment.Doctor.user_id) {
        const doctorUser = await User.findByPk(appointment.Doctor.user_id, {
          attributes: ['name']
        });
        doctorName = doctorUser?.name || null;
      }

      const response = {
        success: true,
        appointment_id: appointment.id,
        payment_status: appointment.payment_status,
        status: appointment.status,
        amount: appointment.amount,
        scheduled_for: appointment.scheduled_for,
        doctor_name: doctorName,
        receipt_url: session.receipt_url || null,
        stripe_payment_status: session.payment_status,
        payment_verified: isPaid && appointment.payment_status === 'paid'
      };

      console.log('✅ Payment verification complete');
      console.log('🔍 ==================== END VERIFY PAYMENT ====================\n');
      res.json(response);
    } catch (error) {
      console.error('🔥 ==================== VERIFICATION ERROR ====================');
      console.error('❌ Error:', error.message);
      console.error('❌ Stack:', error.stack);
      console.error('🔥 ==============================================================\n');
      res.status(500).json({ 
        error: 'Failed to verify payment',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }
  },

  // Get my appointments (as patient)
  async getMyAppointments(req, res) {
    try {
      const appointments = await Appointment.findAll({
        where: { user_id: req.user.id },
        include: [{
          model: Doctor,
          attributes: ['id', 'specialization', 'image', 'consultation_fee', 'user_id']
        }],
        order: [['scheduled_for', 'DESC']]
      });

      // Fetch doctor users separately
      const doctorUserIds = [...new Set(appointments.map(a => a.Doctor?.user_id).filter(Boolean))];
      const doctorUsers = await User.findAll({
        where: { id: doctorUserIds },
        attributes: ['id', 'name', 'email']
      });
      const doctorUserMap = Object.fromEntries(doctorUsers.map(u => [u.id, u]));

      // Format response with doctor user data
      const formattedAppointments = appointments.map(apt => ({
        ...apt.toJSON(),
        Doctor: apt.Doctor ? {
          ...apt.Doctor.toJSON(),
          User: doctorUserMap[apt.Doctor.user_id] || null
        } : null
      }));

      res.json(formattedAppointments);
    } catch (error) {
      console.error('Error fetching my appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  },

  // Get all appointments
  async getAllAppointments(req, res) {
    try {
      const appointments = await Appointment.findAll({
        include: [{
          model: User,
          attributes: ['id', 'name', 'email'],
        }, {
          model: Doctor,
          attributes: ['id', 'first_name', 'last_name', 'specialization', 'user_id']
        }],
        order: [['scheduled_for', 'DESC']],
      });

      // Fetch doctor users separately
      const doctorUserIds = [...new Set(appointments.map(a => a.Doctor?.user_id).filter(Boolean))];
      const doctorUsers = await User.findAll({
        where: { id: doctorUserIds },
        attributes: ['id', 'name', 'email']
      });
      const doctorUserMap = Object.fromEntries(doctorUsers.map(u => [u.id, u]));

      // Format response with doctor user data
      const formattedAppointments = appointments.map(apt => ({
        ...apt.toJSON(),
        Doctor: apt.Doctor ? {
          ...apt.Doctor.toJSON(),
          User: doctorUserMap[apt.Doctor.user_id] || null
        } : null
      }));

      res.json(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  },

  // Get appointment by ID
  async getAppointmentById(req, res) {
    try {
      const appointmentId = req.params.id;

      const appointment = await Appointment.findByPk(appointmentId, {
        include: [{
          model: User,
          attributes: ['id', 'name', 'email'],
        }, {
          model: Doctor,
          attributes: ['id', 'first_name', 'last_name', 'specialization', 'phone', 'user_id']
        }],
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Fetch doctor user separately if doctor exists
      let formattedAppointment = appointment.toJSON();
      if (appointment.Doctor && appointment.Doctor.user_id) {
        const doctorUser = await User.findByPk(appointment.Doctor.user_id, {
          attributes: ['id', 'name', 'email']
        });
        formattedAppointment.Doctor.User = doctorUser || null;
      }

      res.json(formattedAppointment);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      res.status(500).json({ error: 'Failed to fetch appointment' });
    }
  },

  // Get user's appointments
  async getUserAppointments(req, res) {
    try {
      const userId = req.params.userId || req.user.id;

      const appointments = await Appointment.findAll({
        where: { user_id: userId },
        include: [{
          model: Doctor,
          attributes: ['id', 'first_name', 'last_name', 'specialization', 'phone', 'user_id']
        }],
        order: [['scheduled_for', 'DESC']],
      });

      // Fetch doctor users separately
      const doctorUserIds = [...new Set(appointments.map(a => a.Doctor?.user_id).filter(Boolean))];
      const doctorUsers = await User.findAll({
        where: { id: doctorUserIds },
        attributes: ['id', 'name', 'email']
      });
      const doctorUserMap = Object.fromEntries(doctorUsers.map(u => [u.id, u]));

      // Format response with doctor user data
      const formattedAppointments = appointments.map(apt => ({
        ...apt.toJSON(),
        Doctor: apt.Doctor ? {
          ...apt.Doctor.toJSON(),
          User: doctorUserMap[apt.Doctor.user_id] || null
        } : null
      }));

      res.json(formattedAppointments);
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  },

  // Get doctor's appointments
  async getDoctorAppointments(req, res) {
    try {
      const doctorId = req.params.doctorId;

      const appointments = await Appointment.findAll({
        where: { doctor_id: doctorId },
        include: [{
          model: User,
          attributes: ['id', 'name', 'email'],
        }],
        order: [['scheduled_for', 'DESC']],
      });

      res.json(appointments);
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  },

  // Create appointment
  async createAppointment(req, res) {
    try {
      const appointmentData = {
        ...req.body,
        user_id: req.user.id,
      };

      // Check for conflicting appointments
      const existingAppointment = await Appointment.findOne({
        where: {
          doctor_id: appointmentData.doctor_id,
          scheduled_for: appointmentData.scheduled_for,
          status: {
            [Op.notIn]: ['CANCELLED', 'DECLINED'],
          },
        },
      });

      if (existingAppointment) {
        return res.status(400).json({ error: 'This time slot is already booked' });
      }

      const appointment = await Appointment.create(appointmentData);

      // Send notification to doctor
      const doctor = await Doctor.findByPk(appointmentData.doctor_id);
      if (doctor) {
        await Notification.create({
          user_id: doctor.user_id,
          sent_by_user_id: req.user.id,
          title: 'New Appointment Request',
          message: `You have a new appointment request for ${new Date(appointmentData.scheduled_for).toLocaleString()}`,
          notification_type: 'general_message',
        });
      }

      res.status(201).json(appointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'This time slot is already booked' });
      }
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  },

  // Update appointment
  async updateAppointment(req, res) {
    try {
      const appointmentId = req.params.id;
      const updates = req.body;

      const appointment = await Appointment.findByPk(appointmentId);

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      await appointment.update(updates);

      // If status changed, send notification
      if (updates.status) {
        let notificationMessage = '';
        let notificationType = 'general_message';

        switch (updates.status) {
          case 'CONFIRMED':
            notificationMessage = `Your appointment has been confirmed for ${new Date(appointment.scheduled_for).toLocaleString()}`;
            notificationType = 'appointment_confirmed';
            break;
          case 'DECLINED':
            notificationMessage = `Your appointment request has been declined`;
            notificationType = 'appointment_cancelled';
            break;
          case 'CANCELLED':
            notificationMessage = `Your appointment has been cancelled`;
            notificationType = 'appointment_cancelled';
            break;
        }

        if (notificationMessage) {
          await Notification.create({
            user_id: appointment.user_id,
            sent_by_user_id: req.user.id,
            title: 'Appointment Status Update',
            message: notificationMessage,
            notification_type: notificationType,
          });
        }
      }

      res.json(appointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ error: 'Failed to update appointment' });
    }
  },

  // Delete/Cancel appointment
  async deleteAppointment(req, res) {
    try {
      const appointmentId = req.params.id;

      const appointment = await Appointment.findByPk(appointmentId);

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Instead of deleting, mark as cancelled
      await appointment.update({ status: 'CANCELLED' });

      res.json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      res.status(500).json({ error: 'Failed to cancel appointment' });
    }
  },

  // Get available time slots for a doctor
  async getAvailableSlots(req, res) {
    try {
      const { doctorId, date } = req.query;

      if (!doctorId || !date) {
        return res.status(400).json({ error: 'Doctor ID and date are required' });
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookedAppointments = await Appointment.findAll({
        where: {
          doctor_id: doctorId,
          scheduled_for: {
            [Op.between]: [startOfDay, endOfDay],
          },
          status: {
            [Op.notIn]: ['CANCELLED', 'DECLINED'],
          },
        },
        attributes: ['scheduled_for'],
      });

      res.json({
        bookedSlots: bookedAppointments.map(a => a.scheduled_for),
      });
    } catch (error) {
      console.error('Error fetching available slots:', error);
      res.status(500).json({ error: 'Failed to fetch available slots' });
    }
  },

  // Get appointment receipt/invoice
  async getAppointmentReceipt(req, res) {
    const startTime = Date.now();
    const requestId = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const appointmentId = req.params.id;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      console.log(`\n📄 ==================== RECEIPT REQUEST [${requestId}] ====================`);
      console.log(`⏰ Time: ${new Date().toISOString()}`);
      console.log(`🆔 Appointment ID: ${appointmentId}`);
      console.log(`👤 User ID: ${userId}, Role: ${userRole}`);

      // Validate inputs
      if (!appointmentId || isNaN(appointmentId)) {
        console.error(`❌ Invalid appointment ID: ${appointmentId}`);
        return res.status(400).json({ 
          error: 'Invalid request',
          message: 'Valid appointment ID is required'
        });
      }

      if (!userId || !userRole) {
        console.error(`❌ Missing authentication data`);
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Fetch appointment first
      console.log(`🔍 Fetching appointment...`);
      const appointment = await Appointment.findByPk(appointmentId);

      if (!appointment) {
        console.error(`❌ Appointment ${appointmentId} not found in database`);
        return res.status(404).json({ 
          error: 'Not found',
          message: 'Appointment not found'
        });
      }

      console.log(`✅ Appointment found:`);
      console.log(`   Patient ID: ${appointment.user_id}`);
      console.log(`   Doctor ID: ${appointment.doctor_id}`);
      console.log(`   Status: ${appointment.status}`);
      console.log(`   Payment Status: ${appointment.payment_status}`);
      console.log(`   Amount: €${appointment.amount}`);

      // Authorization check
      console.log(`🔐 Checking authorization...`);
      const isPatient = appointment.user_id === userId;
      
      let isDoctor = false;
      if (userRole === 'doctor') {
        try {
          const doctorProfile = await Doctor.findOne({ where: { user_id: userId } });
          isDoctor = doctorProfile && doctorProfile.id === appointment.doctor_id;
          console.log(`   Doctor check: ${isDoctor ? 'Authorized' : 'Not authorized'}`);
        } catch (docError) {
          console.warn(`⚠️  Error checking doctor authorization:`, docError.message);
        }
      }
      
      const isAdmin = userRole === 'admin';
      const isAuthorized = isPatient || isDoctor || isAdmin;

      console.log(`   Patient: ${isPatient}, Doctor: ${isDoctor}, Admin: ${isAdmin}`);
      console.log(`   Result: ${isAuthorized ? '✅ Authorized' : '❌ Denied'}`);

      if (!isAuthorized) {
        console.error(`❌ Access denied for user ${userId} to appointment ${appointmentId}`);
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You do not have permission to view this receipt'
        });
      }

      // Check payment status
      if (appointment.payment_status !== 'paid') {
        console.warn(`⚠️  Receipt requested for unpaid appointment (status: ${appointment.payment_status})`);
        return res.status(400).json({ 
          error: 'Receipt not available',
          message: `Receipt is only available for paid appointments. Current status: ${appointment.payment_status}`
        });
      }

      // Fetch related data separately to avoid nested include issues
      console.log(`🔍 Fetching patient data...`);
      const patient = await User.findByPk(appointment.user_id, {
        attributes: ['id', 'name', 'email', 'phone', 'address']
      }).catch(err => {
        console.error(`❌ Error fetching patient:`, err.message);
        return null;
      });

      if (!patient) {
        console.warn(`⚠️  Patient ${appointment.user_id} not found`);
      } else {
        console.log(`✅ Patient found: ${patient.name}`);
      }

      console.log(`🔍 Fetching doctor data...`);
      const doctor = await Doctor.findByPk(appointment.doctor_id).catch(err => {
        console.error(`❌ Error fetching doctor:`, err.message);
        return null;
      });

      let doctorUser = null;
      if (doctor) {
        console.log(`✅ Doctor found, fetching user profile...`);
        doctorUser = await User.findByPk(doctor.user_id, {
          attributes: ['name', 'email']
        }).catch(err => {
          console.error(`❌ Error fetching doctor user:`, err.message);
          return null;
        });
        if (doctorUser) {
          console.log(`✅ Doctor user found: ${doctorUser.name}`);
        }
      } else {
        console.warn(`⚠️  Doctor ${appointment.doctor_id} not found`);
      }

      // Find clinical assessment (prescription/diagnosis)
      console.log(`🔍 Fetching clinical assessment...`);
      let clinicalAssessment = null;
      try {
        clinicalAssessment = await ClinicalAssessment.findOne({
          where: { appointment_id: appointmentId }
        });
        if (clinicalAssessment) {
          console.log(`✅ Clinical assessment found (ID: ${clinicalAssessment.id})`);
        } else {
          console.log(`ℹ️  No clinical assessment yet`);
        }
      } catch (err) {
        console.warn(`⚠️  Error fetching clinical assessment:`, err.message);
      }

      // Find payment history and bill details
      console.log(`🔍 Fetching payment and billing data...`);
      let paymentHistory = null;
      let bill = null;
      let billItems = [];

      if (appointment.stripe_session_id) {
        console.log(`   Looking for payment with session ID: ${appointment.stripe_session_id}`);
        try {
          paymentHistory = await PaymentHistory.findOne({
            where: { transactionRef: appointment.stripe_session_id }
          });

          if (paymentHistory) {
            console.log(`✅ Payment history found: €${paymentHistory.amount}`);
            
            if (paymentHistory.billId) {
              console.log(`   Fetching bill ${paymentHistory.billId}...`);
              bill = await Bill.findByPk(paymentHistory.billId);
              
              if (bill) {
                console.log(`✅ Bill found: €${bill.totalAmount}`);
                billItems = await BillItem.findAll({
                  where: { billId: bill.id }
                });
                console.log(`✅ Found ${billItems.length} bill items`);
              } else {
                console.warn(`⚠️  Bill ${paymentHistory.billId} not found`);
              }
            } else {
              console.warn(`⚠️  No bill ID in payment history`);
            }
          } else {
            console.warn(`⚠️  No payment history found for session ${appointment.stripe_session_id}`);
          }
        } catch (billError) {
          console.error(`❌ Error fetching bill details:`, billError.message);
          console.error(billError.stack);
          // Continue without bill details - graceful degradation
        }
      } else {
        console.warn(`⚠️  No Stripe session ID for appointment ${appointmentId}`);
      }

      // Build receipt data
      const receiptData = {
        // Receipt Info
        receipt_number: `RCP-${appointment.id}-${Date.now().toString().slice(-6)}`,
        receipt_date: appointment.paid_at || new Date(),
        
        // Appointment Details
        appointment: {
          id: appointment.id,
          scheduled_for: appointment.scheduled_for,
          status: appointment.status,
          department: appointment.department || 'General Consultation',
          reason: appointment.reason
        },

        // Patient Information
        patient: {
          name: patient?.name || 'N/A',
          email: patient?.email || 'N/A',
          phone: patient?.phone || 'N/A',
          address: patient?.address || 'N/A'
        },

        // Doctor Information
        doctor: {
          name: doctorUser?.name || 'N/A',
          email: doctorUser?.email || 'N/A',
          specialization: doctor?.specialization || 'General Physician'
        },

        // Payment Details
        payment: {
          amount: parseFloat(appointment.amount),
          currency: appointment.currency || 'EUR',
          payment_status: appointment.payment_status,
          payment_method: 'Online Payment (Stripe)',
          paid_at: appointment.paid_at,
          stripe_session_id: appointment.stripe_session_id,
          transaction_ref: paymentHistory?.transactionRef || appointment.stripe_session_id
        },

        // Bill Details (if available)
        bill: bill ? {
          id: bill.id,
          total_amount: parseFloat(bill.totalAmount),
          paid_amount: parseFloat(bill.paidAmount),
          bill_type: bill.billType,
          payment_method: bill.paymentMethod,
          payment_date: bill.paymentDate,
          items: billItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            amount: parseFloat(item.amount)
          }))
        } : null,

        // Payment History (if available)
        payment_history: paymentHistory ? {
          id: paymentHistory.id,
          amount: parseFloat(paymentHistory.amount),
          payment_method: paymentHistory.paymentMethod,
          transaction_ref: paymentHistory.transactionRef,
          payment_date: paymentHistory.created_at,
          notes: paymentHistory.notes
        } : null,

        // Clinical Assessment / Prescription (if available)
        clinical_assessment: clinicalAssessment ? {
          id: clinicalAssessment.id,
          clinical_notes: clinicalAssessment.clinical_notes,
          diagnosis: clinicalAssessment.diagnosis,
          therapy_prescribed: clinicalAssessment.therapy_prescribed || appointment.therapy_prescribed,
          treatment_plan: clinicalAssessment.treatment_plan,
          follow_up_instructions: clinicalAssessment.follow_up_instructions,
          follow_up_date: clinicalAssessment.follow_up_date,
          requires_admission: clinicalAssessment.requires_admission,
          status: clinicalAssessment.status,
          submitted_at: clinicalAssessment.submitted_at
        } : (appointment.therapy_prescribed || appointment.clinical_assessment) ? {
          // Fallback to appointment fields if assessment doesn't exist yet
          therapy_prescribed: appointment.therapy_prescribed,
          clinical_notes: appointment.clinical_assessment,
          requires_admission: appointment.requires_admission
        } : null,

        // Hospital/System Info
        issuer: {
          name: 'Hospital Management System',
          address: process.env.HOSPITAL_ADDRESS || 'Hospital Address',
          phone: process.env.HOSPITAL_PHONE || 'Hospital Phone',
          email: process.env.HOSPITAL_EMAIL || 'info@hospital.com'
        }
      };

      const elapsedTime = Date.now() - startTime;
      console.log(`✅ Receipt generated successfully for appointment ${appointmentId}`);
      console.log(`⏱️  Processing time: ${elapsedTime}ms`);
      console.log(`📄 ==================== END RECEIPT [${requestId}] ====================\n`);
      
      res.json(receiptData);
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      console.error(`\n🔥 ==================== RECEIPT ERROR [${requestId}] ====================`);
      console.error(`❌ Error Type: ${error.name}`);
      console.error(`❌ Error Message: ${error.message}`);
      console.error(`❌ Stack Trace:`);
      console.error(error.stack);
      console.error(`⏱️  Failed after: ${elapsedTime}ms`);
      console.error(`🔥 ====================================================================\n`);
      
      // Determine appropriate status code and message
      let statusCode = 500;
      let errorMessage = 'Failed to generate receipt';
      let userMessage = 'An unexpected error occurred while generating your receipt. Please try again later.';
      
      if (error.name === 'SequelizeDatabaseError') {
        errorMessage = 'Database error';
        userMessage = 'Database error occurred. Please contact support if this persists.';
      } else if (error.name === 'SequelizeConnectionError') {
        errorMessage = 'Database connection error';
        userMessage = 'Unable to connect to database. Please try again in a moment.';
      } else if (error.name === 'SequelizeValidationError') {
        statusCode = 400;
        errorMessage = 'Invalid data';
        userMessage = 'Invalid data encountered. Please contact support.';
      }
      
      res.status(statusCode).json({ 
        error: errorMessage,
        message: userMessage,
        requestId: requestId,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      });
    }
  },
};

module.exports = appointmentController;
