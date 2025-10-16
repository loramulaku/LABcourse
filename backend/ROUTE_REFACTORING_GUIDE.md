# 🔄 Route Refactoring Guide

## Overview

This guide shows how to refactor the remaining routes to use controllers and Sequelize models. The auth routes have been fully refactored as a reference example.

## ✅ Already Completed

- ✅ **auth.js** - Fully refactored to use `authController.js`
- ✅ **Controllers Created:** auth, user, doctor, appointment, laboratory, notification

## 📋 Remaining Routes to Refactor

The following route files can be refactored using the same pattern:

1. `users.js` - Use `userController.js` (already created)
2. `doctorRoutes.js` - Use `doctorController.js` (already created)
3. `laboratoryRoutes.js` - Use `laboratoryController.js` (already created)
4. `appointments.js` - Use `appointmentController.js` (already created)
5. `notificationRoutes.js` - Use `notificationController.js` (already created)
6. `patientRoutes.js` - Create `patientController.js`
7. `profile.js` - Create `profileController.js`
8. `adminProfile.js` - Create `adminProfileController.js`
9. `doctorApplications.js` - Create `doctorApplicationController.js`
10. `contactRoutes.js` - Create `contactController.js`
11. `therapyRoutes.js` - Create `therapyController.js`
12. `trainRoutes.js` - Create `trainController.js`
13. `lecturerRoutes.js` - Create `lecturerController.js`

## 🎯 Refactoring Pattern

### Before (Old Pattern)

```javascript
// routes/users.js
const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/users', async (req, res) => {
  try {
    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE role = ?',
      [req.query.role]
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### After (New Pattern)

**1. Create Controller (`controllers/userController.js`):**

```javascript
const { User, UserProfile } = require('../models');

const userController = {
  async getUsersByRole(req, res) {
    try {
      const users = await User.findAll({
        where: { role: req.query.role },
        attributes: { exclude: ['password'] },
        include: [{ model: UserProfile }]
      });
      res.json(users);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
};

module.exports = userController;
```

**2. Update Route (`routes/users.js`):**

```javascript
const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/users', authenticateToken, isAdmin, userController.getUsersByRole);

module.exports = router;
```

## 📝 Step-by-Step Refactoring

### Example: Refactoring `users.js`

#### Step 1: Read current route file

```bash
# See what endpoints exist
cat routes/users.js
```

#### Step 2: Update existing or create new controller

The `userController.js` is already created with these methods:
- `getAllUsers()` - GET /users
- `getUserById()` - GET /users/:id
- `updateUser()` - PUT /users/:id
- `deleteUser()` - DELETE /users/:id
- `getUsersByRole()` - GET /users/role/:role
- `updateUserStatus()` - PUT /users/:id/status

#### Step 3: Refactor route file

```javascript
const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, isAdmin, userController.getAllUsers);

// Get user by ID
router.get('/:id', authenticateToken, userController.getUserById);

// Update user
router.put('/:id', authenticateToken, userController.updateUser);

// Delete user (admin only)
router.delete('/:id', authenticateToken, isAdmin, userController.deleteUser);

// Get users by role (admin only)
router.get('/role/:role', authenticateToken, isAdmin, userController.getUsersByRole);

// Update user status (admin only)
router.put('/:id/status', authenticateToken, isAdmin, userController.updateUserStatus);

module.exports = router;
```

## 🔧 Converting Raw SQL to Sequelize

### Common Conversions

#### 1. SELECT Query

**Before (Raw SQL):**
```javascript
const [rows] = await db.promise().query(
  'SELECT * FROM users WHERE email = ?',
  [email]
);
```

**After (Sequelize):**
```javascript
const user = await User.findOne({
  where: { email }
});
```

#### 2. SELECT with JOIN

**Before (Raw SQL):**
```javascript
const [rows] = await db.promise().query(`
  SELECT u.*, p.phone, p.address 
  FROM users u 
  LEFT JOIN user_profiles p ON u.id = p.user_id 
  WHERE u.role = ?
`, [role]);
```

**After (Sequelize):**
```javascript
const users = await User.findAll({
  where: { role },
  include: [{
    model: UserProfile,
    attributes: ['phone', 'address']
  }]
});
```

#### 3. INSERT

**Before (Raw SQL):**
```javascript
const [result] = await db.promise().query(
  'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
  [name, email, hashedPassword]
);
```

**After (Sequelize):**
```javascript
const user = await User.create({
  name,
  email,
  password  // Auto-hashed by model hook
});
```

#### 4. UPDATE

**Before (Raw SQL):**
```javascript
await db.promise().query(
  'UPDATE users SET name = ?, email = ? WHERE id = ?',
  [name, email, userId]
);
```

**After (Sequelize):**
```javascript
await User.update(
  { name, email },
  { where: { id: userId } }
);

// Or with instance
const user = await User.findByPk(userId);
await user.update({ name, email });
```

#### 5. DELETE

**Before (Raw SQL):**
```javascript
await db.promise().query(
  'DELETE FROM users WHERE id = ?',
  [userId]
);
```

**After (Sequelize):**
```javascript
await User.destroy({
  where: { id: userId }
});

// Or with instance
const user = await User.findByPk(userId);
await user.destroy();
```

#### 6. COUNT

**Before (Raw SQL):**
```javascript
const [[{ count }]] = await db.promise().query(
  'SELECT COUNT(*) as count FROM users WHERE role = ?',
  [role]
);
```

**After (Sequelize):**
```javascript
const count = await User.count({
  where: { role }
});
```

## 📚 Common Sequelize Patterns

### 1. Find One

```javascript
const user = await User.findOne({
  where: { email: 'test@example.com' }
});
```

### 2. Find By Primary Key

```javascript
const user = await User.findByPk(userId);
```

### 3. Find All with Conditions

```javascript
const doctors = await Doctor.findAll({
  where: {
    specialization: 'Cardiology',
    available: true
  },
  order: [['first_name', 'ASC']],
  limit: 10,
  offset: 0
});
```

### 4. Find with OR Condition

```javascript
const { Op } = require('sequelize');

const users = await User.findAll({
  where: {
    [Op.or]: [
      { email: searchTerm },
      { name: { [Op.like]: `%${searchTerm}%` } }
    ]
  }
});
```

### 5. Include Related Models

```javascript
const appointment = await Appointment.findByPk(id, {
  include: [
    {
      model: User,
      attributes: ['id', 'name', 'email']
    },
    {
      model: Doctor,
      include: [{
        model: User,
        attributes: ['name']
      }]
    }
  ]
});
```

### 6. Create with Association

```javascript
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123'
});

