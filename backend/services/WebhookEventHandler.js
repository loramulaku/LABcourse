/**
 * WebhookEventHandler - Handles all Stripe webhook events
 * 
 * This service processes different payment-related events from Stripe,
 * maintaining clean separation of concerns and proper error handling.
 */

const { Appointment, Doctor, User, Bill, BillItem, PaymentHistory } = require('../models');
const paymentService = require('./PaymentService');
const notificationService = require('./NotificationService');

class WebhookEventHandler {
  constructor() {
    // Map event types to handler methods
    this.eventHandlers = {
      'checkout.session.completed': this.handleCheckoutCompleted.bind(this),
      'checkout.session.expired': this.handleCheckoutExpired.bind(this),
      'payment_intent.succeeded': this.handlePaymentSucceeded.bind(this),
      'payment_intent.payment_failed': this.handlePaymentFailed.bind(this),
      'charge.refunded': this.handleChargeRefunded.bind(this),
      'charge.failed': this.handleChargeFailed.bind(this),
    };
  }

  /**
   * Process a webhook event
   * @param {Object} event - Stripe event object
   * @param {string} requestId - Unique request ID for logging
   * @returns {Promise<Object>} Processing result
   */
  async processEvent(event, requestId) {
    console.log(`\n📨 Processing event: ${event.type}`);
    console.log(`🆔 Event ID: ${event.id}`);
    console.log(`🔖 Request ID: ${requestId}`);

    const handler = this.eventHandlers[event.type];

    if (handler) {
      try {
        const result = await handler(event);
        console.log(`✅ Event ${event.type} processed successfully`);
        return { success: true, result };
      } catch (error) {
        console.error(`❌ Error processing ${event.type}:`, error.message);
        throw error;
      }
    } else {
      console.log(`ℹ️  No handler for event type: ${event.type}`);
      return { success: true, message: 'Event type not handled', skipped: true };
    }
  }

  /**
   * Handle checkout.session.completed
   * Fires when customer completes payment
   */
  async handleCheckoutCompleted(event) {
    const session = event.data.object;
    const paymentDetails = paymentService.extractPaymentDetails(session);
    
    console.log('💳 Checkout Session Completed:');
    console.log('   Session ID:', paymentDetails.sessionId);
    console.log('   Appointment ID:', paymentDetails.appointmentId);
    console.log('   Amount:', paymentService.formatAmount(paymentDetails.amount));
    console.log('   Customer:', paymentDetails.customerEmail);

    if (!paymentDetails.appointmentId) {
      console.error('❌ No appointment_id in session metadata');
      return { warning: 'No appointment_id in metadata' };
    }

    // IDEMPOTENCY CHECK
    const isDuplicate = await this.checkDuplicatePayment(paymentDetails.sessionId);
    if (isDuplicate) {
      console.log('⚠️  Payment already processed (idempotency check)');
      return { message: 'Payment already processed', duplicate: true };
    }

    // Process the payment
    return await this.processSuccessfulPayment(paymentDetails, event.id);
  }

  /**
   * Handle checkout.session.expired
   * Fires when checkout session expires without payment
   */
  async handleCheckoutExpired(event) {
    const session = event.data.object;
    const appointmentId = session.metadata?.appointment_id;

    console.log('⏰ Checkout Session Expired:');
    console.log('   Session ID:', session.id);
    console.log('   Appointment ID:', appointmentId);

    if (!appointmentId) {
      return { warning: 'No appointment_id in metadata' };
    }

    const appointment = await Appointment.findByPk(appointmentId);
    
    if (!appointment) {
      console.error(`❌ Appointment ${appointmentId} not found`);
      return { error: 'Appointment not found' };
    }

    // Only update if not already paid
    if (appointment.payment_status === 'paid') {
      console.log('ℹ️  Appointment already paid, ignoring expiry');
      return { message: 'Appointment already paid' };
    }

    console.log('📝 Marking payment link as expired');
    
    await appointment.update({
      payment_status: 'expired',
      payment_link: null, // Clear expired link
      stripe_session_id: null
    });

    // Notify patient
    await this.sendNotification({
      user_id: appointment.user_id,
      title: '⏰ Payment Link Expired',
      message: 'Your payment link has expired. Please request a new payment link from your appointments page.',
      notification_type: 'payment_expired',
      appointment_id: appointmentId,
      optional_link: `/my-appointments?highlight=${appointmentId}`
    });

    console.log('✅ Session expiry processed');
    return { message: 'Session expired, appointment updated' };
  }

