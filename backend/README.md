# Backend - Patient Management System

Modern, secure backend built with Node.js, Express, Sequelize ORM, and Argon2id password hashing.

## 🚀 Features

- ✅ **Secure Authentication** - JWT with refresh tokens in httpOnly cookies
- ✅ **Argon2id Password Hashing** - More secure than bcrypt
- ✅ **SQL Injection Protection** - Parameterized queries via Sequelize ORM
- ✅ **Database Migrations** - Version-controlled database schema
- ✅ **MVC Architecture** - Clean separation of concerns
- ✅ **Role-Based Access Control** - Admin, Doctor, Lab, User roles
- ✅ **Audit Logging** - Track all important actions
- ✅ **File Upload Support** - Secure file handling for avatars, reports
- ✅ **Real-time Notifications** - User notification system
- ✅ **Stripe Integration** - Payment processing for appointments

## 📋 Tech Stack

- **Runtime:** Node.js 16+
- **Framework:** Express.js 5.x
- **Database:** MySQL 5.7+ / MariaDB 10.3+
- **ORM:** Sequelize 6.x
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** Argon2id
- **File Upload:** Multer
- **Payment:** Stripe
- **CORS:** cors middleware
- **Cookie Parsing:** cookie-parser

## 🛠️ Installation

### Prerequisites

- Node.js >= 16.x
- MySQL >= 5.7 or MariaDB >= 10.3
- npm or yarn

### Quick Start

```bash
# 1. Clone the repository (if not already done)
git clone <your-repo-url>
cd backend

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Edit .env with your configuration
nano .env

# 5. Create database
mysql -u root -p
```

```sql
CREATE DATABASE menaxhimi_pacienteve CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

```bash
# 6. Run migrations
npx sequelize-cli db:migrate

# 7. (Optional) Run seeders for test data
npx sequelize-cli db:seed:all

# 8. Start the server
npm start

# Or for development with auto-restart
npm run dev
```

The server should start on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js              # Sequelize configuration
├── controllers/                 # Business logic
│   ├── authController.js        # Authentication
│   ├── userController.js        # User management
│   ├── doctorController.js      # Doctor management
│   ├── appointmentController.js # Appointments
│   ├── laboratoryController.js  # Laboratory management
│   └── notificationController.js# Notifications
├── models/                      # Sequelize models (18 tables)
│   ├── index.js                 # Model loader
│   ├── User.js                  # User model with Argon2 hashing
│   ├── UserProfile.js
│   ├── Doctor.js
│   ├── Laboratory.js
│   ├── Appointment.js
│   ├── Notification.js
│   └── ... (13 more models)
├── routes/                      # API routes
│   ├── auth.js                  # Authentication routes
│   ├── users.js                 # User routes
│   ├── doctorRoutes.js          # Doctor routes
│   ├── laboratoryRoutes.js      # Laboratory routes
│   ├── appointments.js          # Appointment routes
│   └── ... (other routes)
├── middleware/
│   └── auth.js                  # JWT authentication middleware
├── migrations/                  # Database migrations
│   └── 20251014084155-create-all-tables.js
├── seeders/                     # Database seeders (optional)
├── uploads/                     # File upload directory
│   ├── avatars/
│   ├── reports/
│   └── contact-attachments/
├── .sequelizerc                 # Sequelize CLI config
├── .env.example                 # Example environment variables
├── server.js                    # Main application entry point
├── db.js                        # Legacy DB connection (deprecated)
├── package.json
├── MIGRATION_GUIDE.md           # Detailed migration instructions
└── README.md                    # This file
```

## 🔐 Security Features

### 1. Password Hashing - Argon2id

All passwords are hashed using Argon2id (OWASP recommended):

```javascript
// Automatic hashing on user creation/update
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'plaintext'  // Automatically hashed before saving
});

// Verification
const isValid = await user.verifyPassword('plaintext');
```

**Why Argon2id?**
- Winner of Password Hashing Competition (2015)
- Resistant to GPU/ASIC attacks
- Memory-hard function
- Recommended by OWASP

### 2. SQL Injection Protection

All queries use parameterized statements via Sequelize:

```javascript
// ✅ SAFE - Parameterized
const user = await User.findOne({ where: { email: userInput } });

// ❌ NEVER DO THIS
db.query(`SELECT * FROM users WHERE email = '${userInput}'`);
```

### 3. JWT Authentication

- Access tokens (short-lived: 15 minutes)
- Refresh tokens (long-lived: 7 days, stored in httpOnly cookies)
- Token rotation on refresh
- Secure cookie settings in production

### 4. Audit Logging

All important actions are logged:

```javascript
await AuditLog.create({
  user_id: userId,
  action: 'login_success',
  details: 'User logged in from IP: 192.168.1.1',
  ip_address: req.ip,
});
```

## 🌐 API Endpoints

### Authentication

```
POST   /api/auth/signup           # Register new user
POST   /api/auth/login            # Login
POST   /api/auth/logout           # Logout
POST   /api/auth/refresh          # Refresh access token
POST   /api/auth/forgot-password  # Request password reset
POST   /api/auth/reset-password   # Reset password
GET    /api/auth/me               # Get current user
GET    /api/auth/navbar-info      # Get navbar profile info
```

### Users

```
GET    /api/users                 # Get all users (admin)
GET    /api/users/:id             # Get user by ID
PUT    /api/users/:id             # Update user
DELETE /api/users/:id             # Delete user
GET    /api/users/role/:role      # Get users by role
PUT    /api/users/:id/status      # Update user status (admin)
```

