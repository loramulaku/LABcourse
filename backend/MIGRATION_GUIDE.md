# 🚀 Migration Guide: Modern Backend Architecture

## Overview

This guide will help you migrate from the old manual SQL-based backend to the new modern architecture featuring:

- ✅ **Sequelize ORM** with parameterized queries (SQL injection protection)
- ✅ **Argon2id password hashing** (more secure than bcrypt)
- ✅ **Database migrations** for version control
- ✅ **Controllers** for clean separation of concerns
- ✅ **Proper MVC architecture**

## 📋 Prerequisites

Make sure you have:
- Node.js >= 16.x
- MySQL >= 5.7 or MariaDB >= 10.3
- Existing database with data (if migrating)

## 🛠️ Installation Steps

### 1. Install Dependencies

All required packages are already in `package.json`. If starting fresh:

```bash
cd backend
npm install
```

The key new dependencies are:
- `sequelize` - ORM for MySQL
- `sequelize-cli` - Migration management
- `argon2` - Secure password hashing

### 2. Configure Environment Variables

Create/update your `.env` file in the `backend` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=menaxhimi_pacienteve
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS and password reset links)
FRONTEND_URL=http://localhost:5173

# Stripe (if using payments)
STRIPE_SECRET_KEY=your_stripe_key
```

### 3. Database Setup

#### Option A: Fresh Installation (New Database)

If you're starting from scratch:

```bash
# Create the database
mysql -u root -p
```

```sql
CREATE DATABASE menaxhimi_pacienteve CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

```bash
# Run migrations to create all tables
cd backend
npx sequelize-cli db:migrate
```

#### Option B: Migration from Existing Database

If you already have data in your old database:

**⚠️ IMPORTANT: Back up your database first!**

```bash
# Back up your existing database
mysqldump -u root -p menaxhimi_pacienteve > backup_$(date +%Y%m%d).sql
```

**Strategy 1: Keep existing tables (Recommended for production)**

The new system is designed to work with your existing tables. You just need to:

1. Update passwords to Argon2 format (see Password Migration section below)
2. Start using the new code - it will work with existing tables

**Strategy 2: Fresh start with data migration**

```bash
# 1. Export your data
mysqldump -u root -p menaxhimi_pacienteve --no-create-info --complete-insert > data_export.sql

# 2. Drop all tables
mysql -u root -p menaxhimi_pacienteve < drop_all_tables.sql

# 3. Run migrations
npx sequelize-cli db:migrate

# 4. Import data (may need adjustments for foreign keys)
mysql -u root -p menaxhimi_pacienteve < data_export.sql
```

### 4. Password Migration

**⚠️ CRITICAL: Existing bcrypt passwords need migration**

The new system uses Argon2id. You have two options:

#### Option A: Gradual Migration (Recommended)

Users' passwords will be automatically upgraded to Argon2 when they next log in.

Add this temporary code to `authController.js` login method (already included):

```javascript
// After password verification
if (match && !user.password.startsWith('$argon2id')) {
  // Upgrade to Argon2
  await user.update({ password: password }); // Will auto-hash with Argon2
}
```

#### Option B: Force Password Reset

Send password reset emails to all users asking them to reset passwords.

```bash
# Run this script to mark all users for password reset
node scripts/mark_password_reset.js
```

### 5. Start the Server

```bash
cd backend
npm start
# or for development with auto-restart
npm run dev
```

You should see:
```
✅ Sequelize database connection established successfully
🚀 Server po punon në portën 5000
```

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Sequelize configuration
├── controllers/             # Business logic
│   ├── authController.js
│   ├── userController.js
│   ├── doctorController.js
│   ├── appointmentController.js
│   ├── laboratoryController.js
│   └── notificationController.js
├── models/                  # Sequelize models (18 tables)
│   ├── index.js
│   ├── User.js
│   ├── UserProfile.js
│   ├── Doctor.js
│   ├── Laboratory.js
│   ├── Appointment.js
│   ├── Notification.js
│   ├── Message.js
│   ├── PatientAnalysis.js
│   ├── AnalysisType.js
│   ├── AnalysisHistory.js
│   ├── RefreshToken.js
│   ├── AdminProfile.js
│   ├── MessageSender.js
│   ├── ContactMessageRedirect.js
│   ├── DoctorApplication.js
│   ├── PasswordResetToken.js
│   └── AuditLog.js
├── routes/                  # API routes
│   ├── auth.js
│   ├── users.js
│   ├── doctorRoutes.js
│   └── ...
├── migrations/              # Database migrations
│   └── 20251014084155-create-all-tables.js
├── middleware/
│   └── auth.js             # JWT authentication
├── .sequelizerc            # Sequelize CLI config
├── server.js               # Main entry point
└── package.json
```

## 🔐 Security Improvements

### 1. SQL Injection Protection

**Before (Vulnerable):**
```javascript
db.query(`SELECT * FROM users WHERE email = '${email}'`); // ❌ NEVER DO THIS
```

**After (Secure):**
```javascript
// Sequelize automatically parameterizes queries
User.findOne({ where: { email } }); // ✅ Safe
```

### 2. Password Hashing

**Before (bcrypt):**
```javascript
bcrypt.hash(password, 10); // Salt rounds: 10
```

**After (Argon2id - More secure):**
```javascript
argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,    // 64 MB
  timeCost: 3,
  parallelism: 4,
});
```

Why Argon2id?
- Winner of Password Hashing Competition (2015)
- Resistant to GPU/ASIC attacks
- More memory-intensive than bcrypt
- Recommended by OWASP

### 3. Input Validation

All models include validation:
```javascript
email: {
  type: DataTypes.STRING(150),
  validate: {
    isEmail: true,  // ✅ Validates email format
  },
}
```

## 🔄 Migration Commands

### Creating New Migrations

```bash
# Generate a new migration
npx sequelize-cli migration:generate --name add-new-field

