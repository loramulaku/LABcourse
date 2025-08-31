// backend/routes/adminProfile.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db"); // lidhu me DB
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
router.get("/me", authenticateToken, (req, res) => {
  db.query(
    "SELECT * FROM admin_profiles WHERE user_id = ?",
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
      }
      
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
    }
  );
});

// -------------------- UPDATE personal + socials --------------------
router.put("/personal", authenticateToken, (req, res) => {
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

  db.query(
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
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
      }

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
    }
  );
});

// -------------------- UPDATE avatar --------------------
router.post("/avatar", authenticateToken, upload.single("avatar"), (req, res) => {
  if (!req.file) {
    // If no file uploaded, set to default avatar
    const defaultAvatarPath = "/uploads/avatars/default.png";
    
    db.query(
      `INSERT INTO admin_profiles (user_id, avatar_path) 
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE avatar_path=VALUES(avatar_path)`,
      [req.user.id, defaultAvatarPath],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Upload error" });
        }

        res.json({ avatar_path: defaultAvatarPath });
      }
    );
    return;
  }

  const avatarPath = `/uploads/avatars/${req.file.filename}`;

  db.query(
    `INSERT INTO admin_profiles (user_id, avatar_path) 
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE avatar_path=VALUES(avatar_path)`,
    [req.user.id, avatarPath],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Upload error" });
      }

      res.json({ avatar_path: avatarPath });
    }
  );
});

// -------------------- UPDATE address --------------------
router.put("/address", authenticateToken, (req, res) => {
  const { country, city_state, postal_code, tax_id } = req.body;

  db.query(
    `INSERT INTO admin_profiles (user_id, country, city_state, postal_code, tax_id) 
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      country=VALUES(country),
      city_state=VALUES(city_state),
      postal_code=VALUES(postal_code),
      tax_id=VALUES(tax_id)`,
    [req.user.id, country, city_state, postal_code, tax_id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
      }

      res.json({ country, city_state, postal_code, tax_id });
    }
  );
});

module.exports = router;