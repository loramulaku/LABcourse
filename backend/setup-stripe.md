# Stripe Setup for Payment Processing

To enable payment processing in your appointment booking system, follow these steps:

## 1. Create a Stripe Account

- Go to https://stripe.com
- Sign up for a free account
- Complete the account setup

## 2. Get Your API Keys

- Go to https://dashboard.stripe.com/apikeys
- Copy your **Publishable key** (starts with `pk_test_`)
- Copy your **Secret key** (starts with `sk_test_`)

## 3. Create .env File

Create a file called `.env` in the `backend` folder with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=menaxhimi_pacienteve

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m
REFRESH_SECRET=your-super-secret-refresh-key-here
REFRESH_EXPIRES_IN=1d

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 4. Replace the Keys

- Replace `sk_test_your_actual_stripe_secret_key_here` with your actual Stripe secret key
- The webhook secret is optional for basic testing

## 5. Test the Payment Flow

- Start your server: `node server.js`
- Try booking an appointment
- You should now be redirected to Stripe checkout

## Current Status

- ✅ Appointments table is working
- ✅ Authentication is working
- ✅ Payment fallback is working (appointments confirmed directly)
- ⚠️ Stripe integration requires API keys setup

## Testing Without Stripe

If you don't want to set up Stripe right now, the system will work by confirming appointments directly without payment processing.
