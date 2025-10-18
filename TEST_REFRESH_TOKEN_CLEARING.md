# 🧪 Test: Refresh Token Clearing on Role Manipulation

## 🎯 **Objective**
Verify that when a user manually changes their role in DevTools, **all tokens (access + refresh)** are cleared from both frontend and backend.

---

## 📋 **Test Procedure**

### **Test 1: Complete Token Clearance**

#### **Setup:**
1. Start backend server: `cd backend && npm start`
2. Start frontend server: `cd frontend && npm run dev`
3. Navigate to: `http://localhost:5173`

#### **Steps:**

**Step 1: Login**
- Login as a regular user
- Verify you're logged in successfully
- Check console for: `[TOKEN] Access token set:`

**Step 2: Verify Initial State**
- Open DevTools → Application → Local Storage
- Confirm these exist:
  - `accessToken`
  - `role` (should be "user")
- Open DevTools → Application → Cookies
- Confirm `refreshToken` cookie exists

**Step 3: Database Check (Before)**
- Open your database tool
- Run query:
  ```sql
  SELECT * FROM refresh_tokens WHERE user_id = [your_user_id];
  ```
- Confirm refresh token exists in database

**Step 4: Manipulate Role**
- In DevTools → Application → Local Storage
- Change `role` from "user" to "admin"
- Close DevTools

**Step 5: Trigger Validation**
- Refresh the page (F5)
- Watch the console logs

**Step 6: Verify Complete Logout**
Check console logs for these messages:
```
[SECURITY] ⚠️ Role mismatch detected! Local: admin Server: user
[SECURITY] Possible tampering attempt - logging out user
[SECURITY] ✅ Backend logout successful
[TOKEN] All auth data cleared
```

**Step 7: Verify Frontend Cleared**
- Open DevTools → Application → Local Storage
- Confirm these are GONE:
  - ❌ `accessToken` (removed)
  - ❌ `role` (removed)
  - ❌ `userName` (removed)

**Step 8: Verify Cookie Cleared**
- Open DevTools → Application → Cookies
- Confirm:
  - ❌ `refreshToken` cookie (removed)

**Step 9: Database Check (After)**
- Open your database tool
- Run query:
  ```sql
  SELECT * FROM refresh_tokens WHERE user_id = [your_user_id];
  ```
- Confirm: **No refresh token exists** (deleted)

**Step 10: Verify Redirect**
- Page should redirect to login page
- User cannot access protected routes

---

### **Test 2: Attempting to Use Old Tokens**

#### **Steps:**

**Step 1: Login Again**
- Login as regular user
- Copy the `refreshToken` cookie value
- Copy the `accessToken` from localStorage

**Step 2: Manipulate Role and Logout**
- Change role to "admin" in localStorage
- Refresh page
- Wait for complete logout

**Step 3: Try to Use Old Access Token**
- Manually set old access token in localStorage
- Try to access a protected route
- **Expected**: Immediate logout (token invalid)

**Step 4: Try to Use Old Refresh Token**
- Manually set old refresh token cookie
- Try to refresh the page
- **Expected**: No new access token generated (refresh token deleted from DB)

---

## ✅ **Expected Results Summary**

| Check | Expected Outcome |
|-------|------------------|
| **Role Mismatch Detection** | ✅ Console shows security warning |
| **Backend Logout Called** | ✅ `/api/auth/logout` endpoint hit |
| **Access Token Cleared** | ✅ Removed from localStorage |
| **Role Cleared** | ✅ Removed from localStorage |
| **Refresh Token Cookie Cleared** | ✅ Removed from browser |
| **Refresh Token DB Record Deleted** | ✅ Deleted from `refresh_tokens` table |
| **User Redirected** | ✅ Sent to login page |
| **Old Tokens Invalid** | ✅ Cannot be reused |

---

## 🔍 **Key Console Messages to Look For**

### **On Role Mismatch:**
```
[ProtectedRoute] ✅ Access token present, validating role with server...
[SECURITY] ⚠️ Role mismatch detected! Local: admin Server: user
[SECURITY] Possible tampering attempt - logging out user
[SECURITY] ✅ Backend logout successful
[TOKEN] All auth data cleared
[ProtectedRoute] ❌ Server role validation failed
```

### **On Successful Validation (No Mismatch):**
```
[ProtectedRoute] ✅ Access token present, validating role with server...
[ProtectedRoute] ✅ Server-validated role: user
```

---

## 🚨 **Security Verification**

### **Before Fix:**
- ❌ Access token: Cleared
- ❌ Role: Cleared
- ⚠️ **Refresh token: STILL EXISTED** (SECURITY ISSUE)

### **After Fix:**
- ✅ Access token: Cleared
- ✅ Role: Cleared
- ✅ **Refresh token: DELETED** (SECURE)

---

## 🛡️ **Security Benefits**

### **Complete Session Termination:**
1. **Frontend tokens cleared**: No client-side access
2. **Backend tokens deleted**: No server-side validity
3. **Cookies removed**: No automatic refresh
4. **Database cleaned**: No token reuse possible

### **Attack Prevention:**
- **Token theft impossible**: All tokens invalidated
- **Session hijacking prevented**: Complete logout
- **Privilege escalation blocked**: Role changes detected
- **Automatic security response**: No manual intervention needed

---

## 📊 **Test Results Log Template**

```
Date: _______________
Tester: _______________

Test 1: Complete Token Clearance
[ ] Role mismatch detected
[ ] Backend logout called
[ ] Access token cleared
[ ] Role cleared
[ ] Refresh token cookie cleared
[ ] Refresh token DB record deleted
[ ] User redirected to login
[ ] Old tokens invalid

Test 2: Token Reuse Prevention
[ ] Old access token rejected
[ ] Old refresh token rejected
[ ] No new tokens generated
[ ] Security maintained

Overall Result: [ ] PASS  [ ] FAIL
Notes: _________________________________
_______________________________________
_______________________________________
```

---

## 🎯 **Success Criteria**

✅ **PASS**: All tokens cleared, user logged out, cannot access protected routes
❌ **FAIL**: Any token remains, user can still access routes, or refresh token reusable

---

*Test Protocol created: January 2025*
*Security Level: Maximum*
*Status: ✅ READY FOR TESTING*
