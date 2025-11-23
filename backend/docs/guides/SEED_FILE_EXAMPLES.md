# Sequelize Seed Files - Complete Guide

## How to Create Seed Files

### Step 1: Generate a Seed File

```bash
npx sequelize-cli seed:generate --name your-seed-name
```

This creates a file in the `seeders/` folder with a timestamp prefix:
- Example: `seeders/20251015133831-your-seed-name.js`

---

## Seed File Templates

### Template 1: Insert Multiple Records

```javascript
'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: '$2b$10$hashedpassword', // Use bcrypt to hash
        role: 'user',
        account_status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: '$2b$10$hashedpassword',
        role: 'doctor',
        account_status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: ['john@example.com', 'jane@example.com']
    }, {});
  }
};
```

---

### Template 2: Update Existing Records

```javascript
'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET account_status = 'active' 
      WHERE account_status = 'pending';
    `);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET account_status = 'pending' 
      WHERE account_status = 'active';
    `);
  }
};
```

---

### Template 3: Complex Data with Relations

```javascript
'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // First insert analysis types
    const [analysisTypes] = await queryInterface.sequelize.query(`
      INSERT INTO analysis_types (name, description, price, created_at, updated_at)
      VALUES 
        ('Blood Test', 'Complete blood count', 50.00, NOW(), NOW()),
        ('X-Ray', 'Chest X-Ray', 100.00, NOW(), NOW()),
        ('MRI Scan', 'Brain MRI', 500.00, NOW(), NOW())
    `);
    
    console.log('✅ Analysis types seeded successfully');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('analysis_types', {
      name: ['Blood Test', 'X-Ray', 'MRI Scan']
    }, {});
  }
};
```

---

### Template 4: Conditional Seeding (Check if Data Exists)

```javascript
'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if admin already exists
    const [admins] = await queryInterface.sequelize.query(`
      SELECT id FROM users WHERE role = 'admin' LIMIT 1
    `);
    
    if (admins.length === 0) {
      // No admin exists, create one
      await queryInterface.bulkInsert('users', [{
        name: 'Admin User',
        email: 'admin@example.com',
        password: '$2b$10$hashedpassword',
        role: 'admin',
        account_status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }]);
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️  Admin user already exists, skipping');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: 'admin@example.com'
    }, {});
  }
};
```

---

### Template 5: Using Sequelize Models (Recommended)

```javascript
'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up (queryInterface, Sequelize) {
    const { User } = require('../models');
    
    // Hash password properly
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await User.bulkCreate([
      {
        name: 'Demo User',
        email: 'demo@example.com',
        password: hashedPassword,
        role: 'user',
        account_status: 'active'
      },
      {
        name: 'Test Doctor',
        email: 'doctor@example.com',
        password: hashedPassword,
        role: 'doctor',
        account_status: 'active'
      }
    ]);
    
    console.log('✅ Demo users created');
  },

  async down (queryInterface, Sequelize) {
    const { User } = require('../models');
    
    await User.destroy({
      where: {
        email: ['demo@example.com', 'doctor@example.com']
      }
    });
  }
};
```

---

## Running Seed Files

### Run All Seeds
```bash
npx sequelize-cli db:seed:all
```

### Run Specific Seed
```bash
npx sequelize-cli db:seed --seed 20251015133831-your-seed-name.js
```

### Undo Last Seed
```bash
npx sequelize-cli db:seed:undo
```

### Undo Specific Seed
```bash
npx sequelize-cli db:seed:undo --seed 20251015133831-your-seed-name.js
```

### Undo All Seeds
```bash
npx sequelize-cli db:seed:undo:all
```

---

## Practical Examples

### Example 1: Demo Doctors

```bash
# Generate
npx sequelize-cli seed:generate --name demo-doctors

# Edit the file with this content:
```

```javascript
'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('doctor123', 10);
    
    // Insert users first
    await queryInterface.bulkInsert('users', [
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@hospital.com',
        password: hashedPassword,
        role: 'doctor',
        phone: '+1234567890',
        account_status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Dr. Michael Chen',
        email: 'michael.chen@hospital.com',
        password: hashedPassword,
        role: 'doctor',
        phone: '+1234567891',
        account_status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
    
    // Get the inserted user IDs
    const [users] = await queryInterface.sequelize.query(`
      SELECT id, email FROM users 
      WHERE email IN ('sarah.johnson@hospital.com', 'michael.chen@hospital.com')
    `);
    
    // Insert doctor profiles
    const doctorProfiles = users.map(user => ({
      user_id: user.id,
      speciality: user.email.includes('sarah') ? 'Cardiology' : 'Neurology',
      bio: 'Experienced doctor with 10+ years in the field',
      consultation_fee: 100.00,
      available: true,
      created_at: new Date(),
      updated_at: new Date()
    }));
    
    await queryInterface.bulkInsert('doctors', doctorProfiles);
    
    console.log('✅ Demo doctors created successfully');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('doctors', {
      user_id: {
        [Sequelize.Op.in]: queryInterface.sequelize.literal(
          `(SELECT id FROM users WHERE email IN ('sarah.johnson@hospital.com', 'michael.chen@hospital.com'))`
        )
      }
    });
    
    await queryInterface.bulkDelete('users', {
      email: ['sarah.johnson@hospital.com', 'michael.chen@hospital.com']
    });
  }
};
```

