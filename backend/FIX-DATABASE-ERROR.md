# Fix Database Error - Step by Step Guide

## Problem
The application is showing a 500 error because the database is missing required columns:
- `doctors.department_id` (for linking doctors to departments)
- `doctors.specializations` (for storing multiple specializations as JSON)

## Solution: Run Database Migrations

### Option 1: Using the Migration Script (Easiest)

1. **Open Command Prompt** in the backend folder:
   - Navigate to: `c:\Lora\LABcourse\backend`
   - OR right-click the backend folder and select "Open in Terminal"

2. **Run the migration script**:
   ```batch
   run-migrations.bat
   ```

3. **Wait for completion**
   - You should see messages about migrations being applied
   - Press any key when prompted

4. **Restart the backend server**:
   ```batch
   npm start
   ```

### Option 2: Manual Command (If script doesn't work)

1. **Open Command Prompt** in the backend folder

2. **Run this command**:
   ```batch
   npx sequelize-cli db:migrate
   ```

3. **You should see output like**:
   ```
   Sequelize CLI [Node: xx.x.x, CLI: x.x.x, ORM: x.x.x]

   Loaded configuration file "config\database.js".
   Using environment "development".
   == 20251101_add_specializations_to_doctors: migrating =======
   == 20251101_add_specializations_to_doctors: migrated (0.123s)
   == 20251101_add_department_id_to_doctors: migrating =======
   == 20251101_add_department_id_to_doctors: migrated (0.234s)
   ```

4. **Restart the backend**:
   ```batch
   npm start
   ```

## Verify It Worked

1. After running migrations and restarting the backend:
   - Backend should start without SQL errors
   - No `ER_BAD_FIELD_ERROR` in the console

2. Open the frontend:
   - Go to http://localhost:5173
   - The 500 error should be gone
   - Doctors list should load successfully

## If You Still Get Errors

### Error: "Cannot find module 'sequelize-cli'"
**Solution**: Install it first:
```batch
npm install
```

### Error: "Access denied for user"
**Solution**: Check your `.env` file has correct database credentials:
```
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
DB_HOST=localhost
DB_PORT=3306
```

### Error: "Unknown database"
**Solution**: Create the database first:
```sql
CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## What These Migrations Do

1. **add_specializations_to_doctors**: Adds a JSON column to store multiple specializations
2. **add_department_id_to_doctors**: Adds a foreign key linking doctors to departments

## After Migration Success

Your doctors table will have these new columns:
- `specializations` - JSON array of specialization strings
- `department_id` - Integer linking to departments.id

The application will then work properly with:
- ✅ Multi-specialization selection via checkboxes
- ✅ Department selection and filtering
- ✅ Proper data storage and retrieval
