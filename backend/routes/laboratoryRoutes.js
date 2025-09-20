// routes/laboratoryRoutes.js
const express = require("express");
const { authenticateToken, isAdmin } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const Laboratory = require("../models/Laboratory");
const Analysis = require("../models/Analysis");
const db = require("../db");
const bcrypt = require("bcrypt");

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/reports/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

const router = express.Router();

// helper: ensure lab role
function requireLab(req, res, next) {
  if (!req.user || req.user.role !== "lab")
    return res.status(403).json({ error: "Lab access required" });
  next();
}

// helper: get current lab id from users->laboratories
async function getCurrentLabId(userId) {
  const [rows] = await db
    .promise()
    .query("SELECT id FROM laboratories WHERE user_id=? LIMIT 1", [userId]);
  return rows[0]?.id || null;
}

// helper: log analysis history for audit
async function logAnalysisHistory(
  patientAnalysisId,
  actionType,
  performedByUserId,
  oldStatus = null,
  newStatus = null,
  notes = null,
  resultPdfPath = null,
  resultNote = null,
) {
  try {
    await db.promise().query(
      `INSERT INTO analysis_history 
             (patient_analysis_id, action_type, old_status, new_status, performed_by_user_id, notes, result_pdf_path, result_note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientAnalysisId,
        actionType,
        oldStatus,
        newStatus,
        performedByUserId,
        notes,
        resultPdfPath,
        resultNote,
      ],
    );
  } catch (error) {
    console.error("Failed to log analysis history:", error);
  }
}

// Get all laboratories
router.get("/", async (req, res) => {
  try {
    const laboratories = await Laboratory.getAll();
    res.json(laboratories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------- LAB DASHBOARD ENDPOINTS ----------------
// List patients with history for current lab
router.get(
  "/dashboard/history",
  authenticateToken,
  requireLab,
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.json([]);
      const [rows] = await db.promise().query(
        `SELECT DISTINCT u.id as user_id, u.name, u.email
             FROM patient_analyses pa
             JOIN users u ON u.id = pa.user_id
             WHERE pa.laboratory_id = ?
             ORDER BY u.name`,
        [labId],
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load history" });
    }
  },
);

// Appointments list for current lab (upcoming + past)
router.get(
  "/dashboard/appointments",
  authenticateToken,
  requireLab,
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.json([]);
      const [rows] = await db.promise().query(
        `SELECT pa.id, u.name as patient_name, at.name as analysis_name, pa.appointment_date, pa.status
             FROM patient_analyses pa
             JOIN users u ON u.id = pa.user_id
             JOIN analysis_types at ON at.id = pa.analysis_type_id
             WHERE pa.laboratory_id = ?
             ORDER BY pa.appointment_date DESC`,
        [labId],
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load appointments" });
    }
  },
);

// Appointments grouped by date for current lab
router.get(
  "/dashboard/appointments-by-date",
  authenticateToken,
  requireLab,
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.json({});
      const [rows] = await db.promise().query(
        `SELECT pa.id,
                    DATE_FORMAT(pa.appointment_date, '%Y-%m-%d') as date,
                    TIME(pa.appointment_date) as time,
                    u.id as user_id,
                    u.name as user_name,
                    u.email as user_email,
                    up.phone as user_phone,
                    at.name as analysis_name,
                    pa.status,
                    pa.notes
             FROM patient_analyses pa
             JOIN users u ON u.id = pa.user_id
             LEFT JOIN user_profiles up ON up.user_id = u.id
             JOIN analysis_types at ON at.id = pa.analysis_type_id
             WHERE pa.laboratory_id = ? AND pa.appointment_date IS NOT NULL AND pa.status != 'cancelled'
             ORDER BY pa.appointment_date ASC`,
        [labId],
      );
      const grouped = rows.reduce((acc, r) => {
        // DATE_FORMAT returns a string, so we can use it directly
        const key = r.date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
      }, {});
      res.json(grouped);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load grouped appointments" });
    }
  },
);

// Update status (cancel, confirm, or set to pending_result)
router.post(
  "/dashboard/update-status/:id",
  authenticateToken,
  requireLab,
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const id = req.params.id;
      const { status, result_note } = req.body;

      // Validate status
      const validStatuses = [
        "unconfirmed",
        "pending_result",
        "completed",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // Get current status before update
      const [[currentRow]] = await db
        .promise()
        .query(
          "SELECT status FROM patient_analyses WHERE id=? AND laboratory_id=?",
          [id, labId],
        );

      if (!currentRow) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      const oldStatus = currentRow.status;

      // Update status and optionally result_note
      const updateFields = ["status = ?"];
      const updateValues = [status];

      if (result_note !== undefined) {
        updateFields.push("result_note = ?");
        updateValues.push(result_note);
      }

      updateValues.push(id, labId);

      await db
        .promise()
        .query(
          `UPDATE patient_analyses SET ${updateFields.join(", ")} WHERE id=? AND laboratory_id=?`,
          updateValues,
        );

      // Log history
      await logAnalysisHistory(
        id,
        "status_changed",
        req.user.id,
        oldStatus,
        status,
        `Status changed from ${oldStatus} to ${status}`,
      );

      // Get appointment details for notification
      const [[row]] = await db.promise().query(
        `SELECT pa.*, u.name as user_name, u.email as user_email, at.name as analysis_name
             FROM patient_analyses pa 
             JOIN users u ON u.id=pa.user_id 
             JOIN analysis_types at ON at.id=pa.analysis_type_id
             WHERE pa.id=?`,
        [id],
      );

      // Create notification based on status change
      if (row) {
        const { createNotification } = require("./notificationRoutes");
        let notificationTitle, notificationMessage;

        switch (status) {
          case "pending_result":
            notificationTitle = "Appointment Confirmed";
            notificationMessage = `Your appointment for ${row.analysis_name} has been confirmed. Please arrive on time.`;
            break;
          case "cancelled":
            notificationTitle = "Appointment Cancelled";
            notificationMessage = `Sorry, your analysis request was cancelled.`;
            break;
          case "completed":
            notificationTitle = "Results Ready";
            notificationMessage = `Your test results for ${row.analysis_name} are now available for download.`;
            break;
        }

        if (notificationTitle) {
          await createNotification(
            row.user_id,
            req.user.id,
            notificationTitle,
            notificationMessage,
            status === "completed" ? "result_ready" : "appointment_confirmed",
          );
        }
      }

      res.json(row || { id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update status" });
    }
  },
);

// Upload result PDF and note
router.post(
  "/dashboard/upload-result/:id",
  authenticateToken,
  requireLab,
  upload.single("result_pdf"),
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const id = req.params.id;
      const { result_note } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: "PDF file is required" });
      }

      const resultPdfPath = req.file.path;

      // Get current status before update
      const [[currentRow]] = await db
        .promise()
        .query(
          "SELECT status FROM patient_analyses WHERE id=? AND laboratory_id=?",
          [id, labId],
        );

      if (!currentRow) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      const oldStatus = currentRow.status;

      // Update with result
      await db.promise().query(
        `UPDATE patient_analyses 
             SET status='completed', result_pdf_path=?, result_note=?, completion_date=NOW()
             WHERE id=? AND laboratory_id=?`,
        [resultPdfPath, result_note, id, labId],
      );

      // Log history for result upload
      await logAnalysisHistory(
        id,
        "result_uploaded",
        req.user.id,
        oldStatus,
        "completed",
        "Result PDF uploaded and analysis completed",
        resultPdfPath,
        result_note,
      );

      // Get appointment details for notification
      const [[row]] = await db.promise().query(
        `SELECT pa.*, u.name as user_name, u.email as user_email, at.name as analysis_name
             FROM patient_analyses pa 
             JOIN users u ON u.id=pa.user_id 
             JOIN analysis_types at ON at.id=pa.analysis_type_id
             WHERE pa.id=?`,
        [id],
      );

      // Create notification for completed results
      if (row) {
        const { createNotification } = require("./notificationRoutes");
        await createNotification(
          row.user_id,
          req.user.id,
          "Results Ready",
          `Your result is ready. Click to view and download your analysis results.`,
          "result_ready",
          `http://localhost:5173/my-analyses`,
          resultPdfPath,
        );
      }

      res.json({ success: true, result_pdf_path: resultPdfPath });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to upload result" });
    }
  },
);

