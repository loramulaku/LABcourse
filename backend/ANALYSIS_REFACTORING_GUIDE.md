# Analysis Model Refactoring Guide

## Overview

The `Analysis.js` model has been successfully refactored to follow Sequelize best practices and OOP principles. This guide explains the changes and how to use the new architecture.

## Problem Statement

The original `Analysis.js` had several issues:

1. **Constructor Error**: Exported a plain JavaScript class instead of a Sequelize model factory function, causing `TypeError: Class constructor Analysis cannot be invoked without 'new'`
2. **Security Risk**: Used raw SQL queries susceptible to SQL injection
3. **Mixing Concerns**: Combined business logic with database operations
4. **Non-Standard**: Didn't follow Sequelize patterns for models, making it incompatible with migrations and associations

## Solution Architecture

The refactoring follows a three-layer architecture:

```
┌─────────────────────────────────────────────────────┐
│           Routes/Controllers Layer                  │
│  (Handle HTTP requests/responses)                   │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│           Service Layer                             │
│  AnalysisService - Business logic                   │
│  - Validation                                       │
│  - Transaction management                           │
│  - Error handling                                   │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│           Repository Layer                          │
│  AnalysisRepository - Database operations           │
│  LaboratoryRepository - Database operations         │
│  - CRUD operations                                  │
│  - Sequelize ORM queries                            │
│  - No business logic                                │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│           Model Layer                               │
│  AnalysisType (Sequelize model)                     │
│  PatientAnalysis (Sequelize model)                  │
│  Laboratory (Sequelize model)                       │
└─────────────────────────────────────────────────────┘
```

## File Structure

### New Files Created

```
backend/
├── models/
│   └── Analysis.js (Refactored - backward compatibility wrapper)
├── repositories/
│   ├── AnalysisRepository.js (NEW)
│   └── LaboratoryRepository.js (NEW)
├── services/
│   └── AnalysisService.js (NEW)
└── routes/
    └── laboratoryRoutes.js (Updated to use services)
```

## Changes Made

### 1. Analysis.js Model (Refactored)

**Before:**
```javascript
class Analysis {
  static async getAllTypes() {
    const [rows] = await db.promise().query("SELECT * FROM analysis_types");
    return rows;
  }
  // ... more raw SQL methods
}
module.exports = Analysis;
```

**After:**
```javascript
module.exports = (sequelize, DataTypes) => {
  const Analysis = sequelize.define('Analysis', { /* ... */ });
  
  // Backward compatibility methods that delegate to AnalysisService
  Analysis.getAllTypes = async function() {
    console.warn('⚠️  Deprecated. Use AnalysisService.getAllTypes()');
    // ... delegates to service
  };
  
  return Analysis;
};
```

### 2. AnalysisRepository.js (New)

Handles all database operations using Sequelize ORM:

```javascript
class AnalysisRepository extends BaseRepository {
  async getAllTypes() {
    return await this.AnalysisType.findAll({
      include: [/* relations */],
      order: [['name', 'ASC']],
    });
  }
  
  async createPatientAnalysis(data, transaction = null) {
    const options = transaction ? { transaction } : {};
    return await this.model.create(data, options);
  }
  // ... more ORM-based methods
}
```

**Key Features:**
- ✅ No raw SQL - uses Sequelize ORM
- ✅ Prevents SQL injection
- ✅ Supports transactions
- ✅ Proper error handling
- ✅ Includes relations/associations

### 3. AnalysisService.js (New)

Contains all business logic:

```javascript
class AnalysisService extends BaseService {
  async createRequest(data) {
    // 1. Validate required fields
    this.validateRequired(data, ['user_id', 'analysis_type_id', /* ... */]);
    
    // 2. Verify related entities exist
    const analysisType = await this.analysisRepository.getTypeById(id);
    if (!analysisType) throw new NotFoundError('Analysis type');
    
    // 3. Use transaction for race condition prevention
    const transaction = await sequelize.transaction();
    try {
      const isAvailable = await this.analysisRepository.isTimeSlotAvailable(
        labId, datetime, transaction
      );
      
      if (!isAvailable) {
        await transaction.rollback();
        throw new ConflictError('Time slot is already booked');
      }
      
      const analysis = await this.analysisRepository.createPatientAnalysis(
        data, transaction
      );
      
      await transaction.commit();
      return analysis.id;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
```

**Key Features:**
- ✅ Input validation
- ✅ Business rule enforcement
- ✅ Transaction management
- ✅ Proper error types (NotFoundError, ConflictError, ValidationError)
- ✅ Logging and monitoring

### 4. LaboratoryRepository.js (New)

Handles laboratory-specific database operations:

