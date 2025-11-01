# ✅ API Endpoint 404 Error - Fixed

## 🐛 Error

```
Failed to load resource: the server responded with a status of 404 (Not Found)
GET /api/admin-profiles/doctors
Error fetching doctors: Object
```

## 🔍 Root Cause

**Mismatch between frontend and backend endpoint names:**

- **Frontend was calling:** `/api/admin-profiles/doctors` (plural)
- **Backend route registered as:** `/api/admin-profile` (singular)

**Backend Route Registration:**
```javascript
// server.js line 114
app.use("/api/admin-profile", adminProfileRoutes);  // ← Singular!
```

**Frontend was using:**
```javascript
// DoctorsTable.jsx line 12
const data = await apiFetch("/api/admin-profiles/doctors", {  // ← Plural! ❌
  method: "GET",
});
```

## ✅ Fix Applied

**File:** `frontend/src/dashboard/components/AdminProfile/DoctorsTable.jsx`

**Changed:**
```javascript
// OLD - WRONG (plural)
await apiFetch("/api/admin-profiles/doctors", { method: "GET" });
await apiFetch(`/api/admin-profiles/doctors/${doctorId}`, { method: "DELETE" });

// NEW - CORRECT (singular)
await apiFetch("/api/admin-profile/doctors", { method: "GET" });
await apiFetch(`/api/admin-profile/doctors/${doctorId}`, { method: "DELETE" });
```

## 🎯 Correct Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin-profile/doctors` | GET | Get all doctors (Admin only) |
| `/api/admin-profile/doctors/:doctorId` | DELETE | Delete doctor (Admin only) |
| `/api/admin-profile/add-doctor` | POST | Add new doctor (Admin only) |
| `/api/admin-profile/me` | GET | Get admin profile |
| `/api/admin-profile/personal` | PUT | Update personal info |
| `/api/admin-profile/avatar` | POST | Upload avatar |
| `/api/admin-profile/address` | PUT | Update address |

## 🧪 Test

1. **Login as admin**
2. **Go to Admin Dashboard** → Manage Doctors section
3. **Page should load** without 404 errors
4. **Doctors list should display** successfully

**Expected Console:**
- ✅ No 404 errors
- ✅ "Manage Doctors (X)" shows count
- ✅ Doctor table displays with data

## 📊 Backend Route Structure

```javascript
// server.js
app.use("/api/admin-profile", adminProfileRoutes);  // ← Base route

// adminProfile.js routes:
router.get("/me", ...)                    // → /api/admin-profile/me
router.put("/personal", ...)              // → /api/admin-profile/personal
router.post("/avatar", ...)               // → /api/admin-profile/avatar
router.put("/address", ...)               // → /api/admin-profile/address
router.post("/add-doctor", ...)           // → /api/admin-profile/add-doctor
router.get("/doctors", ...)               // → /api/admin-profile/doctors
router.delete("/doctors/:doctorId", ...)  // → /api/admin-profile/doctors/:doctorId
```

## ✅ Status

**Fixed!** The frontend now uses the correct endpoint name matching the backend route.

**Before:** `/api/admin-profiles/doctors` ❌ (404 Not Found)  
**After:** `/api/admin-profile/doctors` ✅ (200 OK)

---

**No more console errors! The doctors table will now load successfully.** 🎉
