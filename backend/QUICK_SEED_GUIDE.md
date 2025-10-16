# Quick Seed File Guide 🌱

## 3-Step Process

### Step 1: Generate Seed File
```bash
npx sequelize-cli seed:generate --name your-seed-name
```
✅ Creates: `seeders/YYYYMMDDHHMMSS-your-seed-name.js`

---

### Step 2: Edit the Seed File

**Basic Structure:**
```javascript
'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Add your data here
    await queryInterface.bulkInsert('table_name', [
      {
        column1: 'value1',
        column2: 'value2',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    // Undo: remove the data
    await queryInterface.bulkDelete('table_name', {
      column1: 'value1'
    }, {});
  }
};
```

---

### Step 3: Run the Seed
```bash
npx sequelize-cli db:seed --seed FILENAME.js
```

---

## Common Commands

```bash
# Run all seeds
npx sequelize-cli db:seed:all

# Undo last seed
npx sequelize-cli db:seed:undo

# Undo specific seed
npx sequelize-cli db:seed:undo --seed FILENAME.js

# Check seed status
npx sequelize-cli db:seed:status
```

---

## Real Example

### 1. Create Users Seed
```bash
npx sequelize-cli seed:generate --name demo-users
```

### 2. Edit the File
```javascript
'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up (queryInterface, Sequelize) {
    const password = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        name: 'Test User',
        email: 'test@example.com',
        password: password,
        role: 'user',
        account_status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
    
    console.log('✅ Demo user created');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: 'test@example.com'
    });
  }
};
```

### 3. Run It
```bash
npx sequelize-cli db:seed --seed 20251015134303-demo-users.js
```

---

## Tips & Tricks

### ✅ Always Include Timestamps
```javascript
created_at: new Date(),
updated_at: new Date()
```

### ✅ Hash Passwords
```javascript
const bcrypt = require('bcrypt');
const password = await bcrypt.hash('plaintext', 10);
```

### ✅ Use Console Logs
```javascript
console.log('✅ Success message');
console.log('ℹ️  Info message');
console.log('⚠️  Warning message');
```

### ✅ Handle Duplicates
```javascript
// Check if exists first
const [existing] = await queryInterface.sequelize.query(`
  SELECT id FROM users WHERE email = 'test@example.com'
`);

if (existing.length === 0) {
  // Insert only if doesn't exist
  await queryInterface.bulkInsert(...);
}
```

---

## Your Seed Files

Current seed files in your project:

1. `20251015133831-update-user-role.js` ✅ Run
   - Sets lora@gmail.com as admin

2. `20251015134303-demo-analysis-types.js` ✅ Run
   - Adds 8 common analysis types

---

## Quick Checklist

- [ ] Generate seed file: `npx sequelize-cli seed:generate --name NAME`
- [ ] Edit file in `seeders/` folder
- [ ] Add `up()` method (insert data)
- [ ] Add `down()` method (remove data)
- [ ] Include timestamps
- [ ] Run seed: `npx sequelize-cli db:seed --seed FILENAME`
- [ ] Verify in database

---

## Need More Examples?

See `SEED_FILE_EXAMPLES.md` for:
- Complex data with relations
- Conditional seeding
- Using Sequelize models
- Best practices
- And more!

---

Happy Seeding! 🌱