// Get appointments for a specific date
router.get(
  "/dashboard/appointments-by-date/:date",
  authenticateToken,
  requireLab,
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const { date } = req.params;

      // Get all appointments for the specific date
      const [appointments] = await db.promise().query(
        `SELECT pa.id, pa.appointment_date, pa.status, pa.result_note, pa.result_pdf_path,
                    u.name as patient_name, u.email as patient_email, up.phone as patient_phone,
                    at.name as analysis_name, at.price
             FROM patient_analyses pa
             JOIN users u ON u.id = pa.user_id
             LEFT JOIN user_profiles up ON up.user_id = u.id
             JOIN analysis_types at ON at.id = pa.analysis_type_id
             WHERE pa.laboratory_id = ? AND DATE(pa.appointment_date) = ?
             ORDER BY pa.appointment_date ASC`,
        [labId, date],
      );

      // Return all appointments for the day
      res.json(appointments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load appointments for date" });
    }
  },
);

// Patient full history for current lab
router.get(
  "/dashboard/history/:userId",
  authenticateToken,
  requireLab,
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const userId = req.params.userId;
      const [rows] = await db.promise().query(
        `SELECT pa.id, at.name as analysis_name, pa.appointment_date, pa.status, pa.result_note, pa.result_pdf_path
             FROM patient_analyses pa
             JOIN analysis_types at ON at.id = pa.analysis_type_id
             WHERE pa.laboratory_id = ? AND pa.user_id = ?
             ORDER BY pa.appointment_date DESC`,
        [labId, userId],
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load patient history" });
    }
  },
);

