# Layered Architecture - Quick Reference Guide

## Layer Flow Chart

```
┌──────────────────────────────────────────────────────────┐
│                     HTTP REQUEST                         │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Controllers)                       │
│  • Extract request data                                 │
│  • Call service methods                                 │
│  • Format HTTP responses                                │
│  • Handle status codes                                  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│  BUSINESS LOGIC LAYER (Services)                        │
│  • Implement business rules                             │
│  • Enforce workflows                                    │
│  • Validate business constraints                        │
│  • Orchestrate repositories                             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│  DATA ACCESS LAYER (Repositories)                       │
│  • Encapsulate database queries                         │
│  • Abstract Sequelize operations                        │
│  • Return model instances                               │
│  • No business logic                                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│  PERSISTENCE LAYER (Models + Database)                  │
│  • Define schema                                        │
│  • Define relationships                                 │
│  • Sequelize ORM                                        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
              DATABASE
```

## Layer Responsibilities Matrix

| Layer         | HTTP? | Business Logic? | Database? | Returns |
|---------------|-------|-----------------|-----------|---------|
| Controller    | ✅    | ❌              | ❌        | HTTP Response |
| Service       | ❌    | ✅              | ❌        | Domain Objects |
| Repository    | ❌    | ❌              | ✅        | Model Instances |
| Model         | ❌    | ❌              | ✅        | Data Structure |

## Communication Rules

### ✅ Allowed
- Controller → Service
- Service → Repository
- Repository → Model
- Service → Service (same layer)

### ❌ Not Allowed
- Controller → Repository (skip service)
- Controller → Model (skip service & repository)
- Service → Controller (wrong direction)
- Repository → Service (wrong direction)

## Example: Creating a Ward

### 1. Controller (Presentation Layer)
```javascript
// controllers/oop/IPDController.js
async createWard(req, res) {
  try {
    const ward = await this.ipdService.createWard(req.body);
    return this.created(res, {
      data: ward,
      message: 'Ward created successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return this.error(res, error, error.statusCode);
    }
    return this.error(res, error);
  }
}
```

**Responsibilities:**
- Extract `req.body`
- Call service method
- Format response with HTTP 201
- Handle errors with proper status codes

### 2. Service (Business Logic Layer)
```javascript
// services/IPDService.js
async createWard(wardData) {
  // Business validation
  this.validateRequired(wardData, ['name']);
  
  // Business rule: No duplicate names
  const existing = await this.wardRepo.findByName(wardData.name);
  if (existing) {
    throw new ConflictError('Ward with this name already exists');
  }

  // Business logic: Set defaults
  return await this.wardRepo.create({
    name: wardData.name,
    description: wardData.description,
    total_beds: wardData.total_beds,
    is_active: wardData.is_active !== undefined ? wardData.is_active : true,
  });
}
```

**Responsibilities:**
- Validate required fields
- Check business constraints (no duplicates)
- Apply business defaults
- Use repository for data access

### 3. Repository (Data Access Layer)
```javascript
// repositories/WardRepository.js
async findByName(name) {
  return await this.findOne({ where: { name } });
}

async create(data) {
  return await this.model.create(data);
}
```

**Responsibilities:**
- Execute database queries
- Return model instances
- No validation or business logic

### 4. Model (Persistence Layer)
```javascript
// models/Ward.js
const Ward = sequelize.define('Ward', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  total_beds: { type: DataTypes.INTEGER },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
});
```

**Responsibilities:**
- Define database schema
- Define relationships

## IPD Module Structure

```
backend/
│
├── controllers/oop/          # PRESENTATION LAYER
│   ├── IPDController.js      # Admin HTTP handlers
│   └── IPDDoctorController.js # Doctor HTTP handlers
│
├── services/                 # BUSINESS LOGIC LAYER
│   ├── IPDService.js         # Admin business logic
│   └── IPDDoctorService.js   # Doctor business logic
│
├── repositories/             # DATA ACCESS LAYER
│   ├── WardRepository.js
│   ├── RoomRepository.js
│   ├── BedRepository.js
│   ├── IPDPatientRepository.js
│   ├── AdmissionRequestRepository.js
│   └── DailyDoctorNoteRepository.js
│
├── models/                   # PERSISTENCE LAYER
│   ├── Ward.js
│   ├── Room.js
│   ├── Bed.js
│   ├── IPDPatient.js
│   ├── AdmissionRequest.js
│   └── DailyDoctorNote.js
│
└── routes/oop/              # ROUTING
    ├── ipdAdminRoutes.js
    └── ipdDoctorRoutes.js
```

## Key Design Patterns

