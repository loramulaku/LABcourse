// backend/routes/adminProfile.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../db"); // lidhu me DB
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// -------------------- Multer config për avatar --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "..", "uploads", "avatars");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}${ext}`);
  },
});
const upload = multer({ storage });

// -------------------- GET profile --------------------
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM admin_profiles WHERE user_id = ?",
      [req.user.id]
    );
    if (rows.length === 0) {
      // nëse nuk ekziston, kthe default
      return res.json({
        user_id: req.user.id,
        first_name: "",
        last_name: "",
        phone: "",
        bio: "Team Manager",
        avatar_path: "/uploads/avatars/default.png",
        facebook: "",
        x: "",
        linkedin: "",
        instagram: "",
        country: "",
        city_state: "",
        postal_code: "",
        tax_id: "",
      });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- UPDATE personal + socials --------------------
router.put("/personal", authenticateToken, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      bio,
      facebook,
      x,
      linkedin,
      instagram,
      avatar_path,
    } = req.body;

    await pool.query(
      `INSERT INTO admin_profiles 
       (user_id, first_name, last_name, phone, bio, facebook, x, linkedin, instagram, avatar_path) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        first_name=VALUES(first_name),
        last_name=VALUES(last_name),
        phone=VALUES(phone),
        bio=VALUES(bio),
        facebook=VALUES(facebook),
        x=VALUES(x),
        linkedin=VALUES(linkedin),
        instagram=VALUES(instagram),
        avatar_path=VALUES(avatar_path)`,
      [
        req.user.id,
        first_name,
        last_name,
        phone,
        bio,
        facebook,
        x,
        linkedin,
        instagram,
        avatar_path || "/uploads/avatars/default.png",
      ]
    );

    res.json({
      first_name,
      last_name,
      phone,
      bio,
      facebook,
      x,
      linkedin,
      instagram,
      avatar_path: avatar_path || "/uploads/avatars/default.png",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- UPDATE avatar --------------------
router.post("/avatar", authenticateToken, upload.single("avatar"), async (req, res) => {
  try {
    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    await pool.query(
      `INSERT INTO admin_profiles (user_id, avatar_path) 
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE avatar_path=VALUES(avatar_path)`,
      [req.user.id, avatarPath]
    );

    res.json({ avatar_path: avatarPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload error" });
  }
});

// -------------------- UPDATE address --------------------
router.put("/address", authenticateToken, async (req, res) => {
  try {
    const { country, city_state, postal_code, tax_id } = req.body;

    await pool.query(
      `INSERT INTO admin_profiles (user_id, country, city_state, postal_code, tax_id) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        country=VALUES(country),
        city_state=VALUES(city_state),
        postal_code=VALUES(postal_code),
        tax_id=VALUES(tax_id)`,
      [req.user.id, country, city_state, postal_code, tax_id]
    );

    res.json({ country, city_state, postal_code, tax_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;