// Lab self profile
router.get("/dashboard/me", authenticateToken, requireLab, async (req, res) => {
  try {
    const [[row]] = await db.promise().query(
      `SELECT l.id, u.name, u.email as login_email, l.address, l.phone, l.email as contact_email, l.description, l.working_hours
             FROM laboratories l JOIN users u ON u.id = l.user_id WHERE u.id = ? LIMIT 1`,
      [req.user.id],
    );
    res.json(row || {});
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load lab profile" });
  }
});

router.put("/dashboard/me", authenticateToken, requireLab, async (req, res) => {
  try {
    const labId = await getCurrentLabId(req.user.id);
    if (!labId) return res.status(404).json({ error: "Lab not found" });
    const {
      name,
      login_email,
      address,
      phone,
      contact_email,
      description,
      working_hours,
    } = req.body;
    const connection = db.promise();
    const trx = await connection.getConnection();
    try {
      await trx.beginTransaction();
      if (name || login_email) {
        const updates = [];
        const params = [];
        if (name) {
          updates.push("name=?");
          params.push(name);
        }
        if (login_email) {
          updates.push("email=?");
          params.push(login_email);
        }
        params.push(req.user.id);
        await trx.query(
          `UPDATE users SET ${updates.join(", ")} WHERE id=?`,
          params,
        );
      }
      await trx.query(
        "UPDATE laboratories SET address=?, phone=?, email=?, description=?, working_hours=? WHERE id=?",
        [
          address || null,
          phone || null,
          contact_email || null,
          description || null,
          working_hours || null,
          labId,
        ],
      );
      await trx.commit();
      trx.release();
      res.json({ success: true });
    } catch (err) {
      await trx.rollback();
      trx.release();
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update lab profile" });
  }
});

// Lab-scoped analysis types
router.get(
  "/dashboard/my-analysis-types",
  authenticateToken,
  requireLab,
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.json([]);
      const [rows] = await db
        .promise()
        .query(
          "SELECT id, name, description, normal_range, unit, price FROM analysis_types WHERE laboratory_id=? ORDER BY name",
          [labId],
        );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load analysis types" });
    }
  },
);

router.post(
  "/dashboard/my-analysis-types",
  authenticateToken,
  requireLab,
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const { name, description, normal_range, unit, price } = req.body;
      if (!name) return res.status(400).json({ error: "name required" });
      const [r] = await db
        .promise()
        .query(
          "INSERT INTO analysis_types (name, description, normal_range, unit, price, laboratory_id) VALUES (?, ?, ?, ?, ?, ?)",
          [
            name,
            description || null,
            normal_range || null,
            unit || null,
            price || null,
            labId,
          ],
        );
      res.status(201).json({ id: r.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create analysis type" });
    }
  },
);

router.put(
  "/dashboard/my-analysis-types/:id",
  authenticateToken,
  requireLab,
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const id = req.params.id;
      const { name, description, normal_range, unit, price } = req.body;
      if (!name) return res.status(400).json({ error: "name required" });
      await db
        .promise()
        .query(
          "UPDATE analysis_types SET name=?, description=?, normal_range=?, unit=?, price=? WHERE id=? AND laboratory_id=?",
          [
            name,
            description || null,
            normal_range || null,
            unit || null,
            price || null,
            id,
            labId,
          ],
        );
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update analysis type" });
    }
  },
);

