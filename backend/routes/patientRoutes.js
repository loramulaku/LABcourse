// routes/patientRoutes.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const db = require("../db");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Get patient's own analyses
router.get("/my-analyses", authenticateToken, async (req, res) => {
  try {
    const [analyses] = await db.promise().query(
      `SELECT pa.*, at.name as analysis_name, at.price, l.address as lab_address, l.phone as lab_phone,
                    u.name as lab_name
             FROM patient_analyses pa
             JOIN analysis_types at ON at.id = pa.analysis_type_id
             JOIN laboratories l ON l.id = pa.laboratory_id
             JOIN users u ON u.id = l.user_id
             WHERE pa.user_id = ?
             ORDER BY pa.appointment_date DESC`,
      [req.user.id],
    );
    res.json(analyses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch analyses" });
  }
});

// Download result PDF (patient's own results only)
router.get("/download-result/:id", authenticateToken, async (req, res) => {
  try {
    const analysisId = req.params.id;

    // Verify the analysis belongs to the current user
    const [analyses] = await db
      .promise()
      .query(
        'SELECT result_pdf_path FROM patient_analyses WHERE id = ? AND user_id = ? AND status = "completed"',
        [analysisId, req.user.id],
      );

    if (analyses.length === 0) {
      return res.status(404).json({ error: "Result not found or not ready" });
    }

    const filePath = analyses[0].result_pdf_path;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Result file not found" });
    }

    // Set appropriate headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="result-${analysisId}.pdf"`,
    );

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("Error streaming file:", error);
      res.status(500).json({ error: "Error downloading file" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to download result" });
  }
});

// View result PDF (inline)
router.get("/view-result/:id", authenticateToken, async (req, res) => {
  try {
    const analysisId = req.params.id;

    // Verify the analysis belongs to the current user
    const [analyses] = await db
      .promise()
      .query(
        'SELECT result_pdf_path FROM patient_analyses WHERE id = ? AND user_id = ? AND status = "completed"',
        [analysisId, req.user.id],
      );

    if (analyses.length === 0) {
      return res.status(404).json({ error: "Result not found or not ready" });
    }

    const filePath = analyses[0].result_pdf_path;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Result file not found" });
    }

    // Set appropriate headers for PDF viewing
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("Error streaming file:", error);
      res.status(500).json({ error: "Error viewing file" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to view result" });
  }
});

module.exports = router;
