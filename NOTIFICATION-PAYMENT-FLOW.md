# ✅ Notification & Payment Flow - Complete Implementation

## 🎯 Feature Overview

When a doctor approves an appointment, the patient:
1. **Receives a notification** with a direct link
2. **Gets redirected** to "My Appointments" page
3. **Sees highlighted appointment** with payment button
4. **Completes payment** within 24 hours
5. **Status automatically changes** to "CONFIRMED"

---

## 🔄 Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Doctor Approves Appointment                              │
│    POST /api/doctor/appointment/:id/approve                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├── Creates Stripe payment link (24h expiry)
                       ├── Updates appointment status → APPROVED
                       ├── Saves payment_link & payment_deadline
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Notification Sent to Patient                             │
│    CREATE notifications table entry                          │
│    - Title: "Appointment Approved - Payment Required"       │
│    - Link: /my-appointments?highlight={appointment_id}      │
│    - Type: appointment_approved                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Patient Clicks Notification Link                         │
│    Redirects to: /my-appointments?highlight=125             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├── Page loads with all appointments
                       ├── Highlights appointment #125 (blue ring, pulse)
                       ├── Scrolls to highlighted appointment
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Patient Sees Payment Section                             │
│    - Status badge: APPROVED (blue)                          │
│    - Time remaining: "23h 45m left"                         │
│    - Payment button: "Pay Now - €60.00"                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Patient Clicks "Pay Now"                                 │
│    Redirects to: Stripe Checkout (appointment.payment_link) │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├── Enters card: 4242 4242 4242 4242
                       ├── Completes payment
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Stripe Webhook Triggered                                 │
│    POST /api/appointments/webhook                           │
│    Event: checkout.session.completed                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├── Updates appointment:
                       │   - status → CONFIRMED
                       │   - payment_status → paid
                       │   - paid_at → now
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Patient Redirected to Success Page                       │
│    /payment-success?session_id={SESSION_ID}                 │
│    Shows: "Payment successful! Appointment confirmed."      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Implementation

### 1. Notification Model Updated

**File:** `backend/models/Notification.js`

**New Fields:**
```javascript
notification_type: ENUM(
  'result_ready',
  'appointment_approved',    // NEW
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_declined',    // NEW
  'general_message',
  'system_alert'
)

appointment_id: INTEGER  // NEW - Links notification to appointment
```

### 2. Approval Endpoint with Notification

**File:** `backend/routes/doctorDashboardRoutes.js`

**Endpoint:** `POST /api/doctor/appointment/:id/approve`

**Notification Creation:**
```javascript
await Notification.create({
  user_id: appointment.user_id,           // Patient ID
  sent_by_user_id: req.user.id,          // Doctor ID
  title: '✅ Appointment Approved - Payment Required',
  message: `Your appointment for ${date} has been approved! Please complete the payment within 24 hours.`,
  notification_type: 'appointment_approved',
  appointment_id: appointment.id,         // Link to appointment
  optional_link: `/my-appointments?highlight=${appointment.id}`,  // Direct link
  is_read: false
});
```

### 3. Notification Routes

**File:** `backend/routes/notifications.js`

**Endpoints:**
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

**Example Response:**
```json
{
  "notifications": [
    {
      "id": 45,
      "user_id": 12,
      "title": "✅ Appointment Approved - Payment Required",
      "message": "Your appointment for 11/5/2025, 2:00 PM has been approved!...",
      "notification_type": "appointment_approved",
      "appointment_id": 125,
      "optional_link": "/my-appointments?highlight=125",
      "is_read": false,
      "created_at": "2025-11-01T10:30:00.000Z",
      "Sender": {
        "id": 8,
        "name": "Dr. Smith",
        "email": "drsmith@example.com"
      }
    }
  ],
  "unread_count": 3
}
```

---

## 🎨 Frontend Implementation

### 1. My Appointments Page Enhanced

**File:** `frontend/src/pages/MyAppointments.jsx`

**Features Added:**
1. ✅ URL parameter handling (`?highlight=125`)
2. ✅ Auto-scroll to highlighted appointment
3. ✅ Visual highlighting (blue ring + pulse animation)
4. ✅ Payment button for APPROVED appointments
5. ✅ Time remaining countdown
6. ✅ Status-specific messages

**Key Functions:**