await UserProfile.create({
  user_id: user.id,
  phone: '1234567890'
});
```

### 7. Update with Conditions

```javascript
await Notification.update(
  { is_read: true },
  {
    where: {
      user_id: userId,
      is_read: false
    }
  }
);
```

### 8. Bulk Create

```javascript
await Notification.bulkCreate([
  { user_id: 1, title: 'Test 1', message: 'Message 1' },
  { user_id: 2, title: 'Test 2', message: 'Message 2' }
]);
```

## 🎯 Controller Method Naming Convention

Follow these conventions for consistency:

- `getAll{Model}s` - Get all records
- `get{Model}ById` - Get single record by ID
- `get{Model}By{Field}` - Get by specific field
- `create{Model}` - Create new record
- `update{Model}` - Update existing record
- `delete{Model}` - Delete record
- `search{Model}s` - Search with filters

Examples:
- `getAllUsers()`
- `getDoctorById()`
- `getDoctorByUserId()`
- `createAppointment()`
- `updateNotification()`
- `deletePatientAnalysis()`
- `searchDoctors()`

## 🔐 Security Checklist

When refactoring, ensure:

- [ ] No raw SQL with string concatenation
- [ ] Use Sequelize parameterized queries
- [ ] Validate user input
- [ ] Check authentication (`authenticateToken`)
- [ ] Check authorization (role-based access)
- [ ] Sanitize error messages (don't expose sensitive data)
- [ ] Use `attributes: { exclude: ['password'] }` when fetching users
- [ ] Log important actions to `AuditLog`

## 🧪 Testing Each Refactored Route

```bash
# 1. Test GET endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/users

# 2. Test POST endpoint
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com"}' \
  http://localhost:5000/api/users

# 3. Test PUT endpoint
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}' \
  http://localhost:5000/api/users/1

# 4. Test DELETE endpoint
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/users/1
```

## 📋 Refactoring Checklist

For each route file:

- [ ] Read current route file and list all endpoints
- [ ] Create/update corresponding controller
- [ ] Convert raw SQL queries to Sequelize
- [ ] Move business logic to controller
- [ ] Keep only route definitions in route file
- [ ] Add proper error handling
- [ ] Test all endpoints
- [ ] Update any frontend API calls if needed
- [ ] Document new endpoints

## 💡 Tips

1. **Start Simple** - Begin with routes that have simple CRUD operations
2. **Test Frequently** - Test after refactoring each route
3. **Keep Old Files** - Don't delete old route files until thoroughly tested
4. **Use Git** - Commit after each successful refactor
5. **Check Logs** - Monitor console for Sequelize query logs
6. **Read Docs** - Refer to Sequelize documentation for complex queries

## 🎓 Learning Resources

- [Sequelize Docs](https://sequelize.org/docs/v6/)
- [Sequelize Querying](https://sequelize.org/docs/v6/core-concepts/model-querying-basics/)
- [Sequelize Associations](https://sequelize.org/docs/v6/core-concepts/assocs/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

## 🆘 Getting Help

If you get stuck:

1. Check the `authController.js` reference implementation
2. Look at model definitions in `models/` directory
3. Review this guide's examples
4. Check Sequelize documentation
5. Look at console logs for query errors

---

**Remember:** The auth routes are fully refactored and serve as a complete reference. Follow that pattern for all other routes!