```javascript
class LaboratoryRepository extends BaseRepository {
  async isTimeSlotAvailable(laboratoryId, appointmentDate) {
    const count = await PatientAnalysis.count({
      where: {
        laboratory_id: laboratoryId,
        appointment_date: appointmentDate,
        status: { [Op.ne]: 'cancelled' },
      },
    });
    return count === 0;
  }
  
  async getAvailableSlots(laboratoryId, date) {
    // Generate slots and check availability
    // Returns array of { time, displayTime, isAvailable }
  }
}
```

### 5. Routes Updated

**Before:**
```javascript
router.post("/request-analysis", authenticateToken, async (req, res) => {
  const analysisRequest = await Analysis.createRequest(requestData);
  res.status(201).json({ id: analysisRequest });
});
```

**After:**
```javascript
router.post("/request-analysis", authenticateToken, async (req, res) => {
  try {
    const analysisService = new AnalysisService();
    const analysisId = await analysisService.createRequest(requestData);
    res.status(201).json({ id: analysisId });
  } catch (error) {
    // Proper error handling by type
    if (error.name === 'ConflictError') {
      return res.status(400).json({ error: "TIME_SLOT_BOOKED" });
    }
    // ... more error handling
  }
});
```

## Migration Guide

### For Existing Code

The old `Analysis` methods still work through backward compatibility:

```javascript
// ⚠️  DEPRECATED (still works but shows warning)
const types = await Analysis.getAllTypes();
const analyses = await Analysis.getPatientAnalyses(userId);
const id = await Analysis.createRequest(data);

// ✅ NEW RECOMMENDED WAY
const analysisService = new AnalysisService();
const types = await analysisService.getAllTypes();
const analyses = await analysisService.getPatientAnalyses(userId);
const id = await analysisService.createRequest(data);
```

### For New Code

Always use the service layer:

```javascript
const AnalysisService = require('../services/AnalysisService');

// In your route/controller
const analysisService = new AnalysisService();
const result = await analysisService.methodName(params);
```

## Benefits of New Architecture

### 1. Security
- ✅ No SQL injection vulnerabilities
- ✅ Parameterized queries via Sequelize
- ✅ Input validation at service layer

### 2. Maintainability
- ✅ Separation of concerns
- ✅ Easy to test (mock repositories in service tests)
- ✅ Clear responsibility boundaries

### 3. Scalability
- ✅ Easy to add new features
- ✅ Service methods can orchestrate multiple repositories
- ✅ Reusable repository methods

### 4. Consistency
- ✅ Follows Sequelize conventions
- ✅ Works with migrations
- ✅ Proper model associations

### 5. Error Handling
- ✅ Typed errors (NotFoundError, ConflictError, ValidationError)
- ✅ Consistent error responses
- ✅ Better debugging

## API Reference

### AnalysisService Methods

#### `getAllTypes()`
Get all analysis types with laboratory details.

```javascript
const types = await analysisService.getAllTypes();
```

#### `getTypesByLaboratory(labId)`
Get analysis types for a specific laboratory.

```javascript
const types = await analysisService.getTypesByLaboratory(5);
```

#### `createRequest(data)`
Create a new analysis request with time slot validation.

```javascript
const id = await analysisService.createRequest({
  user_id: 123,
  analysis_type_id: 5,
  laboratory_id: 10,
  appointment_date: '2024-01-15T10:30:00',
  notes: 'Optional notes'
});
```

**Throws:**
- `ValidationError` - Missing required fields
- `NotFoundError` - Analysis type or laboratory not found
- `ConflictError` - Time slot already booked

#### `getPatientAnalyses(userId)`
Get all analyses for a patient with full details.

```javascript
const analyses = await analysisService.getPatientAnalyses(123);
```

#### `updateResult(analysisId, result, status)`
Update analysis result and status.

```javascript
await analysisService.updateResult(456, 'Normal levels', 'completed');
```

#### `cancelAnalysis(analysisId, userId)`
Cancel an analysis (with ownership check).

```javascript
await analysisService.cancelAnalysis(456, 123);
```

#### `checkTimeSlotAvailability(laboratoryId, appointmentDate)`
Check if a time slot is available.

```javascript
const isAvailable = await analysisService.checkTimeSlotAvailability(
  10, 
  '2024-01-15T10:30:00'
);
```

#### `getAvailableSlots(laboratoryId, date)`
Get all available time slots for a date.

```javascript
const slots = await analysisService.getAvailableSlots(10, '2024-01-15');
// Returns: [{ time: '2024-01-15T10:00', displayTime: '10:00 AM', isAvailable: true }, ...]
```

### AnalysisRepository Methods

- `getAllTypes()` - Get all analysis types
- `getTypesByLaboratory(labId)` - Get types by lab
- `getTypeById(typeId)` - Get single type
- `createPatientAnalysis(data, transaction)` - Create analysis
- `getPatientAnalyses(userId)` - Get user's analyses
- `getPatientAnalysisById(analysisId)` - Get single analysis
- `isTimeSlotAvailable(labId, date, transaction)` - Check availability
- `updateAnalysisResult(analysisId, data)` - Update result
- `getAnalysesByLaboratory(labId, filters)` - Get lab's analyses
- `cancelAnalysis(analysisId)` - Cancel analysis
- `updateStatus(analysisId, status)` - Update status

