# IPD Module - Layered Architecture Implementation

## Overview
The IPD (Inpatient Department) module has been refactored to follow **proper layered architecture** (also known as **layered pattern** or **n-tier architecture**), ensuring clean separation of concerns, maintainability, and scalability.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Controllers)                           │
│  ├─ IPDController.js         → HTTP request/response        │
│  └─ IPDDoctorController.js   → HTTP request/response        │
├─────────────────────────────────────────────────────────────┤
│  BUSINESS LOGIC LAYER (Services)                            │
│  ├─ IPDService.js            → Business rules & workflow    │
│  └─ IPDDoctorService.js      → Business rules & workflow    │
├─────────────────────────────────────────────────────────────┤
│  DATA ACCESS LAYER (Repositories)                           │
│  ├─ WardRepository.js        → Database operations          │
│  ├─ RoomRepository.js        → Database operations          │
│  ├─ BedRepository.js         → Database operations          │
│  ├─ IPDPatientRepository.js → Database operations          │
│  ├─ AdmissionRequestRepository.js → Database operations    │
│  └─ DailyDoctorNoteRepository.js  → Database operations    │
├─────────────────────────────────────────────────────────────┤
│  PERSISTENCE LAYER (Models)                                 │
│  ├─ Ward.js, Room.js, Bed.js                               │
│  ├─ IPDPatient.js, AdmissionRequest.js                     │
│  └─ DailyDoctorNote.js                                      │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Presentation Layer (Controllers)
**Location:** `backend/controllers/oop/`

**Responsibilities:**
- Handle HTTP requests and responses
- Extract data from request objects
- Validate HTTP-level concerns (headers, params, etc.)
- Call appropriate service methods
- Format responses using BaseController methods
- Handle HTTP status codes

**Files:**
- `IPDController.js` - Admin operations
- `IPDDoctorController.js` - Doctor operations

**Example:**
```javascript
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

**Key Principles:**
- ✅ Controllers should be thin (minimal logic)
- ✅ Only handle HTTP concerns
- ✅ Delegate all business logic to services
- ✅ Use BaseController for consistent responses

### 2. Business Logic Layer (Services)
**Location:** `backend/services/`

**Responsibilities:**
- Implement business rules and workflows
- Orchestrate between multiple repositories
- Enforce business constraints (e.g., "cannot delete occupied bed")
- Handle complex transactions
- Calculate derived data (e.g., occupancy statistics)
- Implement workflow logic (e.g., admission approval process)

**Files:**
- `IPDService.js` - Admin business logic
- `IPDDoctorService.js` - Doctor business logic

**Example:**
```javascript
async approveAdmissionRequest(requestId, bedAssignment) {
  this.validateRequired(bedAssignment, ['ward_id', 'room_id', 'bed_id']);
  
  const request = await this.admissionRequestRepo.findById(requestId);
  if (!request) {
    throw new NotFoundError('Admission request');
  }

  // Business rule: Request must be pending
  if (request.status !== 'Pending') {
    throw new BadRequestError('This request has already been processed');
  }

  // Business rule: Bed must be available
  const isAvailable = await this.bedRepo.isAvailable(bedAssignment.bed_id);
  if (!isAvailable) {
    throw new BadRequestError('Selected bed is not available');
  }

  // Transaction: Create patient, update bed, update request
  const ipdPatient = await this.ipdPatientRepo.create({...});
  await this.bedRepo.updateStatus(bedAssignment.bed_id, 'Occupied');
  await this.admissionRequestRepo.updateStatus(requestId, 'Approved');

  return { request, ipdPatient };
}
```

**Key Principles:**
- ✅ All business logic lives here
- ✅ Services use repositories for data access
- ✅ Services never touch HTTP req/res objects
- ✅ Services return domain objects, not HTTP responses
- ✅ Use BaseService for logging and validation

### 3. Data Access Layer (Repositories)
**Location:** `backend/repositories/`

**Responsibilities:**
- Encapsulate database queries
- Provide clean API for data operations
- Handle Sequelize operations
- Return model instances or data objects
- No business logic whatsoever

**Files:**
- `WardRepository.js`
- `RoomRepository.js`
- `BedRepository.js`
- `IPDPatientRepository.js`
- `AdmissionRequestRepository.js`
- `DailyDoctorNoteRepository.js`

**Example:**
```javascript
async findAllWithHierarchy(roomId = null) {
  const where = {};
  if (roomId) {
    where.room_id = roomId;
  }

  return await this.findAll({
    where,
    include: [
      {
        model: Room,
        as: 'room',
        include: [{ model: Ward, as: 'ward' }],
      },
    ],
    order: [['bed_number', 'ASC']],
  });
}
```

**Key Principles:**
- ✅ Pure data access, no business logic
- ✅ Abstract Sequelize details
- ✅ Return model instances or arrays
- ✅ Use BaseRepository for common CRUD operations

### 4. Persistence Layer (Models)
**Location:** `backend/models/`

**Responsibilities:**
- Define database schema
- Define relationships (associations)
- Provide instance methods if needed
- Represent data structure

**Files:**
- `Ward.js`, `Room.js`, `Bed.js`
- `IPDPatient.js`, `AdmissionRequest.js`
- `DailyDoctorNote.js`

## Data Flow

### Request Flow (Top-Down)
```
1. HTTP Request
   ↓
