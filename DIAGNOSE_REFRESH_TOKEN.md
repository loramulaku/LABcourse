# 🔍 Diagnose Refresh Token Issue - Step by Step

## Step 1: Restart Backend Server (CRITICAL!)

```bash
# Stop current server (Ctrl+C)
cd backend
npm start
```

**Wait for:** `Server po punon në portën 5000`

---

## Step 2: Clear ALL Browser Data

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **"Clear site data"** button
4. Refresh page

This ensures no old cookies/tokens interfere.

---

## Step 3: Fresh Login

1. Go to your login page
2. Enter credentials and login
3. **Watch BOTH consoles**

### Expected Backend Console Output:
```
✅ Password match, generating tokens for user: X
🔑 Access token generated (expires in 15m )
🔑 Refresh token generated (expires in 7d )
✅ Refresh token stored in database
🍪 Setting refresh cookie with options: { 
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 604800000,
  tokenLength: 200+ 
}
✅ Refresh token cookie set
📤 Sending login response with access token
```

### Check Browser DevTools:
1. **Application → Cookies → http://localhost:5173**
2. **Look for:** `refreshToken` cookie
3. **Should see:**
   - Name: `refreshToken`
   - Value: (long JWT string starting with `eyJ...`)
   - Domain: `localhost`
   - Path: `/`
   - HttpOnly: ✅ (checkmark)
   - Secure: (empty in development)
   - SameSite: `Lax`

### ⚠️ If you DON'T see the refreshToken cookie:

**Possible causes:**
1. Backend server not restarted
2. Cookie being set on wrong domain
3. CORS blocking cookie

**Run this in backend console to check environment:**
```javascript
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('REFRESH_SECRET exists:', !!process.env.REFRESH_SECRET);
```

---

## Step 4: Test Automatic Refresh

### Method A: Delete Access Token and Refresh Page

1. In DevTools, go to **Console** tab
2. In **Application → Local Storage**, delete `accessToken`
3. **Keep Console tab visible**
4. **Press F5 to refresh**

### Expected Frontend Console Output:
```
🔄 No access token found, checking for refresh token...
🍪 Current cookies: refreshToken=eyJ...
📍 Calling refresh endpoint: http://localhost:5000/api/auth/refresh
📥 Refresh response status: 200 OK
📥 Refresh response data: { accessToken: "eyJ...", role: "admin" }
✅ New access token obtained from refresh token
✅ Role restored: admin
```

### Expected Backend Console Output:
```
🔍 === INCOMING REQUEST TO /auth/refresh ===
📍 Origin: http://localhost:5173
🍪 Cookie header: refreshToken=eyJ...
🍪 Parsed cookies: { refreshToken: 'eyJ...' }
===========================================

🔄 ===== REFRESH TOKEN REQUEST =====
📧 Cookies received: { refreshToken: 'eyJ...' }
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
🍪 Setting refresh cookie with options: {...}
✅ New refresh token cookie set
📤 Sending response with new access token and role: admin
===== REFRESH TOKEN SUCCESS =====
```

---

## Step 5: If You Get 401 Error

### Check 1: Is the cookie being sent?

**Frontend Console should show:**
```
🍪 Current cookies: refreshToken=eyJ...
```

**If it shows:**
```
🍪 Current cookies: (empty or no refreshToken)
```

**Then the cookie was never set or expired!**

**Solutions:**
1. Clear browser data completely
2. Login again
3. Check cookies immediately after login

---

### Check 2: Is the backend receiving the cookie?

**Backend Console should show:**
```
🍪 Cookie header: refreshToken=eyJ...
🍪 Parsed cookies: { refreshToken: 'eyJ...' }
```

**If it shows:**
```
🍪 Cookie header: undefined
🍪 Parsed cookies: {}
```

**Then cookies aren't being sent to backend!**

**Possible causes:**
1. **CORS issue** - Frontend and backend on different domains
2. **credentials: 'include'** not working
3. **SameSite** policy blocking cookie

**Solution:**
Check `backend/server.js` CORS config:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,  // ← MUST be true
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

---

### Check 3: Is cookie-parser working?

**Backend Console should show:**
```
🍪 Parsed cookies: { refreshToken: 'eyJ...' }
```

**NOT:**
```
🍪 Parsed cookies: {}
```

**If cookies are in header but not parsed:**

**Check `backend/server.js` has cookie-parser BEFORE routes:**
```javascript
app.use(cookieParser()); // ← Must be here
app.use(express.json());
// ... then routes
app.use("/api/auth", authRoutes);
```

