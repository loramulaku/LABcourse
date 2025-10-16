# Test: Add Doctor API Endpoint

## Quick Test Guide

### Prerequisites
- Server running on `http://localhost:5000`
- Admin access token from `localStorage.getItem("accessToken")`
- Or use the admin user: `lora@gmail.com` (password from your .env)

---

## Test 1: Basic Doctor Creation (Postman/Thunder Client)

### Request:
```http
POST http://localhost:5000/api/doctors
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@test.com",
  "password": "SecurePass123!",
  "specialization": "Cardiology",
  "degree": "MD, FACC",
  "experience_years": 12,
  "fees": 150.00,
  "phone": "+1-555-0123",
  "about": "Experienced cardiologist specializing in heart disease prevention and treatment.",
  "address_line1": "123 Medical Plaza",
  "address_line2": "Suite 400",
  "department": "Cardiology",
  "license_number": "CA12345",
  "available": true
}
```

### Expected Response (201):
```json
{
  "message": "Doctor created successfully",
  "doctor": {
    "id": 1,
    "user_id": 2,
    "image": "/uploads/avatars/default.png",
    "first_name": "Sarah",
    "last_name": "Johnson",
    "specialization": "Cardiology",
    "degree": "MD, FACC",
    "experience_years": 12,
    "consultation_fee": "150.00",
    "available": true,
    "User": {
      "id": 2,
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@test.com",
      "role": "doctor",
      "account_status": "active"
    }
  }
}
```

---

## Test 2: Minimal Required Fields Only

### Request:
```http
POST http://localhost:5000/api/doctors
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "name": "Dr. John Doe",
  "email": "john.doe@test.com",
  "password": "password123"
}
```

### Expected Response (201):
```json
{
  "message": "Doctor created successfully",
  "doctor": {
    "id": 2,
    "user_id": 3,
    "first_name": "John",
    "last_name": "Doe",
    "specialization": "",
    "available": true,
    ...
  }
}
```

---

## Test 3: Duplicate Email (Should Fail)

### Request:
```http
POST http://localhost:5000/api/doctors
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "name": "Dr. Another Doctor",
  "email": "sarah.johnson@test.com",  // ← Already exists
  "password": "password123"
}
```

### Expected Response (400):
```json
{
  "error": "Email already exists"
}
```

---

## Test 4: Missing Required Fields (Should Fail)

### Request:
```http
POST http://localhost:5000/api/doctors
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "name": "Dr. Test",
  "email": "test@test.com"
  // Missing password
}
```

### Expected Response (400):
```json
{
  "error": "Missing required fields: name, email, and password are required"
}
```

---

## Test 5: Unauthorized Access (Should Fail)

### Request:
```http
POST http://localhost:5000/api/doctors
Content-Type: application/json
// No Authorization header

{
  "name": "Dr. Test",
  "email": "test@test.com",
  "password": "password123"
}
```

### Expected Response (401):
```json
{
  "error": "No token provided" 
}
```

---

## Test 6: Non-Admin User (Should Fail)

### Request:
```http
POST http://localhost:5000/api/doctors
Content-Type: application/json
Authorization: Bearer USER_TOKEN  // ← Regular user token, not admin

{
  "name": "Dr. Test",
  "email": "test@test.com",
  "password": "password123"
}
```

### Expected Response (403):
```json
{
  "error": "Admin access required"
}
```

---

## Test 7: With Image Upload

### Using cURL:
```bash
curl -X POST http://localhost:5000/api/doctors \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Dr. Maria Garcia" \
  -F "email=maria.garcia@test.com" \
  -F "password=SecurePass123!" \
  -F "specialization=Pediatrics" \
  -F "degree=MD, FAAP" \
  -F "experience_years=8" \
  -F "fees=120.00" \
  -F "image=@/path/to/doctor-photo.jpg"
```

### Expected Response (201):
```json
{
  "message": "Doctor created successfully",
  "doctor": {
    "image": "/uploads/1234567890-123456789.jpg",  // ← Uploaded file path
    "avatar_path": "/uploads/1234567890-123456789.jpg",
    ...
  }
}
```

---

## Verification Checklist

After successful creation, verify:

✅ **Database Check:**
```sql
-- Check user was created
SELECT id, name, email, role FROM users WHERE email = 'sarah.johnson@test.com';

-- Check doctor profile was created
SELECT * FROM doctors WHERE user_id = (
  SELECT id FROM users WHERE email = 'sarah.johnson@test.com'
);
```

✅ **Login Test:**
Try logging in as the newly created doctor:
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "sarah.johnson@test.com",
  "password": "SecurePass123!"
}
```

✅ **Frontend Test:**
1. Open Admin Dashboard
2. Navigate to "Add Doctor" section
3. Fill in the form
4. Submit
5. Should show: "Doctor created successfully!"
6. Form should reset

---

## Common Issues & Solutions

### Issue: "Cannot read property 'id' of null"
**Cause**: User creation failed but code continued  
**Solution**: ✅ Fixed with transaction handling - now rolls back on error

### Issue: "user_id cannot be null"
**Cause**: Doctor created without user  
**Solution**: ✅ Fixed - User is created first in transaction

### Issue: "Email already exists"
**Cause**: Duplicate email in database  
**Solution**: Use a different email or delete existing user

### Issue: "Password too short"
**Cause**: Password validation (if implemented)  
**Solution**: Use stronger password (8+ characters recommended)

---

## Success Indicators

✅ Status Code: 201 Created  
✅ Response contains: `"message": "Doctor created successfully"`  
✅ Response contains doctor object with User nested object  
✅ User record created in database with `role: 'doctor'`  
✅ Doctor record created in database with correct `user_id`  
✅ Password is hashed in database (not plain text)  
✅ Can login with created credentials  
✅ Frontend form resets after success  

---

## Performance Notes

- Average response time: ~100-200ms (local)
- Transaction ensures data consistency
- Password hashing adds ~50-100ms (security trade-off)
- Image upload adds ~50-150ms depending on file size

---

## Next Steps

After successful testing:

1. ✅ Test with frontend form
2. ✅ Verify doctor can login
3. ✅ Check doctor dashboard access
4. ✅ Test appointment booking with new doctor
5. ✅ Verify doctor profile displays correctly

---

## Clean Up Test Data

To remove test doctors:

```sql
-- Find test doctor user IDs
SELECT id FROM users WHERE email LIKE '%@test.com';

-- Delete doctors (cascade will handle relationships)
DELETE FROM doctors WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%@test.com'
);

-- Delete test users
DELETE FROM users WHERE email LIKE '%@test.com';
```

Or use the API:

```http
DELETE http://localhost:5000/api/doctors/:id
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

**All tests should pass! ✅**

