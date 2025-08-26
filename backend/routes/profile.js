const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// ✅ GET profile
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [[user]] = await db
      .promise()
      .query("SELECT id, name, email FROM users WHERE id=?", [userId]);
    const [[profile]] = await db
      .promise()
      .query(
        "SELECT phone, address_line1, address_line2, gender, dob, profile_image FROM user_profiles WHERE user_id=?",
        [userId]
      );

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: profile?.phone || "",
      address_line1: profile?.address_line1 || "",
      address_line2: profile?.address_line2 || "",
      gender: profile?.gender || "",
      dob: profile?.dob
        ? new Date(profile.dob).toLocaleDateString("en-CA") // yyyy-mm-dd
        : "",
      profile_image: profile?.profile_image || "uploads/default.png",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gabim gjatë marrjes së profilit" });
  }
});

// ✅ PUT profile
router.put(
  "/",
  authenticateToken,
  upload.single("profile_image"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        phone,
        address_line1,
        address_line2,
        gender,
        dob,
        removePhoto,
      } = req.body;

      // Siguro që ekziston rreshti
      await db
        .promise()
        .query("INSERT IGNORE INTO user_profiles (user_id) VALUES (?)", [
          userId,
        ]);

      const [curRows] = await db
        .promise()
        .query(
          "SELECT phone, address_line1, address_line2, gender, dob, profile_image FROM user_profiles WHERE user_id=?",
          [userId]
        );

      const cur = curRows[0] || {};

      // ✅ Vlerat e reja
      const newPhone = phone || cur.phone || null;
      const newAddr1 = address_line1 || cur.address_line1 || null;
      const newAddr2 = address_line2 || cur.address_line2 || null;
      const newGender = gender || cur.gender || null;

      let newDob = cur.dob;
      if (dob !== undefined) newDob = dob === "" ? null : dob;

      let newImage = cur.profile_image || "uploads/default.png";
      if (removePhoto === "true") newImage = "uploads/default.png";
      else if (req.file) newImage = "uploads/" + req.file.filename;

      await db
        .promise()
        .query(
          `UPDATE user_profiles 
           SET phone=?, address_line1=?, address_line2=?, gender=?, dob=?, profile_image=? 
           WHERE user_id=?`,
          [newPhone, newAddr1, newAddr2, newGender, newDob, newImage, userId]
        );

      // Return updated profile
      const [[updatedProfile]] = await db
        .promise()
        .query(
          "SELECT phone, address_line1, address_line2, gender, dob, profile_image FROM user_profiles WHERE user_id=?",
          [userId]
        );

      res.json({
        id: userId,
        name: req.user.name,
        email: req.user.email,
        phone: updatedProfile.phone || "",
        address_line1: updatedProfile.address_line1 || "",
        address_line2: updatedProfile.address_line2 || "",
        gender: updatedProfile.gender || "",
        dob: updatedProfile.dob
          ? new Date(updatedProfile.dob).toLocaleDateString("en-CA")
          : "",
        profile_image:
          updatedProfile.profile_image || "uploads/default.png",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Gabim gjatë përditësimit të profilit" });
    }
  }
);

module.exports = router;