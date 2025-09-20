const express = require("express");
const { authenticateToken, isAdmin } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctorController");

const router = express.Router();

// Multer storage config for doctor image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || "");
    cb(null, `${unique}${ext || ".jpg"}`);
  },
});

const upload = multer({ storage });

// Create doctor (admin only)
router.post(
  "/",
  authenticateToken,
  isAdmin,
  upload.single("image"),
  createDoctor,
);

// Public endpoints
router.get("/", getDoctors);
router.get("/:id", getDoctorById);

// Admin update/delete
router.put(
  "/:id",
  authenticateToken,
  isAdmin,
  upload.single("image"),
  updateDoctor,
);
router.delete("/:id", authenticateToken, isAdmin, deleteDoctor);

module.exports = router;