2. Route → Controller Method
   ↓
3. Controller → Service Method
   ↓
4. Service → Repository Method(s)
   ↓
5. Repository → Sequelize Model
   ↓
6. Database Query
```

### Response Flow (Bottom-Up)
```
1. Database Result
   ↓
2. Model Instance(s)
   ↓
3. Repository → Returns data
   ↓
4. Service → Processes & returns result
   ↓
5. Controller → Formats HTTP response
   ↓
6. HTTP Response
```

## Ward → Room → Bed Hierarchy

The hierarchical structure is enforced at the **Service Layer**:

```javascript
// Ward contains Rooms
async getAllWards() {
  const wards = await this.wardRepo.findAllWithStats();
  // Calculate statistics (business logic)
  return wards.map(ward => ({
    ...ward,
    totalBeds: calculateTotalBeds(ward.rooms),
    occupancyRate: calculateOccupancy(ward.rooms),
  }));
}

// Room belongs to Ward
async createRoom(roomData) {
  // Business rule: Verify ward exists
  const ward = await this.wardRepo.findById(roomData.ward_id);
  if (!ward) {
    throw new NotFoundError('Ward');
  }
  return await this.roomRepo.create(roomData);
}

// Bed belongs to Room (which belongs to Ward)
async getAllBeds(roomId) {
  // Returns beds with full hierarchy
  return await this.bedRepo.findAllWithHierarchy(roomId);
}
```

## Clinical Assessment Workflow

### Confirmed Appointment → Assessment → Conditional Admission

```javascript
// Service Layer
async submitClinicalAssessment(appointmentId, doctorId, assessmentData) {
  // 1. Validate appointment status (business rule)
  const appointment = await Appointment.findOne({
    where: { id: appointmentId, status: 'CONFIRMED' }
  });

  // 2. Update appointment with assessment
  await appointment.update({
    requires_admission: assessmentData.requires_admission,
    therapy_prescribed: !assessmentData.requires_admission 
      ? assessmentData.therapy_prescribed 
      : null,
    clinical_assessment: assessmentData.clinical_assessment,
  });

  // 3. Conditional logic (business rule)
  if (assessmentData.requires_admission) {
    // Create admission request
    const admissionRequest = await this.createAdmissionRequest(...);
    return { appointment, admission_request: admissionRequest };
  }

  // Therapy only
  return { appointment };
}
```

## Benefits of Layered Architecture

### 1. **Separation of Concerns**
- Each layer has a single, well-defined responsibility
- Changes in one layer don't cascade to others
- HTTP concerns separate from business logic separate from data access

### 2. **Testability**
- Services can be tested without HTTP
- Repositories can be tested with mock models
- Controllers can be tested with mock services

### 3. **Maintainability**
- Easy to locate where specific logic lives
- Clear dependencies between layers
- Easier to onboard new developers

### 4. **Scalability**
- Services can be reused across different controllers
- Repositories can be optimized independently
- Easy to add caching at repository level

### 5. **Flexibility**
- Can swap HTTP framework without touching business logic
- Can swap database without touching services
- Can add GraphQL alongside REST easily

## File Structure

```
backend/
├── controllers/
│   └── oop/
│       ├── IPDController.js
│       └── IPDDoctorController.js
├── services/
│   ├── IPDService.js
│   └── IPDDoctorService.js
├── repositories/
│   ├── WardRepository.js
│   ├── RoomRepository.js
│   ├── BedRepository.js
│   ├── IPDPatientRepository.js
│   ├── AdmissionRequestRepository.js
│   └── DailyDoctorNoteRepository.js
├── models/
│   ├── Ward.js
│   ├── Room.js
│   ├── Bed.js
│   ├── IPDPatient.js
│   ├── AdmissionRequest.js
│   └── DailyDoctorNote.js
├── routes/
│   └── oop/
│       ├── ipdAdminRoutes.js
│       └── ipdDoctorRoutes.js
└── core/
    ├── BaseController.js
    ├── BaseService.js
    ├── BaseRepository.js
    └── errors.js
