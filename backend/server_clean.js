const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Initialize Stripe
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Database connection
const db = require("./db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Initialize Stripe
if (process.env.STRIPE_SECRET_KEY) {
  console.log("✅ Stripe initialized successfully");
} else {
  console.log("⚠️ Stripe not configured");
}

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

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const doctorRoutes = require("./routes/doctorRoutes");
const labRoutes = require("./routes/laboratoryRoutes");
const lecturerRoutes = require("./routes/lecturerRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const patientRoutes = require("./routes/patientRoutes");
const profileRoutes = require("./routes/profile");
const adminProfileRoutes = require("./routes/adminProfile");
const appointmentRoutes = require("./routes/appointments");
const doctorApplicationRoutes = require("./routes/doctorApplications");
const therapyRoutes = require("./routes/therapyRoutes");
const trainRoutes = require("./routes/trainRoutes");
const contactRoutes = require("./routes/contactRoutes");

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/lecturers", lecturerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin-profile", adminProfileRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctor-applications", doctorApplicationRoutes);
app.use("/api/therapy", therapyRoutes);
app.use("/api/train", trainRoutes);
app.use("/api/contact", contactRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Check database tables on startup
checkTables();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server po punon në portën ${PORT}`));

