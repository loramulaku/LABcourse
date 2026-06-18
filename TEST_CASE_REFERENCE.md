# Manual Testing Reference — Hospital Management System
> Use this file as the ground truth for writing test cases (EP, BVA, Decision Table, State Transition).

---

## 1. VALIDATION RULES

### 1.1 Authentication

#### Registration (`POST /auth/signup`)
| Field | Required | Type | Constraints | Error (HTTP 400) |
|-------|----------|------|-------------|-----------------|
| name | Yes | string | max 100 chars | "Të gjitha fushat duhen" |
| email | Yes | string | max 150 chars, valid email format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), unique | "Email already exists" |
| password | Yes | string | min 6 characters | "Të gjitha fushat duhen" |
| role | No | ENUM | only `'user'` allowed on signup; doctors created by admin | — |

**Account Status** ENUM: `'active'`, `'pending'`, `'rejected'`, `'suspended'`  
- Inactive account login → **403** "Your account is {status}. Please contact admin."

#### Login (`POST /auth/login`)
| Scenario | HTTP | Message |
|----------|------|---------|
| Missing fields | 400 | — |
| Email not found | 400 | "Ska user me ketë email" |
| Wrong password | 400 | "Password gabim" |
| Inactive account | 403 | "Your account is {status}. Please contact admin." |

**Token lifetimes:** Access token `15m`, Refresh token `7d`, Password reset token `1h`

---

### 1.2 Appointments

#### Create Appointment (`POST /appointments/`)
| Field | Required | Type | Constraints | Error |
|-------|----------|------|-------------|-------|
| doctor_id | Yes | integer | doctor must exist | 400 "Invalid doctor_id format" |
| scheduled_for | Yes | ISO datetime | must be **≥ 5 minutes** in the future | 400 "Appointment must be scheduled at least 5 minutes in the future. Please select a later time slot." |
| reason | Yes | string | max **500 chars** | 400 |
| phone | No | string | max **20 chars** | — |
| notes | No | text | — | — |

**Availability rules:**
- Doctor must have `available === true` → 400 "Doctor is not currently accepting appointments"
- No duplicate `(doctor_id, scheduled_for)` with status `!== 'CANCELLED'` → 400 "TIME_SLOT_BOOKED"

**Payment:**
- Fee: `doctor.consultation_fee` or `doctor.fees`, fallback `60.00 EUR`
- Default amount stored: `20.00 EUR` (model default)
- Payment link valid for exactly **24 hours**

---

### 1.3 Therapy

#### Create Therapy (`POST /therapy/doctor/create`)
| Field | Required | Type | Constraints | Error |
|-------|----------|------|-------------|-------|
| appointment_id | Yes | integer | must exist | 400 "appointment_id, patient_id, and therapy_text are required" |
| patient_id | Yes | integer | must exist | 400 (same) |
| therapy_text | Yes | text | non-empty | 400 (same) |
| medications | No | text | — | — |
| dosage | No | string | max **255 chars** | — |
| frequency | No | string | max **255 chars** | — |
| duration | No | string | max **255 chars** | — |
| instructions | No | text | — | — |
| follow_up_date | No | date | — | — |
| therapy_type | No | string | max **100 chars** | — |
| start_date / end_date | No | date | — | — |
| priority | No | ENUM | `'low'`, `'medium'`, `'high'`, `'urgent'` — default `'medium'` | — |
| patient_notes / doctor_notes | No | text | — | — |

**Invalid status update** → 400 "Invalid status"

---

### 1.4 Laboratory / Patient Analysis

#### Upload Result (`POST /laboratory/dashboard/upload-result/:id`)
| Constraint | Value |
|-----------|-------|
| Max file size | **10 MB** (10 × 1024 × 1024 = **10,485,760 bytes**) |
| Allowed MIME type | `application/pdf` only |
| Error on wrong type | 400 "Only PDF files are allowed" |
| Error on missing file | 400 "PDF file is required" |

#### Create Analysis Type (`POST /laboratory/dashboard/my-analysis-types`)
| Field | Required | Notes |
|-------|----------|-------|
| name | Yes | max 255 chars — 400 "Name is required" if missing |
| description | No | text |
| normal_range | No | max 255 chars |
| unit | No | max 50 chars |
| price | No | DECIMAL(10,2), default 0.00 |

**Lab time slots:** 16 slots per day, 08:00–16:00 in 30-min intervals. Day is "fully booked" at 16 bookings.

---

