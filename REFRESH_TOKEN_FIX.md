# Refresh Token Auto-Restoration Fix

## Problems Fixed

### 1. ❌ Cookie Parser Missing
**Problem:** The backend had `cookie-parser` installed but wasn't using it, so it couldn't read the `refreshToken` cookie.

**Fix:** Added `cookieParser()` middleware to `backend/server.js`

```javascript
const cookieParser = require("cookie-parser");
app.use(cookieParser());
```

### 2. ❌ No Auto-Refresh on Page Load
**Problem:** The app only tried to refresh the token when an API call failed with 401/403. If you deleted the access token from localStorage and refreshed the page, the app didn't automatically try to get a new one from the refresh token.

**Fix:** Created `useAuthInit` hook that runs on app mount to automatically restore the session.

### 3. ✅ Logout Token Deletion
Already working correctly - refresh token is deleted from database on logout.

---

## Implementation Details

### Backend Changes

**File:** `backend/server.js`
- Added `cookie-parser` middleware to parse cookies from requests
- This allows the `/api/auth/refresh` endpoint to read the `refreshToken` cookie

### Frontend Changes

**File:** `frontend/src/hooks/useAuthInit.js` (NEW)
- Created a custom hook that runs on app initialization
- Checks if access token exists in localStorage
- If not, tries to call `/api/auth/refresh` with the refresh token cookie
- If successful, stores the new access token and role

**File:** `frontend/src/App.jsx`
- Integrated `useAuthInit` hook at the app level
- Shows a loading spinner while checking for refresh token
- Ensures authentication is initialized before rendering any routes

**File:** `frontend/src/components/Navbar.jsx`
- Added effect to re-check token state on mount
- Ensures navbar displays correct user info after token restoration

---

## How It Works Now

### Login Flow
1. User logs in → receives access token (15min) and refresh token (1 day)
2. Access token stored in localStorage
3. Refresh token stored as httpOnly cookie

### Automatic Token Refresh on Page Load
1. User refreshes page or opens app
2. `useAuthInit` hook runs immediately
3. Checks for access token in localStorage
4. If missing, calls `/api/auth/refresh` with cookie
5. Backend validates refresh token from cookie
6. Returns new access token
7. Frontend stores new access token and role
8. App renders with user authenticated

### Token Refresh on API Call Failure
1. User makes API request
2. Request fails with 401/403 (token expired)
3. `apiFetch` automatically calls `/api/auth/refresh`
4. Gets new access token
5. Retries original request
6. User never notices the interruption

### Logout Flow
1. User clicks logout
2. Frontend calls `/api/auth/logout` with cookie
3. Backend deletes refresh token from database
4. Backend clears refresh token cookie
5. Frontend clears access token and role from localStorage
6. User redirected to login

---

## Testing Instructions

### Test 1: Manual Token Deletion + Page Refresh
1. ✅ **Login** to the app
2. ✅ **Open DevTools** (F12) → Application/Storage → Local Storage
3. ✅ **Delete** the `accessToken` entry
4. ✅ **Refresh** the page (F5)
5. ✅ **Expected:** You should still be logged in (token automatically restored)
6. ✅ **Check Console:** You should see: "🔄 No access token found, checking for refresh token..." and "✅ New access token obtained from refresh token"

### Test 2: Token Expiration During Session
1. ✅ **Login** to the app
2. ✅ **Wait 15 minutes** (or change JWT_EXPIRES_IN to "10s" for quick testing)
3. ✅ **Make any API call** (navigate to a protected page)
4. ✅ **Expected:** Should automatically refresh and continue working

### Test 3: Logout Cleanup
1. ✅ **Login** to the app
2. ✅ **Check database:** `SELECT * FROM refresh_tokens;` (should see your token)
3. ✅ **Logout**
4. ✅ **Check database again:** Your refresh token should be deleted
5. ✅ **Check DevTools:** Application → Cookies → `refreshToken` should be gone
6. ✅ **Try to refresh page:** Should redirect to login

### Test 4: Expired Refresh Token
1. ✅ **Login** to the app
2. ✅ **Wait 1 day** (or change REFRESH_EXPIRES_IN to "30s" for testing)
3. ✅ **Delete access token** from localStorage
4. ✅ **Refresh page**
5. ✅ **Expected:** Should redirect to login (refresh token expired)

---

## Environment Variables

Make sure these are set in your `.env` file:

```env
JWT_SECRET=your_jwt_secret_here
REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

---

## Security Features

✅ **httpOnly Cookie:** Refresh token stored in httpOnly cookie (not accessible to JavaScript)
✅ **Token Rotation:** Each refresh generates a new refresh token and invalidates the old one
✅ **Database Tracking:** All refresh tokens stored in database, can be revoked
✅ **Logout Cleanup:** Refresh tokens deleted from both database and cookie on logout
✅ **Audit Logging:** Login attempts and password resets logged in audit_logs table

---

## Files Modified

### Backend
- ✅ `backend/server.js` - Added cookie-parser middleware
- ✅ `backend/routes/auth.js` - Fixed logout cookie clearing (path consistency)

### Frontend
- ✅ `frontend/src/hooks/useAuthInit.js` - NEW: Auto-refresh on app mount
- ✅ `frontend/src/App.jsx` - Integrated useAuthInit hook
- ✅ `frontend/src/components/Navbar.jsx` - Re-check token state on mount

---

## Next Steps

1. **Restart backend server** to load cookie-parser middleware
2. **Test the flow** following the testing instructions above
3. **Monitor console logs** for authentication flow messages
4. **Check database** to verify refresh tokens are properly managed

---

## Troubleshooting

**Issue:** Still redirecting to login after refresh
- Check that backend server was restarted
- Check that `refreshToken` cookie exists in DevTools → Application → Cookies
- Check browser console for error messages
- Check backend console for refresh endpoint calls

**Issue:** Cookie not being set
- Verify CORS settings allow credentials
- Verify frontend is sending `credentials: "include"`
- Check that frontend and backend URLs match CORS origins

**Issue:** "No refresh token" error
- User logged out → expected behavior
- Refresh token expired → expected behavior
- Cookie got cleared → check browser settings (cookies allowed)

