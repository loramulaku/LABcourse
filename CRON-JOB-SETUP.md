# ⏰ Cron Job Setup - Auto-Cancel Expired Payments

## 🎯 Purpose

Automatically cancel appointments where:
- Status = `APPROVED`
- Payment status = `unpaid`
- Payment deadline has passed (>24 hours since approval)

---

## 🔧 Setup Options

### Option 1: External Cron Service (Recommended for Production)

**Services:**
- [cron-job.org](https://cron-job.org) - Free, easy setup
- [EasyCron](https://www.easycron.com) - Free tier available
- [Vercel Cron](https://vercel.com/docs/cron-jobs) - If deployed on Vercel

**Setup Steps:**

1. Add CRON_SECRET to `.env`:
```env
CRON_SECRET=your_super_secret_key_here_change_this
```

2. Configure cron job:
```
URL: https://your-domain.com/api/appointments/cron/cancel-expired
Method: POST
Schedule: Every hour (0 * * * *)
Headers: X-Cron-Secret: your_super_secret_key_here_change_this
```

3. Test endpoint:
```bash
curl -X POST https://your-domain.com/api/appointments/cron/cancel-expired \
  -H "X-Cron-Secret: your_super_secret_key_here_change_this"
```

---

### Option 2: Node-Cron (Built-in Scheduler)

**Install:**
```bash
npm install node-cron
```

**Create:** `backend/jobs/cancelExpiredAppointments.js`

```javascript
const cron = require('node-cron');
const { Appointment, Doctor, User } = require('../models');
const { Op } = require('sequelize');

// Run every hour
const scheduleExpiredAppointmentCancellation = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[CRON] Running expired appointment cancellation...');
      
      const now = new Date();

      // Find expired appointments
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
        console.log('[CRON] No expired appointments found.');
        return;
      }

      // Cancel each appointment
      for (const appointment of expiredAppointments) {
        await appointment.update({
          status: 'CANCELLED',
          payment_status: 'expired',
          cancelled_at: now
        });
        
        console.log(`[CRON] Cancelled appointment ${appointment.id} - payment expired`);
        
        // TODO: Send notifications
        // await sendEmail(appointment.User.email, 'Appointment Cancelled', ...);
        // await sendEmail(appointment.Doctor.User.email, 'Appointment Cancelled', ...);
      }

      console.log(`[CRON] Cancelled ${expiredAppointments.length} expired appointment(s)`);
    } catch (error) {
      console.error('[CRON] Error cancelling expired appointments:', error);
    }
  });

  console.log('✅ Cron job scheduled: Cancel expired appointments every hour');
};

module.exports = { scheduleExpiredAppointmentCancellation };
```

**Update:** `backend/server.js`

```javascript
// Add after database connection
const { scheduleExpiredAppointmentCancellation } = require('./jobs/cancelExpiredAppointments');

connectDatabase().then(() => {
  // Start cron jobs
  scheduleExpiredAppointmentCancellation();
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server po punon në portën ${PORT}`));
});
```

---

### Option 3: Windows Task Scheduler

**Create:** `cancel-expired.bat`

```batch
@echo off
curl -X POST http://localhost:5000/api/appointments/cron/cancel-expired ^
  -H "X-Cron-Secret: your_super_secret_key_here_change_this" ^
  -H "Content-Type: application/json"
```

**Setup Task Scheduler:**

1. Open Task Scheduler (`taskschd.msc`)
2. Create Basic Task
3. Name: "Cancel Expired Appointments"
4. Trigger: Hourly
5. Action: Start a program
6. Program: `C:\path\to\cancel-expired.bat`
7. Save and test

---

### Option 4: Linux Crontab

**Create:** `cancel-expired.sh`

```bash
#!/bin/bash
curl -X POST http://localhost:5000/api/appointments/cron/cancel-expired \
  -H "X-Cron-Secret: your_super_secret_key_here_change_this" \
  -H "Content-Type: application/json"
```

**Make executable:**
```bash
chmod +x cancel-expired.sh
```

**Add to crontab:**
```bash
crontab -e
```

**Add line:**
```
0 * * * * /path/to/cancel-expired.sh >> /var/log/cancel-expired.log 2>&1
```

---

## 🧪 Testing

### Manual Test

1. Create an appointment
2. Doctor approves it
3. Manually set payment_deadline in past:

```sql
UPDATE appointments 
SET payment_deadline = DATE_SUB(NOW(), INTERVAL 1 HOUR) 
WHERE id = 125 AND status = 'APPROVED';
```

4. Trigger cron job:

```bash
curl -X POST http://localhost:5000/api/appointments/cron/cancel-expired \
  -H "X-Cron-Secret: your_super_secret_key_here_change_this"