### 1.5 Clinical Assessment

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| appointment_id | Yes | integer | unique — one assessment per appointment |
| doctor_id | Yes | integer | — |
| patient_id | Yes | integer | — |
| clinical_notes | Yes | text | non-empty |
| chief_complaint | No | string | max **500 chars** |
| diagnosis | No | text | — |
| vitals | No | JSON | keys: blood_pressure, heart_rate, temperature, respiratory_rate, oxygen_saturation, weight, height |
| requires_admission | No | boolean | — |
| follow_up_date | No | date | — |

**Status ENUM:** `'draft'`, `'submitted'`, `'locked'` — default `'draft'`  
- `is_locked = true` → cannot be modified

---

### 1.6 Billing (Admin only)

#### Create Bill (`POST /billing/bills`)
| Field | Required | Type |
|-------|----------|------|
| patientId | Yes | integer |
| totalAmount | Yes | DECIMAL(10,2) |
| items | Yes | array of `{ description, quantity, amount }` |
| billType | No | ENUM: `'consultation'`, `'treatment'`, `'lab_test'`, `'package'`, `'other'` — default `'other'` |
| notes | No | text |
| dueDate | No | date |

**Missing Bill:** 404 "Bill not found"

**Invoice Status ENUM:** `'draft'`, `'issued'`, `'paid'`, `'partially_paid'`, `'cancelled'`, `'refunded'`  
**Payment Status ENUM:** `'pending'`, `'completed'`, `'failed'`, `'refunded'`  
**Payment Method ENUM:** `'stripe'`, `'cash'`, `'card'`, `'insurance'`, `'other'`

---

### 1.7 IPD Admission

| Field | Required | Type |
|-------|----------|------|
| patient_id | Yes | integer |
| doctor_id | Yes | integer |
| ward_id | Yes | integer |
| room_id | Yes | integer |
| bed_id | Yes | integer |
| primary_diagnosis | Yes | text |
| admission_date | No | date — defaults to NOW |
| treatment_plan | No | text |
| discharge_date | No | date |

**Urgency ENUM:** `'Normal'`, `'Emergency'` — default `'Normal'`

---

## 2. STATUS TRANSITION RULES

### 2.1 Appointment Status
**Values:** `PENDING` → `APPROVED` → `CONFIRMED` → `COMPLETED`  
Side paths: any → `DECLINED`, any → `CANCELLED`

| Transition | Trigger | HTTP | Message |
|------------|---------|------|---------|
| → APPROVED | Doctor approves request | 200 | notification sent |
| APPROVED → CONFIRMED | Stripe payment succeeds | 200 | "Your appointment has been confirmed" |
| non-APPROVED → payment link | Any status except APPROVED | 400 | "Appointment is not in APPROVED status (current: {status})" |
| → DECLINED | Doctor declines | 200 | "Your appointment request has been declined" |
| → CANCELLED | Patient/admin cancels | 200 | "Your appointment has been cancelled" |
| → COMPLETED | Post-appointment | 200 | — |

**Payment status flow:**  
`unpaid` → `paid` (after Stripe) → `refunded` (manual)  
`unpaid` → `expired` (after 24h) | `failed` (Stripe failure)

---

### 2.2 Therapy Status
**Values:** `draft`, `pending`, `confirmed`, `active`, `on_hold`, `completed`, `cancelled`, `overdue`  
Default: `draft`

- Doctor can set any → any valid status
- Invalid value → 400 "Invalid status"
- Every change triggers patient notification: "Your therapy status has been updated to: {status}"

---

