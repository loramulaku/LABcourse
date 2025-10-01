require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Importo rruget
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const usersRoutes = require("./routes/users");
const adminProfileRoutes = require("./routes/adminProfile");
const doctorRoutes = require("./routes/doctorRoutes");
const doctorApplicationsRoutes = require('./routes/doctorApplications');
const lecturerRoutes = require("./routes/lecturerRoutes");
const trainRoutes = require("./routes/trainRoutes");
const contactRoutes = require("./routes/contactRoutes"); 


const app = express();

// CORS – lejo origin + credentials + Authorization header
app.use(
  cors({
    origin: [
      process.env.CLIENT_ORIGIN || "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
      "http://localhost:5178",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], // ✅
  }),
);

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookie parser
app.use(cookieParser());

const laboratoryRoutes = require("./routes/laboratoryRoutes");
app.use("/api/laboratories", laboratoryRoutes);

// Therapy routes
const therapyRoutes = require("./routes/therapyRoutes");
app.use("/api/therapies", therapyRoutes);

// Appointments routes (doctor bookings + Stripe)
const appointmentsRoutes = require("./routes/appointments");
app.use("/api/appointments", appointmentsRoutes);

// Notification routes
const { router: notificationRoutes } = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

// Patient routes
const patientRoutes = require("./routes/patientRoutes");
app.use("/api/patient-analyses", patientRoutes);




// Rrugët kryesore
app.use("/api/lecturers", lecturerRoutes);
app.use("/api/trains", trainRoutes);  
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin-profiles", adminProfileRoutes);
app.use("/api/doctors", doctorRoutes);
app.use('/api/doctor-applications', doctorApplicationsRoutes);
app.use("/api/contact", contactRoutes);




