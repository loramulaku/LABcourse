// routes/profile.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticateToken } = require("../middleware/auth");
const db = require("../db");

const router = express.Router();

// Konfigurimi i multer për ruajtjen e fotove
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "..", "uploads", "avatars");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// GET profile i user-it
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [[profile]] = await db.promise().query(
      "SELECT phone, address_line1, address_line2, gender, dob, profile_image FROM user_profiles WHERE user_id=?",
      [userId]
    );

    const [[user]] = await db.promise().query(
      "SELECT id, name, email FROM users WHERE id=? LIMIT 1",
      [userId]
    );

    res.json({
      id: userId,
      name: user?.name || "",
      email: user?.email || "",
      phone: profile?.phone || "",
      address_line1: profile?.address_line1 || "",
      address_line2: profile?.address_line2 || "",
      gender: profile?.gender || "",
      dob: profile?.dob ? new Date(profile.dob).toISOString().split('T')[0] : "",
      profile_image: profile?.profile_image || "uploads/avatars/default.png",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gabim gjatë marrjes së profilit" });
  }
});

// PUT update profile i user-it
router.put("/", authenticateToken, upload.single("profile_image"), async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone, address_line1, address_line2, gender, dob, removePhoto } = req.body;
    
    // Handle photo removal separately
    let profileImage = null;
    if (removePhoto === "true") {
      profileImage = "uploads/avatars/default.png";
    } else if (req.file) {
      profileImage = `uploads/avatars/${req.file.filename}`;
    }

    // nëse gender është bosh → NULL
    const genderValue = gender && gender.trim() !== "" ? gender : null;

    // nëse dob është bosh → NULL
    const dobValue = dob && dob.trim() !== "" ? dob : null;

    // kontrollo nëse ekziston profili
    const [existing] = await db.promise().query(
      "SELECT id FROM user_profiles WHERE user_id=?",
      [userId]
    );

    if (existing.length > 0) {
      if (removePhoto === "true") {
        // Only remove photo, keep all other fields unchanged
        await db.promise().query(
          `UPDATE user_profiles 
           SET profile_image=?
           WHERE user_id=?`,
          ["uploads/avatars/default.png", userId]
        );
      } else if (profileImage !== null) {
        // Update everything including new photo
        await db.promise().query(
          `UPDATE user_profiles 
           SET phone=?, address_line1=?, address_line2=?, gender=?, dob=?, profile_image=?
           WHERE user_id=?`,
          [phone, address_line1, address_line2, genderValue, dobValue, profileImage, userId]
        );
      } else {
        // Only update other fields, keep existing photo
        await db.promise().query(
          `UPDATE user_profiles 
           SET phone=?, address_line1=?, address_line2=?, gender=?, dob=?
           WHERE user_id=?`,
          [phone, address_line1, address_line2, genderValue, dobValue, userId]
        );
      }
    } else {
      // insert profile
      await db.promise().query(
        `INSERT INTO user_profiles 
         (user_id, phone, address_line1, address_line2, gender, dob, profile_image) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, phone, address_line1, address_line2, genderValue, dobValue, profileImage || "uploads/avatars/default.png"]
      );
    }

    // Merr profile-in e përditësuar
    const [[updatedProfile]] = await db.promise().query(
      "SELECT phone, address_line1, address_line2, gender, dob, profile_image FROM user_profiles WHERE user_id=?",
      [userId]
    );

    // Merr user-in për emër/email
    const [[user]] = await db.promise().query(
      "SELECT id, name, email FROM users WHERE id=? LIMIT 1",
      [userId]
    );

    res.json({
      id: userId,
      name: user?.name || "",
      email: user?.email || "",
      phone: updatedProfile?.phone || "",
      address_line1: updatedProfile?.address_line1 || "",
      address_line2: updatedProfile?.address_line2 || "",
      gender: updatedProfile?.gender || "",
      dob: updatedProfile?.dob ? new Date(updatedProfile.dob).toISOString().split('T')[0] : "",
      profile_image: updatedProfile?.profile_image || "uploads/avatars/default.png",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gabim gjatë përditësimit të profilit" });
  }
});

module.exports = router;