```

## Design Patterns Used

### 1. **Layered Architecture Pattern**
- Clear separation between presentation, business, and data layers

### 2. **Repository Pattern**
- Abstracts data access logic
- Provides collection-like interface for domain objects

### 3. **Service Layer Pattern**
- Encapsulates business logic
- Orchestrates operations across repositories

### 4. **Base Class Pattern**
- `BaseController`, `BaseService`, `BaseRepository`
- Provides common functionality
- Reduces code duplication

### 5. **Dependency Injection**
- Controllers receive services
- Services receive repositories
- Loose coupling between layers

## Comparison with Previous Implementation

### ❌ Old Approach (Functional)
```javascript
// routes/ipdAdminRoutes.js
router.post('/wards', async (req, res) => {
  const { name, description } = req.body;
  
  // Validation in route
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }
  
  // Business logic in route
  const existing = await Ward.findOne({ where: { name } });
  if (existing) {
    return res.status(400).json({ error: 'Already exists' });
  }
  
  // Data access in route
  const ward = await Ward.create({ name, description });
  
  res.json({ data: ward });
});
```

**Problems:**
- ❌ Business logic mixed with HTTP handling
- ❌ Hard to test without HTTP mocking
- ❌ No reusability
- ❌ Violates Single Responsibility Principle

### ✅ New Approach (Layered)
```javascript
// Controller
async createWard(req, res) {
  try {
    const ward = await this.ipdService.createWard(req.body);
    return this.created(res, { data: ward });
  } catch (error) {
    return this.handleError(res, error);
  }
}

// Service
async createWard(wardData) {
  this.validateRequired(wardData, ['name']);
  const existing = await this.wardRepo.findByName(wardData.name);
  if (existing) {
    throw new ConflictError('Ward already exists');
  }
  return await this.wardRepo.create(wardData);
}

// Repository
async findByName(name) {
  return await this.findOne({ where: { name } });
}
```

**Benefits:**
- ✅ Clean separation of concerns
- ✅ Easy to test each layer independently
- ✅ Reusable business logic
- ✅ Follows SOLID principles

## Testing Strategy

### Unit Tests
```javascript
// Service Test
describe('IPDService', () => {
  it('should create ward when name is unique', async () => {
    const mockWardRepo = {
      findByName: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1, name: 'ICU' }),
    };
    
    const service = new IPDService();
    service.wardRepo = mockWardRepo;
    
    const result = await service.createWard({ name: 'ICU' });
    
    expect(result.name).toBe('ICU');
    expect(mockWardRepo.create).toHaveBeenCalled();
  });
});
```

### Integration Tests
```javascript
// Controller Test
describe('IPDController', () => {
  it('should return 201 when ward created', async () => {
    const req = { body: { name: 'ICU' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    
    await controller.createWard(req, res);
    
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });
});
```

## Migration from Old to New

The old functional routes (`ipdAdminRoutes.js`, `ipdDoctorRoutes.js`) have been replaced with:
- `routes/oop/ipdAdminRoutes.js`
- `routes/oop/ipdDoctorRoutes.js`

The `server.js` file has been updated to use the new routes:
```javascript
const ipdAdminRoutesOOP = require("./routes/oop/ipdAdminRoutes");
const ipdDoctorRoutesOOP = require("./routes/oop/ipdDoctorRoutes");

app.use("/api/ipd/admin", ipdAdminRoutesOOP);
app.use("/api/ipd/doctor", ipdDoctorRoutesOOP);
```

## Summary

The IPD module now follows **proper layered architecture** with:

✅ **Presentation Layer** - Controllers handle HTTP  
✅ **Business Logic Layer** - Services implement workflows  
✅ **Data Access Layer** - Repositories manage database  
✅ **Persistence Layer** - Models define schema  

✅ **Ward → Room → Bed hierarchy** enforced at service layer  
✅ **Clinical assessment workflow** implemented cleanly  
✅ **Separation of concerns** throughout  
✅ **Testable, maintainable, scalable** codebase  

This architecture ensures the IPD module is **enterprise-grade**, following industry best practices for layered/n-tier architecture.
