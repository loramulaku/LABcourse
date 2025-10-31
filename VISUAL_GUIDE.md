# Visual Guide - Department & Doctor Management

## Navigation Structure

```
Dashboard
│
├── Doctor Management
│   ├── Departments
│   │   ├── View all departments
│   │   ├── Add Department
│   │   │   ├── Enter name
│   │   │   ├── Enter number of specializations
│   │   │   └── Enter specialization names manually
│   │   ├── Edit Department
│   │   └── Delete Department
│   │
│   ├── Add Doctor ⭐ NEW
│   │   ├── Basic Information
│   │   │   ├── Name
│   │   │   ├── Email
│   │   │   ├── Password
│   │   │   └── Phone
│   │   ├── Professional Information
│   │   │   ├── Department (required)
│   │   │   ├── Specialization (filtered by dept)
│   │   │   ├── Degree
│   │   │   ├── License Number
│   │   │   └── Experience
│   │   ├── Financial Information
│   │   │   ├── Consultation Fee
│   │   │   └── Available checkbox
│   │   ├── Address Information
│   │   └── Social Media
│   │
│   └── Edit & Delete Doctors
│       ├── Search doctors
│       ├── Expand doctor card
│       ├── Edit Doctor
│       │   └── Update any field
│       └── Delete Doctor
│           └── Confirmation dialog
│
├── Calendar
├── Laboratory Management
└── ...
```

---

## Page Layouts

### 1. Add Doctor Page

```
┌─────────────────────────────────────────────────┐
│ ← Add New Doctor                                │
│    Create a new doctor profile in the system    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ BASIC INFORMATION                               │
├─────────────────────────────────────────────────┤
│ Full Name *          │ Email *                  │
│ [____________]       │ [____________]           │
│                                                 │
│ Password *           │ Phone                    │
│ [____________]       │ [____________]           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ PROFESSIONAL INFORMATION                        │
├─────────────────────────────────────────────────┤
│ Department *         │ Specialization *         │
│ [Select Dept ▼]      │ [Select Spec ▼]         │
│                                                 │
│ Degree               │ License Number           │
│ [____________]       │ [____________]           │
│                                                 │
│ Experience (Years)   │ Experience Details       │
│ [____________]       │ [____________]           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ FINANCIAL INFORMATION                           │
├─────────────────────────────────────────────────┤
│ Consultation Fee (€)                            │
│ [____________]                                  │
│                                                 │
│ ☑ Doctor is available for appointments         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ADDRESS INFORMATION                             │
├─────────────────────────────────────────────────┤
│ Address Line 1       │ Address Line 2           │
│ [____________]       │ [____________]           │
│                                                 │
│ Country              │ City/State               │
│ [____________]       │ [____________]           │
│                                                 │
│ Postal Code                                     │
│ [____________]                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SOCIAL MEDIA & CONTACT                          │
├─────────────────────────────────────────────────┤
│ Facebook             │ Twitter                  │
│ [____________]       │ [____________]           │
│                                                 │
│ Instagram                                       │
│ [____________]                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                     [Cancel] [Add Doctor]       │
└─────────────────────────────────────────────────┘
```

---

### 2. Edit & Delete Doctors Page

```
┌─────────────────────────────────────────────────┐
│ Edit & Delete Doctors (24)                      │
│ Manage existing doctor profiles                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [Search doctors by name, email, specialization] │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Dr. John Smith                            ▼     │
│ Cardiology • john@hospital.com                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ▼ Dr. John Smith                                │
│   Cardiology • john@hospital.com                │
├─────────────────────────────────────────────────┤
│ Email: john@hospital.com                        │
│ Phone: +1-555-0001                              │
│ Specialization: Cardiology                      │
│ Degree: MD                                      │
│ Experience: 10 years                            │
│ Consultation Fee: €150                          │
│                                                 │
│                    [Edit] [Delete]              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ▼ Dr. Jane Doe                                  │
│   Neurology • jane@hospital.com                 │
├─────────────────────────────────────────────────┤
│ Email: jane@hospital.com                        │
│ Phone: +1-555-0002                              │
│ Specialization: Neurology                       │
│ Degree: MD                                      │
│ Experience: 8 years                             │
│ Consultation Fee: €120                          │
│                                                 │
│                    [Edit] [Delete]              │
└─────────────────────────────────────────────────┘
```

---

### 3. Department Management Page

```
┌─────────────────────────────────────────────────┐
│ Department Management (8)                       │
│ Manage hospital departments and specializations │
│                          [+ Add Department]     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [Search departments...]                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Cardiology                                  ▼   │
│ Heart and cardiovascular diseases               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ▼ Cardiology                                    │
│   Heart and cardiovascular diseases             │
├─────────────────────────────────────────────────┤
│ Location: Building A, Floor 2                   │
│ Phone: +1-555-0101                              │
│ Email: cardiology@hospital.com                  │
│ Budget: $500,000                                │
│                                                 │
│ Specializations (2)                             │
│ [Cardiology] [Interventional Cardiology]        │
│                                                 │
│                    [Edit] [Delete]              │
└─────────────────────────────────────────────────┘
```

---

### 4. Add Department Modal

