# 🗄️ Database Setup Guide

## Quick Commands

### Run Migrations and Seeders Together

```batch
npm run migrate
```

This single command will:
1. ✅ Apply all pending database migrations
2. ✅ Run all database seeders

### Individual Commands

```batch
# Run only migrations
npx sequelize-cli db:migrate

# Run only seeders
npm run seed

# Or use the batch file
run-migrations.bat
```

---

## 📋 Available NPM Scripts

### Migration Scripts

| Command | Description |
|---------|-------------|
| `npm run migrate` | Run migrations + seeders together |
| `npm run migrate:undo` | Undo the last migration |
| `npm run seed` | Run all seeders |
| `npm run seed:undo` | Undo all seeders |

---

## 🚀 What Happens When You Run `npm run migrate`

### Step 1: Migrations
The system will apply any pending migrations in order:

```
== 20251101_add_specializations_to_doctors: migrating =======
== 20251101_add_specializations_to_doctors: migrated (0.123s)

== 20251101_add_department_id_to_doctors: migrating =======
== 20251101_add_department_id_to_doctors: migrated (0.234s)
```

These migrations add:
- `specializations` (JSON) column to doctors table
- `department_id` (foreign key) column to doctors table

### Step 2: Seeders
After migrations complete, seeders will automatically run:

```
== 20251031_seed_departments: seeding =======
== 20251031_seed_departments: seeded (0.045s)

== 20251101_seed_sample_doctors: seeding =======
== 20251101_seed_sample_doctors: seeded (0.067s)
```

Seeders populate your database with:
- Initial departments
- Sample doctors
- Test data (if configured)

---

## 📁 Project Structure

```
backend/
├── migrations/           # Database schema changes
│   ├── 20251014084155-create-all-tables.js
│   ├── 20251031_add_departments.js
│   ├── 20251031_add_specializations_to_departments.js
│   ├── 20251101_add_specializations_to_doctors.js
│   └── 20251101_add_department_id_to_doctors.js
│
├── seeders/             # Initial data
│   ├── (your seeder files here)
│   └── README.md
│
├── models/              # Sequelize models
│   ├── Doctor.js
│   ├── Department.js
│   └── index.js
│
└── config/
    └── database.js      # Database configuration
```

---

## 🔧 Creating New Migrations

### Generate a new migration:

```batch
npx sequelize-cli migration:generate --name your-migration-name
```

Example:
```batch
npx sequelize-cli migration:generate --name add-verified-to-doctors
```

This creates a file like:
```
migrations/20251101123456-add-verified-to-doctors.js
```

### Migration Template:

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add your changes here
    await queryInterface.addColumn('doctors', 'verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback changes here
    await queryInterface.removeColumn('doctors', 'verified');
  },
};
```

---

## 🌱 Creating New Seeders

### Generate a new seeder:

```batch
npx sequelize-cli seed:generate --name your-seeder-name
```

Example:
```batch
npx sequelize-cli seed:generate --name demo-doctors
```

This creates:
```
seeders/20251101123456-demo-doctors.js
```

### Seeder Template:

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('doctors', [
      {
        user_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        specialization: 'Cardiologist',
        specializations: JSON.stringify(['Cardiologist', 'Internal Medicine']),
        department_id: 1,
        degree: 'MD',
        experience_years: 10,
        consultation_fee: 100.00,
        available: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Add more records...
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('doctors', null, {});
  },
};
```

---

## ⚠️ Troubleshooting

### Error: "Seeder already exists"

This is normal if you run `npm run migrate` multiple times. Seeders are tracked in the `SequelizeSeeders` table.

**To re-run seeders:**
```batch
npm run seed:undo
npm run seed
```

### Error: "Migration already executed"

Migrations are also tracked and won't run twice. To force re-run:

```batch
# Undo last migration
npm run migrate:undo

# Re-run migrations
npx sequelize-cli db:migrate
```

### Error: "Cannot add or update a child row: a foreign key constraint fails"

This means your seeder is trying to insert data that references a non-existent foreign key.

**Solution**: Make sure referenced records exist first.

Example - If seeding doctors with `department_id: 5`, ensure department with `id: 5` exists:

```javascript
// First seed departments
await queryInterface.bulkInsert('departments', [...], {});

// Then seed doctors
await queryInterface.bulkInsert('doctors', [
  { department_id: 1, ... },  // department 1 must exist
], {});
```

### No Seeders to Run

If you see "⚠️ Seeders failed or no seeders found!" it means:
- You don't have any seeder files yet, OR
- All seeders have already been executed

This is **not critical**. Your application will work fine without seeders (just without initial data).

---

## 📊 Checking Migration Status

### View applied migrations:

```sql
-- In MySQL
SELECT * FROM SequelizeMeta ORDER BY name;
```

### View applied seeders:

```sql
-- In MySQL
SELECT * FROM SequelizeSeeders ORDER BY name;
```

---

## 🔄 Workflow Examples

### First-time setup:

```batch
# Install dependencies
npm install

# Run migrations and seeders
npm run migrate

# Start server
npm start
```

### After pulling new code:

```batch
# Check for new migrations/seeders
npm run migrate

# Restart server if needed
npm start
```

### Reset database (development only):

```batch
# Undo all seeders
npm run seed:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all

# Re-run everything
npm run migrate
```

---

## ✅ Best Practices

1. **Always create migrations for schema changes**
   - Never manually alter the database
   - Use migrations so changes are version-controlled

2. **Use seeders for initial/test data**
   - Development seed data
   - Required initial records (like default departments)
   - Test fixtures

3. **Don't use seeders in production**
   - Seeders should be for development/testing only
   - Use proper data import tools for production data

4. **Test migrations before committing**
   - Run `npm run migrate`
   - Verify the changes
   - Test `migrate:undo` works correctly

5. **Keep migrations small and focused**
   - One migration per logical change
   - Makes rollback easier
   - Easier to debug issues

---

## 🎯 Summary

| What You Want | Command to Use |
|---------------|---------------|
| Setup everything | `npm run migrate` |
| Just migrations | `npx sequelize-cli db:migrate` |
| Just seeders | `npm run seed` |
| Undo last migration | `npm run migrate:undo` |
| Undo all seeders | `npm run seed:undo` |
| Create new migration | `npx sequelize-cli migration:generate --name <name>` |
| Create new seeder | `npx sequelize-cli seed:generate --name <name>` |

**Most common use case:**
```batch
npm run migrate
```
This runs both migrations and seeders in the correct order! ✅
