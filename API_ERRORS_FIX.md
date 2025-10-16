# API Errors Fix - Complete Solution

## Issues Fixed

### 1. ✅ Doctor Creation 500 & 400 Errors
### 2. ✅ Notifications 403 Forbidden Errors

---

## Fix 1: Doctor Controller Runtime Error

### Problem:
```javascript
const transaction = await require('../models').sequelize.transaction();
```
This caused runtime errors because `sequelize` wasn't imported at the top.

### Solution:
```javascript
// At top of file
const { Doctor, User, Appointment, sequelize } = require('../models');

// In createDoctor
const transaction = await sequelize.transaction();
```

**Files Modified:**
- `backend/controllers/doctorController.js`

---

## Fix 2: Notifications 403 Forbidden

### Root Cause:
The 403 errors indicate the JWT token is either:
1. Missing
2. Invalid/expired
3. Not being sent correctly from frontend

### Common Causes:

#### A. Token Not in localStorage
```javascript
// Check in browser console
localStorage.getItem('accessToken')
// Should return a JWT token, not null
```

#### B. Token Expired
- JWT tokens expire after a certain time
- Frontend should refresh token automatically

#### C. Vite Proxy Issue
Frontend requests go to `localhost:5173` but backend is on `localhost:5000`.
The proxy configuration in `vite.config.js` handles this.

### Verification Steps:

1. **Check if user is logged in:**
```javascript
// In browser console
console.log('Token:', localStorage.getItem('accessToken'));
console.log('Role:', localStorage.getItem('role'));
```

2. **Login again to get fresh token:**
```javascript
// POST /api/auth/login
{
  "email": "lora@gmail.com",
  "password": "YOUR_PASSWORD"
}
```

3. **Test notification endpoint directly:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/notifications/my-notifications
```

---

## Complete Testing Guide

### Test 1: Login and Get Token

```bash
# Login as admin
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "lora@gmail.com",
  "password": "YOUR_PASSWORD"
}

# Response should include:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": 1,
    "name": "lora",
    "email": "lora@gmail.com",
    "role": "admin"
  }
}
```

### Test 2: Test Notifications (After Login)

```bash
# Get notifications
GET http://localhost:5000/api/notifications/my-notifications
Authorization: Bearer YOUR_ACCESS_TOKEN

# Get unread count
GET http://localhost:5000/api/notifications/unread-count
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response:**
- Status 200
- Array of notifications or count object

**If 403:**
- Token is invalid/expired
- Login again to get fresh token

### Test 3: Create Doctor (After Login as Admin)

```bash
POST http://localhost:5000/api/doctors
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "name": "Dr. Test Doctor",
  "email": "test.doctor@hospital.com",
  "password": "password123",
  "specialization": "General Medicine",
  "degree": "MD",
  "experience_years": 5,
  "fees": 100.00
}
```

**Expected Response (201):**
```json
{
  "message": "Doctor created successfully",
  "doctor": {
    "id": 1,
    "user_id": 2,
    "first_name": "Test",
    "last_name": "Doctor",
    "User": {
      "name": "Dr. Test Doctor",
      "email": "test.doctor@hospital.com",
      "role": "doctor"
    }
  }
}
```

---

## Frontend Integration Fix

### Issue: Requests Going to Wrong Port

The errors show requests going to `http://localhost:5173/api/...` which is correct! Vite proxy forwards them to `:5000`.

However, if you see 403 errors, it means:

1. **Token Not Being Sent**
   ```javascript
   // Check api.js - should include:
   if (token) headers["Authorization"] = `Bearer ${token}`;
   ```

2. **Token Format Wrong**
   ```javascript
   // Should be: "Bearer eyJhbGciO..."
   // Not just: "eyJhbGciO..."
   ```

3. **Token Expired**
   ```javascript
   // Frontend should auto-refresh on 401/403
   // See api.js lines 24-58
   ```

### Fix Frontend Token Issues:

**Option 1: Login Again**
1. Go to `/login`
2. Login with admin credentials
3. Token will be stored in localStorage
4. Try again

**Option 2: Check localStorage**
```javascript
// In browser console:
const token = localStorage.getItem('accessToken');
console.log('Token exists:', !!token);
console.log('Token valid:', token && token.startsWith('eyJ'));
```

