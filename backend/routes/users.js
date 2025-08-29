// routes/users.js
const express = require("express");
const db = require("../db");
const { authenticateToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/users → merr të gjithë userat me profile
router.get("/", authenticateToken, isAdmin, (req, res) => {
  const query = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.role,
      u.created_at,
      p.phone,
      p.address_line1,
      p.address_line2,
      p.gender,
      p.dob,
      p.profile_image
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ORDER BY u.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Gabim gjatë query:", err);
      return res.status(500).json({ error: "Gabim me DB" });
    }

    res.json(results);
  });
});

module.exports = router;
