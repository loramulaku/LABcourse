const { UserProfile, User } = require('../models');
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

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    let profile = await UserProfile.findOne({
      where: { user_id: req.user.id },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });

    if (!profile) {
      // Create default profile if not exists
      profile = await UserProfile.create({
        user_id: req.user.id,
        first_name: '',
        last_name: '',
        phone: '',
        bio: '',
        avatar_path: '/uploads/avatars/default.png'
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      bio,
      date_of_birth,
      gender,
      address,
      city,
      country,
      postal_code
    } = req.body;

    let profile = await UserProfile.findOne({
      where: { user_id: req.user.id }
    });

    if (!profile) {
      // Create profile if doesn't exist
      profile = await UserProfile.create({
        user_id: req.user.id,
        first_name,
        last_name,
        phone,
        bio,
        date_of_birth,
        gender,
        address,
        city,
        country,
        postal_code
      });
    } else {
      // Update existing profile
      await profile.update({
        first_name,
        last_name,
        phone,
        bio,
        date_of_birth,
        gender,
        address,
        city,
        country,
        postal_code
      });
    }

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      profile 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    let profile = await UserProfile.findOne({
      where: { user_id: req.user.id }
    });

    if (!profile) {
      profile = await UserProfile.create({
        user_id: req.user.id,
        avatar_path: avatarPath
      });
    } else {
      // Delete old avatar if exists and not default
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
      message: 'Avatar uploaded successfully',
      avatar_path: avatarPath
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

// Export multer upload middleware
exports.upload = upload;
