const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'labcourse',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'migrations', 'create-billing-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Running migration...');

    // Execute SQL
    await connection.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 New tables created:');
    console.log('  - billing_packages');
    console.log('  - payment_history');
    console.log('\n📊 Bills table updated with new fields:');
    console.log('  - paidAmount');
    console.log('  - paymentMethod');
    console.log('  - paymentDate');
    console.log('  - billType');
    console.log('  - packageId');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