```
┌─────────────────────────────────────────────────┐
│ Add New Department                          ✕   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Department Name *                               │
│ [_________________________]                     │
│                                                 │
│ Location                                        │
│ [_________________________]                     │
│                                                 │
│ Description                                     │
│ [_________________________]                     │
│ [_________________________]                     │
│ [_________________________]                     │
│                                                 │
│ Phone                    Email                  │
│ [____________]           [____________]         │
│                                                 │
│ Annual Budget                                   │
│ [_________________________]                     │
│                                                 │
│ Number of Specializations                       │
│ [___] ← Enter how many specializations          │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Enter Specialization Names                  │ │
│ ├─────────────────────────────────────────────┤ │
│ │ [Specialization 1 ____________]             │ │
│ │ [Specialization 2 ____________]             │ │
│ │ [Specialization 3 ____________]             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│              [Cancel] [Create]                  │
└─────────────────────────────────────────────────┘
```

---

## User Workflows

### Workflow 1: Add Doctor

```
START
  ↓
Click "Add Doctor" in sidebar
  ↓
AddDoctor page opens
  ↓
Fill Basic Information
  ├─ Name
  ├─ Email
  ├─ Password
  └─ Phone
  ↓
Select Department (required)
  ↓
Specialization dropdown updates
  ↓
Select Specialization (required)
  ↓
Fill Professional Information
  ├─ Degree
  ├─ License
  ├─ Experience
  └─ etc.
  ↓
Fill Financial & Address Info
  ↓
Click "Add Doctor"
  ↓
Success notification
  ↓
Redirect to Edit & Delete page
  ↓
END
```

---

### Workflow 2: Edit Doctor

```
START
  ↓
Click "Edit & Delete Doctors" in sidebar
  ↓
Search for doctor (optional)
  ↓
Click doctor card to expand
  ↓
Click "Edit" button
  ↓
Edit modal opens
  ↓
Update fields
  ├─ Can change department
  ├─ Specialization updates
  └─ etc.
  ↓
Click "Update"
  ↓
Success notification
  ↓
List refreshes
  ↓
END
```

---

### Workflow 3: Add Department

```
START
  ↓
Click "Departments" in sidebar
  ↓
Click "Add Department"
  ↓
Modal opens
  ↓
Enter Department Name
  ↓
Enter other details
  ├─ Location
  ├─ Phone
  ├─ Email
  └─ Budget
  ↓
Enter Number of Specializations
  (e.g., 3)
  ↓
Input fields appear
  ↓
Enter Specialization Names
  ├─ Cardiology
  ├─ Interventional Cardiology
  └─ Electrophysiology
  ↓
Click "Create"
  ↓
Success notification
  ↓
Department created
  ↓
END
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│           FRONTEND COMPONENTS                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  AddDoctor.jsx                                  │
│  ├─ Fetch departments                           │
│  ├─ Department dropdown                         │
│  ├─ Filter specializations                      │
│  └─ POST /api/doctors                           │
│                                                 │
│  DoctorsCrud.jsx                                │
│  ├─ Fetch doctors                               │
│  ├─ Fetch departments                           │
│  ├─ PUT /api/doctors/:id                        │
│  └─ DELETE /api/doctors/:id                     │
│                                                 │
│  DepartmentManagement.jsx                       │
│  ├─ Fetch departments                           │
│  ├─ POST /api/departments                       │
│  ├─ PUT /api/departments/:id                    │
│  └─ DELETE /api/departments/:id                 │
│                                                 │
└─────────────────────────────────────────────────┘
           ↓↑
┌─────────────────────────────────────────────────┐
│           BACKEND API                           │
├─────────────────────────────────────────────────┤
│                                                 │
│  GET /api/departments                           │
│  POST /api/departments                          │
│  PUT /api/departments/:id                       │
│  DELETE /api/departments/:id                    │
│                                                 │
│  GET /api/doctors                               │
│  POST /api/doctors                              │
│  PUT /api/doctors/:id                           │
│  DELETE /api/doctors/:id                        │
│                                                 │
└─────────────────────────────────────────────────┘
           ↓↑
┌─────────────────────────────────────────────────┐
│           DATABASE                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  departments table                              │
│  ├─ id, name, description                       │
│  ├─ location, phone, email                      │
│  ├─ budget, is_active                           │
│  └─ specializations (JSON)                      │
│                                                 │
│  doctors table                                  │
│  ├─ id, name, email, phone                      │
│  ├─ department_id (FK)                          │
│  ├─ specialization                              │
│  └─ other fields...                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Key Features Summary

| Feature | Add Doctor | Edit & Delete | Departments |
|---------|-----------|---------------|-------------|
| Create | ✅ | ❌ | ✅ |
| Read | ✅ | ✅ | ✅ |
| Update | ❌ | ✅ | ✅ |
| Delete | ❌ | ✅ | ✅ |
| Search | ❌ | ✅ | ✅ |
| Department Select | ✅ | ✅ | N/A |
| Specialization Filter | ✅ | ✅ | N/A |
| Manual Specializations | ❌ | ❌ | ✅ |
| Expandable Cards | ❌ | ✅ | ✅ |

---

## Summary

✅ **Clean separation of concerns**
✅ **Intuitive user workflows**
✅ **Responsive design**
✅ **Dark mode support**
✅ **Form validation**
✅ **Toast notifications**
✅ **Dynamic filtering**
✅ **Manual specialization entry**

**System is user-friendly and production-ready!** 🎉
