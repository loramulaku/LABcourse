# 🏥 IPD (Inpatient Department) Module - Complete Guide

## ✅ Installation Complete

All setup steps have been completed:
- ✅ Database migrated successfully
- ✅ Backend layered architecture implemented
- ✅ Frontend components integrated
- ✅ Navigation links added to sidebars
- ✅ Routes configured in App.jsx
- ✅ Clean project structure verified

## 🚀 How to Start the Project

### Step 1: Start Backend
```bash
cd backend
npm start
```
**Expected output:**
```
Server running on port 5000
Database connected successfully
```

### Step 2: Start Frontend (New Terminal)
```bash
cd frontend  
npm start
```
**Expected output:**
```
Compiled successfully!
Local: http://localhost:3000
```

## 🎯 Quick Test Guide

### Admin Flow (Setup Infrastructure)

1. **Login:** http://localhost:3000/login
   - Use admin credentials

2. **Navigate to IPD Management:**
   - Dashboard → Sidebar → **"IPD Management"**

3. **Create Ward:**
   - Click **"Wards"** tab
   - Click **"+ Add Ward"**
   - Name: `ICU` or `Cardiology`
   - Description: Optional
   - Total Beds: `10`
   - Click **"Add Ward"**

4. **Create Room:**
   - Click **"Rooms"** tab
   - Select Ward from dropdown
   - Room Number: `101`
   - Room Type: `ICU` or `Single`
   - Click **"Add Room"**

5. **Create Beds:**
   - Click **"Beds"** tab
   - Select Ward from dropdown
   - Select Room from dropdown (filtered by ward)
   - Bed Number: `1`
   - Status: `Available`
   - Click **"Add Bed"**
   - Repeat for beds 2, 3, etc.

6. **View Hierarchy:**
   - You should see: **ICU → Room 101 → Bed 1, 2, 3**

### Doctor Flow (Clinical Assessment & Admission)

1. **Login:** http://localhost:3000/login
   - Use doctor credentials

2. **View Appointments:**
   - Doctor Dashboard → **"Appointments"**

3. **For CONFIRMED Appointment:**
   - Click **"📋 Clinical Assessment"** button
   - A modal opens

4. **Fill Assessment Form:**
   - **Clinical Assessment:** Write notes
   - Choose admission requirement:
     - ⛔ **Patient does NOT require admission:**
       - Fill **"Therapy Prescribed"** field only
       - Submit → Done (Outpatient care)
     - ✅ **Patient requires admission:**
       - Fill **"Primary Diagnosis"** (required)
       - Fill **"Treatment Plan"** (optional)
       - Select **"Recommended Ward"** (optional)
       - Select **"Recommended Room Type"** (optional)
       - Select **"Urgency"** (Normal/Emergency)
       - Submit → Creates admission request

5. **View IPD Patients:**
   - Sidebar → **"My IPD Patients"**
   - Currently empty (until admin approves)

### Admin Flow (Approve Admission)

1. **Return to IPD Management:**
   - Dashboard → **"IPD Management"**

2. **View Admission Requests:**
   - Click **"Admission Requests"** tab
   - See pending request with:
     - Patient name
     - Doctor name
     - Diagnosis
     - Recommended ward
     - Urgency level

3. **Approve Request:**
   - Click **"Approve"** button
   - Modal opens with bed selection:
     - **Select Ward:** Choose from dropdown
     - **Select Room:** Filtered by selected ward
     - **Select Bed:** Filtered by selected room, shows only Available beds
   - Click **"Approve & Admit"**

4. **Verification:**
   - Go to **"IPD Patients"** tab
   - Patient appears with:
     - Ward, Room, Bed assignment
     - Status: Admitted
     - Admission date

5. **Check Bed Status:**
   - Go to **"Beds"** tab
   - The assigned bed now shows status: **Occupied**

6. **View Statistics:**
   - Click **"Bed Occupancy"** tab
   - See occupancy rates per ward

### Doctor Flow (Manage IPD Patient)

1. **View IPD Patients:**
   - Sidebar → **"My IPD Patients"**
   - Patient now appears

2. **Add Daily Note:**
   - Click **"Add Note"** icon
   - Write progress note
   - Submit

3. **Update Treatment Plan:**
   - Click **"Update Treatment"** icon
   - Modify treatment plan
   - Submit

4. **Request Transfer:**
   - Click **"Request Transfer"** icon
   - Enter reason
   - Suggest new ward (optional)
   - Submit
   - Admin reviews in IPD Patients tab