### Doctors

```
GET    /api/doctors               # Get all doctors
GET    /api/doctors/available     # Get available doctors
GET    /api/doctors/:id           # Get doctor by ID
GET    /api/doctors/user/:userId  # Get doctor by user ID
POST   /api/doctors               # Create doctor (admin)
PUT    /api/doctors/:id           # Update doctor
DELETE /api/doctors/:id           # Delete doctor
GET    /api/doctors/:id/appointments  # Get doctor's appointments
GET    /api/doctors/search        # Search doctors
```

### Appointments

```
GET    /api/appointments          # Get all appointments
GET    /api/appointments/:id      # Get appointment by ID
GET    /api/appointments/user/:userId     # Get user's appointments
GET    /api/appointments/doctor/:doctorId # Get doctor's appointments
POST   /api/appointments          # Create appointment
PUT    /api/appointments/:id      # Update appointment
DELETE /api/appointments/:id      # Cancel appointment
GET    /api/appointments/slots    # Get available time slots
```

### Notifications

```
GET    /api/notifications         # Get user's notifications
GET    /api/notifications/:id     # Get notification by ID
POST   /api/notifications         # Create notification
PUT    /api/notifications/:id/read  # Mark as read
PUT    /api/notifications/read-all # Mark all as read
DELETE /api/notifications/:id     # Delete notification
GET    /api/notifications/unread-count  # Get unread count
POST   /api/notifications/broadcast     # Send broadcast (admin)
```

### Laboratories

```
GET    /api/labs                  # Get all laboratories
GET    /api/labs/:id              # Get laboratory by ID
GET    /api/labs/user/:userId     # Get lab by user ID
POST   /api/labs                  # Create laboratory
PUT    /api/labs/:id              # Update laboratory
DELETE /api/labs/:id              # Delete laboratory
GET    /api/labs/:id/analyses     # Get lab analyses
GET    /api/labs/:id/types        # Get analysis types
POST   /api/labs/types            # Create analysis type
PUT    /api/labs/types/:id        # Update analysis type
DELETE /api/labs/types/:id        # Delete analysis type
```

*See individual route files for complete endpoint documentation.*

## 🗄️ Database Models

### Core Models

1. **User** - User accounts with Argon2 password hashing
2. **UserProfile** - Extended user profile information
3. **Doctor** - Doctor profiles and information
4. **Laboratory** - Laboratory profiles
5. **Appointment** - Doctor appointments
6. **Notification** - User notifications
7. **Message** - Internal messaging system
8. **PatientAnalysis** - Patient analysis records
9. **AnalysisType** - Available analysis types
10. **RefreshToken** - JWT refresh tokens
11. **AuditLog** - System audit trail

*Total: 18 models covering all system functionality*

### Relationships

```
User
├── hasOne UserProfile
├── hasOne AdminProfile
├── hasOne Doctor
├── hasOne Laboratory
├── hasMany RefreshToken
├── hasMany Notification (received)
├── hasMany Notification (sent)
├── hasMany Message (sent)
├── hasMany Message (received)
├── hasMany Appointment
├── hasMany PatientAnalysis
└── hasMany AuditLog

Doctor
├── belongsTo User
└── hasMany Appointment

Laboratory
├── belongsTo User
├── hasMany AnalysisType
└── hasMany PatientAnalysis

Appointment
├── belongsTo User
└── belongsTo Doctor
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=menaxhimi_pacienteve

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-secret-key
REFRESH_SECRET=your-refresh-secret

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Database Connection

Sequelize configuration in `config/database.js`:

```javascript
{
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: 'mysql',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  }
}
```

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"Test123!"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

## 📊 Migrations

### Create Migration

```bash
npx sequelize-cli migration:generate --name add-new-field
```

### Run Migrations

```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all
```

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot find module 'sequelize'"**
   ```bash
   npm install
   ```

2. **"Access denied for user"**
   - Check `.env` DB credentials
   - Ensure MySQL is running

3. **"Table doesn't exist"**
   ```bash
   npx sequelize-cli db:migrate
   ```

4. **"Port already in use"**
   - Change PORT in `.env`
   - Or kill process: `lsof -ti:5000 | xargs kill` (Mac/Linux)

## 📚 Documentation

- [Migration Guide](./MIGRATION_GUIDE.md) - Detailed migration from old system
- [Sequelize Docs](https://sequelize.org/docs/v6/)
- [Express Docs](https://expressjs.com/)
- [Argon2 Docs](https://github.com/ranisalt/node-argon2)

## 🔄 Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes to models/controllers/routes

# 3. Create migration if schema changed
npx sequelize-cli migration:generate --name add-feature-table

# 4. Test locally
npm start

# 5. Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 6. Create pull request
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use strong, unique JWT secrets
- [ ] Enable SSL for database connection
- [ ] Configure CORS for production domain
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure automated backups
- [ ] Set up rate limiting
- [ ] Use a process manager (PM2, Docker)
- [ ] Configure logging
- [ ] Enable HTTPS

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start server.js --name "patient-management-api"

# Monitor
pm2 monit

# Auto-restart on server reboot
pm2 startup
pm2 save
```

## 📝 License

[Your License Here]

## 👥 Contributors

[Your Team Here]

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Email: support@yourdomain.com

---

**Built with ❤️ using modern security best practices**

