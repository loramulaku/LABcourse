const { Appointment, Doctor, User, Notification, Bill, BillItem, PaymentHistory } = require('../models');
const { Op } = require('sequelize');
const Stripe = require('stripe');

// Initialize Stripe
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
    console.log('✅ Stripe initialized successfully in appointment controller');
  } else {
    console.log('⚠️  Stripe not configured - appointments will be confirmed directly');
  }
} catch (error) {
  console.log('⚠️  Stripe initialization failed:', error.message);
  stripe = null;
}

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

  // Webhook to confirm payment
  async webhookHandler(req, res) {
    // Skip webhook processing if Stripe is not configured
    if (!stripe) {
      return res.json({ received: true, message: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    
    try {
      if (!endpointSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const appointmentId = session.metadata?.appointment_id;
        const paidAmount = session.metadata?.amount || (session.amount_total / 100);
        
        if (appointmentId) {
          console.log(`Payment confirmed for appointment ${appointmentId}, amount: €${paidAmount}`);
          
          const appointment = await Appointment.findByPk(appointmentId);
          
          if (appointment) {
            // Update appointment: APPROVED or PENDING -> CONFIRMED + PAID
            await appointment.update({
              status: 'CONFIRMED',
              payment_status: 'paid',
              amount: paidAmount,
              paid_at: new Date(),
              stripe_session_id: session.id
            });
            
            console.log(`Appointment ${appointmentId} payment completed. Status: ${appointment.status} -> CONFIRMED`);

            // Create a Bill for this paid appointment
            try {
              const existingPayment = await PaymentHistory.findOne({ 
                where: { transactionRef: session.id } 
              });
              
              if (!existingPayment) {
                const patientId = appointment.user_id;
                const doctor = await Doctor.findByPk(appointment.doctor_id, { 
                  include: [{ model: User, attributes: ['name'] }] 
                });
                const description = `Consultation${doctor?.User?.name ? ` with ${doctor.User.name}` : ''}`;

                const bill = await Bill.create({
                  patientId,
                  totalAmount: paidAmount,
                  paidAmount: paidAmount,
                  isPaid: true,
                  paymentMethod: 'online',
                  paymentDate: new Date(),
                  billType: 'consultation',
                  notes: `Generated from Stripe session ${session.id} for appointment ${appointmentId}`
                });

                await BillItem.create({
                  billId: bill.id,
                  description,
                  quantity: 1,
                  amount: paidAmount
                });

                await PaymentHistory.create({
                  billId: bill.id,
                  amount: paidAmount,
                  paymentMethod: 'online',
                  transactionRef: session.id,
                  notes: 'Stripe checkout.session.completed'
                });

                console.log(`✅ Bill ${bill.id} created for appointment ${appointmentId}`);
              } else {
                console.log(`ℹ️ Payment history already exists for session ${session.id}`);
              }
            } catch (billErr) {
              console.error('Error creating bill from Stripe payment:', billErr);
            }
          }
        }
      }
      res.json({ received: true });
    } catch (e) {
      console.error('Webhook handler error:', e);
      res.status(500).json({ error: 'Webhook handling failed' });
    }
  },

  // Regenerate payment link
  async regeneratePaymentLink(req, res) {
    try {
      const appointmentId = Number(req.params.id);
      console.log(`🔄 Regenerating payment link for appointment ${appointmentId}`);
      
      if (!stripe) {
        return res.status(400).json({ error: 'Stripe not configured' });
      }
      
      const appointment = await Appointment.findOne({ 
        where: { id: appointmentId, user_id: req.user.id } 
      });
      
      if (!appointment) {
        console.log(`❌ Appointment ${appointmentId} not found`);
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      // Check if already paid
      if (appointment.payment_status === 'paid' || appointment.status === 'CONFIRMED') {
        console.log(`✅ Appointment ${appointmentId} already paid`);
        return res.status(400).json({ 
          error: 'Appointment already paid', 
          already_paid: true 
        });
      }
      
      if (appointment.status !== 'APPROVED') {
        console.log(`⚠️  Appointment ${appointmentId} status is ${appointment.status}, not APPROVED`);
        return res.status(400).json({ error: 'Appointment is not in APPROVED status' });
      }
      
      const amountInCents = Math.round(Number(appointment.amount) * 100);
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            unit_amount: amountInCents,
            product_data: {
              name: 'Doctor Appointment',
              description: `Consultation on ${new Date(appointment.scheduled_for).toLocaleString()} - €${appointment.amount}`,
            },
          },
          quantity: 1,
        }],
        metadata: {
          appointment_id: String(appointment.id),
          user_id: String(appointment.user_id),
          doctor_id: String(appointment.doctor_id),
          scheduled_for: appointment.scheduled_for,
          amount: String(appointment.amount),
        },
        customer_email: req.user.email,
        success_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/payment-cancelled?appointment_id=${appointment.id}`,
        expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      });

      const paymentDeadline = new Date();
      paymentDeadline.setHours(paymentDeadline.getHours() + 24);

      await appointment.update({
        stripe_session_id: session.id,
        payment_link: session.url,
        payment_deadline: paymentDeadline,
      });

      console.log(`✅ New payment link generated for appointment ${appointmentId}`);
      console.log(`   Session ID: ${session.id}`);
      console.log(`   Expires: ${new Date(session.expires_at * 1000).toLocaleString()}`);

      res.json({ 
        success: true, 
        payment_link: session.url, 
        expires_at: session.expires_at,
        session_id: session.id
      });
    } catch (error) {
      console.error('Error regenerating payment link:', error);
      res.status(500).json({ error: 'Failed to regenerate payment link' });
    }
  },

  // Verify payment after Stripe checkout
  async verifyPayment(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (!stripe) {
        return res.status(400).json({ error: 'Stripe not configured' });
      }

      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Payment session not found' });
      }

      const appointmentId = session.metadata?.appointment_id;
      
      if (!appointmentId) {
        return res.status(400).json({ error: 'No appointment associated with this payment' });
      }

      // Get appointment details
      const appointment = await Appointment.findByPk(appointmentId, {
        include: [{
          model: Doctor,
          attributes: ['id', 'specialization'],
          include: [{
            model: User,
            attributes: ['name']
          }]
        }]
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Check if user owns this appointment
      if (appointment.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      res.json({
        success: true,
        appointment_id: appointment.id,
        payment_status: appointment.payment_status,
        status: appointment.status,
        amount: appointment.amount,
        scheduled_for: appointment.scheduled_for,
        doctor_name: appointment.Doctor?.User?.name,
        receipt_url: session.receipt_url
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ error: 'Failed to verify payment' });
    }
  },

  // Get my appointments (as patient)
  async getMyAppointments(req, res) {
    try {
      const appointments = await Appointment.findAll({
        where: { user_id: req.user.id },
        include: [{
          model: Doctor,
          attributes: ['id', 'specialization', 'image', 'consultation_fee'],
          include: [{
            model: User,
            attributes: ['name', 'email']
          }]
        }],
        order: [['scheduled_for', 'DESC']]
      });

      res.json(appointments);
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
          attributes: ['id', 'first_name', 'last_name', 'specialization'],
          include: [{
            model: User,
            attributes: ['name', 'email'],
          }],
        }],
        order: [['scheduled_for', 'DESC']],
      });

      res.json(appointments);
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
          attributes: ['id', 'first_name', 'last_name', 'specialization', 'phone'],
          include: [{
            model: User,
            attributes: ['name', 'email'],
          }],
        }],
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json(appointment);
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
          attributes: ['id', 'first_name', 'last_name', 'specialization', 'phone'],
          include: [{
            model: User,
            attributes: ['name', 'email'],
          }],
        }],
        order: [['scheduled_for', 'DESC']],
      });

      res.json(appointments);
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
};

module.exports = appointmentController;