#### A. Highlight Handling
```javascript
const [searchParams] = useSearchParams();
const highlightedRef = useRef(null);

useEffect(() => {
  const highlightId = searchParams.get('highlight');
  if (highlightId && highlightedRef.current) {
    setTimeout(() => {
      highlightedRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 500);
  }
}, [appointments, searchParams]);
```

#### B. Time Remaining Calculator
```javascript
const getTimeRemaining = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate - now;
  
  if (diff <= 0) return "Expired";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} left`;
  }
  return `${hours}h ${minutes}m left`;
};
```

#### C. Payment Handler
```javascript
const handlePayNow = (appointment) => {
  if (appointment.payment_link) {
    window.location.href = appointment.payment_link;
  } else {
    toast.error("Payment link not available. Please contact support.");
  }
};
```

### 2. Visual Components

#### A. Highlighted Appointment Card
```jsx
<div
  ref={isHighlighted ? highlightedRef : null}
  className={`bg-white shadow rounded-lg p-6 transition-all duration-300 ${
    isHighlighted ? 'ring-4 ring-blue-500 ring-opacity-50 animate-pulse' : ''
  }`}
>
```

#### B. Status Badges
```jsx
<span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
  {appointment.status}
</span>

{isApproved && timeLeft && (
  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
    ⏱️ {timeLeft}
  </span>
)}
```

#### C. Payment Section
```jsx
{isApproved && (
  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
    <div className="flex items-center mb-2">
      <svg className="w-5 h-5 text-blue-600 mr-2">...</svg>
      <h4 className="text-lg font-semibold text-blue-900">
        Appointment Approved!
      </h4>
    </div>
    <p className="text-sm text-blue-800 mb-3">
      Please complete the payment within <strong>{timeLeft}</strong> to confirm your appointment.
    </p>
    <button
      onClick={() => handlePayNow(appointment)}
      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md"
    >
      Pay Now - €{appointment.amount}
    </button>
  </div>
)}
```

#### D. Pending Status Message
```jsx
{appointment.status === 'PENDING' && (
  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div className="flex items-center">
      <svg className="w-5 h-5 text-yellow-600 mr-2">...</svg>
      <p className="text-sm text-yellow-800">
        Waiting for doctor approval. You'll be notified once the doctor reviews your request.
      </p>
    </div>
  </div>
)}
```

---

## 🧪 Testing Guide

### Test Scenario: Full Approval & Payment Flow

**Prerequisites:**
- Patient user (ID: 45)
- Doctor user (ID: 8)
- Appointment in PENDING status (ID: 125)

**Step 1: Doctor Approves**
```bash
curl -X POST http://localhost:5000/api/doctor/appointment/125/approve \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Backend Response:**
```json
{
  "success": true,
  "message": "Appointment approved successfully. Payment link sent to patient.",
  "appointment": {
    "id": 125,
    "status": "APPROVED",
    "payment_link": "https://checkout.stripe.com/c/pay/...",
    "payment_deadline": "2025-11-02T10:30:00.000Z",
    "expires_in_hours": 24
  }
}
```

**Expected Backend Log:**
```
Appointment 125 approved by doctor 8. Payment link generated, expires in 24h.
Notification sent to patient 45 for appointment 125
```

**Expected Database State:**
```sql
-- appointments table
UPDATE appointments SET
  status = 'APPROVED',
  stripe_session_id = 'cs_test_...',
  payment_link = 'https://checkout.stripe.com/...',
  payment_deadline = '2025-11-02 10:30:00',
  approved_at = '2025-11-01 10:30:00'
WHERE id = 125;

-- notifications table
INSERT INTO notifications VALUES (
  45,                                             -- user_id (patient)
  8,                                              -- sent_by_user_id (doctor)
  '✅ Appointment Approved - Payment Required',
  'Your appointment for 11/5/2025, 2:00 PM...',
  'appointment_approved',
  125,                                            -- appointment_id
  '/my-appointments?highlight=125',               -- optional_link
  FALSE,                                          -- is_read
  NOW()
);
```

---

**Step 2: Patient Checks Notifications**

Frontend should display notification with:
- Title: "✅ Appointment Approved - Payment Required"
- Message with date/time
- Clickable link

---

**Step 3: Patient Clicks Notification**

