const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const adminProfileController = require("../controllers/adminProfileController");

const router = express.Router();

// -------------------- GET profile --------------------
router.get("/me", authenticateToken, adminProfileController.getProfile);

// -------------------- UPDATE personal + socials --------------------
router.put("/personal", authenticateToken, adminProfileController.updatePersonal);

// -------------------- UPDATE location info --------------------
router.put("/location", authenticateToken, adminProfileController.updateLocation);

// -------------------- UPLOAD avatar --------------------
router.post("/avatar", authenticateToken, adminProfileController.upload.single("avatar"), adminProfileController.uploadAvatar);

// -------------------- CREATE doctor (admin function) --------------------
router.post("/create-doctor", authenticateToken, adminProfileController.createDoctor);

// -------------------- GET all doctors (admin function) --------------------
const doctorController = require("../controllers/doctorController");
router.get("/doctors", authenticateToken, doctorController.getAllDoctors);

module.exports = router;
