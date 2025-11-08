# 🚀 Quick Start Guide - IPD Module

## One-Time Setup (Already Done)

✅ Database migration completed  
✅ Routes configured  
✅ Navigation links added  
✅ All files in place  

## Start the Project

### Option 1: Manual Start (2 Terminals)

**Terminal 1 - Backend:**
```bash
cd c:\Lora\LABcourse\backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd c:\Lora\LABcourse\frontend
npm start
```

### Option 2: Use Existing Start Script

Double-click: `start-servers.bat` (if it exists in root)

Or run:
```bash
cd c:\Lora\LABcourse
start-servers.bat
```

## Access the Application

Once both servers are running:

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000

## Test IPD Module Immediately

### As Admin (Create Infrastructure):

1. **Login** as admin: http://localhost:3000/login
2. Navigate to **Dashboard**
3. Click **"IPD Management"** in sidebar
4. Create in order:
   - **Ward:** "ICU" or "Cardiology"
   - **Room:** Room 101, Type: ICU
   - **Bed:** Bed 1, 2, 3

### As Doctor (Create Admission Request):

1. **Login** as doctor: http://localhost:3000/login
2. Navigate to **Appointments**
3. For any **CONFIRMED** appointment:
   - Click **"📋 Clinical Assessment"**
   - Fill assessment
   - Select **"✅ Patient requires admission"**
   - Fill diagnosis and details
   - Submit

### Back to Admin (Approve Admission):

1. Go to **IPD Management** → **Admission Requests**
2. Review the pending request
3. Click **"Approve"**
4. Select: **Ward → Room → Bed**
5. Confirm approval

### Back to Doctor (Manage Patient):

1. Navigate to **"My IPD Patients"** in sidebar
2. View admitted patient
3. Add daily notes
4. Update treatment plan
5. Request discharge when ready

## Expected Results

✅ **Ward Management:** Create/Edit/Delete wards  
✅ **Room Management:** Assign rooms to wards  
✅ **Bed Management:** Assign beds to rooms with hierarchy view  
✅ **Clinical Assessment:** Conditional admission logic works  
✅ **Admission Requests:** Admin can approve and assign beds  
✅ **IPD Patients:** Doctor can manage admitted patients  
✅ **Bed Occupancy:** Real-time statistics display  

## Quick Test Checklist

- [ ] Backend starts successfully on port 5000
- [ ] Frontend starts successfully on port 3000
- [ ] Can login as admin
- [ ] IPD Management page loads
- [ ] Can create ward
- [ ] Can create room (shows ward dropdown)
- [ ] Can create bed (shows room dropdown after selecting ward)
- [ ] Bed hierarchy displays correctly: Ward → Room → Bed
- [ ] Can login as doctor
- [ ] Appointments page shows confirmed appointments
- [ ] Clinical Assessment button appears for confirmed appointments
- [ ] Assessment form opens with conditional fields
- [ ] Admission request created successfully
- [ ] Admin sees pending admission request
- [ ] Admin can approve and assign bed
- [ ] Doctor sees patient in "My IPD Patients"
- [ ] Can add daily notes to patient
- [ ] Bed occupancy stats show correct data

## If Something Doesn't Work

### Backend Issues:
```bash
# Check backend console for errors
# Common issues:
# - Port 5000 already in use
# - Database connection failed
# - Migration not run
```

### Frontend Issues:
```bash
# Check browser console (F12)
# Common issues:
# - API endpoints not reachable
# - CORS errors (backend not running)
# - Component import errors
```

### Database Issues:
```bash
# Verify migrations ran
cd backend
npx sequelize-cli db:migrate:status

# Should show:
# up 20251106_add_therapy_fields_to_appointments
# up 20251106_create_ipd_tables
```

## Need Help?

Check the documentation:
- **IPD_SETUP_COMPLETE.md** - Complete setup guide
- **IPD_LAYERED_ARCHITECTURE.md** - Architecture details
- **IPD_CLEAN_STRUCTURE.md** - File structure

## Everything is Ready! 🎉

Just start the servers and test the module. All features are fully functional.
