const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const therapyController = require("../controllers/therapyController");

const router = express.Router();

// Helper: ensure doctor role
function requireDoctor(req, res, next) {
  if (!req.user || req.user.role !== "doctor") {
    return res.status(403).json({ error: "Doctor access required" });
  }
  next();
}

// ================ DOCTOR THERAPY DASHBOARD ENDPOINTS ================

// Get all therapies for current doctor
router.get("/doctor/dashboard", authenticateToken, requireDoctor, therapyController.getDashboard);

// Get therapy statistics for current doctor
router.get("/doctor/stats", authenticateToken, requireDoctor, therapyController.getStats);

// Get upcoming follow-ups for current doctor
router.get("/doctor/upcoming-followups", authenticateToken, requireDoctor, therapyController.getUpcomingFollowUps);

// Get therapies by status for dashboard
router.get("/doctor/status/:status", authenticateToken, requireDoctor, therapyController.getByStatus);

// Get therapy calendar data
router.get("/doctor/calendar", authenticateToken, requireDoctor, therapyController.getCalendar);

// Get single therapy by ID
router.get("/doctor/:id", authenticateToken, requireDoctor, therapyController.getById);

// Update therapy status
router.patch("/doctor/:id/status", authenticateToken, requireDoctor, therapyController.updateStatus);

// Create new therapy (doctor only)
router.post("/doctor/create", authenticateToken, requireDoctor, therapyController.create);

// Update therapy (doctor only)
router.put("/doctor/:id", authenticateToken, requireDoctor, therapyController.update);

// Delete therapy (doctor only)
router.delete("/doctor/:id", authenticateToken, requireDoctor, therapyController.delete);

module.exports = router;