router.delete(
  "/dashboard/my-analysis-types/:id",
  authenticateToken,
  requireLab,
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const id = req.params.id;
      await db
        .promise()
        .query("DELETE FROM analysis_types WHERE id=? AND laboratory_id=?", [
          id,
          labId,
        ]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete analysis type" });
    }
  },
);

// Confirmed patients: status = 'confirmed'
router.get(
  "/dashboard/confirmed",
  authenticateToken,
  requireLab,
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.json([]);
      const [rows] = await db.promise().query(
        `SELECT pa.id, pa.appointment_date, pa.status, pa.result_note, pa.result_pdf_path, pa.notes,
                    u.name as patient_name, u.email as patient_email, up.phone as patient_phone,
                    at.name as analysis_name, at.price
             FROM patient_analyses pa
             JOIN users u ON u.id = pa.user_id
             LEFT JOIN user_profiles up ON up.user_id = u.id
             JOIN analysis_types at ON at.id = pa.analysis_type_id
             WHERE pa.laboratory_id = ? AND pa.status = 'pending_result' AND (pa.result_note IS NULL OR pa.result_note != 'READY_FOR_RESULT_UPLOAD')
             ORDER BY pa.appointment_date DESC`,
        [labId],
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load confirmed" });
    }
  },
);

// Pending Result patients: status = 'pending_result' AND result_pdf_path IS NOT NULL (moved from confirmed to pending result)
router.get(
  "/dashboard/pending",
  authenticateToken,
  requireLab,
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.json([]);
      const [rows] = await db.promise().query(
        `SELECT pa.id, pa.appointment_date, pa.status, pa.result_note, pa.result_pdf_path, pa.notes,
                    u.name as patient_name, u.email as patient_email, up.phone as patient_phone,
                    at.name as analysis_name, at.price
             FROM patient_analyses pa
             JOIN users u ON u.id = pa.user_id
             LEFT JOIN user_profiles up ON up.user_id = u.id
             JOIN analysis_types at ON at.id = pa.analysis_type_id
             WHERE pa.laboratory_id = ? AND pa.status = 'pending_result' AND pa.result_note = 'READY_FOR_RESULT_UPLOAD'
             ORDER BY pa.appointment_date DESC`,
        [labId],
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load pending" });
    }
  },
);

// Mark record back to pending
router.post(
  "/dashboard/mark-pending/:id",
  authenticateToken,
  requireLab,
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const id = req.params.id;
      await db
        .promise()
        .query(
          `UPDATE patient_analyses SET status='pending' WHERE id=? AND laboratory_id=?`,
          [id, labId],
        );
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update status" });
    }
  },
);

// handle PDF uploads and results

router.post(
  "/dashboard/submit-result/:id",
  authenticateToken,
  requireLab,
  upload.single("report"),
  async (req, res) => {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const id = req.params.id;
      const resultText = req.body.result || "";
      const notes = req.body.notes || null;
      const reportPath = req.file ? `uploads/${req.file.filename}` : null;

      await db.promise().query(
        `UPDATE patient_analyses 
             SET result=?, completion_date=NOW(), status='completed', notes=COALESCE(?, notes), report_path=?
             WHERE id=? AND laboratory_id=?`,
        [resultText, notes, reportPath, id, labId],
      );

      res.json({ success: true, report: reportPath });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to submit result" });
    }
  },
);

// Admin: Create laboratory (users + laboratories)
router.post("/", authenticateToken, isAdmin, async (req, res) => {
  const {
    name,
    login_email,
    password,
    address,
    phone,
    contact_email,
    description,
    working_hours,
  } = req.body;
  if (!name || !login_email || !password) {
    return res
      .status(400)
      .json({ error: "name, login_email, password required" });
  }

  const connection = db.promise();
  const trx = await connection.getConnection();
  try {
    await trx.beginTransaction();

    // Create user with role 'lab'
    const hashed = await bcrypt.hash(password, 10);
    const [userResult] = await trx.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'lab')",
      [name, login_email, hashed],
    );
    const userId = userResult.insertId;

    // Create laboratory profile
    const [labResult] = await trx.query(
      "INSERT INTO laboratories (user_id, address, phone, email, description, working_hours) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userId,
        address || null,
        phone || null,
        contact_email || null,
        description || null,
        working_hours || null,
      ],
    );

    await trx.commit();
    trx.release();
    return res.status(201).json({ id: labResult.insertId, user_id: userId });
  } catch (error) {
    await trx.rollback();
    trx.release();
    console.error("Create laboratory failed:", error);
    return res
      .status(500)
      .json({ error: "Failed to create laboratory", details: error.message });
  }
});