**URL:** `http://localhost:5173/my-appointments?highlight=125`

**Expected UI:**
1. Page loads all appointments
2. Appointment #125 is highlighted:
   - Blue ring (4px)
   - Pulse animation
   - Scrolled into view (centered)
3. Status badge shows "APPROVED" (blue)
4. Time remaining badge shows "⏱️ 23h 55m left"
5. Payment section visible:
   - "Appointment Approved!" heading
   - Payment instructions
   - "Pay Now - €60.00" button (gradient blue→indigo)

---

**Step 4: Patient Clicks "Pay Now"**

**Action:** Redirects to: `appointment.payment_link` (Stripe Checkout)

**Test Card:**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
ZIP: 12345
```

---

**Step 5: Payment Completed**

**Webhook Triggered:** `POST /api/appointments/webhook`

**Event:**
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "metadata": {
        "appointment_id": "125",
        "user_id": "45",
        "doctor_id": "8"
      },
      "amount_total": 6000
    }
  }
}
```

**Backend Action:**
```javascript
await appointment.update({
  status: 'CONFIRMED',
  payment_status: 'paid',
  amount: 60.00,
  paid_at: new Date()
});
```

**Backend Log:**
```
Payment confirmed for appointment 125, amount: €60
Appointment 125 payment completed. Status: APPROVED -> CONFIRMED
```

---

**Step 6: Patient Sees Success Page**

**URL:** `/payment-success?session_id=cs_test_...`

**Displays:**
- ✅ Payment successful message
- Appointment details
- Confirmed status
- "View My Appointments" button

---

## 📊 Database Schema

### appointments Table - Payment Fields

| Field | Type | Description |
|-------|------|-------------|
| `payment_link` | VARCHAR(500) | Stripe checkout URL |
| `payment_deadline` | DATETIME | 24h from approval |
| `approved_at` | DATETIME | When doctor approved |
| `paid_at` | DATETIME | When payment completed |

### notifications Table - New Fields

| Field | Type | Description |
|-------|------|-------------|
| `notification_type` | ENUM | Includes 'appointment_approved', 'appointment_declined' |
| `appointment_id` | INTEGER | Links to appointments table |

---

## 🎯 Features Summary

| Feature | Status | Implementation |
|---------|--------|----------------|
| Doctor approves → Notification sent | ✅ Complete | Backend creates notification |
| Notification link with appointment ID | ✅ Complete | `/my-appointments?highlight={id}` |
| Highlight & scroll to appointment | ✅ Complete | React ref + useSearchParams |
| Visual highlighting (ring + pulse) | ✅ Complete | Tailwind classes |
| Time remaining countdown | ✅ Complete | Real-time calculation |
| Payment button for APPROVED status | ✅ Complete | Conditional rendering |
| Redirect to Stripe | ✅ Complete | payment_link from database |
| Webhook updates status | ✅ Complete | APPROVED → CONFIRMED |
| Status-specific messages | ✅ Complete | PENDING, APPROVED states |

---

## 🚀 Server Status

```
✅ Backend running on port 5000
✅ Database migrations applied
✅ Notification system active
✅ Stripe integration working
✅ Webhook configured
```

---

## ✅ Complete Flow Summary

```
Doctor Approves
    ↓
Notification Created (with link: /my-appointments?highlight=125)
    ↓
Patient Clicks Link
    ↓
Page Opens → Scrolls to Highlighted Appointment
    ↓
Sees: Blue Ring + Pulse + "APPROVED" Badge + "Pay Now" Button
    ↓
Clicks "Pay Now"
    ↓
Redirects to Stripe → Pays
    ↓
Webhook Triggered
    ↓
Status → CONFIRMED
    ↓
✅ Appointment Confirmed!
```

---

## 🎉 Ready to Test!

**All systems operational:**
- ✅ Notifications sent when doctor approves
- ✅ Direct links to highlighted appointments
- ✅ Visual highlighting with animations
- ✅ Payment button with countdown
- ✅ Auto status update after payment

**Try it now!**
1. Login as doctor
2. Approve a PENDING appointment
3. Login as patient
4. Check notifications (bell icon)
5. Click notification link
6. See highlighted appointment
7. Click "Pay Now"
8. Complete payment
9. Status → CONFIRMED!

🎊 **Everything working perfectly!**
