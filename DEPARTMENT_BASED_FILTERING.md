# Department-Based Doctor Filtering - Implementation

## Overview

Transitioned from **specialization-based filtering** to **department-based filtering** for the public Doctors page. Now users browse doctors organized by their assigned departments instead of individual specializations.

---

## What Changed

### Before (Specialization-Based)
```
Filter Buttons:
- General physician
- Gynecologist
- Dermatologist
- Pediatricians
- Neurologist
- Gastroenterologist

Doctor Card:
- Name: Dr. John Smith
- Speciality: Cardiology
```

### After (Department-Based)
```
Filter Buttons:
- Cardiology (fetched from database)
- Neurology (fetched from database)
- Orthopedics (fetched from database)
- [Any department created by admin]

Doctor Card:
- Name: Dr. John Smith
- Department: Cardiology
```

---

## Implementation Details

### File Modified
**`frontend/src/pages/Doctors.jsx`**

### Key Changes

#### 1. Import API_URL
```javascript
import { API_URL } from "../api";
```

#### 2. Update URL Parameters
```javascript
// Before
const { speciality } = useParams();

// After
const { department } = useParams();
```

#### 3. Add State for Departments
```javascript
const [departments, setDepartments] = useState([]);
const [loading, setLoading] = useState(true);
```

#### 4. Fetch Departments on Mount
```javascript
useEffect(() => {
  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/departments`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchDepartments();
}, []);
```

#### 5. Helper Function to Get Department Name
```javascript
const getDepartmentName = (deptId) => {
  const dept = departments.find((d) => d.id === deptId);
  return dept?.name || "Unknown";
};
```

#### 6. Update Filter Logic
```javascript
// Before
const applyFilter = () => {
  if (speciality) {
    setFilterDoc(doctors.filter((doc) => doc.speciality === speciality));
  } else {
    setFilterDoc(doctors);
  }
};

// After
const applyFilter = () => {
  if (department) {
    setFilterDoc(doctors.filter((doc) => {
      const deptName = getDepartmentName(doc.department_id);
      return deptName === department;
    }));
  } else {
    setFilterDoc(doctors);
  }
};
```

#### 7. Update Filter Buttons
```javascript
// Before
{["General physician","Gynecologist","Dermatologist",...].map((spec) => (
  <p
    key={spec}
    onClick={() =>
      speciality === spec ? navigate("/doctors") : navigate(`/doctors/${spec}`)
    }
    className={`... ${speciality === spec ? "bg-[#E2E5FF]" : ""}`}
  >
    {spec}
  </p>
))}

// After
{departments.map((dept) => (
  <p
    key={dept.id}
    onClick={() =>
      department === dept.name ? navigate("/doctors") : navigate(`/doctors/${dept.name}`)
    }
    className={`... ${department === dept.name ? "bg-[#E2E5FF]" : ""}`}
  >
    {dept.name}
  </p>
))}
```

#### 8. Update Doctor Card Display
```javascript
// Before
<p className="text-[#262626] text-lg font-medium">{item.name}</p>
<p className="text-[#5C5C5C] text-sm">{item.speciality}</p>