---

### Example 2: Analysis Types for Laboratories

```bash
npx sequelize-cli seed:generate --name default-analysis-types
```

```javascript
'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('analysis_types', [
      {
        name: 'Complete Blood Count (CBC)',
        description: 'Measures different components of blood',
        normal_range: '4.5-5.5 million cells/mcL (RBC)',
        unit: 'cells/mcL',
        price: 25.00,
        laboratory_id: null, // Available to all labs
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Lipid Panel',
        description: 'Cholesterol and triglycerides test',
        normal_range: '< 200 mg/dL (Total Cholesterol)',
        unit: 'mg/dL',
        price: 35.00,
        laboratory_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Blood Glucose',
        description: 'Fasting blood sugar test',
        normal_range: '70-100 mg/dL',
        unit: 'mg/dL',
        price: 15.00,
        laboratory_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Liver Function Test',
        description: 'Tests liver enzyme levels',
        normal_range: 'ALT: 7-56 U/L, AST: 10-40 U/L',
        unit: 'U/L',
        price: 45.00,
        laboratory_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Kidney Function Test',
        description: 'Creatinine and BUN levels',
        normal_range: 'Creatinine: 0.6-1.2 mg/dL',
        unit: 'mg/dL',
        price: 40.00,
        laboratory_id: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
    
    console.log('✅ Default analysis types seeded');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('analysis_types', {
      name: [
        'Complete Blood Count (CBC)',
        'Lipid Panel',
        'Blood Glucose',
        'Liver Function Test',
        'Kidney Function Test'
      ]
    });
  }
};
```

---

## Best Practices

### 1. Always Include `down()` Method
- Allows undoing seeds
- Essential for testing and development

### 2. Use Timestamps
```javascript
created_at: new Date(),
updated_at: new Date()
```

### 3. Hash Passwords
```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash('plaintext', 10);
```

### 4. Check for Existing Data
```javascript
const [existing] = await queryInterface.sequelize.query(`
  SELECT id FROM table WHERE condition
`);

if (existing.length === 0) {
  // Insert only if doesn't exist
}
```

### 5. Use Transactions for Multiple Operations
```javascript
const transaction = await queryInterface.sequelize.transaction();

try {
  await queryInterface.bulkInsert('users', data, { transaction });
  await queryInterface.bulkInsert('doctors', doctorData, { transaction });
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### 6. Add Console Logs
```javascript
console.log('✅ Seeding completed');
console.log('⚠️  Warning: ...');
console.log('ℹ️  Info: ...');
```

---

## Common Use Cases

### Development Data
- Demo users for testing
- Sample doctors and laboratories
- Test analysis types

### Default Configuration
- System settings
- Default roles and permissions
- Initial admin user

### Reference Data
- List of specialties
- Analysis types
- Common medications

---

## Troubleshooting

### Seed Not Running?
```bash
# Check seeder status
npx sequelize-cli db:seed:status

# Re-run specific seed
npx sequelize-cli db:seed:undo --seed filename.js
npx sequelize-cli db:seed --seed filename.js
```

### Foreign Key Errors?
- Insert parent records first
- Use proper order in `up()` method
- Delete child records first in `down()` method

### Duplicate Entry Errors?
- Check for existing data first
- Use unique identifiers
- Implement conditional seeding

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `seed:generate --name <name>` | Create new seed file |
| `db:seed:all` | Run all seeds |
| `db:seed --seed <file>` | Run specific seed |
| `db:seed:undo` | Undo last seed |
| `db:seed:undo:all` | Undo all seeds |
| `db:seed:status` | Check seed status |

---

## Example: Complete Seed Workflow

```bash
# 1. Create seed file
npx sequelize-cli seed:generate --name demo-data

# 2. Edit the file (add your data)

# 3. Run the seed
npx sequelize-cli db:seed --seed 20251015133831-demo-data.js

# 4. Verify in database
# (use your database client or query)

# 5. If needed, undo
npx sequelize-cli db:seed:undo --seed 20251015133831-demo-data.js
```

Happy seeding! 🌱

