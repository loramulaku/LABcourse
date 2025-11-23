const { AdminProfile, User, Doctor } = require('../models');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// Email service function (placeholder)
const sendWelcomeEmail = async (email, name, password) => {
  console.log(`Welcome email would be sent to ${email} for doctor ${name} with password: ${password}`);
  // TODO: Implement actual email service (Nodemailer, SendGrid, etc.)
};

// Get admin profile
exports.getProfile = async (req, res) => {
  try {
    let profile = await AdminProfile.findOne({
      where: { user_id: req.user.id }
    });

    if (!profile) {
      // Return default profile
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

    res.json(profile);
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update personal info and socials
exports.updatePersonal = async (req, res) => {
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
    } = req.body;

    let profile = await AdminProfile.findOne({
      where: { user_id: req.user.id }
    });

    if (!profile) {
      profile = await AdminProfile.create({
        user_id: req.user.id,
        first_name,
        last_name,
        phone,
        bio,
        facebook,
        x,
        linkedin,
        instagram,
      });
    } else {
      await profile.update({
        first_name,
        last_name,
        phone,
        bio,
        facebook,
        x,
        linkedin,
        instagram,
      });
    }

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Error updating personal info:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Update location info
exports.updateLocation = async (req, res) => {
  try {
    const { country, city_state, postal_code, tax_id } = req.body;

    let profile = await AdminProfile.findOne({
      where: { user_id: req.user.id }
    });

    if (!profile) {
      profile = await AdminProfile.create({
        user_id: req.user.id,
        country,
        city_state,
        postal_code,
        tax_id,
      });
    } else {
      await profile.update({
        country,
        city_state,
        postal_code,
        tax_id,
      });
    }

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    let profile = await AdminProfile.findOne({
      where: { user_id: req.user.id }
    });

    if (!profile) {
      profile = await AdminProfile.create({
        user_id: req.user.id,
        avatar_path: avatarPath
      });
    } else {
      // Delete old avatar if exists
      if (profile.avatar_path && profile.avatar_path !== '/uploads/avatars/default.png') {
        const oldPath = path.join(__dirname, '..', profile.avatar_path);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      await profile.update({ avatar_path: avatarPath });
    }

    res.json({
      success: true,
      avatar_path: avatarPath
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

// Create doctor (admin function)
exports.createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      specialization,
      license_number,
      consultation_fee,
      available,
      phone,
      department_id
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user account
    const user = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: 'doctor',
      account_status: 'active',
      verified_at: new Date(),
      verified_by: req.user.id
    });

    // Create doctor profile
    const doctor = await Doctor.create({
      user_id: user.id,
      specialization: specialization,
      license_number: license_number,
      consultation_fee: consultation_fee || 60.00,
      available: available !== undefined ? available : true,
      phone: phone,
      department_id: department_id || null
    });

    // Send welcome email
    await sendWelcomeEmail(email, name, tempPassword);

    res.json({
      success: true,
      message: 'Doctor created successfully. Welcome email sent.',
      doctor: {
        id: doctor.id,
        user_id: user.id,
        name: name,
        email: email,
        temp_password: tempPassword
      }
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ error: 'Failed to create doctor' });
  }
};

// Export upload middleware
exports.upload = upload;
