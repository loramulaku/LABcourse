const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Initialize Sequelize models
const { sequelize } = require('./models');

// Initialize Stripe
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Debug middleware to log cookies on every request
app.use((req, res, next) => {
  if (req.path.includes('/auth/refresh')) {
    console.log('\n🔍 === INCOMING REQUEST TO /auth/refresh ===');
    console.log('📍 Origin:', req.headers.origin);
    console.log('🍪 Cookie header:', req.headers.cookie);
    console.log('🍪 Parsed cookies:', req.cookies);
    console.log('🍪 Signed cookies:', req.signedCookies);
    console.log('===========================================\n');
  }
  next();
});

// Serve uploaded files with CORS headers to prevent CORB
app.use("/uploads", (req, res, next) => {
  // Set CORS headers to allow cross-origin access
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
  
  // Important: Set Cross-Origin-Resource-Policy to cross-origin to prevent CORB
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  
  // Ensure proper content type detection
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
}, express.static(path.join(__dirname, "uploads")));

// Initialize Stripe
if (process.env.STRIPE_SECRET_KEY) {
  console.log("✅ Stripe initialized successfully");
} else {
  console.log("⚠️ Stripe not configured");
}

// Database connection using Sequelize
const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize database connection established successfully');
    
    // Sync models in development (NOT recommended for production)
    if (process.env.NODE_ENV === 'development') {
      // Use migrations instead: npx sequelize-cli db:migrate
      console.log('ℹ️ To create/update tables, run: npx sequelize-cli db:migrate');
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const doctorRoutes = require("./routes/doctorRoutes");
const doctorDashboardRoutes = require("./routes/doctorDashboardRoutes");
const labRoutes = require("./routes/laboratoryRoutes");
const lecturerRoutes = require("./routes/lecturerRoutes");
const { router: notificationRoutes } = require("./routes/notificationRoutes");
const patientRoutes = require("./routes/patientRoutes");
const profileRoutes = require("./routes/profile");
const adminProfileRoutes = require("./routes/adminProfile");
const appointmentRoutes = require("./routes/appointments");
const doctorApplicationRoutes = require("./routes/doctorApplications");
const therapyRoutes = require("./routes/therapyRoutes");
const trainRoutes = require("./routes/trainRoutes");
const contactRoutes = require("./routes/contactRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const patientAnalysesRoutes = require("./routes/patientAnalysesRoutes");
// IPD Routes - Layered Architecture
const ipdAdminRoutesOOP = require("./routes/oop/ipdAdminRoutes");
const ipdDoctorRoutesOOP = require("./routes/oop/ipdDoctorRoutes");

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/doctor", doctorDashboardRoutes); // Doctor dashboard routes
app.use("/api/laboratories", labRoutes); // Changed from /api/labs to match frontend
app.use("/api/labs", labRoutes); // Keep legacy route for backward compatibility
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
app.use("/api/departments", departmentRoutes);
app.use("/api/patient-analyses", patientAnalysesRoutes);
// IPD Routes - Layered Architecture
app.use("/api/ipd/admin", ipdAdminRoutesOOP);
app.use("/api/ipd/doctor", ipdDoctorRoutesOOP);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    database: sequelize.authenticate() ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to database and start server
connectDatabase().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server po punon në portën ${PORT}`));
});
