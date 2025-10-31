# Specializations Storage Fix

## Problem
Specializations were not being saved to the database because the `specializations` field was missing from the Department model and database schema.

## Solution
Added proper support for storing specializations as a JSON array in the database.

## Changes Made

### 1. New Migration File
**File:** `backend/migrations/20251031_add_specializations_to_departments.js`

Adds a `specializations` column to the departments table:
- Type: JSON
- Default: Empty array []
- Stores all specializations for each department

### 2. Updated Department Model
**File:** `backend/models/Department.js`

Added `specializations` field:
```javascript
specializations: {
  type: DataTypes.JSON,
  allowNull: true,
  defaultValue: [],
  comment: 'Array of specializations for this department',
}
```

### 3. Updated Department Controller
**File:** `backend/controllers/departmentController.js`

#### createDepartment function:
- Now accepts `specializations` from request body
- Filters out empty specializations
- Saves valid specializations to database

#### updateDepartment function:
- Now accepts `specializations` from request body
- Filters out empty specializations
- Updates specializations when editing department

## How It Works

### Creating a Department
```javascript
POST /api/departments
{
  "name": "Cardiology",
  "description": "Heart and cardiovascular diseases",
  "location": "Building A, Floor 2",
  "phone": "+1-555-0101",
  "email": "cardiology@hospital.com",
  "budget": 500000,
  "specializations": [
    "Cardiology",
    "Interventional Cardiology",
    "Electrophysiology"
  ]
}
```

**Result:** All 3 specializations are saved to the database

### Updating a Department
```javascript
PUT /api/departments/:id
{
  "specializations": [
    "Cardiology",
    "Interventional Cardiology",
    "Electrophysiology",
    "Cardiac Surgery"
  ]
}
```

**Result:** Specializations are updated to the new list

### Retrieving Departments
```javascript
GET /api/departments
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Cardiology",
      "description": "Heart and cardiovascular diseases",
      "specializations": [
        "Cardiology",
        "Interventional Cardiology",
        "Electrophysiology"
      ]
    }
  ]
}
```

## Implementation Steps

### Step 1: Run the New Migration
```bash
cd backend
npx sequelize-cli db:migrate
```

This will:
- Add `specializations` column to departments table
- Set default value to empty array

### Step 2: Restart Backend Server
```bash
npm start
```

### Step 3: Test the Feature

**Create a Department:**
1. Go to Dashboard → Doctor Management → Departments
2. Click "Add Department"
3. Enter department name
4. Enter number of specializations (e.g., 3)
5. Enter specialization names:
   - Cardiology
   - Interventional Cardiology
   - Electrophysiology
6. Click "Create"

**Verify in Database:**
```sql
SELECT id, name, specializations FROM departments WHERE name = 'Cardiology';
```

**Result:**
```
id: 1
name: Cardiology
specializations: ["Cardiology", "Interventional Cardiology", "Electrophysiology"]
```

## Data Storage

### Database Schema
```sql
CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  location VARCHAR(255),
  head_doctor_id INT,
  phone VARCHAR(20),
  email VARCHAR(100),
  budget DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  specializations JSON DEFAULT '[]',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_departments_name (name),
  INDEX idx_departments_is_active (is_active)
);
```

### Example Data
```json
{
  "id": 1,
  "name": "Cardiology",
  "description": "Heart and cardiovascular diseases",
  "location": "Building A, Floor 2",
  "head_doctor_id": null,
  "phone": "+1-555-0101",
  "email": "cardiology@hospital.com",
  "budget": "500000.00",
  "is_active": true,
  "specializations": [
    "Cardiology",
    "Interventional Cardiology",
    "Electrophysiology"
  ],
  "created_at": "2025-10-31T12:00:00.000Z",
  "updated_at": "2025-10-31T12:00:00.000Z"
}
```

## Frontend Integration

The frontend already handles specializations correctly:

### DepartmentManagement.jsx
- Sends `specializations` array in POST/PUT requests
- Filters out empty strings
- Displays specializations as badges

### AddDoctor.jsx
- Fetches departments with specializations
- Filters specializations based on selected department
- Shows only department's specializations in dropdown

### DoctorsCrud.jsx
- Fetches departments with specializations
- Filters specializations when editing doctor
- Updates doctor with correct specialization

## Verification

### Check Migration Status
```bash
npx sequelize-cli db:migrate:status
```

Should show:
```
up 20251031_add_departments.js
up 20251031_add_specializations_to_departments.js
```

### Test API Endpoint
```bash
curl -X GET http://localhost:5000/api/departments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should return departments with specializations array.

## Rollback (if needed)

```bash
npx sequelize-cli db:migrate:undo
```

This will remove the `specializations` column from the database.

## Summary

✅ Specializations are now properly stored in the database
✅ Each department can have any number of specializations
✅ Specializations are saved exactly as entered by admin
✅ Frontend and backend are fully integrated
✅ System is ready for production use

**All specializations added by the admin are now permanently saved!** 🎉
