require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Importo rruget
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const usersRoutes = require('./routes/users');
const adminProfileRoutes = require('./routes/adminProfile'); 
const doctorRoutes = require("./routes/doctorRoutes");

const app = express();

// CORS – lejo origin + credentials + Authorization header
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // ✅
  })
);

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookie parser
app.use(cookieParser());

const laboratoryRoutes = require('./routes/laboratoryRoutes');
app.use('/api/laboratories', laboratoryRoutes);

// Appointments routes (doctor bookings + Stripe)
const appointmentsRoutes = require('./routes/appointments');
app.use('/api/appointments', appointmentsRoutes);

// Rrugët kryesore
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin-profiles', adminProfileRoutes); 
app.use("/api/doctors", doctorRoutes);

// bëj folderin uploads publik
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Ensure SQL tables for doctor appointments exist
const db = require('./db');
const ensureTables = async () => {
  try {
    // Create appointments table with proper structure
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS appointments (
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
        CONSTRAINT fk_appt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_appt_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Ensured appointments table');
  } catch (e) {
    console.error('❌ Failed to ensure appointments table', e);
  }
};

ensureTables();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server po punon në portën ${PORT}`));