### LaboratoryRepository Methods

- `getAllWithDetails()` - Get all labs with user info
- `getByUserId(userId)` - Get lab by user
- `getWithAnalysisTypes(labId)` - Get lab with types
- `createLaboratory(data)` - Create lab
- `updateLaboratory(labId, data)` - Update lab
- `isTimeSlotAvailable(labId, date)` - Check availability
- `getAvailableSlots(labId, date)` - Get available slots
- `getStatistics(labId)` - Get lab statistics
- `searchLaboratories(query)` - Search labs

## Testing Examples

### Unit Test Example (Service)

```javascript
const AnalysisService = require('../services/AnalysisService');

describe('AnalysisService', () => {
  let analysisService;
  let mockAnalysisRepo;
  let mockLabRepo;
  
  beforeEach(() => {
    mockAnalysisRepo = {
      getTypeById: jest.fn(),
      createPatientAnalysis: jest.fn(),
      isTimeSlotAvailable: jest.fn(),
    };
    
    mockLabRepo = {
      findById: jest.fn(),
    };
    
    analysisService = new AnalysisService();
    analysisService.analysisRepository = mockAnalysisRepo;
    analysisService.laboratoryRepository = mockLabRepo;
  });
  
  test('createRequest should create analysis when slot is available', async () => {
    mockAnalysisRepo.getTypeById.mockResolvedValue({ id: 5 });
    mockLabRepo.findById.mockResolvedValue({ id: 10 });
    mockAnalysisRepo.isTimeSlotAvailable.mockResolvedValue(true);
    mockAnalysisRepo.createPatientAnalysis.mockResolvedValue({ id: 100 });
    
    const id = await analysisService.createRequest({
      user_id: 123,
      analysis_type_id: 5,
      laboratory_id: 10,
      appointment_date: '2024-01-15T10:30:00',
    });
    
    expect(id).toBe(100);
  });
  
  test('createRequest should throw ConflictError when slot is booked', async () => {
    mockAnalysisRepo.getTypeById.mockResolvedValue({ id: 5 });
    mockLabRepo.findById.mockResolvedValue({ id: 10 });
    mockAnalysisRepo.isTimeSlotAvailable.mockResolvedValue(false);
    
    await expect(
      analysisService.createRequest({
        user_id: 123,
        analysis_type_id: 5,
        laboratory_id: 10,
        appointment_date: '2024-01-15T10:30:00',
      })
    ).rejects.toThrow('Time slot is already booked');
  });
});
```

## Troubleshooting

### Issue: "Class constructor Analysis cannot be invoked without 'new'"

**Cause:** Old code trying to use Analysis as a class.

**Solution:** The refactored Analysis.js now exports a Sequelize model factory function and includes backward compatibility methods. Old code should still work but will show deprecation warnings.

### Issue: Getting deprecation warnings

**Cause:** Using old Analysis methods directly.

**Solution:** Update to use AnalysisService:

```javascript
// Old
const types = await Analysis.getAllTypes();

// New
const analysisService = new AnalysisService();
const types = await analysisService.getAllTypes();
```

### Issue: Transaction errors

**Cause:** Not passing transaction to repository methods.

**Solution:** Always pass transaction when within a transaction block:

```javascript
const transaction = await sequelize.transaction();
try {
  await repository.method(data, transaction);
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

## Best Practices

1. **Always use services in routes/controllers** - Never call repositories directly
2. **Validate at service layer** - Repositories assume data is valid
3. **Use transactions for multi-step operations** - Prevents partial updates
4. **Use typed errors** - Makes error handling consistent
5. **Log important operations** - Services have built-in logging
6. **Test services with mocked repositories** - Fast, isolated tests

## Next Steps

### Recommended Improvements

1. **Add DTOs** - Create Data Transfer Objects for request/response formatting
2. **Add validators** - Create AnalysisValidator similar to AuthValidator
3. **Add tests** - Write unit tests for services and integration tests for repositories
4. **Add API documentation** - Document all endpoints using Swagger/OpenAPI
5. **Refactor Laboratory model** - Apply same pattern to Laboratory.js

## Summary

The Analysis model has been successfully refactored from a raw SQL class to a proper Sequelize model with a clean three-layer architecture:

- ✅ **Security**: No SQL injection vulnerabilities
- ✅ **OOP Principles**: Clear separation of concerns
- ✅ **Sequelize Compatible**: Works with migrations and associations
- ✅ **Maintainable**: Easy to test and extend
- ✅ **Backward Compatible**: Old code still works with deprecation warnings

All analysis-related operations now follow industry best practices and are ready for production use.