5. **Request Discharge:**
   - Click **"Request Discharge"** icon
   - Enter discharge summary
   - Submit
   - Admin reviews in IPD Patients tab

### Admin Flow (Discharge Patient)

1. **Review Discharge Request:**
   - IPD Management → **"IPD Patients"** tab
   - Patient shows status: **DischargeRequested**

2. **Approve Discharge:**
   - Click **"Approve Discharge"**
   - Confirm
   - Patient status → **Discharged**
   - Bed status → **Available**

## 📊 Complete Workflow Diagram

```
Patient Books Appointment
        ↓
Admin Approves (Status: PENDING → APPROVED)
        ↓
Patient Pays via Stripe
        ↓
Doctor Confirms (Status: APPROVED → CONFIRMED)
        ↓
Doctor Fills Clinical Assessment
        ├──────────────────┬──────────────────┐
        ↓                  ↓                  ↓
    ⛔ NO Admission    ✅ YES Admission    (Conditions)
        ↓                  ↓
Therapy Prescribed    Admission Request
        ↓             Created (Pending)
    END                    ↓
                    Admin Reviews Request
                           ↓
                    Approves & Assigns:
                    Ward → Room → Bed
                           ↓
                    IPD Patient Created
                    Bed Status: Occupied
                           ↓
                    Doctor Manages Patient
                    ├─ Daily Notes
                    ├─ Treatment Updates
                    ├─ Transfer Requests
                    └─ Discharge Request
                           ↓
                    Admin Approves Discharge
                           ↓
                    Patient Status: Discharged
                    Bed Status: Available
                           ↓
                         END
```

## 🏗️ Architecture Overview

### Layered Architecture Pattern

```
┌─────────────────────────────────────────┐
│  PRESENTATION LAYER (Controllers)       │
│  Handle HTTP requests/responses         │
├─────────────────────────────────────────┤
│  BUSINESS LOGIC LAYER (Services)        │
│  Implement workflows & rules            │
├─────────────────────────────────────────┤
│  DATA ACCESS LAYER (Repositories)       │
│  Database queries & operations          │
├─────────────────────────────────────────┤
│  PERSISTENCE LAYER (Models)             │
│  Schema definitions & relationships     │
└─────────────────────────────────────────┘
```

### Ward → Room → Bed Hierarchy

```
Ward (ICU)
  ├── Room 101 (ICU Type)
  │   ├── Bed 1 (Available)
  │   ├── Bed 2 (Occupied)
  │   └── Bed 3 (Available)
  └── Room 102 (ICU Type)
      ├── Bed 4 (Cleaning)
      └── Bed 5 (Available)
```

**Business Rules:**
- ✅ Can only create Room if Ward exists
- ✅ Can only create Bed if Room exists
- ✅ Cannot delete Ward with Rooms
- ✅ Cannot delete Room with Beds
- ✅ Cannot delete Occupied Bed

## 📁 File Structure

### Backend (Layered Architecture)

```
backend/
├── controllers/oop/
│   ├── IPDController.js          (Admin HTTP handlers)
│   └── IPDDoctorController.js    (Doctor HTTP handlers)
├── services/
│   ├── IPDService.js             (Admin business logic)
│   └── IPDDoctorService.js       (Doctor business logic)
├── repositories/
│   ├── WardRepository.js
│   ├── RoomRepository.js
│   ├── BedRepository.js
│   ├── IPDPatientRepository.js
│   ├── AdmissionRequestRepository.js
│   └── DailyDoctorNoteRepository.js
├── models/
│   ├── Ward.js
│   ├── Room.js
│   ├── Bed.js
│   ├── IPDPatient.js
│   ├── AdmissionRequest.js
│   └── DailyDoctorNote.js
├── routes/oop/
│   ├── ipdAdminRoutes.js
│   └── ipdDoctorRoutes.js
└── migrations/
    ├── 20251106_create_ipd_tables.js
    └── 20251106_add_therapy_fields_to_appointments.js
```

### Frontend (Component Structure)

```
frontend/src/
├── dashboard/
│   ├── pages/
│   │   └── IPDManagement.jsx         (Admin main page)
│   └── components/IPD/
│       ├── WardManagement.jsx
│       ├── RoomManagement.jsx
│       ├── BedManagement.jsx
│       ├── AdmissionRequests.jsx
│       ├── IPDPatientsManagement.jsx
│       └── BedOccupancyDashboard.jsx
└── doctor/
    ├── pages/
    │   └── MyIPDPatients.jsx         (Doctor IPD page)
    └── components/
        └── ClinicalAssessmentForm.jsx
```