### 2.3 Patient Analysis / Lab Status
**Model values:** `unconfirmed`, `confirmed`, `pending_result`, `completed`, `cancelled`  
**Controller accepted values:** `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `pending_result`

| Transition | Trigger |
|------------|---------|
| → `pending_result` | Lab uploads PDF result |
| → `completed` | Lab submits final result |
| → `cancelled` | Lab or patient cancels |

Invalid status → 400 "Invalid status"

---

### 2.4 IPD Admission Status
**Values:** `Admitted` → `UnderCare` → `TransferRequested` | `DischargeRequested` → `Discharged`

| Transition | Meaning |
|------------|---------|
| Admitted → UnderCare | Treatment begins |
| UnderCare → TransferRequested | Ward transfer requested |
| UnderCare → DischargeRequested | Doctor approves discharge |
| DischargeRequested → Discharged | Patient discharged; `discharge_date` set |

---

## 3. ROLE-BASED ACCESS (Decision Table)

### 3.1 Middleware
| Middleware | Check | HTTP on Fail |
|-----------|-------|--------------|
| authenticateToken | Valid JWT in `Authorization: Bearer <token>` | 401 "Nuk ka token, login ose refresh" / 403 "Token i pavlefshëm ose skadoi" |
| isAdmin | `req.user.role === 'admin'` | 403 "Akses i ndaluar, duhet admin" |
| isDoctor / requireDoctor | `req.user.role === 'doctor'` | 403 "Doctor access required" |
| requireLab | `req.user.role === 'lab'` | 403 |

### 3.2 Action Matrix
| Action | patient | doctor | lab | admin | No Auth |
|--------|---------|--------|-----|-------|---------|
| Register / Login | ✓ | ✓ | ✓ | ✓ | ✓ |
| Book appointment | ✓ | — | — | — | 401 |
| Approve/update appointment | — | ✓ | — | ✓ | 401/403 |
| Submit clinical assessment | — | ✓ | — | — | 401/403 |
| Create therapy | — | ✓ | — | — | 401/403 |
| View own therapies | ✓ | — | — | — | 401 |
| Upload lab result | — | — | ✓ | — | 401/403 |
| Request analysis | ✓ | — | — | — | 401 |
| Create bill | — | — | — | ✓ | 401/403 |
| Mark bill paid | — | — | — | ✓ | 401/403 |
| Admit IPD patient | — | ✓ | — | ✓ | 401/403 |
| Broadcast notification | — | — | — | ✓ | 401/403 |
| View own notifications | ✓ | ✓ | ✓ | ✓ | 401 |

---

## 4. BOUNDARY VALUES

| Rule | Exact Value |
|------|-------------|
| Appointment min future time | **5 minutes** |
| Payment link expiry | **24 hours** |
| PDF upload max size | **10,485,760 bytes** (10 MB) |
| JWT access token TTL | **15 minutes** |
| JWT refresh token TTL | **7 days** |
| Password reset token TTL | **1 hour** |
| Lab time slots per day | **16** (08:00–16:00, 30-min intervals) |
| Default appointment amount | **20.00 EUR** |
| Default consultation fee | **60.00 EUR** |
| Password min length | **6 characters** |

### Character Limits
| Field | Limit |
|-------|-------|
| User name | 100 |
| User email | 150 |
| Appointment reason | 500 |
| Appointment phone | 20 |
| Chief complaint | 500 |
| Therapy dosage | 255 |
| Therapy frequency | 255 |
| Therapy duration | 255 |
| Therapy type | 100 |
| Analysis type name | 255 |
| Analysis type unit | 50 |
| Analysis type normal_range | 255 |
| Doctor specialization | 255 |
| Doctor license number | 50 |
| Stripe session ID | 255 |
| Payment link | 500 |
| Result PDF path | 500 |

---

## 5. API ENDPOINTS

### Authentication
| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| POST | /auth/signup | No | Public |
| POST | /auth/login | No | Public |
| POST | /auth/refresh | No | Public (cookie) |
| POST | /auth/logout | No | Public |
| POST | /auth/forgot-password | No | Public |
| POST | /auth/reset-password | No | Public |
| GET | /auth/me | Yes | Any |
| GET | /auth/navbar-info | Yes | Any |
| GET | /auth/validate-role | Yes | Any |
| GET | /auth/dashboard | Yes | Admin |

### Appointments
| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| POST | /appointments/ | Yes | Patient |
| GET | /appointments/my | Yes | Patient |
| POST | /appointments/create-checkout-session | Yes | Patient |
| POST | /appointments/regenerate-payment-link/:id | Yes | Patient (owner) |
| GET | /appointments/verify-payment/:sessionId | Yes | Patient (owner) |
| GET | /appointments/receipt/:id | Yes | Patient/Doctor/Admin |
| PUT | /appointments/:id | Yes | Doctor/Admin |
| DELETE | /appointments/:id | Yes | Patient/Doctor/Admin |
| GET | /appointments/ | No | Public |
| GET | /appointments/:id | No | Public |
| GET | /appointments/doctor/:doctorId | No | Public |
| GET | /appointments/slots/available | No | Public |
| GET | /appointments/user/:userId | Yes | Any |

### Therapy
| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| GET | /therapy/patient/dashboard | Yes | Patient |
| GET | /therapy/patient/stats | Yes | Patient |
| GET | /therapy/patient/upcoming-followups | Yes | Patient |
| POST | /therapy/doctor/create | Yes | Doctor |
| GET | /therapy/doctor/dashboard | Yes | Doctor |
| GET | /therapy/doctor/stats | Yes | Doctor |
| GET | /therapy/doctor/upcoming-followups | Yes | Doctor |
| GET | /therapy/doctor/status/:status | Yes | Doctor |
| GET | /therapy/doctor/calendar | Yes | Doctor |
| GET | /therapy/doctor/:id | Yes | Doctor |
| PATCH | /therapy/doctor/:id/status | Yes | Doctor |
| PUT | /therapy/doctor/:id | Yes | Doctor |
| DELETE | /therapy/doctor/:id | Yes | Doctor |

### Laboratory
| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| POST | /laboratory/request-analysis | Yes | Patient |
| GET | /laboratory/my-analyses | Yes | Patient |
| GET | /laboratory/dashboard/pending | Yes | Lab |
| GET | /laboratory/dashboard/confirmed | Yes | Lab |
| GET | /laboratory/dashboard/history | Yes | Lab |
| GET | /laboratory/dashboard/appointments | Yes | Lab |
| POST | /laboratory/dashboard/upload-result/:id | Yes | Lab |
| POST | /laboratory/dashboard/submit-result/:id | Yes | Lab |
| POST | /laboratory/dashboard/update-status/:id | Yes | Lab |
| POST | /laboratory/dashboard/mark-pending/:id | Yes | Lab |
| GET | /laboratory/dashboard/my-analysis-types | Yes | Lab |
| POST | /laboratory/dashboard/my-analysis-types | Yes | Lab |
| PUT | /laboratory/dashboard/my-analysis-types/:id | Yes | Lab |
| DELETE | /laboratory/dashboard/my-analysis-types/:id | Yes | Lab |
| GET | /laboratory/dashboard/me | Yes | Lab |
| PUT | /laboratory/dashboard/me | Yes | Lab |
| POST | /laboratory/ | Yes | Admin |
| PUT | /laboratory/:id | Yes | Admin |
| DELETE | /laboratory/:id | Yes | Admin |
| POST | /laboratory/analysis-types | Yes | Admin |
| GET | /laboratory/_dropdown/minimal | Yes | Admin |
| GET | /laboratory/ | No | Public |
| GET | /laboratory/:id | No | Public |
| GET | /laboratory/:id/analysis-types | No | Public |
| GET | /laboratory/:labId/available-slots/:date | No | Public |
| GET | /laboratory/:labId/monthly-status/:year/:month | No | Public |

### Clinical Assessment
| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| POST | /clinical-assessments/ | Yes | Doctor |
| GET | /clinical-assessments/:id | Yes | Doctor/Admin |
| PUT | /clinical-assessments/:id | Yes | Doctor |
| GET | /clinical-assessments/appointment/:appointmentId | Yes | Doctor/Patient |

### Patient Analysis
| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| GET | /patient-analyses/ | Yes | Patient |
| GET | /patient-analyses/my-analyses | Yes | Patient |
| GET | /patient-analyses/:id | Yes | Patient (owner) |
| POST | /patient-analyses/ | Yes | Patient |
| PUT | /patient-analyses/:id | Yes | Patient (owner) |
| PATCH | /patient-analyses/:id/cancel | Yes | Patient (owner) |

### Billing (All Admin only)
| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| GET | /billing/bills | Yes | Admin |
| GET | /billing/bills-all | Yes | Admin |
| GET | /billing/bills/:id | Yes | Admin |
| POST | /billing/bills | Yes | Admin |
| PATCH | /billing/bills/:id/mark-paid | Yes | Admin |
| POST | /billing/payments | Yes | Admin |
| GET | /billing/bills/:id/payments | Yes | Admin |

### Notifications
| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| GET | /notifications/my-notifications | Yes | Any |
| GET | /notifications/unread-count | Yes | Any |
| POST | /notifications/mark-read/:id | Yes | Any |
| POST | /notifications/mark-all-read | Yes | Any |
| GET | /notifications/my-messages | Yes | Any |
| POST | /notifications/mark-message-read/:id | Yes | Any |
| GET | /notifications/preferences | Yes | Any |
| POST | /notifications/preferences | Yes | Any |
| POST | /notifications/send-message | Yes | Admin |
| POST | /notifications/broadcast | Yes | Admin |

---

## 6. STANDARD ERROR RESPONSE FORMAT

```json
{
  "error": "Error message string"
}
```

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error / bad request / business rule violation |
| 401 | No token / not authenticated |
| 403 | Authenticated but wrong role |
| 404 | Resource not found or access denied |
| 500 | Internal server error |