// Admin: Update laboratory (users + laboratories)
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
  const labId = req.params.id;
  const {
    name,
    login_email,
    password,
    address,
    phone,
    contact_email,
    description,
    working_hours,
  } = req.body;

  const connection = db.promise();
  const trx = await connection.getConnection();
  try {
    await trx.beginTransaction();

    // Fetch current to get user_id
    const [rows] = await trx.query(
      "SELECT user_id FROM laboratories WHERE id = ?",
      [labId],
    );
    if (rows.length === 0) {
      await trx.rollback();
      trx.release();
      return res.status(404).json({ error: "Laboratory not found" });
    }
    const userId = rows[0].user_id;

    // Update users table if provided
    if (name || login_email || password) {
      const updates = [];
      const params = [];
      if (name) {
        updates.push("name = ?");
        params.push(name);
      }
      if (login_email) {
        updates.push("email = ?");
        params.push(login_email);
      }
      if (password) {
        const hashed = await bcrypt.hash(password, 10);
        updates.push("password = ?");
        params.push(hashed);
      }
      if (updates.length > 0) {
        params.push(userId);
        await trx.query(
          `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
          params,
        );
      }
    }

    // Update laboratories table
    await trx.query(
      "UPDATE laboratories SET address = ?, phone = ?, email = ?, description = ?, working_hours = ? WHERE id = ?",
      [
        address || null,
        phone || null,
        contact_email || null,
        description || null,
        working_hours || null,
        labId,
      ],
    );

    await trx.commit();
    trx.release();
    return res.json({ message: "Laboratory updated" });
  } catch (error) {
    await trx.rollback();
    trx.release();
    console.error("Update laboratory failed:", error);
    return res
      .status(500)
      .json({ error: "Failed to update laboratory", details: error.message });
  }
});

// Admin: Delete laboratory (cascades to lab via FK or delete both)
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  const labId = req.params.id;
  const connection = db.promise();
  const trx = await connection.getConnection();
  try {
    await trx.beginTransaction();
    const [rows] = await trx.query(
      "SELECT user_id FROM laboratories WHERE id = ?",
      [labId],
    );
    if (rows.length === 0) {
      await trx.rollback();
      trx.release();
      return res.status(404).json({ error: "Laboratory not found" });
    }
    const userId = rows[0].user_id;

    // Delete lab first (ON DELETE CASCADE would delete lab when user is deleted as well)
    await trx.query("DELETE FROM laboratories WHERE id = ?", [labId]);
    // Delete user
    await trx.query("DELETE FROM users WHERE id = ?", [userId]);

    await trx.commit();
    trx.release();
    return res.json({ message: "Laboratory deleted" });
  } catch (error) {
    await trx.rollback();
    trx.release();
    console.error("Delete laboratory failed:", error);
    return res
      .status(500)
      .json({ error: "Failed to delete laboratory", details: error.message });
  }
});

// Get analysis types for a specific laboratory
router.get("/:id/analysis-types", async (req, res) => {
  try {
    const types = await Analysis.getTypesByLaboratory(req.params.id);
    res.json(types);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: Create analysis type
router.post("/analysis-types", authenticateToken, isAdmin, async (req, res) => {
  const { name, description, normal_range, unit, price, laboratory_id } =
    req.body;
  if (!name || !laboratory_id) {
    return res.status(400).json({ error: "name and laboratory_id required" });
  }
  try {
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO analysis_types (name, description, normal_range, unit, price, laboratory_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          name,
          description || null,
          normal_range || null,
          unit || null,
          price || null,
          laboratory_id,
        ],
      );
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error("Create analysis type failed:", error);
    return res
      .status(500)
      .json({
        error: "Failed to create analysis type",
        details: error.message,
      });
  }
});

// Labs minimal list for dropdown (id + name)
router.get(
  "/_dropdown/minimal",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const [rows] = await db.promise().query(
        `SELECT l.id, u.name
             FROM laboratories l
             JOIN users u ON u.id = l.user_id
             WHERE u.role = 'lab'
             ORDER BY u.name`,
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get available time slots for a specific date and laboratory
router.get("/:id/available-slots/:date", async (req, res) => {
  try {
    const labId = req.params.id;
    const date = req.params.date;

    console.log(`Getting available slots for lab ${labId} on date ${date}`);

    // Generate all possible 30-minute slots for the day (8 AM to 6 PM)
    const allPossibleSlots = [];
    const startHour = 8;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Create local datetime string (no timezone conversion)
        const localSlot = `${date}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

        // Check availability using the same method as the booking validation
        const isAvailable = await Laboratory.isTimeSlotAvailableForDisplay(
          labId,
          localSlot,
        );

        // Format display time correctly
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayTime = `${displayHour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${ampm}`;

        allPossibleSlots.push({
          time: localSlot,
          displayTime: displayTime,
          isAvailable: isAvailable,
          originalTimeString: localSlot,
        });
      }
    }

    console.log(
      `Generated ${allPossibleSlots.length} slots, ${allPossibleSlots.filter((s) => !s.isAvailable).length} blocked`,
    );

    res.json(allPossibleSlots);
  } catch (error) {
    console.error("Error in available-slots endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check if a specific date is fully booked
router.get("/:id/date-status/:date", async (req, res) => {
  try {
    const labId = req.params.id;
    const date = req.params.date;

    const isFullyBooked = await Laboratory.isDateFullyBooked(labId, date);

    res.json({ isFullyBooked });
  } catch (error) {
    console.error("Error checking date status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Request analysis (protected route)
router.post("/request-analysis", authenticateToken, async (req, res) => {
  try {
    console.log("Analysis request received:", req.body);
    console.log("User ID:", req.user.id);

    const userId = req.user.id;
    const requestData = {
      user_id: userId,
      ...req.body,
    };

    console.log("Request data:", requestData);

    const analysisRequest = await Analysis.createRequest(requestData);
    res.status(201).json({ id: analysisRequest });
  } catch (error) {
    console.error("Error in analysis request:", error);
    console.error("Error stack:", error.stack);
    if (error.message === "TIME_SLOT_BOOKED") {
      return res.status(400).json({
        error: "TIME_SLOT_BOOKED",
        message:
          "This time slot is not available. Please select an available time slot from the calendar.",
      });
    }
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// Get patient's analyses (protected route)
router.get("/my-analyses", authenticateToken, async (req, res) => {
  try {
    const analyses = await Analysis.getPatientAnalyses(req.user.id);
    res.json(analyses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Test endpoint to check current reservations by laboratory
router.get("/test-reservations/:labId/:date", async (req, res) => {
  try {
    const labId = req.params.labId;
    const date = req.params.date;

    const [rows] = await db.promise().query(
      `SELECT pa.*, at.name as analysis_name, l.name as laboratory_name 
             FROM patient_analyses pa 
             JOIN analysis_types at ON pa.analysis_type_id = at.id 
             JOIN laboratories l ON pa.laboratory_id = l.id 
             WHERE pa.laboratory_id = ? 
             AND DATE(pa.appointment_date) = ?
             AND pa.status != "cancelled"
             ORDER BY pa.appointment_date`,
      [labId, date],
    );

    res.json({
      laboratory_id: labId,
      date: date,
      reservations: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error("Error fetching test reservations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cleanup endpoint to remove all test data
router.post("/cleanup-test-data", async (req, res) => {
  try {
    console.log("Cleaning up all test data...");

    // Delete all test reservations
    const [result] = await db
      .promise()
      .query(
        "DELETE FROM patient_analyses WHERE notes LIKE ? OR notes = ? OR notes = ? OR notes LIKE ?",
        ["%Test%", "ee", "5", "%test%"],
      );

    console.log(`Deleted ${result.affectedRows} test reservations`);

    res.json({
      success: true,
      message: "Test data cleaned up successfully",
      deletedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Error cleaning up test data:", error);
    res.status(500).json({
      error: "Failed to clean up test data",
      details: error.message,
    });
  }
});

// Cleanup endpoint to remove ALL reservations (for testing)
router.post("/cleanup-all-data", async (req, res) => {
  try {
    console.log("Cleaning up ALL reservation data...");

    // Delete ALL reservations
    const [result] = await db.promise().query("DELETE FROM patient_analyses");

    console.log(`Deleted ${result.affectedRows} reservations`);

    res.json({
      success: true,
      message: "All reservation data cleaned up successfully",
      deletedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Error cleaning up all data:", error);
    res.status(500).json({
      error: "Failed to clean up all data",
      details: error.message,
    });
  }
});

module.exports = router;