```

5. Check response:

```json
{
  "success": true,
  "message": "Auto-cancelled 1 expired appointment(s)",
  "cancelled_count": 1,
  "results": [
    {
      "appointment_id": 125,
      "patient_email": "patient@example.com",
      "doctor_email": "doctor@example.com",
      "scheduled_for": "2025-11-05T14:00:00.000Z"
    }
  ]
}
```

6. Verify in database:

```sql
SELECT id, status, payment_status, cancelled_at 
FROM appointments 
WHERE id = 125;
```

**Expected:**
```
status: CANCELLED
payment_status: expired
cancelled_at: 2025-11-02 12:00:00
```

---

## 📊 Monitoring

### Check Cron Logs

**Option 1 (External Service):**
- Check cron service dashboard
- View execution history
- Monitor success/failure rates

**Option 2 (Node-Cron):**
- Check server console output
- Look for `[CRON]` prefixed logs

**Option 3 (Task Scheduler):**
- Open Task Scheduler
- View "Last Run Result"
- Check history tab

---

## 🔒 Security

### Environment Variables

**.env:**
```env
# Cron job secret - Change this to a secure random string
CRON_SECRET=generate_random_secure_key_here

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### IP Whitelisting (Optional)

If using external cron service, whitelist their IPs in `server.js`:

```javascript
// Cron endpoint with IP whitelist
router.post("/cron/cancel-expired", (req, res, next) => {
  const allowedIPs = [
    '1.2.3.4',  // Your cron service IP
    '127.0.0.1' // Localhost for testing
  ];
  
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (!allowedIPs.includes(clientIP)) {
    return res.status(403).json({ error: 'IP not allowed' });
  }
  
  next();
}, async (req, res) => {
  // ... existing cron logic
});
```

---

## 📧 Notifications Integration

### Add Email Sending to Cron Job

**Install:**
```bash
npm install nodemailer
```

**Create:** `backend/utils/email.js`

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendAppointmentCancelledEmail = async (to, appointmentDetails) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: to,
    subject: 'Appointment Cancelled - Payment Expired',
    html: `
      <h2>Appointment Cancelled</h2>
      <p>Your appointment scheduled for ${appointmentDetails.scheduled_for} has been cancelled because payment was not completed within 24 hours.</p>
      <p>If you would like to reschedule, please book a new appointment.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};

module.exports = { sendAppointmentCancelledEmail };
```

**Update Cron Job:**

```javascript
const { sendAppointmentCancelledEmail } = require('../utils/email');

// After cancelling appointment
await sendAppointmentCancelledEmail(
  appointment.User.email,
  {
    scheduled_for: appointment.scheduled_for,
    doctor_name: appointment.Doctor.User.name
  }
);
```

---

## 🎯 Cron Schedule Recommendations

| Frequency | Cron Expression | Use Case |
|-----------|----------------|----------|
| **Every hour** | `0 * * * *` | Recommended for production |
| Every 30 minutes | `*/30 * * * *` | High-traffic sites |
| Every 4 hours | `0 */4 * * *` | Low-traffic sites |
| Daily at 2 AM | `0 2 * * *` | Maintenance window |

---

## 🐛 Troubleshooting

### Issue: Cron job not running

**Check:**
1. Is CRON_SECRET set correctly?
2. Is server URL correct?
3. Is cron schedule correct?
4. Check logs for errors

### Issue: No appointments cancelled

**Reasons:**
1. No expired appointments exist
2. payment_deadline not set correctly
3. Status not APPROVED

**Debug Query:**
```sql
SELECT id, status, payment_status, payment_deadline, approved_at
FROM appointments
WHERE status = 'APPROVED' 
  AND payment_status = 'unpaid' 
  AND payment_deadline < NOW();
```

### Issue: Authentication error

**Solutions:**
1. Verify CRON_SECRET matches
2. Check header name: `X-Cron-Secret`
3. Ensure no typos in secret key

---

## ✅ Setup Checklist

- [ ] Add CRON_SECRET to `.env`
- [ ] Choose cron option (external service, node-cron, etc.)
- [ ] Configure cron schedule (every hour recommended)
- [ ] Test with manual expired appointment
- [ ] Verify cancellation works
- [ ] Set up monitoring/logging
- [ ] Configure email notifications (optional)
- [ ] Document cron service credentials
- [ ] Set up alerts for cron failures

---

## 📚 Resources

**Cron Expression Generator:**
- https://crontab.guru

**External Cron Services:**
- https://cron-job.org
- https://www.easycron.com
- https://uptimerobot.com

**Node-Cron Documentation:**
- https://www.npmjs.com/package/node-cron

---

## 🚀 Production Deployment

### Vercel/Netlify

Use their built-in cron feature:

**`vercel.json`:**
```json
{
  "crons": [{
    "path": "/api/appointments/cron/cancel-expired",
    "schedule": "0 * * * *"
  }]
}
```

### Heroku

Use Heroku Scheduler addon:

```bash
heroku addons:create scheduler:standard
heroku addons:open scheduler
```

Add command:
```bash
curl -X POST https://your-app.herokuapp.com/api/appointments/cron/cancel-expired \
  -H "X-Cron-Secret: $CRON_SECRET"
```

### AWS Lambda

Create Lambda function triggered by CloudWatch Events (EventBridge).

---

## 🎉 Summary

✅ Cron job endpoint created: `/api/appointments/cron/cancel-expired`  
✅ Secret-based authentication implemented  
✅ Automatic cancellation of expired payments (24h)  
✅ Multiple setup options documented  
✅ Testing guide provided  
✅ Security best practices included  

**Choose your preferred cron option and set it up!**