# Run pending migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all
```

### Migration Best Practices

1. **Always backup** before running migrations in production
2. **Test migrations** on a development database first
3. **Use transactions** for data integrity
4. **Never edit** old migrations - create new ones
5. **Version control** all migration files

## 📊 Database Tables

All 18 tables are now managed by migrations:

1. **users** - Core user accounts
2. **user_profiles** - User profile data
3. **refresh_tokens** - JWT refresh tokens
4. **admin_profiles** - Admin profile data
5. **doctors** - Doctor profiles
6. **laboratories** - Laboratory profiles
7. **analysis_types** - Available analysis tests
8. **patient_analyses** - Patient analysis records
9. **analysis_history** - Audit trail for analyses
10. **notifications** - User notifications
11. **messages** - Internal messaging
12. **message_senders** - Contact form senders
13. **contact_message_redirects** - Message routing
14. **appointments** - Doctor appointments
15. **doctor_applications** - Doctor registration requests
16. **password_reset_tokens** - Password reset tokens
17. **audit_logs** - System audit trail

## 🧪 Testing the Migration

### 1. Test User Registration

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### 2. Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. Check Password Hash

```sql
-- Old system (bcrypt)
SELECT password FROM users WHERE email = 'old@example.com';
-- Result: $2b$10$abcd...

-- New system (argon2id)
SELECT password FROM users WHERE email = 'new@example.com';
-- Result: $argon2id$v=19$m=65536,t=3,p=4$...
```

## 🐛 Troubleshooting

### Issue: "Cannot find module 'sequelize'"

**Solution:**
```bash
cd backend
npm install
```

### Issue: "Access denied for user"

**Solution:** Check your `.env` file credentials:
```env
DB_USER=root
DB_PASSWORD=your_actual_password
```

### Issue: "Table doesn't exist"

**Solution:** Run migrations:
```bash
npx sequelize-cli db:migrate
```

### Issue: "Password verification fails after migration"

**Solution:** Passwords need to be re-hashed in Argon2 format. Use gradual migration approach.

### Issue: "Foreign key constraint fails"

**Solution:** Check that parent records exist before creating child records.

## 📈 Performance Considerations

### Connection Pooling

Sequelize automatically manages connection pooling:

```javascript
pool: {
  max: 10,          // Maximum connections
  min: 0,           // Minimum connections
  acquire: 30000,   // Max time to get connection
  idle: 10000,      // Max idle time
}
```

### Query Optimization

```javascript
// Include only needed fields
User.findAll({
  attributes: ['id', 'name', 'email'],
  where: { role: 'user' }
});

// Use indexes (already defined in models)
// Indexes on: email, role, user_id, etc.
```

## 🔒 Security Checklist

- [x] Parameterized queries (via Sequelize)
- [x] Argon2id password hashing
- [x] JWT with secure httpOnly cookies
- [x] Input validation on models
- [x] CORS configuration
- [x] Audit logging
- [x] Foreign key constraints
- [x] No sensitive data in error messages (production)

## 📚 Additional Resources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Argon2 Password Hashing](https://github.com/P-H-C/phc-winner-argon2)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)

## 🆘 Getting Help

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify `.env` configuration
3. Ensure database is running and accessible
4. Check that migrations have been run
5. Review the troubleshooting section above

## 🎉 Success!

If you see no errors and can successfully:
- ✅ Register a new user
- ✅ Login with credentials
- ✅ Access protected routes
- ✅ See Argon2id password hashes in database

Then your migration is complete! 🚀

---

**Next Steps:**
- Update frontend to use new API endpoints (if needed)
- Test all user flows thoroughly
- Monitor logs for any issues
- Consider implementing rate limiting
- Set up automated backups

