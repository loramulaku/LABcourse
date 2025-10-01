# 🔐 Complete Refresh Token Fix - Step-by-Step Guide

## ✅ What Was Fixed

### Backend Changes
1. ✅ Added `cookie-parser` middleware to read cookies
2. ✅ Added comprehensive logging to track token flow
3. ✅ Fixed logout to properly delete refresh token from database

### Frontend Changes
1. ✅ Created `useAuthInit` hook that runs on every page load
2. ✅ Automatically checks for refresh token if access token is missing
3. ✅ Generates new access token before app renders

---

## 🚀 CRITICAL: What You Must Do Now

### Step 1: Check Environment Variables

Your `backend/.env` file **MUST** have these variables:

```env
JWT_SECRET=put_a_long_random_secret_here
REFRESH_SECRET=put_a_different_long_random_secret_here
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

**⚠️ If you don't have a `.env` file in the backend folder:**

Create it now with those variables! The refresh token **WILL NOT WORK** without them.

### Step 2: Restart Backend Server

**This is CRITICAL!** The cookie-parser middleware only loads when the server starts.

```bash
# Stop your current server (Ctrl+C)
cd backend
npm start
```

**Watch for these messages:**
```
Server po punon në portën 5000
✅ Database tables check completed
```

### Step 3: Clear Browser Data

```bash
# In your browser:
1. Open DevTools (F12)
2. Go to Application tab
3. Clear all site data OR:
   - Delete all cookies for localhost
   - Clear all localStorage
   - Clear all sessionStorage
```

This ensures no old/corrupted tokens interfere with testing.

---

## 🧪 How to Test (Step by Step)

### Test 1: Verify Login Creates Tokens

1. **Go to login page** and enter your credentials

2. **Watch Backend Console** - you should see:
```
✅ Password match, generating tokens for user: X
🔑 Access token generated (expires in 15m )
🔑 Refresh token generated (expires in 7d )
✅ Refresh token stored in database
✅ Refresh token cookie set
📤 Sending login response with access token
```

3. **Open Browser DevTools** (F12) and check:
   - **Application → Local Storage** → `accessToken` should exist
   - **Application → Cookies** → `refreshToken` should exist (httpOnly)

4. **If you don't see these logs or the tokens:**
   - Backend server might not be restarted
   - .env file might be missing JWT_SECRET and REFRESH_SECRET
   - Check backend console for errors

---

### Test 2: Delete Access Token and Refresh Page

**This is YOUR MAIN REQUIREMENT!**

1. **Open DevTools** (F12) and go to Console tab

2. **Go to Application → Local Storage**

3. **Right-click `accessToken` → Delete**

4. **Keep both DevTools Console AND Backend Console visible**

5. **Press F5 to refresh the page**

6. **Frontend Console should show:**
```
🔄 No access token found, checking for refresh token...
✅ New access token obtained from refresh token
✅ Role restored: admin
```

7. **Backend Console should show:**
```
🔄 ===== REFRESH TOKEN REQUEST =====
📧 Cookies received: { refreshToken: 'eyJhbGc...' }
✅ Refresh token found in cookie
🔍 Checking database for token...
📊 Database lookup result: 1 rows found
✅ Refresh token found in database for user: X
🔐 Verifying JWT signature...
✅ JWT verified, payload: { id: X, ... }
✅ User found: X Role: admin
🔑 Generating new access token...
✅ New access token generated
🔄 Rotating refresh token...
✅ Old refresh token deleted from database
✅ New refresh token stored in database
✅ New refresh token cookie set
📤 Sending response with new access token and role: admin
===== REFRESH TOKEN SUCCESS =====
```

8. **Check Local Storage again** → `accessToken` should be there!

9. **You should still be logged in!**

---

## ❌ Troubleshooting

### Problem: "No refresh token found in cookies"

**Cause:** cookie-parser not working

**Fix:**
1. Check `backend/server.js` line 22 has `app.use(cookieParser());`
2. **Restart backend server** (this is the most common issue!)
3. Clear browser cookies and login again

---

### Problem: "Refresh token not found in database"

**Cause:** Token wasn't stored during login

**Check:**
1. Backend console during login - does it say "✅ Refresh token stored in database"?
2. Database query: `SELECT * FROM refresh_tokens;` - do you see any tokens?
3. Check table exists: `SHOW TABLES LIKE 'refresh_tokens';`

**Fix:**
- Make sure you're logged in AFTER restarting the server
- Old tokens from before the fix won't work - login again

---

### Problem: "JWT_SECRET not set" or "REFRESH_SECRET not set"

**Cause:** Missing environment variables

**Fix:**
1. Create `backend/.env` file if it doesn't exist
2. Add these lines:
```env
JWT_SECRET=your_super_secret_key_here_make_it_long
REFRESH_SECRET=another_different_secret_key_here
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```
3. **Restart backend server**

---

### Problem: Page redirects to login even with refresh token cookie

**Possible causes:**

1. **Frontend not updated** - Hard refresh (Ctrl+Shift+R)
2. **Server not restarted** - Restart backend
3. **CORS blocking cookies** - Check frontend URL matches backend CORS origins
4. **Old/corrupted tokens** - Clear all browser data and login again

---

## 🔍 Manual Test Script

Run this in **browser console** to test manually:

```javascript
// Check current state
console.log('Access Token:', localStorage.getItem('accessToken'));
console.log('Cookies:', document.cookie);

