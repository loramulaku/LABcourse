const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const doctorDashboardController = require("../controllers/doctorDashboardController");

const router = express.Router();

// Middleware to check if user is a doctor
const isDoctor = async (req, res, next) => {
  if (req.user.role !== "doctor") {
    return res.status(403).json({ error: "Access denied. Doctor role required." });
  }
  next();
};

// Get doctor dashboard statistics
router.get("/dashboard/stats", authenticateToken, isDoctor, doctorDashboardController.getDashboardStats);

// Get recent appointments for doctor
router.get("/appointments/recent", authenticateToken, isDoctor, doctorDashboardController.getRecentAppointments);

// Get upcoming appointments for doctor
router.get("/appointments/upcoming", authenticateToken, isDoctor, doctorDashboardController.getUpcomingAppointments);

// Get all appointments for doctor (with filtering)
router.get("/appointments", authenticateToken, isDoctor, doctorDashboardController.getAllAppointments);

// Get single appointment details
router.get("/appointment/:id", authenticateToken, isDoctor, doctorDashboardController.getAppointmentById);

// Update appointment status
router.patch("/appointment/:id/status", authenticateToken, isDoctor, doctorDashboardController.updateAppointmentStatus);

// Approve appointment (Doctor confirms -> Patient pays)
router.post("/appointment/:id/approve", authenticateToken, isDoctor, doctorDashboardController.approveAppointment);

// Reject appointment
router.post("/appointment/:id/reject", authenticateToken, isDoctor, doctorDashboardController.rejectAppointment);

// Get pending appointments (for doctor to review)
router.get("/appointments/pending", authenticateToken, isDoctor, doctorDashboardController.getPendingAppointments);

// Debug endpoint: Check appointment payment link status
router.get("/appointment/:id/payment-status", authenticateToken, doctorDashboardController.getPaymentStatus);

// Submit clinical assessment for confirmed appointment
// Using layered architecture controller
const IPDDoctorController = require('../controllers/oop/IPDDoctorController');
const ipdDoctorController = new IPDDoctorController();
router.post("/appointment/:id/clinical-assessment", authenticateToken, isDoctor, ipdDoctorController.submitClinicalAssessment);

module.exports = router;
