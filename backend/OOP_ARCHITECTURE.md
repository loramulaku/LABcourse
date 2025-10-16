# 🏗️ Object-Oriented Architecture Guide

## 📖 Overview

This project now follows a **clean, enterprise-grade Object-Oriented Programming (OOP) architecture** with proper separation of concerns. This guide explains the new structure and how to use it.

## 🎯 Architecture Layers

```
┌─────────────────────────────────────────────┐
│           HTTP Layer (Routes)               │
│   - Express routes                          │
│   - Route definitions only                  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       Controller Layer (Controllers)        │
│   - Handle HTTP requests/responses          │
│   - Extend BaseController                   │
│   - Call services                           │
│   - Return appropriate HTTP responses       │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│        Service Layer (Services)             │
│   - Business logic                          │
│   - Orchestrate repositories                │
│   - Extend BaseService                      │
│   - Use validators                          │
│   - Use DTOs                                │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│      Repository Layer (Repositories)        │
│   - Data access only                        │
│   - CRUD operations                         │
│   - Extend BaseRepository                   │
│   - Interact with Sequelize models          │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Model Layer (Sequelize Models)      │
│   - Database schema                         │
│   - Associations                            │
│   - Hooks (password hashing, etc.)          │
└─────────────────────────────────────────────┘
```

## 📁 Project Structure

```
backend/
├── core/                          # Core infrastructure
│   ├── BaseController.js          # Base class for all controllers
│   ├── BaseService.js             # Base class for all services
│   ├── BaseRepository.js          # Base class for all repositories
│   ├── Container.js               # Dependency injection container
│   └── errors/                    # Custom error classes
│       ├── AppError.js            # Base error
│       ├── ValidationError.js     # Validation errors
│       ├── NotFoundError.js       # Resource not found
│       ├── UnauthorizedError.js   # Authentication errors
│       ├── ForbiddenError.js      # Authorization errors
│       └── ConflictError.js       # Conflict errors
├── dto/                           # Data Transfer Objects
│   ├── BaseDTO.js                 # Base DTO class
│   └── auth/                      # Auth DTOs
│       ├── SignupDTO.js
│       ├── LoginDTO.js
│       ├── UserResponseDTO.js
│       └── AuthResponseDTO.js
├── validators/                    # Input validation
│   ├── BaseValidator.js           # Base validator
│   └── AuthValidator.js           # Auth validation
├── repositories/                  # Data access layer
│   ├── UserRepository.js
│   ├── RefreshTokenRepository.js
│   └── AuditLogRepository.js
├── services/                      # Business logic layer
│   ├── AuthService.js
│   └── TokenService.js
├── controllers/
│   ├── oop/                       # New OOP controllers
│   │   └── AuthController.js
│   └── authController.js          # Old controller (deprecated)
├── routes/
│   ├── oop/                       # New OOP routes
│   │   └── auth.js
│   └── auth.js                    # Old routes (deprecated)
└── models/                        # Sequelize models (unchanged)
```

## 🔧 Core Components

### 1. BaseController

All controllers extend `BaseController` which provides:

- ✅ `success(res, data, statusCode)` - Send success response
- ✅ `created(res, data)` - Send 201 Created response
- ✅ `error(res, error, statusCode)` - Send error response
- ✅ `badRequest(res, message)` - Send 400 Bad Request
- ✅ `unauthorized(res, message)` - Send 401 Unauthorized
- ✅ `forbidden(res, message)` - Send 403 Forbidden
- ✅ `notFound(res, message)` - Send 404 Not Found
- ✅ `validationError(res, errors)` - Send 422 Validation Error
- ✅ `asyncHandler(fn)` - Wrap async functions with error handling

**Example:**
```javascript
class AuthController extends BaseController {
  async login(req, res) {
    try {
      const result = await this.authService.login(req.body);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error, error.statusCode);
    }
  }
}
```

### 2. BaseService

All services extend `BaseService` which provides:

- ✅ `log(message, data)` - Log service activity
- ✅ `logError(message, error)` - Log errors
- ✅ `validateRequired(data, fields)` - Validate required fields
- ✅ `executeOperation(operation, errorMessage)` - Execute with error handling

**Example:**
```javascript
class AuthService extends BaseService {
  async login(loginData) {
    this.log('Processing login request');
    
    const user = await this.userRepository.findByEmail(loginData.email);
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    this.log(`User logged in: ${user.id}`);
    return user;
  }
}
```

### 3. BaseRepository

All repositories extend `BaseRepository` which provides:

