// routes/therapyRoutes.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const Therapy = require("../models/Therapy");
const db = require("../db");

const router = express.Router();

// Helper: ensure doctor role
function requireDoctor(req, res, next) {
  if (!req.user || req.user.role !== "doctor") {
    return res.status(403).json({ error: "Doctor access required" });
  }
  next();
}

// Helper: get current doctor id from users->doctors
async function getCurrentDoctorId(userId) {
  const [rows] = await db
    .promise()
    .query("SELECT id FROM doctors WHERE user_id=? LIMIT 1", [userId]);
  return rows[0]?.id || null;
}

// ================ DOCTOR THERAPY DASHBOARD ENDPOINTS ================

// Get all therapies for current doctor
router.get(
  "/doctor/dashboard",
  authenticateToken,
  requireDoctor,
  async (req, res) => {
    try {
      const doctorId = await getCurrentDoctorId(req.user.id);
      if (!doctorId) return res.json([]);

      const therapies = await Therapy.getByDoctorId(doctorId);
      res.json(therapies);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get therapy statistics for current doctor
router.get(
  "/doctor/stats",
  authenticateToken,
  requireDoctor,
  async (req, res) => {
    try {
      const doctorId = await getCurrentDoctorId(req.user.id);
      if (!doctorId)
        return res.json({
          total_therapies: 0,
          active_therapies: 0,
          completed_therapies: 0,
          cancelled_therapies: 0,
        });

      const stats = await Therapy.getDoctorStats(doctorId);
      res.json(stats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get upcoming follow-ups for current doctor
router.get(
  "/doctor/upcoming-followups",
  authenticateToken,
  requireDoctor,
  async (req, res) => {
    try {
      const doctorId = await getCurrentDoctorId(req.user.id);
      if (!doctorId) return res.json([]);

      const followUps = await Therapy.getUpcomingFollowUps(doctorId);
      res.json(followUps);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get therapies by status for dashboard
router.get(
  "/doctor/status/:status",
  authenticateToken,
  requireDoctor,
  async (req, res) => {
    try {
      const doctorId = await getCurrentDoctorId(req.user.id);
      if (!doctorId) return res.json([]);

      const { status } = req.params;
      const validStatuses = [
        "draft",
        "pending",
        "confirmed",
        "active",
        "on_hold",
        "completed",
        "cancelled",
        "overdue",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const therapies = await Therapy.getTherapiesByStatus(doctorId, status);
      res.json(therapies);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get therapy calendar data
router.get(
  "/doctor/calendar",
  authenticateToken,
  requireDoctor,
  async (req, res) => {
    try {
      const doctorId = await getCurrentDoctorId(req.user.id);
      if (!doctorId) return res.json([]);

      const { start_date, end_date } = req.query;
      if (!start_date || !end_date) {
        return res
          .status(400)
          .json({ error: "start_date and end_date are required" });
      }

      const calendarData = await Therapy.getTherapyCalendar(
        doctorId,
        start_date,
        end_date,
      );
      res.json(calendarData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Update therapy status
router.patch(
  "/doctor/:id/status",
  authenticateToken,
  requireDoctor,
  async (req, res) => {
    try {
      const doctorId = await getCurrentDoctorId(req.user.id);
      const therapyId = req.params.id;
      const { status } = req.body;

      // Verify therapy belongs to this doctor
      const [existing] = await db
        .promise()
        .query("SELECT id FROM therapies WHERE id=? AND doctor_id=?", [
          therapyId,
          doctorId,
        ]);

      if (existing.length === 0) {
        return res
          .status(404)
          .json({ error: "Therapy not found or access denied" });
      }

      const validStatuses = [
        "draft",
        "pending",
        "confirmed",
        "active",
        "on_hold",
        "completed",
        "cancelled",
        "overdue",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await Therapy.updateStatus(therapyId, status);
      res.json({ message: "Therapy status updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get therapy templates
router.get("/templates", authenticateToken, requireDoctor, async (req, res) => {
  try {
    const templates = await Therapy.getTherapyTemplates();
    res.json(templates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new therapy (doctor only)
router.post(
  "/doctor/create",
  authenticateToken,
  requireDoctor,
  async (req, res) => {
    try {
      const doctorId = await getCurrentDoctorId(req.user.id);
      if (!doctorId)
        return res.status(404).json({ error: "Doctor profile not found" });

      const {
        appointment_id,
        patient_id,
        therapy_text,
        medications,
        dosage,
        frequency,
        duration,
        instructions,
        follow_up_date,
        therapy_type,
        start_date,
        end_date,
        priority,
        patient_notes,
        doctor_notes,
      } = req.body;

      if (!appointment_id || !patient_id || !therapy_text) {
        return res
          .status(400)
          .json({
            error: "appointment_id, patient_id, and therapy_text are required",
          });
      }

      const therapyData = {
        appointment_id,
        doctor_id: doctorId,
        patient_id,
        therapy_text,
        medications: medications || null,
        dosage: dosage || null,
        frequency: frequency || null,
        duration: duration || null,
        instructions: instructions || null,
        follow_up_date: follow_up_date || null,
        therapy_type: therapy_type || null,
        start_date: start_date || null,
        end_date: end_date || null,
        priority: priority || "medium",
        patient_notes: patient_notes || null,
        doctor_notes: doctor_notes || null,
      };

      const therapyId = await Therapy.create(therapyData);
      res
        .status(201)
        .json({ id: therapyId, message: "Therapy created successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Update therapy (doctor only)
router.put(
  "/doctor/:id",
  authenticateToken,
  requireDoctor,
  async (req, res) => {
    try {
      const doctorId = await getCurrentDoctorId(req.user.id);
      const therapyId = req.params.id;

      // Verify therapy belongs to this doctor
      const [existing] = await db
        .promise()
        .query("SELECT id FROM therapies WHERE id=? AND doctor_id=?", [
          therapyId,
          doctorId,
        ]);

      if (existing.length === 0) {
        return res
          .status(404)
          .json({ error: "Therapy not found or access denied" });
      }

      const {
        therapy_text,
        medications,
        dosage,
        frequency,
        duration,
        instructions,
        follow_up_date,
        status,
      } = req.body;

      const updateData = {
        therapy_text,
        medications,
        dosage,
        frequency,
        duration,
        instructions,
        follow_up_date,
        status,
      };

      await Therapy.update(therapyId, updateData);
      res.json({ message: "Therapy updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Delete therapy (doctor only)
router.delete(
  "/doctor/:id",
  authenticateToken,
  requireDoctor,
  async (req, res) => {
    try {
      const doctorId = await getCurrentDoctorId(req.user.id);
      const therapyId = req.params.id;

      // Verify therapy belongs to this doctor
      const [existing] = await db
        .promise()
        .query("SELECT id FROM therapies WHERE id=? AND doctor_id=?", [
          therapyId,
          doctorId,
        ]);

      if (existing.length === 0) {
        return res
          .status(404)
          .json({ error: "Therapy not found or access denied" });
      }

      await Therapy.delete(therapyId);
      res.json({ message: "Therapy deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ================ PATIENT THERAPY ENDPOINTS ================

// Get all therapies for current patient
router.get("/patient/dashboard", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ error: "Patient access required" });
    }

    const therapies = await Therapy.getByPatientId(req.user.id);
    res.json(therapies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get therapy statistics for current patient
router.get("/patient/stats", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ error: "Patient access required" });
    }

    const stats = await Therapy.getPatientStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get upcoming follow-ups for current patient
router.get(
  "/patient/upcoming-followups",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "user") {
        return res.status(403).json({ error: "Patient access required" });
      }

      const followUps = await Therapy.getPatientUpcomingFollowUps(req.user.id);
      res.json(followUps);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get specific therapy details (patient can view their own therapies)
router.get("/patient/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ error: "Patient access required" });
    }

    const therapyId = req.params.id;
    const [rows] = await db
      .promise()
      .query("SELECT * FROM therapies WHERE id=? AND patient_id=?", [
        therapyId,
        req.user.id,
      ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Therapy not found or access denied" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================ GENERAL THERAPY ENDPOINTS ================

// Get all therapies (admin only)
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const therapies = await Therapy.getAll();
    res.json(therapies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get specific therapy by ID (admin only)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const therapy = await Therapy.getById(req.params.id);
    if (!therapy) {
      return res.status(404).json({ error: "Therapy not found" });
    }

    res.json(therapy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