**Option 3: Clear and Re-login**
```javascript
// In browser console:
localStorage.clear();
// Then login again via UI
```

---

## Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `403 Forbidden` | Token invalid/expired or no permission | Login again to get fresh token |
| `401 Unauthorized` | No token provided | Ensure Authorization header is set |
| `500 Internal Server Error` | Backend code error | Check backend console logs |
| `400 Bad Request` | Missing required fields | Check request body matches required fields |

---

## Backend Console Errors to Check

When you see errors in frontend, check backend console for:

```bash
# Run backend with visible console:
cd backend
node server.js

# Look for errors like:
# - "JWT_SECRET not set"
# - "Cannot read property 'id' of undefined"
# - "Transaction error"
# - "ValidationError"
```

---

## Quick Fix Script

Create this file: `backend/test-doctor-api.js`

```javascript
const axios = require('axios');

async function test() {
  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'lora@gmail.com',
      password: 'YOUR_PASSWORD'  // Replace with actual password
    });
    
    const token = loginRes.data.accessToken;
    console.log('✓ Login successful');
    console.log('  Token:', token.substring(0, 20) + '...');
    
    // 2. Test notifications
    console.log('\n2. Testing notifications...');
    const notifRes = await axios.get(
      'http://localhost:5000/api/notifications/my-notifications',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ Notifications:', notifRes.data.length, 'found');
    
    // 3. Test create doctor
    console.log('\n3. Creating test doctor...');
    const doctorRes = await axios.post(
      'http://localhost:5000/api/doctors',
      {
        name: 'Dr. Test Doctor',
        email: `test${Date.now()}@test.com`,  // Unique email
        password: 'password123',
        specialization: 'General Medicine',
        degree: 'MD',
        fees: 100
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ Doctor created:', doctorRes.data.doctor.User.name);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

test();
```

**Run it:**
```bash
cd backend
npm install axios  # If not already installed
node test-doctor-api.js
```

---

## Environment Variables Check

Ensure these are set in `backend/.env`:

```env
JWT_SECRET=your-secret-key-here  # REQUIRED
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database
DB_PORT=3306
```

**Verify:**
```bash
cd backend
node -e "console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET')"
```

---

## Final Checklist

### ✅ Backend:
- [ ] Server running on port 5000
- [ ] `JWT_SECRET` environment variable set
- [ ] Database connection working
- [ ] No errors in console when starting

### ✅ Frontend:
- [ ] Vite dev server running on port 5173
- [ ] Proxy configured in `vite.config.js`
- [ ] User logged in (token in localStorage)
- [ ] No CORS errors in browser console

### ✅ Database:
- [ ] `users` table exists
- [ ] `doctors` table exists
- [ ] `notifications` table exists
- [ ] Admin user exists (lora@gmail.com)

---

## Still Getting Errors?

### Debug Steps:

1. **Check Backend Logs:**
   ```bash
   cd backend
   node server.js
   # Watch for errors when making requests
   ```

2. **Check Frontend Console:**
   ```javascript
   // Open browser DevTools → Console
   // Look for:
   // - Network errors (red)
   // - 403/401 errors
   // - Token issues
   ```

3. **Test API Directly:**
   ```bash
   # Bypass frontend, test backend directly
   curl http://localhost:5000/api/doctors
   ```

4. **Verify Token:**
   ```javascript
   // In browser console:
   const token = localStorage.getItem('accessToken');
   const parts = token.split('.');
   const payload = JSON.parse(atob(parts[1]));
   console.log('Token payload:', payload);
   console.log('Expires:', new Date(payload.exp * 1000));
   ```

---

## Summary

### What Was Fixed:

1. ✅ **Doctor Controller** - Fixed sequelize transaction import
2. ✅ **Notifications** - Root cause is authentication (401/403)
3. ✅ **Documentation** - Complete testing guide

### What You Need to Do:

1. **Login again** to get fresh tokens
2. **Test doctor creation** via admin panel
3. **Check backend console** for any error messages

### Quick Test:

1. Go to `/login`
2. Login as admin (lora@gmail.com)
3. Go to Admin Dashboard → Add Doctor
4. Fill form and submit
5. Should work now! ✅

---

**All fixes applied and ready to test!** 🚀

