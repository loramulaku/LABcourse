// backend/routes/adminProfile.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db"); // lidhu me DB
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Email service function
const sendWelcomeEmail = async (email, name, password) => {
  // This is a placeholder - implement with your preferred email service (Nodemailer, SendGrid, etc.)
  console.log(`Welcome email would be sent to ${email} for doctor ${name} with password: ${password}`);
  
  // Example implementation with nodemailer:
  /*
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransporter({
    // Your email service configuration
  });
  
  const mailOptions = {
    from: 'noreply@yourclinic.com',
    to: email,
    subject: 'Welcome to Medical Portal - Account Created',
    html: `
      <h2>Welcome ${name}!</h2>
      <p>Your doctor account has been created successfully.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${password}</p>
      <p>Please log in and change your password for security.</p>
      <p>Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
  */
};

// -------------------- Multer config për avatar --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "..", "uploads", "avatars");
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
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
    },
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
    },
  );
});

// -------------------- UPDATE avatar --------------------
router.post(
  "/avatar",
  authenticateToken,
  upload.single("avatar"),
  (req, res) => {
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
        },
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
      },
    );
  },
);

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
    },
  );
});

// -------------------- ADD DOCTOR (Admin only) --------------------
router.post("/add-doctor", authenticateToken, upload.single('profilePhoto'), async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Only admins can add doctors" });
  }

  const { 
    name, 
    email, 
    password, 
    phone, 
    speciality, 
    department, 
    licenseNumber, 
    degree, 
    experience, 
    about, 
    fees 
  } = req.body;

  if (!name || !email || !password || !phone || !speciality || !department || !licenseNumber) {
    return res.status(400).json({ 
      error: "Name, email, password, phone, specialization, department, and license number are required" 
    });
  }

  try {
    // Check if user already exists
    const [existingUsers] = await db.promise().query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account with doctor role and active status
    const [userResult] = await db.promise().query(
      'INSERT INTO users (name, email, password, role, account_status) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'doctor', 'active']
    );

    const userId = userResult.insertId;

    // Handle profile photo
    let profileImagePath = '/uploads/avatars/default.png';
    if (req.file) {
      profileImagePath = `/uploads/avatars/${req.file.filename}`;
    }

    // Create doctor profile
    await db.promise().query(
      `INSERT INTO doctor_profiles 
       (user_id, specialization, department, license_number, experience_years, phone, bio, degree, fees)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       specialization = VALUES(specialization),
       department = VALUES(department),
       license_number = VALUES(license_number),
       experience_years = VALUES(experience_years),
       phone = VALUES(phone),
       bio = VALUES(bio),
       degree = VALUES(degree),
       fees = VALUES(fees)`,
      [userId, speciality, department, licenseNumber, experience || '', phone, about || '', degree || '', fees || '']
    );



    // Update user profile image
    await db.promise().query(
      'UPDATE users SET profile_image = ? WHERE id = ?',
      [profileImagePath, userId]
    );

    // Send welcome email (implement email service)
    try {
      await sendWelcomeEmail(email, name, password);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    // Log doctor creation
    await db.promise().query(
      'INSERT INTO audit_logs (user_id, action, details, created_by) VALUES (?, ?, ?, ?)',
      [userId, 'doctor_created', `Doctor account created for ${email}`, req.user.id]
    );

    res.json({ 
      message: 'Doctor added successfully. Welcome email sent.',
      doctorId: userId,
      email: email
    });

  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(500).json({ error: 'Failed to add doctor' });
  }
});

// -------------------- GET ALL DOCTORS (Admin only) --------------------
router.get("/doctors", authenticateToken, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Only admins can view doctors" });
  }

  try {
    const [doctors] = await db.promise().query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.account_status,
        u.created_at,
        u.profile_image,
        dp.specialization,
        dp.department,
        dp.license_number,
        dp.experience_years,
        dp.phone,
        dp.bio,
        dp.degree,
        dp.fees
      FROM users u
      LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
      WHERE u.role = 'doctor'
      ORDER BY u.created_at DESC
    `);

    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// -------------------- DELETE DOCTOR (Admin only) --------------------
router.delete("/doctors/:doctorId", authenticateToken, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Only admins can delete doctors" });
  }

  const { doctorId } = req.params;

  try {
    // Check if doctor exists
    const [doctors] = await db.promise().query(
      'SELECT id FROM users WHERE id = ? AND role = "doctor"',
      [doctorId]
    );

    if (doctors.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Delete doctor profile first
    await db.promise().query(
      'DELETE FROM doctor_profiles WHERE user_id = ?',
      [doctorId]
    );

    // Delete user account
    await db.promise().query(
      'DELETE FROM users WHERE id = ?',
      [doctorId]
    );

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

module.exports = router;
