#!/usr/bin/env node
/**
 * Stripe Webhook Testing Script
 * 
 * This script helps you test and debug Stripe webhooks locally.
 * 
 * Usage:
 *   node scripts/test-stripe-webhook.js [command]
 * 
 * Commands:
 *   check       - Check Stripe configuration and webhook setup
 *   test        - Send a test webhook event to your local server
 *   list        - List recent Stripe events
 *   session     - Get details of a specific checkout session
 */

require('dotenv').config();
const Stripe = require('stripe');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(70), 'cyan');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function checkConfiguration() {
  header('STRIPE CONFIGURATION CHECK');
  
  const checks = {
    stripeKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    clientOrigin: process.env.CLIENT_ORIGIN,
  };
  
  let allGood = true;
  
  // Check Stripe Secret Key
  if (!checks.stripeKey) {
    error('STRIPE_SECRET_KEY is not set');
    allGood = false;
  } else if (!checks.stripeKey.startsWith('sk_test_') && !checks.stripeKey.startsWith('sk_live_')) {
    error('STRIPE_SECRET_KEY has invalid format');
    log(`  Current value: ${checks.stripeKey.substring(0, 10)}...`, 'yellow');
    allGood = false;
  } else {
    const mode = checks.stripeKey.startsWith('sk_test_') ? 'TEST' : 'LIVE';
    success(`STRIPE_SECRET_KEY is set (${mode} mode)`);
    
    // Try to initialize Stripe
    try {
      const stripe = new Stripe(checks.stripeKey);
      await stripe.balance.retrieve();
      success('Stripe API connection successful');
    } catch (err) {
      error(`Stripe API connection failed: ${err.message}`);
      allGood = false;
    }
  }
  
  // Check Webhook Secret
  if (!checks.webhookSecret) {
    error('STRIPE_WEBHOOK_SECRET is not set');
    warning('Webhooks will not work without this!');
    info('To get your webhook secret:');
    console.log('  1. Go to https://dashboard.stripe.com/test/webhooks');
    console.log('  2. Click on your webhook endpoint');
    console.log('  3. Click "Reveal" next to "Signing secret"');
    console.log('  4. Copy the secret (starts with whsec_)');
    console.log('  5. Add it to your .env file');
    allGood = false;
  } else if (!checks.webhookSecret.startsWith('whsec_')) {
    error('STRIPE_WEBHOOK_SECRET has invalid format!');
    log(`  Current value: ${checks.webhookSecret}`, 'yellow');
    warning('This appears to be a placeholder value');
    info('Please replace it with a real webhook secret from Stripe dashboard');
    allGood = false;
  } else {
    success('STRIPE_WEBHOOK_SECRET is set and has correct format');
  }
  
  // Check Publishable Key
  if (!checks.publishableKey) {
    warning('STRIPE_PUBLISHABLE_KEY is not set (needed for frontend)');
  } else if (!checks.publishableKey.startsWith('pk_test_') && !checks.publishableKey.startsWith('pk_live_')) {
    error('STRIPE_PUBLISHABLE_KEY has invalid format');
    allGood = false;
  } else {
    success('STRIPE_PUBLISHABLE_KEY is set');
  }
  
  // Check Client Origin
  if (!checks.clientOrigin) {
    warning('CLIENT_ORIGIN is not set (using default: http://localhost:5173)');
  } else {
    success(`CLIENT_ORIGIN is set: ${checks.clientOrigin}`);
  }
  
  // Database check
  header('DATABASE CONNECTION CHECK');
  try {
    const { sequelize } = require('../models');
    await sequelize.authenticate();
    success('Database connection successful');
    
    // Check Appointment table
    const { Appointment } = require('../models');
    const count = await Appointment.count();
    success(`Appointment table accessible (${count} appointments found)`);
  } catch (err) {
    error(`Database connection failed: ${err.message}`);
    allGood = false;
  }
  
  // Webhook endpoint check
  header('WEBHOOK ENDPOINT CHECK');
  const backendUrl = process.env.VITE_API_URL || 'http://localhost:5000';
  const webhookUrl = `${backendUrl}/api/appointments/webhook`;
  info(`Your webhook endpoint should be: ${webhookUrl}`);
  info('Make sure this is registered in Stripe dashboard');
  
  // Check if webhook secret is still placeholder
  if (checks.webhookSecret === 'whsec_your_webhook_secret_here') {
    console.log('');
    warning('⚠️  WEBHOOK SECRET IS STILL A PLACEHOLDER!');
    console.log('');
    error('⛔ Payments will NOT work until you set a real webhook secret!');
    console.log('');
    info('To fix this:');
    console.log('  1. Install Stripe CLI: https://stripe.com/docs/stripe-cli');
    console.log('  2. Run: stripe login');
    console.log('  3. Run: stripe listen --forward-to localhost:5000/api/appointments/webhook');
    console.log('  4. Copy the webhook signing secret (whsec_xxx...)');
    console.log('  5. Replace STRIPE_WEBHOOK_SECRET in your .env file');
    console.log('  6. Restart your backend server');
    console.log('');
    allGood = false; // Mark as failed
  }
  
  // Summary
  header('SUMMARY');
  if (allGood) {
    success('All checks passed! Your Stripe configuration looks good.');
    info('Next steps:');
    console.log('  1. Make sure your server is running');
    console.log('  2. Use Stripe CLI to forward webhooks: stripe listen --forward-to localhost:5000/api/appointments/webhook');
    console.log('  3. Or configure webhooks in Stripe dashboard');
  } else {
    error('Some checks failed. Please fix the issues above.');
  }
  
  console.log('');
}