// bëj folderin uploads publik
const path = require("path");
const fs = require("fs");
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Ensure SQL tables for doctor appointments exist
const db = require("./db");
const ensureTables = async () => {
  try {
    // Check if appointments table exists
    const [tables] = await db.promise().query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments'
    `);

    if (tables.length === 0) {
      // Check if referenced tables exist
      const [usersTable] = await db.promise().query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      `);
      
      const [doctorsTable] = await db.promise().query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors'
      `);

      // Create appointments table with or without foreign keys based on referenced tables
      if (usersTable.length > 0 && doctorsTable.length > 0) {
        // Create with foreign keys
        await db.promise().query(`
          CREATE TABLE appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            doctor_id INT NOT NULL,
            scheduled_for DATETIME NOT NULL,
            reason VARCHAR(500) NOT NULL,
            phone VARCHAR(20),
            notes TEXT,
            status ENUM('PENDING','CONFIRMED','DECLINED','CANCELLED') DEFAULT 'PENDING',
            stripe_session_id VARCHAR(255),
            payment_status ENUM('unpaid','paid','refunded') DEFAULT 'unpaid',
            amount DECIMAL(10,2) DEFAULT 20.00,
            currency VARCHAR(3) DEFAULT 'EUR',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_doctor_time (doctor_id, scheduled_for),
            CONSTRAINT fk_appointments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("✅ Created appointments table with foreign keys");
      } else {
        // Create without foreign keys (referenced tables don't exist yet)
        await db.promise().query(`
          CREATE TABLE appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            doctor_id INT NOT NULL,
            scheduled_for DATETIME NOT NULL,
            reason VARCHAR(500) NOT NULL,
            phone VARCHAR(20),
            notes TEXT,
            status ENUM('PENDING','CONFIRMED','DECLINED','CANCELLED') DEFAULT 'PENDING',
            stripe_session_id VARCHAR(255),
            payment_status ENUM('unpaid','paid','refunded') DEFAULT 'unpaid',
            amount DECIMAL(10,2) DEFAULT 20.00,
            currency VARCHAR(3) DEFAULT 'EUR',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_doctor_time (doctor_id, scheduled_for)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("✅ Created appointments table without foreign keys (referenced tables not found)");
      }
    } else {
      console.log("✅ Appointments table already exists");

      // Table exists, check if it has the required columns
      const [columns] = await db.promise().query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments'
      `);

      const columnNames = columns.map((col) => col.COLUMN_NAME);
      const requiredColumns = [
        "id",
        "user_id",
        "doctor_id",
        "scheduled_for",
        "reason",
        "status",
        "payment_status",
        "amount",
      ];

      const missingColumns = requiredColumns.filter(
        (col) => !columnNames.includes(col),
      );

      if (missingColumns.length > 0) {
        console.log(
          "⚠️  Appointments table exists but missing columns:",
          missingColumns,
        );
        // Add missing columns if needed
        for (const col of missingColumns) {
          try {
            let alterQuery = "";
            switch (col) {
              case "status":
                alterQuery = `ALTER TABLE appointments ADD COLUMN status ENUM('PENDING','CONFIRMED','DECLINED','CANCELLED') DEFAULT 'PENDING'`;
                break;
              case "payment_status":
                alterQuery = `ALTER TABLE appointments ADD COLUMN payment_status ENUM('unpaid','paid','refunded') DEFAULT 'unpaid'`;
                break;
              case "amount":
                alterQuery = `ALTER TABLE appointments ADD COLUMN amount DECIMAL(10,2) DEFAULT 20.00`;
                break;
              case "currency":
                alterQuery = `ALTER TABLE appointments ADD COLUMN currency VARCHAR(3) DEFAULT 'EUR'`;
                break;
              case "stripe_session_id":
                alterQuery = `ALTER TABLE appointments ADD COLUMN stripe_session_id VARCHAR(255)`;
                break;
              case "phone":
                alterQuery = `ALTER TABLE appointments ADD COLUMN phone VARCHAR(20)`;
                break;
              case "notes":
                alterQuery = `ALTER TABLE appointments ADD COLUMN notes TEXT`;
                break;
              case "created_at":
                alterQuery = `ALTER TABLE appointments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
                break;
              case "updated_at":
                alterQuery = `ALTER TABLE appointments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`;
                break;
            }
            if (alterQuery) {
              await db.promise().query(alterQuery);
              console.log(`✅ Added column: ${col}`);
            }
          } catch (err) {
            console.log(`⚠️  Could not add column ${col}:`, err.message);
          }
        }
      } else {
    console.log("✅ All required columns present in appointments table");
  }

  // Ensure message_senders table exists
  const [messageSendersTables] = await db.promise().query(`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_senders'
  `);
  if (messageSendersTables.length === 0) {
    // Check if messages table exists
    const [messagesTable] = await db.promise().query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages'
    `);

    // Create message_senders table with or without foreign key based on messages table
    if (messagesTable.length > 0) {
      // Create with foreign key
      await db.promise().query(`
        CREATE TABLE message_senders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          message_id INT NOT NULL,
          sender_name VARCHAR(255) NOT NULL,
          sender_email VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log("✅ Created message_senders table with foreign key");
    } else {
      // Create without foreign key (messages table doesn't exist yet)
      await db.promise().query(`
        CREATE TABLE message_senders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          message_id INT NOT NULL,
          sender_name VARCHAR(255) NOT NULL,
          sender_email VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log("✅ Created message_senders table without foreign key (messages table not found)");
    }
  } else {
    console.log("✅ message_senders table already exists");
  }
    }

    // Ensure therapies table exists
    const [therapiesTables] = await db.promise().query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'therapies'
    `);
    if (therapiesTables.length === 0) {
      // Check if referenced tables exist
      const [appointmentsTable] = await db.promise().query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments'
      `);
      
      const [usersTable] = await db.promise().query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      `);
      
      const [doctorsTable] = await db.promise().query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors'
      `);

      // Create therapies table with or without foreign keys based on referenced tables
      if (appointmentsTable.length > 0 && usersTable.length > 0 && doctorsTable.length > 0) {
        // Create with foreign keys
        await db.promise().query(`
          CREATE TABLE therapies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            appointment_id INT NOT NULL,
            doctor_id INT NOT NULL,
            patient_id INT NOT NULL,
            therapy_text TEXT NOT NULL,
            medications TEXT,
            dosage VARCHAR(255),
            frequency VARCHAR(255),
            duration VARCHAR(255),
            instructions TEXT,
            follow_up_date DATETIME,
            therapy_type VARCHAR(100),
            start_date DATE,
            end_date DATE,
            priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
            status ENUM('draft', 'pending', 'confirmed', 'active', 'on_hold', 'completed', 'cancelled', 'overdue') DEFAULT 'draft',
            patient_notes TEXT,
            doctor_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_therapies_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
            CONSTRAINT fk_therapies_doc FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
            CONSTRAINT fk_therapies_patient FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("✅ Created therapies table with foreign keys");
      } else {
        // Create without foreign keys (referenced tables don't exist yet)
        await db.promise().query(`
          CREATE TABLE therapies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            appointment_id INT NOT NULL,
            doctor_id INT NOT NULL,
            patient_id INT NOT NULL,
            therapy_text TEXT NOT NULL,
            medications TEXT,
            dosage VARCHAR(255),
            frequency VARCHAR(255),
            duration VARCHAR(255),
            instructions TEXT,
            follow_up_date DATETIME,
            therapy_type VARCHAR(100),
            start_date DATE,
            end_date DATE,
            priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
            status ENUM('draft', 'pending', 'confirmed', 'active', 'on_hold', 'completed', 'cancelled', 'overdue') DEFAULT 'draft',
            patient_notes TEXT,
            doctor_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("✅ Created therapies table without foreign keys (referenced tables not found)");
      }
    } else {
      console.log("✅ Therapies table already exists");
    }
  } catch (e) {
    console.error("❌ Failed to ensure appointments table", e);
  }
};

// Check database tables status (all tables already exist in your database)
const checkTables = async () => {
  try {
    // List of core tables that should exist in your database
    const coreTables = [
      'users', 'user_profiles', 'doctors', 'laboratories', 'appointments',
      'notifications', 'messages', 'message_senders', 'contact_message_redirects',
      'patient_analyses', 'analysis_types', 'analysis_history', 'doctor_applications',
      'admin_profiles', 'refresh_tokens', 'password_reset_tokens', 'audit_logs'
    ];

    console.log("🔍 Checking database tables...");
    
    for (const tableName of coreTables) {
      try {
        const [tables] = await db.promise().query(`
          SELECT TABLE_NAME 
          FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
        `, [tableName]);
        
        if (tables.length > 0) {
          console.log(`✅ ${tableName} table exists`);
        } else {
          console.log(`⚠️ ${tableName} table not found`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${tableName}:`, error.message);
      }
    }
    
    console.log("✅ Database tables check completed");
  } catch (error) {
    console.error("❌ Failed to check database tables:", error);
  }
};

checkTables();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server po punon në portën ${PORT}`));