## 🔌 API Endpoints

### Admin (`/api/ipd/admin`)

**Ward Management:**
- `GET /wards` - List all wards
- `POST /wards` - Create ward
- `PUT /wards/:id` - Update ward
- `DELETE /wards/:id` - Delete ward

**Room Management:**
- `GET /rooms?wardId=` - List rooms (filtered)
- `POST /rooms` - Create room
- `PUT /rooms/:id` - Update room
- `DELETE /rooms/:id` - Delete room

**Bed Management:**
- `GET /beds?roomId=` - List beds (filtered)
- `POST /beds` - Create bed
- `PUT /beds/:id` - Update bed
- `DELETE /beds/:id` - Delete bed

**Admission Requests:**
- `GET /admission-requests` - List requests
- `PUT /admission-requests/:id/approve` - Approve request
- `PUT /admission-requests/:id/reject` - Reject request

**IPD Patients:**
- `GET /patients` - List IPD patients
- `PUT /transfers/:id` - Transfer patient
- `PUT /discharges/:id` - Approve discharge

**Statistics:**
- `GET /bed-occupancy-stats` - Get occupancy statistics

### Doctor (`/api/ipd/doctor`)

**Patient Management:**
- `GET /my-patients` - List my IPD patients
- `GET /patients/:id` - Get patient details

**Admission:**
- `GET /wards` - List available wards
- `POST /admission-request` - Create admission request

**Notes:**
- `POST /notes/:ipdId` - Add daily note
- `GET /notes/:ipdId` - Get patient notes

**Treatment:**
- `PUT /patients/:id/treatment-plan` - Update treatment plan

**Workflow:**
- `PUT /patients/:id/request-transfer` - Request transfer
- `PUT /patients/:id/request-discharge` - Request discharge

**Clinical Assessment:**
- `POST /api/doctor/appointment/:id/clinical-assessment` - Submit assessment

## 🔐 Authentication & Authorization

All endpoints require JWT authentication:
- Admin endpoints: `requireRole="admin"`
- Doctor endpoints: `requireRole="doctor"`

**Headers:**
```
Authorization: Bearer <access_token>
```

## 📚 Documentation

- **IPD_LAYERED_ARCHITECTURE.md** - Complete architecture guide
- **IPD_SETUP_COMPLETE.md** - Setup verification
- **IPD_CLEAN_STRUCTURE.md** - File structure
- **START_IPD_PROJECT.md** - Quick start
- **backend/LAYERED_ARCHITECTURE_REFERENCE.md** - Quick reference

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port is in use
netstat -ano | findstr :5000

# Clear node modules if needed
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend Won't Start
```bash
cd frontend
rm -rf node_modules package-lock.json  
npm install
npm start
```

### Database Issues
```bash
# Check migration status
cd backend
npx sequelize-cli db:migrate:status

# Re-run if needed
npx sequelize-cli db:migrate
```

### API Returns 401 Unauthorized
- Check if logged in
- Verify JWT token in localStorage
- Check token expiration

### Clinical Assessment Button Not Showing
- Verify appointment status is `CONFIRMED`
- Check if assessment already submitted
- Refresh appointments list

### Bed Not Showing in Dropdown
- Verify bed status is `Available`
- Check if bed assigned to correct room
- Verify room assigned to correct ward

## ✅ Features Summary

### ✅ Ward Management
- Create, edit, delete wards
- Track total beds per ward
- View occupancy statistics

### ✅ Room Management  
- Assign rooms to wards
- Specify room types (ICU, Single, etc.)
- View beds per room

### ✅ Bed Management
- Assign beds to rooms
- Track bed status (Available, Occupied, Cleaning, etc.)
- Hierarchical view: Ward → Room → Bed

### ✅ Clinical Assessment
- Conditional form based on admission need
- Therapy prescription for outpatients
- Admission request for inpatients

### ✅ Admission Workflow
- Doctor creates request
- Admin reviews and assigns bed
- Automatic bed status update
- Patient tracking from admission to discharge

### ✅ IPD Patient Management
- Daily doctor notes
- Treatment plan updates
- Transfer requests
- Discharge workflow

### ✅ Bed Occupancy Dashboard
- Real-time statistics
- Ward-wise breakdown
- Visual indicators (Critical/Warning/Normal)

## 🎉 You're All Set!

**Everything is configured and ready to use.**

Just:
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Login and test the module

**Happy coding!** 🚀