  /**
   * Handle payment_intent.succeeded
   * Fires when payment is successfully processed (backup/confirmation)
   */
  async handlePaymentSucceeded(event) {
    const paymentIntent = event.data.object;
    
    console.log('💰 Payment Intent Succeeded:');
    console.log('   Payment Intent ID:', paymentIntent.id);
    console.log('   Amount:', paymentService.formatAmount(paymentIntent.amount / 100));
    console.log('   Status:', paymentIntent.status);

    // Extract appointment ID from metadata if available
    const appointmentId = paymentIntent.metadata?.appointment_id;
    
    if (appointmentId) {
      console.log('   Appointment ID:', appointmentId);
      
      // Verify appointment is confirmed
      const appointment = await Appointment.findByPk(appointmentId);
      if (appointment && appointment.payment_status !== 'paid') {
        console.log('⚠️  Payment succeeded but appointment not marked paid - updating now');
        
        await appointment.update({
          status: 'CONFIRMED',
          payment_status: 'paid',
          paid_at: new Date()
        });
      }
    }

    return { message: 'Payment intent processed' };
  }

  /**
   * Handle payment_intent.payment_failed
   * Fires when payment attempt fails
   */
  async handlePaymentFailed(event) {
    const paymentIntent = event.data.object;
    const appointmentId = paymentIntent.metadata?.appointment_id;

    console.log('❌ Payment Failed:');
    console.log('   Payment Intent ID:', paymentIntent.id);
    console.log('   Appointment ID:', appointmentId);
    console.log('   Error:', paymentIntent.last_payment_error?.message || 'Unknown error');

    if (!appointmentId) {
      return { warning: 'No appointment_id in metadata' };
    }

    const appointment = await Appointment.findByPk(appointmentId);
    
    if (!appointment) {
      return { error: 'Appointment not found' };
    }

    // Update payment status to failed
    await appointment.update({
      payment_status: 'failed',
      payment_failure_reason: paymentIntent.last_payment_error?.message || 'Payment declined'
    });

    // Notify patient
    await this.sendNotification({
      user_id: appointment.user_id,
      title: '❌ Payment Failed',
      message: 'Your payment could not be processed. Please try again or use a different payment method.',
      notification_type: 'payment_failed',
      appointment_id: appointmentId,
      optional_link: `/my-appointments?highlight=${appointmentId}`
    });

    console.log('✅ Payment failure processed');
    return { message: 'Payment failure handled' };
  }

  /**
   * Handle charge.refunded
   * Fires when a charge is refunded
   */
  async handleChargeRefunded(event) {
    const charge = event.data.object;
    const refundAmount = charge.amount_refunded / 100;

    console.log('💸 Charge Refunded:');
    console.log('   Charge ID:', charge.id);
    console.log('   Refund Amount:', paymentService.formatAmount(refundAmount));
    console.log('   Payment Intent:', charge.payment_intent);

    // Find the payment in our system
    const paymentHistory = await PaymentHistory.findOne({
      where: { transactionRef: charge.payment_intent }
    });

    if (paymentHistory) {
      const bill = await Bill.findByPk(paymentHistory.billId, {
        include: [{ model: BillItem }]
      });

      if (bill) {
        console.log('📄 Found associated bill:', bill.id);
        
        // Update bill to reflect refund
        await bill.update({
          paidAmount: bill.paidAmount - refundAmount,
          isPaid: bill.paidAmount - refundAmount >= bill.totalAmount
        });

        // Create refund record in payment history
        await PaymentHistory.create({
          billId: bill.id,
          amount: -refundAmount, // Negative amount for refund
          paymentMethod: 'online',
          transactionRef: charge.id,
          notes: `Refund from Stripe charge ${charge.id}`
        });

        // Find related appointment
        const appointment = await Appointment.findOne({
          where: { stripe_session_id: charge.payment_intent }
        });

        if (appointment) {
          await appointment.update({
            payment_status: 'refunded',
            status: 'CANCELLED'
          });

          // Notify patient
          await this.sendNotification({
            user_id: appointment.user_id,
            title: '💸 Payment Refunded',
            message: `Your payment of ${paymentService.formatAmount(refundAmount)} has been refunded. Your appointment has been cancelled.`,
            notification_type: 'payment_refunded',
            appointment_id: appointment.id,
            optional_link: `/my-appointments?highlight=${appointment.id}`
          });
        }

        console.log('✅ Refund processed successfully');
      }
    } else {
      console.log('⚠️  No payment history found for this charge');
    }

    return { message: 'Refund processed' };
  }

  /**
   * Handle charge.failed
   * Fires when a charge fails
   */
  async handleChargeFailed(event) {
    const charge = event.data.object;
    
    console.log('❌ Charge Failed:');
    console.log('   Charge ID:', charge.id);
    console.log('   Failure Code:', charge.failure_code);
    console.log('   Failure Message:', charge.failure_message);

    // Similar to payment_failed handling
    return { message: 'Charge failure logged' };
  }