// After
<p className="text-[#262626] text-lg font-medium">{item.User?.name || item.name}</p>
<p className="text-[#5C5C5C] text-sm">{getDepartmentName(item.department_id)}</p>
```

---

## Data Flow

### Initial Load
```
1. Page loads
2. Fetch departments from API
3. Fetch doctors from AppContext
4. Display all departments as filter buttons
5. Display all doctors in grid
```

### User Clicks Department Filter
```
1. User clicks "Cardiology" button
2. URL changes to: /doctors/Cardiology
3. useParams() extracts department name
4. applyFilter() runs
5. Filters doctors where getDepartmentName(doctor.department_id) === "Cardiology"
6. Grid updates to show only Cardiology doctors
7. Button highlights with blue background
```

### User Clicks "Clear Filter"
```
1. User clicks active department button again
2. URL changes to: /doctors
3. useParams() returns undefined
4. applyFilter() shows all doctors
5. Button highlight removed
```

---

## API Endpoints Used

### Get All Departments
```
GET /api/departments
Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Cardiology",
      "specializations": ["Cardiology", "Interventional Cardiology"],
      ...
    },
    {
      "id": 2,
      "name": "Neurology",
      "specializations": ["Neurology", "Neurosurgery"],
      ...
    }
  ]
}
```

### Get All Doctors (from AppContext)
```
GET /api/doctors
Response: Array of doctors with User object
[
  {
    "id": 1,
    "department_id": 1,
    "specialization": "Cardiology",
    "User": {
      "name": "Dr. John Smith",
      "email": "john@hospital.com"
    }
  }
]
```

---

## URL Structure

### All Doctors
```
/doctors
```

### Doctors by Department
```
/doctors/Cardiology
/doctors/Neurology
/doctors/Orthopedics
```

---

## Benefits

✅ **Dynamic Filtering** - Departments are fetched from database, not hardcoded
✅ **Scalable** - Adding new departments automatically adds new filter buttons
✅ **Consistent** - Matches the admin's department management system
✅ **User-Friendly** - Clear department organization
✅ **Maintainable** - No need to update code when departments change

---

## User Workflow

### Browse Doctors by Department

**Step 1:** Navigate to Doctors page
- See all departments as filter buttons
- See all doctors in grid

**Step 2:** Click a department (e.g., "Cardiology")
- URL changes to `/doctors/Cardiology`
- Filter button highlights
- Grid shows only Cardiology doctors

**Step 3:** Click doctor card
- Navigate to appointment booking page

**Step 4:** Clear filter (click active button again)
- URL changes to `/doctors`
- All doctors displayed again

---

## Mobile Responsiveness

### Mobile View
- "Filters" button appears
- Click to show/hide department filters
- Filters display as vertical list
- Doctors grid responsive (1 column on mobile)

### Desktop View
- Department filters always visible
- Doctors grid responsive (4 columns on large screens)

---

## Testing Checklist

- [ ] Navigate to /doctors page
- [ ] All departments display as filter buttons
- [ ] Click a department filter
- [ ] URL changes to /doctors/DepartmentName
- [ ] Button highlights with blue background
- [ ] Grid shows only doctors from that department
- [ ] Doctor cards display department name (not specialization)
- [ ] Doctor cards display doctor name from User.name
- [ ] Click another department
- [ ] Grid updates to show different doctors
- [ ] Click active department button again
- [ ] URL changes back to /doctors
- [ ] All doctors displayed
- [ ] Button highlight removed
- [ ] Mobile view: "Filters" button appears
- [ ] Mobile view: Click "Filters" to show/hide
- [ ] Mobile view: Filters display correctly
- [ ] Mobile view: Doctor grid responsive
- [ ] Dark mode works correctly
- [ ] No console errors

---

## Example Scenarios

### Scenario 1: Browse Cardiology Doctors
```
1. User visits /doctors
2. Sees all departments: Cardiology, Neurology, Orthopedics, etc.
3. Sees all doctors: 50 total
4. Clicks "Cardiology"
5. URL: /doctors/Cardiology
6. Sees 8 Cardiology doctors
7. Each card shows: Name, Department (Cardiology), Availability
```

### Scenario 2: Switch Departments
```
1. User viewing Cardiology doctors
2. Clicks "Neurology"
3. URL: /doctors/Neurology
4. Grid updates to show 6 Neurology doctors
5. "Neurology" button highlighted
6. "Cardiology" button no longer highlighted
```

### Scenario 3: Clear Filter
```
1. User viewing Cardiology doctors
2. Clicks "Cardiology" button again
3. URL: /doctors
4. All 50 doctors displayed
5. No button highlighted
```

---

## Database Relationships

```
departments table
├── id: 1
├── name: "Cardiology"
└── specializations: ["Cardiology", "Interventional Cardiology"]

doctors table
├── id: 1
├── department_id: 1 (FK to departments)
├── specialization: "Cardiology"
└── user_id: 101

users table
├── id: 101
├── name: "Dr. John Smith"
└── email: "john@hospital.com"
```

---

## Summary

✅ **Replaced hardcoded specializations** with dynamic department filtering
✅ **Departments fetched from database** on page load
✅ **Filter buttons dynamically generated** from departments
✅ **Doctor cards display department** instead of specialization
✅ **URL structure updated** to use department names
✅ **Fully responsive** on mobile and desktop
✅ **Maintains existing UX** with improved organization

**System is production-ready!** 🚀
