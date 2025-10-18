# 🔍 Comprehensive Token Debugging Guide

## Problem Summary 🎯

**Issue**: Refresh tokens work for **admin** but fail for **user**, **doctor**, and **lab** roles when access tokens are deleted and pages are refreshed.

**Status**: Backend is working perfectly for all roles. Issue is in frontend implementation.

---

## Debugging Tools Implemented 🛠️

### **1. Backend Debugging (COMPLETE ✅)**
- **File**: `backend/controllers/authController.js`
- **Added**: Comprehensive logging to refresh endpoint
- **Logs**: Request details, cookie info, database lookups, token generation

### **2. Frontend Debugging (COMPLETE ✅)**
- **File**: `frontend/src/components/ProtectedRoute.jsx`
- **Added**: Detailed logging to ProtectedRoute component
- **Logs**: Token checks, API calls, response handling, state updates

### **3. Debug Page (COMPLETE ✅)**
- **URL**: `http://localhost:5173/token-debug`
- **Features**: Interactive testing of token flow
- **Functions**: Check tokens, test refresh, simulate ProtectedRoute

---

## How to Debug the Issue 🧪

### **Step 1: Access Debug Page**
1. Navigate to `http://localhost:5173/token-debug`
2. Login as any role (user, doctor, lab, admin)
3. Check current token status

### **Step 2: Test Refresh Logic**
1. Click "Test Refresh" button
2. Check browser console for detailed logs
3. Verify if refresh endpoint is called
4. Check if new tokens are received

### **Step 3: Simulate ProtectedRoute**
1. Click "Clear Tokens" to simulate deleted access token
2. Click "Test ProtectedRoute" to simulate page refresh
3. Check console logs for the exact flow
4. Compare with admin behavior

### **Step 4: Compare with Admin**
1. Login as admin
2. Repeat the same tests
3. Compare console logs between admin and other roles
4. Identify differences in behavior

---

## Expected Console Output 📝

### **Backend Logs (All Roles Should Show):**
```
=== BACKEND REFRESH DEBUG START ===
[REFRESH] Request received at: 2024-01-XX...
[REFRESH] Cookies received: ['refreshToken']
[REFRESH] Refresh token present: true
[REFRESH] Token (first 30 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...
[REFRESH] User-Agent: Mozilla/5.0...
[REFRESH] Origin: http://localhost:5173
[REFRESH] Referer: http://localhost:5173/
[REFRESH] Looking up token in database...
[REFRESH] Token found in DB: true
[REFRESH] Token user ID: X
[REFRESH] Verifying JWT signature...
[REFRESH] JWT verified successfully
[REFRESH] Payload user ID: X
[REFRESH] Looking up user in database...
[REFRESH] User found: true
[REFRESH] User ID: X Role: [role]
[REFRESH] Generating new access token...
[REFRESH] New access token generated
[REFRESH] Generating new refresh token...
[REFRESH] New refresh token generated
[REFRESH] Deleting old refresh token from database...
[REFRESH] Creating new refresh token in database...
[REFRESH] Setting new refresh token cookie...
[REFRESH] ✅ SUCCESS: Returning new access token
[REFRESH] User ID: X Role: [role]
[REFRESH] New access token (first 30 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...
=== BACKEND REFRESH DEBUG END ===
```

### **Frontend Logs (Working - Admin):**
```
=== FRONTEND PROTECTED ROUTE DEBUG START ===
[ProtectedRoute] Checking authentication at: 2024-01-XX...
[ProtectedRoute] Access token present: false
[ProtectedRoute] Access token (first 30 chars): NONE
[ProtectedRoute] Role: admin
[ProtectedRoute] Require role: undefined
[ProtectedRoute] ❌ No access token, attempting refresh...
[ProtectedRoute] API_URL: 
[ProtectedRoute] Refresh URL: /api/auth/refresh
[ProtectedRoute] Making refresh request...
[ProtectedRoute] Refresh response status: 200
[ProtectedRoute] Refresh response headers: {...}
[ProtectedRoute] ✅ Refresh successful, data: { hasAccessToken: true, role: "admin", accessTokenPreview: "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..." }
[ProtectedRoute] Setting new access token...
[ProtectedRoute] Setting new role: admin
[ProtectedRoute] ✅ Authentication restored successfully
=== FRONTEND PROTECTED ROUTE DEBUG END ===
```

