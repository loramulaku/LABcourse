const express = require("express");
const db = require("../db");
const { authenticateToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

// Get admin profile
router.get("/", authenticateToken, isAdmin, (req, res) => {
  const userId = req.user.id;
  db.query("SELECT * FROM admin_profiles WHERE user_id = ?", [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.json({ profile: null });
    return res.json({ profile: rows[0] });
  });
});

// Update admin profile
router.put("/", authenticateToken, isAdmin, (req, res) => {
  const userId = req.user.id;
  const {
    first_name,
    last_name,
    phone,
    bio,
    country,
    city_state,
    postal_code,
    tax_id,
    facebook,
    twitter,
    linkedin,
    instagram
  } = req.body;

  const query = `
    INSERT INTO admin_profiles (user_id, first_name, last_name, phone, bio, country, city_state, postal_code, tax_id, facebook, twitter, linkedin, instagram)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      first_name = VALUES(first_name),
      last_name = VALUES(last_name),
      phone = VALUES(phone),
      bio = VALUES(bio),
      country = VALUES(country),
      city_state = VALUES(city_state),
      postal_code = VALUES(postal_code),
      tax_id = VALUES(tax_id),
      facebook = VALUES(facebook),
      twitter = VALUES(twitter),
      linkedin = VALUES(linkedin),
      instagram = VALUES(instagram),
      updated_at = CURRENT_TIMESTAMP
  `;

  db.query(query, [
    userId,
    first_name,
    last_name,
    phone,
    bio,
    country,
    city_state,
    postal_code,
    tax_id,
    facebook,
    twitter,
    linkedin,
    instagram,
  ], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ message: "Admin profile updated successfully" });
  });
});

module.exports = router;