- ✅ `findAll(options)` - Find all records
- ✅ `findOne(options)` - Find one record
- ✅ `findById(id, options)` - Find by primary key
- ✅ `create(data, options)` - Create new record
- ✅ `update(id, data)` - Update record
- ✅ `delete(id)` - Delete record
- ✅ `count(options)` - Count records
- ✅ `exists(where)` - Check if exists
- ✅ `bulkCreate(records, options)` - Bulk create
- ✅ `paginate(page, limit, options)` - Paginated results

**Example:**
```javascript
class UserRepository extends BaseRepository {
  constructor() {
    super(User); // Pass Sequelize model
  }

  async findByEmail(email) {
    return await this.findOne({ where: { email } });
  }
}
```

### 4. Custom Errors

All custom errors extend `AppError`:

```javascript
// In service
throw new UnauthorizedError('Invalid credentials');

// In controller
if (error instanceof AppError) {
  return this.error(res, error, error.statusCode);
}
```

**Available errors:**
- `ValidationError` - 422
- `NotFoundError` - 404
- `UnauthorizedError` - 401
- `ForbiddenError` - 403
- `ConflictError` - 409
- `AppError` - Base class (500)

### 5. DTOs (Data Transfer Objects)

DTOs define the shape of data transferred between layers:

```javascript
// Create DTO
const signupDTO = new SignupDTO(req.body);

// Get sanitized data (without password)
const sanitized = signupDTO.getSanitized();

// Convert to plain object
const obj = signupDTO.toObject();
```

**Benefits:**
- ✅ Type safety
- ✅ Data transformation
- ✅ Sanitization
- ✅ Validation

### 6. Validators

Validators check input data:

```javascript
// Validate signup data
AuthValidator.validateSignup(data);

// Throws ValidationError if invalid
```

**Built-in validators:**
- `isValidEmail(email)`
- `isValidPassword(password, options)`
- `isNotEmpty(value)`
- `validateRequired(data, fields)`

### 7. Dependency Injection Container

The container manages service instances:

```javascript
const container = require('./core/Container');

// Get service
const authService = container.get('AuthService');

// Use in controllers
class AuthController {
  constructor() {
    this.authService = container.get('AuthService');
  }
}
```

## 🎯 Request Flow Example

Let's trace a **login request**:

### 1. HTTP Request
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 2. Route (routes/oop/auth.js)
```javascript
router.post('/login', authController.asyncHandler(authController.login));
```

### 3. Controller (controllers/oop/AuthController.js)
```javascript
async login(req, res) {
  try {
    // Call service
    const authResponse = await this.authService.login(req.body, req.ip);
    
    // Set cookie
    this.tokenService.setRefreshCookie(res, authResponse.refreshToken);
    
    // Return response
    return this.success(res, {
      accessToken: authResponse.accessToken,
      user: authResponse.user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return this.error(res, error, error.statusCode);
    }
    return this.error(res, error);
  }
}
```

### 4. Service (services/AuthService.js)
```javascript
async login(loginData, ipAddress) {
  // Validate input
  AuthValidator.validateLogin(loginData);
  
  // Create DTO
  const dto = new LoginDTO(loginData);
  
  // Find user via repository
  const user = await this.userRepository.findByEmail(dto.email);
  
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  // Verify password
  const isValid = await user.verifyPassword(dto.password);
  
  if (!isValid) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  // Generate tokens
  const tokens = this.tokenService.generateTokenPair(user);
  
  // Store refresh token via repository
  await this.refreshTokenRepository.createToken(user.id, tokens.refreshToken);
  
  // Log via repository
  await this.auditLogRepository.log({
    userId: user.id,
    action: 'login_success',
    ipAddress,
  });
  
  // Return DTO
  return new AuthResponseDTO({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: UserResponseDTO.fromModel(user),
  });
}
```

### 5. Repository (repositories/UserRepository.js)
```javascript
async findByEmail(email) {
  return await this.findOne({ where: { email } });
}
```

### 6. Model (models/User.js)
```javascript
// Sequelize model with Argon2 hashing
const User = sequelize.define('User', {
  email: DataTypes.STRING,
  password: DataTypes.STRING,
}, {
  hooks: {
    beforeCreate: async (user) => {
      user.password = await argon2.hash(user.password);
    }
  }
});
```

### 7. HTTP Response
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

## ✅ Benefits of This Architecture