**Restart backend server after verifying!**

---

## Step 6: Manual Test in Browser Console

Run this **immediately after login** to test manually:

```javascript
// 1. Check cookies exist
console.log('Cookies:', document.cookie);
console.log('Access token:', localStorage.getItem('accessToken'));

// 2. Test refresh endpoint directly
fetch('http://localhost:5000/api/auth/refresh', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(async res => {
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
  if (data.accessToken) {
    console.log('✅ SUCCESS! Refresh token works!');
    console.log('New token:', data.accessToken.substring(0, 30) + '...');
  } else {
    console.log('❌ FAILED: No access token in response');
  }
})
.catch(err => console.error('❌ ERROR:', err));
```

**Expected output:**
```
Cookies: refreshToken=eyJ...
Access token: eyJ...
Status: 200
Response: { accessToken: "eyJ...", role: "admin" }
✅ SUCCESS! Refresh token works!
New token: eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

---

## Common Issues and Solutions

### Issue 1: No refreshToken cookie after login

**Symptoms:**
- Login works
- Access token in localStorage
- NO refreshToken cookie

**Causes:**
- Backend not setting cookie (check backend console for "🍪 Setting refresh cookie")
- Browser blocking third-party cookies
- HTTPS/HTTP mismatch

**Solutions:**
1. Check backend console for cookie-setting log
2. Use same protocol (both HTTP in development)
3. Check browser doesn't block localhost cookies

---

### Issue 2: Cookie exists but not sent to backend

**Symptoms:**
- Frontend console shows: `🍪 Current cookies: refreshToken=...`
- Backend console shows: `🍪 Parsed cookies: {}`

**Causes:**
- CORS not allowing credentials
- Cookie domain mismatch
- SameSite policy

**Solutions:**
1. Verify CORS has `credentials: true`
2. Verify fetch has `credentials: 'include'`
3. Both frontend and backend on localhost (same domain)
4. Set `sameSite: 'lax'` in cookie options

---

### Issue 3: Cookie sent but not parsed

**Symptoms:**
- Backend shows: `🍪 Cookie header: refreshToken=...`
- Backend shows: `🍪 Parsed cookies: {}`

**Causes:**
- cookie-parser not installed
- cookie-parser not initialized
- cookie-parser initialized after routes

**Solutions:**
1. Run `npm list cookie-parser` in backend
2. Check `backend/server.js` has `app.use(cookieParser());`
3. Ensure cookie-parser is BEFORE route definitions
4. **Restart backend server**

---

### Issue 4: Token not in database

**Symptoms:**
- Backend shows: `📊 Database lookup result: 0 rows found`

**Causes:**
- Token never stored during login
- Token was deleted
- Wrong database table

**Solutions:**
1. Check database: `SELECT * FROM refresh_tokens;`
2. Login again after restarting server
3. Check backend console during login for "✅ Refresh token stored in database"

---

## Environment Variables Check

Run this in your backend code or console:

```javascript
console.log('Environment Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('- REFRESH_SECRET:', process.env.REFRESH_SECRET ? '✅ Set' : '❌ Missing');
console.log('- JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'default: 15m');
console.log('- REFRESH_EXPIRES_IN:', process.env.REFRESH_EXPIRES_IN || 'default: 1d');
```

**Expected:**
```
Environment Check:
- NODE_ENV: development
- JWT_SECRET: ✅ Set
- REFRESH_SECRET: ✅ Set
- JWT_EXPIRES_IN: 15m
- REFRESH_EXPIRES_IN: 7d
```

---

## Summary Checklist

Before saying "it doesn't work", verify ALL of these:

- [ ] Backend server restarted after changes
- [ ] Browser data cleared completely
- [ ] Fresh login performed
- [ ] `refreshToken` cookie visible in DevTools after login
- [ ] Backend console shows "🍪 Setting refresh cookie" during login
- [ ] `.env` file exists with JWT_SECRET and REFRESH_SECRET
- [ ] `cookie-parser` installed and initialized before routes
- [ ] CORS has `credentials: true`
- [ ] Fetch calls use `credentials: 'include'`
- [ ] Frontend and backend both on localhost

---

## Share These Logs

If still not working after ALL checks above, share these:

1. **Backend console output during login**
2. **Backend console output during refresh attempt**
3. **Frontend console output during refresh attempt**
4. **Screenshot of DevTools → Application → Cookies**
5. **Output of environment variables check**
6. **Result of manual test script**

This will help identify the exact problem!

