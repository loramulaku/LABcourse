# How to Test Refresh Token Functionality

## IMPORTANT: Prerequisites

### 1. Check Environment Variables

Make sure your `backend/.env` file exists with these variables:

```env
JWT_SECRET=your_jwt_secret_here
REFRESH_SECRET=your_refresh_secret_here_must_be_different
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

**⚠️ If you don't have a `.env` file:**
1. Copy `backend/.env.example` to `backend/.env`
2. Fill in your actual values
3. Make sure `JWT_SECRET` and `REFRESH_SECRET` are different!

### 2. Restart Backend Server

After adding cookie-parser and environment variables:

```bash
cd backend
npm start
```

**Check the console output for:**
- ✅ "Server po punon në portën 5000"
- ✅ No errors about missing JWT_SECRET or REFRESH_SECRET

---

## Testing Steps

### Test 1: Login and Verify Tokens

1. **Login to your app** (use your regular credentials)

2. **Check Backend Console** - you should see:
   ```
   ✅ Password match, generating tokens for user: X
   🔑 Access token generated (expires in 15m )
   🔑 Refresh token generated (expires in 7d )
   ✅ Refresh token stored in database
   ✅ Refresh token cookie set
   📤 Sending login response with access token
   ```

3. **Check Browser DevTools**:
   - **Application → Local Storage** → should have `accessToken`
   - **Application → Cookies** → should have `refreshToken` cookie (httpOnly)

4. **Check Database**:
   ```sql
   SELECT * FROM refresh_tokens WHERE user_id = YOUR_USER_ID;
   ```
   Should see your refresh token stored

---

### Test 2: Delete Access Token and Refresh Page

This is the main test you requested!

1. **Open DevTools** (F12)

2. **Go to Application → Local Storage**

3. **Delete the `accessToken`** entry

4. **Keep DevTools Console open** to see frontend logs

5. **Refresh the page** (F5)

6. **Expected Frontend Console Output**:
   ```
   🔄 No access token found, checking for refresh token...
   ✅ New access token obtained from refresh token
   ✅ Role restored: admin
   ```

7. **Expected Backend Console Output**:
   ```
   🔄 ===== REFRESH TOKEN REQUEST =====
   📧 Cookies received: { refreshToken: 'eyJhbGc...' }
   ✅ Refresh token found in cookie
   🔍 Checking database for token...
   📊 Database lookup result: 1 rows found
   ✅ Refresh token found in database for user: X
   🔐 Verifying JWT signature...
   ✅ JWT verified, payload: { id: X, iat: ..., exp: ... }
   🔍 Fetching user from database...
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

8. **Check Local Storage Again** - `accessToken` should be back!

9. **Check Database** - the refresh token should be different (rotated)

---

### Test 3: Automatic Refresh on API Call

1. **Login** to the app

2. **Wait 15 minutes** (or set `JWT_EXPIRES_IN=30s` in `.env` for faster testing)

3. **Navigate to a protected page** or make any API call

4. **Expected**: Should work seamlessly without redirect to login

5. **Check Console**: Should see refresh happening automatically

---

### Test 4: Logout Token Cleanup

1. **Login** to the app

2. **Check Database**:
   ```sql
   SELECT * FROM refresh_tokens WHERE user_id = YOUR_USER_ID;
   ```

3. **Click Logout**

4. **Check Database Again** - refresh token should be deleted

5. **Check DevTools Cookies** - `refreshToken` cookie should be gone

6. **Try to refresh page** - should redirect to login

---

## Troubleshooting

### ❌ "No refresh token found in cookies"

**Possible causes:**

1. **Cookie-parser not working**
   - Check `backend/server.js` has `app.use(cookieParser());`
   - Restart backend server

2. **CORS not allowing credentials**
   - Check `backend/server.js` CORS config has `credentials: true`
   - Check frontend requests use `credentials: "include"`

3. **Cookie not set on login**
   - Check backend console for "✅ Refresh token cookie set"
   - Check DevTools → Cookies for `refreshToken`

4. **Domain mismatch**
   - Frontend and backend must be on same domain/localhost
   - Check URLs match CORS origins

### ❌ "Refresh token not found in database"

**Possible causes:**

1. **Token not stored on login**
   - Check backend console during login
   - Check database: `SELECT * FROM refresh_tokens;`

2. **Wrong database/table**
   - Verify table exists: `SHOW TABLES LIKE 'refresh_tokens';`
   - Verify structure: `DESCRIBE refresh_tokens;`

### ❌ "JWT_SECRET not set"

**Fix:**
1. Create `backend/.env` file
2. Add `JWT_SECRET=your_secret_here`
3. Add `REFRESH_SECRET=different_secret_here`
4. Restart server

### ❌ Still redirecting to login

**Check:**
1. Backend server was restarted after changes
2. Frontend was refreshed (Ctrl+Shift+R)
3. `.env` file exists with correct variables
4. Browser console for error messages
5. Backend console for detailed logs

---

## Quick Test Script

Run this in browser console after login:

```javascript
// 1. Check if refresh token cookie exists
console.log('Cookies:', document.cookie);

// 2. Remove access token
localStorage.removeItem('accessToken');
console.log('✅ Access token deleted');

// 3. Try to refresh
fetch('http://localhost:5000/api/auth/refresh', {
  method: 'POST',
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  console.log('✅ Refresh response:', data);
  if (data.accessToken) {
    localStorage.setItem('accessToken', data.accessToken);
    console.log('✅ New access token stored!');
  }
})
.catch(err => console.error('❌ Refresh failed:', err));
```

---

## Expected Database Schema

Your `refresh_tokens` table should look like:

```sql
CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Summary

The fix includes:

✅ **Backend**: Added `cookie-parser` middleware
✅ **Backend**: Added comprehensive logging to track token flow
✅ **Frontend**: Created `useAuthInit` hook to check for refresh token on page load
✅ **Frontend**: Integrated hook in App.jsx to run before rendering
✅ **Logout**: Already properly deletes refresh token from database

**Your specific requirement:**
> "Every time I refresh the page, a new access token should be generated from the refresh token if the access token is missing."

This is now implemented via the `useAuthInit` hook that runs automatically on app mount!