### 1. Repository Pattern
```javascript
class WardRepository extends BaseRepository {
  constructor() {
    super(Ward); // Inject model
  }
  
  async findByName(name) {
    return await this.findOne({ where: { name } });
  }
}
```

### 2. Service Layer Pattern
```javascript
class IPDService extends BaseService {
  constructor() {
    super();
    this.wardRepo = new WardRepository(); // Inject repository
  }
  
  async createWard(wardData) {
    // Business logic here
  }
}
```

### 3. Dependency Injection
```javascript
class IPDController extends BaseController {
  constructor() {
    super();
    this.ipdService = new IPDService(); // Inject service
    this.bindMethods();
  }
}
```

## Ward → Room → Bed Hierarchy

### Enforced at Service Layer

```javascript
// Ward level
async getAllWards() {
  const wards = await this.wardRepo.findAllWithStats();
  return wards.map(ward => ({
    ...ward.toJSON(),
    totalBeds: calculateTotal(ward.rooms),
    occupancyRate: calculateRate(ward.rooms),
  }));
}

// Room level (validates ward exists)
async createRoom(roomData) {
  const ward = await this.wardRepo.findById(roomData.ward_id);
  if (!ward) throw new NotFoundError('Ward');
  return await this.roomRepo.create(roomData);
}

// Bed level (validates room exists, which implies ward exists)
async createBed(bedData) {
  const room = await this.roomRepo.findById(bedData.room_id);
  if (!room) throw new NotFoundError('Room');
  return await this.bedRepo.create(bedData);
}
```

## Clinical Assessment Flow

```javascript
// Doctor fills assessment for CONFIRMED appointment
async submitClinicalAssessment(appointmentId, doctorId, assessmentData) {
  // 1. Validate appointment
  const appointment = await Appointment.findOne({
    where: { id: appointmentId, status: 'CONFIRMED' }
  });
  
  // 2. Update with assessment
  await appointment.update({
    requires_admission: assessmentData.requires_admission,
    therapy_prescribed: assessmentData.requires_admission 
      ? null 
      : assessmentData.therapy_prescribed,
    clinical_assessment: assessmentData.clinical_assessment,
  });
  
  // 3. Conditional logic
  if (assessmentData.requires_admission) {
    // Create admission request → Admin reviews → Assign bed
    const admissionRequest = await this.createAdmissionRequest({
      appointment_id: appointmentId,
      patient_id: appointment.user_id,
      ...assessmentData.admission_details,
    }, doctorId);
    
    return { appointment, admission_request: admissionRequest };
  }
  
  // Therapy only path
  return { appointment, message: 'Therapy prescribed' };
}
```

## Common Mistakes to Avoid

### ❌ DON'T: Put business logic in controllers
```javascript
// BAD
async createWard(req, res) {
  const existing = await Ward.findOne({ where: { name: req.body.name } });
  if (existing) {
    return res.status(400).json({ error: 'Exists' });
  }
  const ward = await Ward.create(req.body);
  res.json({ data: ward });
}
```

### ✅ DO: Put business logic in services
```javascript
// GOOD
async createWard(req, res) {
  try {
    const ward = await this.ipdService.createWard(req.body);
    return this.created(res, { data: ward });
  } catch (error) {
    return this.error(res, error);
  }
}
```

### ❌ DON'T: Access database directly from controllers
```javascript
// BAD
async getWards(req, res) {
  const wards = await Ward.findAll({ include: [Room] });
  res.json({ data: wards });
}
```

### ✅ DO: Use services and repositories
```javascript
// GOOD
async getAllWards(req, res) {
  const wards = await this.ipdService.getAllWards();
  return this.success(res, { data: wards });
}
```

## Benefits Summary

| Benefit | Description |
|---------|-------------|
| **Testability** | Each layer can be tested independently with mocks |
| **Maintainability** | Clear structure, easy to locate and fix issues |
| **Reusability** | Services and repositories can be reused |
| **Scalability** | Easy to add features without breaking existing code |
| **Separation of Concerns** | Each layer has single responsibility |
| **Flexibility** | Can swap implementations without affecting other layers |

## Quick Checklist

When adding new features:

- [ ] **Controller**: Handle HTTP request/response only
- [ ] **Service**: Implement business logic and rules
- [ ] **Repository**: Create database query methods
- [ ] **Model**: Define schema if needed
- [ ] **Route**: Wire controller to endpoint
- [ ] **Test**: Write unit tests for service layer

## Reference Architecture

This IPD module follows the same pattern as:
- `AuthService.js` / `AuthController.js`
- `AnalysisService.js` / `AnalysisRepository.js`
- Core classes: `BaseController`, `BaseService`, `BaseRepository`

✅ Consistent, maintainable, enterprise-grade code structure
