require('dotenv').config();
const db = require('./models');

async function fixDB() {
  await db.sequelize.authenticate();
  
  try {
    console.log("Adding status to beds...");
    await db.sequelize.query("ALTER TABLE beds ADD COLUMN status ENUM('Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance') NOT NULL DEFAULT 'Available'");
    // Also migrate existing is_active = 0 to Maintenance if needed
    console.log("Success.");
  } catch (e) {
    if (e.message && e.message.includes('Duplicate column name')) {
      console.log("Status already exists in beds.");
    } else {
      console.error('Error adding status:', e);
    }
  }

  try {
    console.log("Adding recommended_room_id to admission_requests...");
    await db.sequelize.query("ALTER TABLE admission_requests ADD COLUMN recommended_room_id INT NULL");
    console.log("Success.");
  } catch (e) {
    if (e.message && e.message.includes('Duplicate column name')) {
      console.log("recommended_room_id already exists.");
    } else {
      console.error('Error adding recommended_room_id:', e);
    }
  }

  try {
    console.log("Adding recommended_bed_id to admission_requests...");
    await db.sequelize.query("ALTER TABLE admission_requests ADD COLUMN recommended_bed_id INT NULL");
    console.log("Success.");
  } catch (e) {
    if (e.message && e.message.includes('Duplicate column name')) {
      console.log("recommended_bed_id already exists.");
    } else {
      console.error('Error adding recommended_bed_id:', e);
    }
  }
}

fixDB().then(() => {
  console.log("Database schema fixed successfully.");
  process.exit(0);
}).catch((e) => {
  console.error("Failed to fix DB:", e);
  process.exit(1);
});