// Remove access token
localStorage.removeItem('accessToken');
console.log('✅ Access token deleted');

// Try to refresh
fetch('http://localhost:5000/api/auth/refresh', {
  method: 'POST',
  credentials: 'include'
})
.then(async res => {
  const data = await res.json();
  console.log('Response status:', res.status);
  console.log('Response data:', data);
  
  if (data.accessToken) {
    localStorage.setItem('accessToken', data.accessToken);
    if (data.role) localStorage.setItem('role', data.role);
    console.log('✅ SUCCESS! New access token stored:', data.accessToken.substring(0, 20) + '...');
  } else {
    console.error('❌ FAILED: No access token in response');
  }
})
.catch(err => console.error('❌ FAILED: Network error:', err));
```

**Expected output:**
```
Access Token: null
✅ Access token deleted
Response status: 200
Response data: { accessToken: "eyJhbGc...", role: "admin" }
✅ SUCCESS! New access token stored: eyJhbGciOiJIUzI1NiIs...
```

---

## 📋 Files Modified (Summary)

### Backend
- ✅ `backend/server.js` - Added cookie-parser
- ✅ `backend/routes/auth.js` - Added logging, fixed logout

### Frontend
- ✅ `frontend/src/hooks/useAuthInit.js` - NEW! Auto-refresh on page load
- ✅ `frontend/src/App.jsx` - Uses useAuthInit hook
- ✅ `frontend/src/components/Navbar.jsx` - Re-checks token on mount
- ✅ `frontend/src/api.js` - Already had refresh logic (kept as is)

---

## ✨ How It Works Now

### Scenario 1: Normal Page Load (has access token)
```
Page Load → useAuthInit checks localStorage →
Access token exists → Skip refresh → App renders
```

### Scenario 2: Page Load (no access token, has refresh token)
```
Page Load → useAuthInit checks localStorage →
No access token → Call /api/auth/refresh →
Backend reads refreshToken cookie →
Backend validates token in database →
Backend generates new access token →
Backend rotates refresh token →
Frontend stores new access token →
App renders with user logged in ✅
```

### Scenario 3: API Call (expired access token)
```
User clicks button → API call with expired token →
Server returns 401 → apiFetch intercepts →
Call /api/auth/refresh → Get new token →
Retry original API call → Success ✅
```

### Scenario 4: Logout
```
User clicks logout → Call /api/auth/logout →
Backend deletes refresh token from database →
Backend clears refresh token cookie →
Frontend clears access token from localStorage →
Redirect to login ✅
```

---

## 🎯 Summary

**Your requirement:**
> "If I delete the access token from localStorage and then refresh the page, it should automatically generate a new access token for me."

**Status: ✅ IMPLEMENTED**

The `useAuthInit` hook now runs **automatically on every page load** and:
1. Checks if access token exists
2. If not, calls `/api/auth/refresh` with refresh token cookie
3. Stores new access token
4. App renders with user authenticated

**What you need to do:**
1. ✅ Make sure `backend/.env` has JWT_SECRET and REFRESH_SECRET
2. ✅ **RESTART backend server**
3. ✅ Clear browser data
4. ✅ Login again
5. ✅ Test by deleting access token and refreshing

**If it still doesn't work after doing ALL the above steps**, please share:
- Backend console output during login
- Backend console output when refreshing page
- Frontend console output when refreshing page
- Any error messages

This will help diagnose exactly where the issue is!