  /**
   * Process a successful payment (shared logic)
   * @private
   */
  async processSuccessfulPayment(paymentDetails, eventId) {
    const { appointmentId, sessionId, amount, customerEmail } = paymentDetails;

    console.log('💾 Processing successful payment...');

    // Fetch appointment
    const appointment = await Appointment.findByPk(appointmentId, {
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });

    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    console.log('✅ Appointment found:', appointment.id);
    console.log('   Current status:', appointment.status);
    console.log('   Current payment status:', appointment.payment_status);

    // Check if already paid (race condition protection)
    if (appointment.payment_status === 'paid') {
      console.log('⚠️  Appointment already paid, skipping');
      return { message: 'Appointment already paid', duplicate: true };
    }

    // Update appointment
    await appointment.update({
      status: 'CONFIRMED',
      payment_status: 'paid',
      amount: amount,
      paid_at: new Date(),
      stripe_session_id: sessionId
    });

    console.log('✅ Appointment updated to CONFIRMED & PAID');

    // Create billing records
    const billingResult = await this.createBillingRecords({
      appointmentId,
      patientId: appointment.user_id,
      doctorId: appointment.doctor_id,
      amount,
      sessionId,
      eventId
    });

    console.log('✅ Billing records created:', billingResult.billId);

    // Send notification
    await this.sendPaymentConfirmationNotification(appointment, amount);

    console.log('🎉 Payment processing complete!');

    return {
      message: 'Payment processed successfully',
      appointmentId,
      billId: billingResult.billId
    };
  }

  /**
   * Create billing records for a payment
   * @private
   */
  async createBillingRecords({ appointmentId, patientId, doctorId, amount, sessionId, eventId }) {
    console.log('📄 Creating billing records...');

    // Get doctor details
    const doctor = await Doctor.findByPk(doctorId, {
      include: [{ model: User, attributes: ['name'] }]
    });
    const doctorName = doctor?.User?.name || 'Unknown Doctor';

    // Create bill
    const bill = await Bill.create({
      patientId,
      totalAmount: amount,
      paidAmount: amount,
      isPaid: true,
      paymentMethod: 'online',
      paymentDate: new Date(),
      billType: 'consultation',
      notes: `Generated from Stripe session ${sessionId} for appointment ${appointmentId}`
    });

    // Create bill item
    await BillItem.create({
      billId: bill.id,
      description: `Consultation with ${doctorName}`,
      quantity: 1,
      amount: amount
    });

    // Create payment history
    await PaymentHistory.create({
      billId: bill.id,
      amount: amount,
      paymentMethod: 'online',
      transactionRef: sessionId,
      notes: `Stripe event: checkout.session.completed (${eventId})`
    });

    console.log('✅ Billing records created');

    return { billId: bill.id };
  }

  /**
   * Send payment confirmation notification
   * @private
   */
  async sendPaymentConfirmationNotification(appointment, amount) {
    try {
      const doctor = await Doctor.findByPk(appointment.doctor_id, {
        include: [{ model: User, attributes: ['name'] }]
      });
      const doctorName = doctor?.User?.name || 'your doctor';

      await notificationService.createNotificationHelper({
        userId: appointment.user_id,
        title: '✅ Payment Confirmed - Appointment Booked!',
        message: `Your payment of ${paymentService.formatAmount(amount)} has been confirmed. Your appointment with ${doctorName} is now confirmed for ${new Date(appointment.scheduled_for).toLocaleString()}.`,
        type: 'payment_confirmed',
        appointmentId: appointment.id,
        optionalLink: `/my-appointments?highlight=${appointment.id}`,
      });

      console.log('✅ Notification sent to patient');
    } catch (error) {
      console.error('⚠️  Failed to send notification:', error.message);
    }
  }

  /**
   * Send a notification to a user
   * @private
   */
  async sendNotification({ user_id, title, message, notification_type, appointment_id, optional_link }) {
    try {
      await notificationService.createNotificationHelper({
        userId: user_id,
        title,
        message,
        type: notification_type,
        appointmentId: appointment_id,
        optionalLink: optional_link,
      });
      console.log('✅ Notification sent');
    } catch (error) {
      console.error('⚠️  Failed to send notification:', error.message);
    }
  }

  /**
   * Check if payment has already been processed (idempotency)
   * @private
   */
  async checkDuplicatePayment(sessionId) {
    const existingPayment = await PaymentHistory.findOne({
      where: { transactionRef: sessionId }
    });

    if (existingPayment) {
      console.log(`⚠️  DUPLICATE: Payment already exists for session ${sessionId}`);
      console.log('   Payment ID:', existingPayment.id);
      console.log('   Bill ID:', existingPayment.billId);
      return true;
    }

    return false;
  }

  /**
   * Get supported event types
   */
  getSupportedEvents() {
    return Object.keys(this.eventHandlers);
  }
}

// Export singleton instance
module.exports = new WebhookEventHandler();
