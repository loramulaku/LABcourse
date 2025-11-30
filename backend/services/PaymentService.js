/**
 * PaymentService - Handles all Stripe payment operations
 * 
 * This service encapsulates all payment-related business logic,
 * keeping controllers thin and maintaining clean MVC architecture.
 */

const Stripe = require('stripe');

class PaymentService {
  constructor() {
    this.stripe = null;
    this.webhookSecret = null;
    this.currency = 'eur';
    this.initialized = false;
    
    this.initialize();
  }

  /**
   * Initialize Stripe with API keys from environment
   */
  initialize() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    this.currency = process.env.STRIPE_CURRENCY || 'eur';

    if (!stripeKey) {
      console.warn('⚠️  STRIPE_SECRET_KEY not configured - payment features disabled');
      return;
    }

    if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
      console.error('❌ Invalid STRIPE_SECRET_KEY format');
      return;
    }

    try {
      this.stripe = new Stripe(stripeKey);
      const mode = stripeKey.startsWith('sk_test_') ? 'TEST' : 'LIVE';
      console.log(`✅ Stripe initialized (${mode} mode)`);
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Stripe:', error.message);
    }
  }

  /**
   * Check if Stripe is configured and ready
   */
  isConfigured() {
    return this.initialized && this.stripe !== null;
  }

  /**
   * Validate webhook secret configuration
   */
  validateWebhookSecret() {
    if (!this.webhookSecret) {
      return {
        valid: false,
        error: 'STRIPE_WEBHOOK_SECRET is not configured'
      };
    }

    if (this.webhookSecret === 'whsec_your_webhook_secret_here') {
      return {
        valid: false,
        error: 'STRIPE_WEBHOOK_SECRET is still a placeholder. Please configure a real webhook secret.'
      };
    }

    if (!this.webhookSecret.startsWith('whsec_')) {
      return {
        valid: false,
        error: 'STRIPE_WEBHOOK_SECRET has invalid format (should start with whsec_)'
      };
    }

    return { valid: true };
  }

  /**
   * Verify webhook signature
   * @param {Buffer} rawBody - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Verified event or error
   */
  verifyWebhookSignature(rawBody, signature) {
    const requestId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`\n🔔 ==================== STRIPE WEBHOOK [${requestId}] ====================`);
    console.log('⏰ Time:', new Date().toISOString());
    console.log('🔐 Verifying webhook signature...');

    if (!this.isConfigured()) {
      console.log('⚠️  Stripe not configured - skipping webhook');
      return { error: 'Stripe not configured', skip: true };
    }

    // Validate webhook secret
    const secretValidation = this.validateWebhookSecret();
    if (!secretValidation.valid) {
      console.error('❌ Webhook secret validation failed!');
      console.error('   Reason:', secretValidation.error);
      console.error('');
      console.error('📚 Setup Instructions:');
      console.error('   1. Install Stripe CLI: https://stripe.com/docs/stripe-cli');
      console.error('   2. Run: stripe login');
      console.error('   3. Run: stripe listen --forward-to localhost:5000/api/appointments/webhook');
      console.error('   4. Copy the webhook signing secret (starts with whsec_)');
      console.error('   5. Update STRIPE_WEBHOOK_SECRET in your .env file');
      console.error('   6. Restart your server');
      console.error('');
      return { error: secretValidation.error };
    }

    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return { error: 'Webhook signature missing' };
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );

      console.log('✅ Signature verified successfully');
      console.log('📦 Event type:', event.type);
      console.log('🆔 Event ID:', event.id);

      return { event, requestId };
    } catch (err) {
      console.error('❌ Webhook signature verification failed!');
      console.error('   Error:', err.message);
      console.error('   Signature:', signature.substring(0, 50) + '...');
      return { error: `Webhook signature verification failed: ${err.message}` };
    }
  }

  /**
   * Create a Stripe checkout session
   * @param {Object} params - Session parameters
   * @returns {Object} Checkout session
   */
  async createCheckoutSession({
    appointmentId,
    userId,
    doctorId,
    amount,
    scheduledFor,
    customerEmail,
    description,
    successUrl,
    cancelUrl,
    expiresInHours = 24
  }) {
    console.log('\n🔧 ==================== CREATE CHECKOUT SESSION ====================');
    console.log('⏰ Time:', new Date().toISOString());
    console.log('🆔 Appointment ID:', appointmentId);
    console.log('💰 Amount:', `€${amount}`);

    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured');
    }

    const amountInCents = Math.round(Number(amount) * 100);
    
    if (isNaN(amountInCents) || amountInCents <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    console.log('   Amount in cents:', amountInCents);
    console.log('   Customer email:', customerEmail);
    console.log('   Description:', description);

    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: this.currency,
            unit_amount: amountInCents,
            product_data: {
              name: 'Medical Appointment',
              description: description
            }
          },
          quantity: 1
        }],
        metadata: {
          appointment_id: String(appointmentId),
          user_id: String(userId),
          doctor_id: String(doctorId),
          scheduled_for: scheduledFor,
          amount: String(amount)
        },
        customer_email: customerEmail,
        success_url: successUrl,
        cancel_url: cancelUrl,
        expires_at: Math.floor(Date.now() / 1000) + (expiresInHours * 60 * 60)
      });

      console.log('✅ Checkout session created successfully');
      console.log('   Session ID:', session.id);
      console.log('   Payment URL:', session.url);
      console.log('   Expires at:', new Date(session.expires_at * 1000).toLocaleString());
      console.log('🔧 ==================== END CREATE SESSION ====================\n');

      return {
        sessionId: session.id,
        url: session.url,
        expiresAt: session.expires_at,
        expiresAtDate: new Date(session.expires_at * 1000)
      };
    } catch (error) {
      console.error('🔥 ==================== CREATE SESSION ERROR ====================');
      console.error('❌ Error:', error.message);
      console.error('❌ Stack:', error.stack);
      console.error('🔥 ==============================================================\n');
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  /**
   * Retrieve a checkout session from Stripe
   * @param {string} sessionId - Stripe session ID
   * @returns {Object} Session details
   */
  async retrieveSession(sessionId) {
    console.log('\n📞 Retrieving Stripe session:', sessionId);

    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured');
    }

    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      throw new Error('Invalid session ID');
    }

    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      
      console.log('✅ Session retrieved successfully');
      console.log('   Status:', session.status);
      console.log('   Payment status:', session.payment_status);
      console.log('   Amount:', `€${(session.amount_total / 100).toFixed(2)}`);

      return session;
    } catch (error) {
      if (error.code === 'resource_missing') {
        console.error('❌ Session not found or expired:', sessionId);
        throw new Error('Payment session not found or expired');
      }
      
      console.error('❌ Failed to retrieve session:', error.message);
      throw new Error(`Failed to retrieve session: ${error.message}`);
    }
  }

  /**
   * Check if a checkout session is still valid (open and not expired)
   * @param {string} sessionId - Stripe session ID
   * @returns {Object} Validation result
   */
  async isSessionValid(sessionId) {
    if (!sessionId) {
      return { valid: false, reason: 'No session ID provided' };
    }

    try {
      const session = await this.retrieveSession(sessionId);
      
      const isOpen = session.status === 'open';
      const notExpired = session.expires_at * 1000 > Date.now();
      
      if (isOpen && notExpired) {
        const timeRemaining = Math.floor((session.expires_at * 1000 - Date.now()) / 1000 / 60);
        return {
          valid: true,
          session,
          timeRemainingMinutes: timeRemaining
        };
      }

      return {
        valid: false,
        reason: !isOpen ? 'Session is not open' : 'Session has expired',
        session
      };
    } catch (error) {
      return {
        valid: false,
        reason: error.message
      };
    }
  }

  /**
   * Extract payment details from a Stripe session
   * @param {Object} session - Stripe checkout session
   * @returns {Object} Payment details
   */
  extractPaymentDetails(session) {
    return {
      sessionId: session.id,
      appointmentId: session.metadata?.appointment_id,
      userId: session.metadata?.user_id,
      doctorId: session.metadata?.doctor_id,
      amount: session.metadata?.amount || (session.amount_total / 100),
      amountCents: session.amount_total,
      currency: session.currency,
      paymentStatus: session.payment_status,
      status: session.status,
      customerEmail: session.customer_email,
      scheduledFor: session.metadata?.scheduled_for,
      receiptUrl: session.receipt_url,
      createdAt: new Date(session.created * 1000),
      expiresAt: new Date(session.expires_at * 1000),
      paymentIntentId: session.payment_intent
    };
  }

  /**
   * Calculate payment deadline from now
   * @param {number} hours - Hours from now
   * @returns {Date} Deadline date
   */
  calculatePaymentDeadline(hours = 24) {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hours);
    return deadline;
  }

  /**
   * Format amount for display
   * @param {number} amount - Amount in euros
   * @param {string} currency - Currency code
   * @returns {string} Formatted amount
   */
  formatAmount(amount, currency = null) {
    const curr = currency || this.currency;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr.toUpperCase()
    }).format(amount);
  }

  /**
   * Check if a payment is completed based on session
   * @param {Object} session - Stripe checkout session
   * @returns {boolean} True if payment is completed
   */
  isPaymentCompleted(session) {
    return session.payment_status === 'paid' && session.status === 'complete';
  }

  /**
   * Get configuration status for debugging
   * @returns {Object} Configuration status
   */
  getConfigurationStatus() {
    return {
      stripeConfigured: this.isConfigured(),
      webhookSecretConfigured: !!this.webhookSecret,
      webhookSecretValid: this.validateWebhookSecret().valid,
      currency: this.currency,
      mode: this.stripe ? (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE') : 'NOT_CONFIGURED'
    };
  }
}

// Export singleton instance
module.exports = new PaymentService();