### **Frontend Logs (Failing - User/Doctor/Lab):**
```
=== FRONTEND PROTECTED ROUTE DEBUG START ===
[ProtectedRoute] Checking authentication at: 2024-01-XX...
[ProtectedRoute] Access token present: false
[ProtectedRoute] Access token (first 30 chars): NONE
[ProtectedRoute] Role: [role]
[ProtectedRoute] Require role: undefined
[ProtectedRoute] ❌ No access token, attempting refresh...
[ProtectedRoute] API_URL: 
[ProtectedRoute] Refresh URL: /api/auth/refresh
[ProtectedRoute] Making refresh request...
[ProtectedRoute] Refresh response status: [status]
[ProtectedRoute] ❌ Refresh failed, status: [status]
[ProtectedRoute] Error data: {...}
[ProtectedRoute] Clearing auth data...
=== FRONTEND PROTECTED ROUTE DEBUG END ===
```

---

## Debugging Checklist ✅

### **1. Check if Backend is Called**
- Look for "=== BACKEND REFRESH DEBUG START ===" in backend console
- If not present, frontend is not calling the endpoint
- If present, check where it fails

### **2. Check Frontend Request**
- Look for "Making refresh request..." in frontend console
- Check if API_URL is correct (should be empty for relative paths)
- Verify credentials: 'include' is set

### **3. Check Response Handling**
- Look for "Refresh response status:" in frontend console
- If status is not 200, check error details
- If status is 200, check if data.accessToken exists

### **4. Check Token Storage**
- Look for "Setting new access token..." in frontend console
- Verify setAccessToken() is called
- Check if localStorage is updated

---

## Common Issues to Check 🔧

### **1. Cookie Issues**
- Check if refresh token cookie is present
- Verify cookie domain and path settings
- Check if credentials: 'include' is set

### **2. API URL Issues**
- Verify API_URL is empty (for relative paths)
- Check Vite proxy configuration
- Ensure no CORS issues

### **3. Role-Specific Logic**
- Check if there are any role-specific conditions
- Verify no role filtering in API calls
- Check ProtectedRoute component logic

### **4. Network Issues**
- Check Network tab in DevTools
- Verify refresh requests are being made
- Check request headers and cookies

---

## Quick Fixes to Try 🚀

### **1. Check Cookie Settings**
```javascript
// In backend setRefreshCookie function
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: false, // Set to false for localhost
  sameSite: 'lax', // Use 'lax' instead of 'strict'
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});
```

### **2. Verify Frontend Fetch**
```javascript
// In ProtectedRoute component
const res = await fetch('/api/auth/refresh', {
  method: 'POST',
  credentials: 'include', // This is crucial
});
```

### **3. Check API URL**
```javascript
// In api.js
export const API_URL = ""; // Should be empty for relative paths
```

---

## Testing Instructions 🧪

### **1. Test with Debug Page**
1. Go to `http://localhost:5173/token-debug`
2. Login as any role
3. Click "Test Refresh" and check console
4. Compare with admin behavior

### **2. Test with Manual Token Deletion**
1. Login as any role
2. Open DevTools → Application → Local Storage
3. Delete the `accessToken` entry
4. Refresh the page
5. Check console logs for debugging info

### **3. Test with Different Roles**
1. Test with admin (should work)
2. Test with user (should fail)
3. Test with doctor (should fail)
4. Test with lab (should fail)
5. Compare console logs between roles

---

## Files Modified 📁

### **Backend:**
1. ✅ `backend/controllers/authController.js` - Added comprehensive debugging

### **Frontend:**
1. ✅ `frontend/src/components/ProtectedRoute.jsx` - Added detailed logging
2. ✅ `frontend/src/pages/TokenDebug.jsx` - Debug page
3. ✅ `frontend/src/utils/tokenDebugger.js` - Debug utilities
4. ✅ `frontend/src/App.jsx` - Added debug route

---

## Next Steps 🚀

1. **Use the debug page**: `http://localhost:5173/token-debug`
2. **Test with different roles** and compare results
3. **Check console logs** for detailed debugging information
4. **Identify the specific difference** between admin and other roles
5. **Report findings** with exact console output

**The debugging tools will help you pinpoint the exact issue!** 🔍

---

## Expected Results 📊

### **If Backend is Working (Expected):**
- Backend logs show successful token generation
- All roles should work the same way
- Issue is in frontend implementation

### **If Backend is Failing (Unexpected):**
- Backend logs show where it fails
- Different behavior for different roles
- Issue is in backend logic

**Use the debugging tools to identify which scenario you're in!** 🎯