async function listRecentEvents() {
  header('RECENT STRIPE EVENTS');
  
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    error('Invalid or missing STRIPE_SECRET_KEY');
    return;
  }
  
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const events = await stripe.events.list({ limit: 10 });
    
    if (events.data.length === 0) {
      info('No events found');
      return;
    }
    
    console.log('');
    events.data.forEach((event, index) => {
      const date = new Date(event.created * 1000);
      const icon = event.type.includes('succeeded') || event.type.includes('completed') ? '✅' : 
                   event.type.includes('failed') ? '❌' : 'ℹ️';
      
      console.log(`${icon} [${index + 1}] ${event.type}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Created: ${date.toLocaleString()}`);
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log(`   Appointment ID: ${session.metadata?.appointment_id || 'N/A'}`);
        console.log(`   Amount: €${(session.amount_total / 100).toFixed(2)}`);
        console.log(`   Status: ${session.payment_status}`);
      }
      console.log('');
    });
  } catch (err) {
    error(`Failed to list events: ${err.message}`);
  }
}

async function getSessionDetails(sessionId) {
  header('CHECKOUT SESSION DETAILS');
  
  if (!sessionId) {
    error('Please provide a session ID');
    info('Usage: node scripts/test-stripe-webhook.js session <session_id>');
    return;
  }
  
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    error('Invalid or missing STRIPE_SECRET_KEY');
    return;
  }
  
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('');
    info(`Session ID: ${session.id}`);
    info(`Status: ${session.status}`);
    info(`Payment Status: ${session.payment_status}`);
    info(`Amount: €${(session.amount_total / 100).toFixed(2)}`);
    info(`Created: ${new Date(session.created * 1000).toLocaleString()}`);
    info(`Expires: ${new Date(session.expires_at * 1000).toLocaleString()}`);
    info(`Customer Email: ${session.customer_email}`);
    
    if (session.metadata) {
      console.log('\nMetadata:');
      Object.entries(session.metadata).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }
    
    if (session.payment_intent) {
      console.log(`\nPayment Intent: ${session.payment_intent}`);
    }
    
    console.log('');
  } catch (err) {
    error(`Failed to retrieve session: ${err.message}`);
  }
}

async function testWebhook() {
  header('TEST WEBHOOK');
  
  info('This feature requires Stripe CLI');
  info('Install: https://stripe.com/docs/stripe-cli');
  console.log('');
  info('To test webhooks locally:');
  console.log('  1. Run: stripe login');
  console.log('  2. Run: stripe listen --forward-to localhost:5000/api/appointments/webhook');
  console.log('  3. Copy the webhook signing secret (starts with whsec_)');
  console.log('  4. Update STRIPE_WEBHOOK_SECRET in your .env file');
  console.log('  5. In another terminal, trigger a test event:');
  console.log('     stripe trigger checkout.session.completed');
  console.log('');
  warning('Make sure your backend server is running on port 5000');
}

// Main execution
const command = process.argv[2] || 'check';
const arg = process.argv[3];

(async () => {
  try {
    switch (command) {
      case 'check':
        await checkConfiguration();
        break;
      case 'test':
        await testWebhook();
        break;
      case 'list':
        await listRecentEvents();
        break;
      case 'session':
        await getSessionDetails(arg);
        break;
      default:
        header('STRIPE WEBHOOK TESTING TOOL');
        console.log('\nUsage: node scripts/test-stripe-webhook.js [command] [args]\n');
        console.log('Commands:');
        console.log('  check         - Check Stripe configuration and setup');
        console.log('  test          - Show how to test webhooks with Stripe CLI');
        console.log('  list          - List recent Stripe events');
        console.log('  session <id>  - Get details of a specific checkout session\n');
        console.log('Examples:');
        console.log('  node scripts/test-stripe-webhook.js check');
        console.log('  node scripts/test-stripe-webhook.js list');
        console.log('  node scripts/test-stripe-webhook.js session cs_test_abc123\n');
    }
    process.exit(0);
  } catch (err) {
    error(`Unexpected error: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
})();
