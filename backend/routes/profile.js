const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// parsers për multipart do i bëjë multer; nuk ka nevojë për express.json() këtu
// (nëse e ke global në server.js, s'pengon)

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// -------- GET /api/profile --------
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [userRows] = await db.promise().query(
      "SELECT id, name, email FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!userRows.length) {
      return res.status(404).json({ error: "User nuk ekziston" });
    }

    const [profileRows] = await db.promise().query(
      `SELECT phone, address_line1, address_line2, gender, dob, profile_image
       FROM user_profiles WHERE user_id = ?`,
      [req.user.id]
    );

    const p = profileRows[0] || {};
    const dobVal = p?.dob;
    // MySQL mund ta kthejë si Date ose si string; i normalizojmë në YYYY-MM-DD
    const dobStr = !dobVal
      ? ""
      : (dobVal instanceof Date
          ? dobVal.toISOString().split("T")[0]
          : String(dobVal).slice(0, 10));

    const merged = {
      id: userRows[0].id,
      name: userRows[0].name,
      email: userRows[0].email,
      phone: p.phone || "",
      address_line1: p.address_line1 || "",
      address_line2: p.address_line2 || "",
      // për lehtësi, kthejmë edhe si objekt siç po e pret frontend-i
      address: {
        line1: p.address_line1 || "",
        line2: p.address_line2 || ""
      },
      gender: p.gender || "",
      dob: dobStr,
      profile_image: p.profile_image || "uploads/default.png"
    };

    return res.json(merged);
  } catch (err) {
    console.error("GET /api/profile error:", err);
    return res.status(500).json({ error: "Gabim gjatë marrjes së profilit" });
  }
});

// -------- PUT /api/profile --------
router.put("/", authenticateToken, upload.single("profile_image"), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      phone,
      address_line1,
      address_line2,
      gender,
      dob,
      removePhoto
    } = req.body;

    // 1) sigurou që ekziston një rresht në user_profiles
    await db.promise().query(
      "INSERT IGNORE INTO user_profiles (user_id) VALUES (?)",
      [userId]
    );

    // 2) lexo vlerat aktuale
    const [curRows] = await db.promise().query(
      `SELECT phone, address_line1, address_line2, gender, dob, profile_image
       FROM user_profiles WHERE user_id = ?`,
      [userId]
    );
    const cur = curRows[0] || {};

    // 3) llogarit vlerat e reja që DO TË RUHEN
    //    - nëse fusha s’vjen (undefined) → mbaj vlerën aktuale
    //    - nëse vjen string bosh, po e pranojmë si bosh (ose ktheje në null nëse e do ashtu)
    const newPhone = typeof phone === "undefined" ? (cur.phone || "") : phone;
    const newAddr1 = typeof address_line1 === "undefined" ? (cur.address_line1 || "") : address_line1;
    const newAddr2 = typeof address_line2 === "undefined" ? (cur.address_line2 || "") : address_line2;
    const newGender = typeof gender === "undefined" ? (cur.gender || "") : gender;

    // dob: ruaje vetëm kur ka vlerë të vlefshme; përndryshe mbaj të vjetrën
    let newDob;
    if (typeof dob === "undefined" || dob === "") {
      newDob = cur.dob || null; // mos e prek nëse s’ka ardhur
    } else {
      // prit format YYYY-MM-DD nga frontend
      const d = new Date(dob);
      if (isNaN(d.getTime())) {
        // nëse është invalid, mbaj të vjetrën
        newDob = cur.dob || null;
      } else {
        newDob = d.toISOString().split("T")[0];
      }
    }

    // Foto:
    // - nëse removePhoto === "true" → vendos default
    // - nëse u ngarkua file i ri → vendose atë
    // - përndryshe → mbaje EXACT vlerën ekzistuese
    let newImage = cur.profile_image || "uploads/default.png";
    if (removePhoto === "true") {
      newImage = "uploads/default.png";
    } else if (req.file) {
      newImage = "uploads/" + req.file.filename;
    }

    // 4) bëj UPDATE determinist (pa ON DUPLICATE), sepse rreshti tash ekziston
    await db.promise().query(
      `UPDATE user_profiles
       SET phone = ?, address_line1 = ?, address_line2 = ?, gender = ?, dob = ?, profile_image = ?
       WHERE user_id = ?`,
      [
        newPhone === "" ? null : newPhone,
        newAddr1 === "" ? null : newAddr1,
        newAddr2 === "" ? null : newAddr2,
        newGender === "" ? null : newGender,
        newDob,                // mund të jetë null ose 'YYYY-MM-DD'
        newImage,
        userId
      ]
    );

    // kthe vlerat e reja që frontend t'i shfaq menjëherë
    return res.json({
      message: "Profili u përditësua me sukses!",
      profile_image: newImage,
      dob: newDob
    });
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    return res.status(500).json({ error: "Gabim gjatë përditësimit të profilit" });
  }
});

module.exports = router;