### 1. Separation of Concerns
Each layer has a single responsibility:
- **Routes** - Define endpoints
- **Controllers** - Handle HTTP
- **Services** - Business logic
- **Repositories** - Data access
- **Models** - Database schema

### 2. Testability
Easy to write unit tests:
```javascript
// Test service with mocked repository
const mockRepo = {
  findByEmail: jest.fn().mockResolvedValue(mockUser)
};

const authService = new AuthService();
authService.userRepository = mockRepo;

await authService.login(loginData);
expect(mockRepo.findByEmail).toHaveBeenCalled();
```

### 3. Maintainability
- Clear file organization
- Easy to find code
- Easy to update logic

### 4. Reusability
- Services can be reused
- Repositories are reusable
- DTOs can be shared

### 5. Type Safety
- DTOs define data shapes
- Validators ensure correctness
- Custom errors are typed

### 6. Scalability
- Easy to add new features
- Easy to add new modules
- Clear patterns to follow

## 🚀 How to Use

### Using OOP Routes (New Way)

**1. Update server.js:**
```javascript
// Use OOP routes
const authRoutes = require('./routes/oop/auth');
app.use('/api/auth', authRoutes);
```

**2. All features work the same:**
```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'
```

### Creating New Features

**Step 1: Create DTO**
```javascript
class CreateProductDTO extends BaseDTO {
  fromObject(data) {
    this.name = data.name;
    this.price = data.price;
  }
}
```

**Step 2: Create Validator**
```javascript
class ProductValidator extends BaseValidator {
  static validateCreate(data) {
    this.validateRequired(data, ['name', 'price']);
  }
}
```

**Step 3: Create Repository**
```javascript
class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  async findByName(name) {
    return await this.findOne({ where: { name } });
  }
}
```

**Step 4: Create Service**
```javascript
class ProductService extends BaseService {
  constructor() {
    super();
    this.productRepository = new ProductRepository();
  }

  async createProduct(data) {
    ProductValidator.validateCreate(data);
    const dto = new CreateProductDTO(data);
    return await this.productRepository.create(dto.toObject());
  }
}
```

**Step 5: Create Controller**
```javascript
class ProductController extends BaseController {
  constructor() {
    super();
    this.productService = new ProductService();
    this.bindMethods();
  }

  async create(req, res) {
    try {
      const product = await this.productService.createProduct(req.body);
      return this.created(res, product);
    } catch (error) {
      return this.error(res, error, error.statusCode);
    }
  }
}
```

**Step 6: Create Routes**
```javascript
const router = express.Router();
const productController = new ProductController();

router.post('/', productController.asyncHandler(productController.create));

module.exports = router;
```

## 📚 Best Practices

### 1. Always Use DTOs
```javascript
// ❌ Bad
const user = await this.userRepository.create(req.body);

// ✅ Good
const dto = new SignupDTO(req.body);
const user = await this.userRepository.create(dto.toObject());
```

### 2. Always Validate Input
```javascript
// ❌ Bad
const user = await this.userRepository.findByEmail(email);

// ✅ Good
AuthValidator.validateLogin({ email, password });
const user = await this.userRepository.findByEmail(email);
```

### 3. Use Custom Errors
```javascript
// ❌ Bad
throw new Error('User not found');

// ✅ Good
throw new NotFoundError('User');
```

### 4. Log Important Actions
```javascript
this.log('Processing login request');
await this.auditLogRepository.log({
  userId: user.id,
  action: 'login_success',
});
```

### 5. Keep Controllers Thin
```javascript
// ❌ Bad - Logic in controller
async login(req, res) {
  const user = await User.findOne({ where: { email: req.body.email } });
  if (!user) return res.status(401).json({ error: 'Invalid' });
  // ... more logic
}

// ✅ Good - Delegate to service
async login(req, res) {
  try {
    const result = await this.authService.login(req.body, req.ip);
    return this.success(res, result);
  } catch (error) {
    return this.error(res, error, error.statusCode);
  }
}
```

## 🎓 Learning Resources

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)
- [DTO Pattern](https://en.wikipedia.org/wiki/Data_transfer_object)
- [Repository Pattern](https://deviq.com/design-patterns/repository-pattern)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)

## 🎉 Conclusion

This OOP architecture provides:

✅ **Clean Code** - Well-organized and readable  
✅ **Maintainable** - Easy to update and extend  
✅ **Testable** - Easy to write unit tests  
✅ **Scalable** - Grows with your application  
✅ **Professional** - Enterprise-grade patterns  

---

**Your code is now organized like a professional enterprise application!** 🚀

