# ⚡ OOP Quick Start Guide

## 🚀 Switch to OOP Architecture in 3 Steps

### Step 1: Use OOP Routes (2 minutes)

**Update `server.js`:**

```javascript
// Comment out old routes
// const authRoutes = require("./routes/auth");

// Add OOP routes
const authRoutes = require("./routes/oop/auth");

// Keep the same route path
app.use("/api/auth", authRoutes);
```

That's it! The API endpoints remain the same.

### Step 2: Test It Works (1 minute)

```bash
# Start server
npm start

# Test signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"pass123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'
```

### Step 3: Enjoy the Benefits! ✨

You now have:
- ✅ **Clean architecture** (Controller → Service → Repository → Model)
- ✅ **Proper error handling** (Custom error classes)
- ✅ **Input validation** (Validators)
- ✅ **Data sanitization** (DTOs)
- ✅ **Testable code** (Dependency injection)

## 📊 What Changed?

### Before (Functional)
```
Route
  └── All logic mixed together
      ├── Validation
      ├── Database queries
      ├── Business logic
      └── Response
```

### After (OOP)
```
Route
  └── Controller (HTTP handling)
      └── Service (Business logic)
          ├── Validator (Input validation)
          ├── DTO (Data transfer)
          └── Repository (Data access)
              └── Model (Database)
```

## 🎯 Key Differences

### Old Way (Functional)
```javascript
// routes/auth.js
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  const [users] = await db.promise().query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  
  if (users.length === 0) {
    return res.status(401).json({ error: 'Invalid' });
  }
  
  const user = users[0];
  const match = await bcrypt.compare(password, user.password);
  
  if (!match) {
    return res.status(401).json({ error: 'Invalid' });
  }
  
  const token = jwt.sign({ id: user.id }, secret);
  res.json({ token });
});
```

### New Way (OOP)
```javascript
// routes/oop/auth.js
router.post('/login', authController.asyncHandler(authController.login));

// controllers/oop/AuthController.js
async login(req, res) {
  try {
    const result = await this.authService.login(req.body, req.ip);
    this.tokenService.setRefreshCookie(res, result.refreshToken);
    return this.success(res, {
      accessToken: result.accessToken,
      user: result.user
    });
  } catch (error) {
    if (error instanceof AppError) {
      return this.error(res, error, error.statusCode);
    }
    return this.error(res, error);
  }
}

// services/AuthService.js
async login(loginData, ipAddress) {
  AuthValidator.validateLogin(loginData);
  const dto = new LoginDTO(loginData);
  const user = await this.userRepository.findByEmail(dto.email);
  
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  const isValid = await user.verifyPassword(dto.password);
  if (!isValid) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  const tokens = this.tokenService.generateTokenPair(user);
  await this.refreshTokenRepository.createToken(user.id, tokens.refreshToken);
  await this.auditLogRepository.log({ userId: user.id, action: 'login_success', ipAddress });
  
  return new AuthResponseDTO({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: UserResponseDTO.fromModel(user)
  });
}
```

**Benefits:**
- 🎯 Each class has one responsibility
- 🧪 Easy to test (can mock services)
- 📝 Clean and readable
- 🔒 Better error handling
- ✅ Input validation
- 📊 DTOs for data safety

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────┐
│  Request: POST /api/auth/login          │
└────────────────┬─────────────────────────┘
                 │
       ┌─────────▼─────────┐
       │  AuthController   │ ← Handle HTTP
       │  (OOP class)      │
       └─────────┬─────────┘
                 │
       ┌─────────▼─────────┐
       │   AuthService     │ ← Business Logic
       │  - Validation     │
       │  - Logic flow     │
       └─────────┬─────────┘
                 │
       ┌─────────▼─────────┐
       │  UserRepository   │ ← Data Access
       │  - CRUD ops       │
       └─────────┬─────────┘
                 │
       ┌─────────▼─────────┐
       │   User Model      │ ← Database
       │  (Sequelize)      │
       └───────────────────┘
```

## 📚 File Organization

```
backend/
├── core/                      # ✨ NEW - Core classes
│   ├── BaseController.js
│   ├── BaseService.js
│   ├── BaseRepository.js
│   ├── Container.js
│   └── errors/
├── dto/                       # ✨ NEW - Data Transfer Objects
│   └── auth/
│       ├── SignupDTO.js
│       ├── LoginDTO.js
│       ├── UserResponseDTO.js
│       └── AuthResponseDTO.js
├── validators/                # ✨ NEW - Input validation
│   ├── BaseValidator.js
│   └── AuthValidator.js
├── repositories/              # ✨ NEW - Data access
│   ├── UserRepository.js
│   ├── RefreshTokenRepository.js
│   └── AuditLogRepository.js
├── services/                  # ✨ NEW - Business logic
│   ├── AuthService.js
│   └── TokenService.js
├── controllers/
│   ├── oop/                   # ✨ NEW - OOP controllers
│   │   └── AuthController.js
│   └── authController.js      # Old (deprecated)
├── routes/
│   ├── oop/                   # ✨ NEW - OOP routes
│   │   └── auth.js
│   └── auth.js                # Old (deprecated)
└── models/                    # Unchanged (Sequelize models)
```

## 🎓 Learn More

Read the comprehensive guide:
- `OOP_ARCHITECTURE.md` - Full documentation
- See examples in:
  - `core/` - Base classes
  - `services/AuthService.js` - Complete service example
  - `controllers/oop/AuthController.js` - Complete controller example

## 🆚 Comparison Table

| Feature | Old (Functional) | New (OOP) |
|---------|------------------|-----------|
| Structure | Routes with inline logic | Layered architecture |
| Error Handling | Try-catch everywhere | Custom error classes |
| Validation | Manual if statements | Validator classes |
| Data Transfer | Raw objects | DTOs |
| Testability | Hard to test | Easy (DI) |
| Maintainability | Low | High |
| Scalability | Limited | Excellent |
| Code Reuse | Difficult | Easy |

## ✅ Next Steps

1. **Keep using OOP routes** - They work exactly the same!
2. **Read `OOP_ARCHITECTURE.md`** - Understand the full architecture
3. **Create new features using OOP pattern** - Follow the examples
4. **Gradually migrate other routes** - One at a time

## 💡 Tips

1. **Both systems work together** - You can use old and new routes simultaneously
2. **No frontend changes needed** - API endpoints are identical
3. **Start small** - Use OOP for new features first
4. **Ask questions** - Check the documentation

## 🎉 You're Done!

Your authentication now uses professional **OOP architecture**!

**The code is cleaner, safer, and easier to maintain.** 🚀

