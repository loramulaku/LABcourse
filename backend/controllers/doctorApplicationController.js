const { User, Doctor, DoctorApplication, Department } = require('../models');
const bcrypt = require('bcrypt');

// Register new doctor (no authentication required)
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      licenseNumber,
      medicalField,
      specialization,
      experienceYears,
      education,
      previousClinic,
      phone,
      bio
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account with doctor role
    const newUser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: 'doctor',
      account_status: 'pending'
    });

    // Create doctor application
    const application = await DoctorApplication.create({
      user_id: newUser.id,
      license_number: licenseNumber,
      medical_field: medicalField,
      specialization: specialization,
      experience_years: experienceYears,
      education: education,
      previous_clinic: previousClinic,
      phone: phone,
      bio: bio
    });

    res.json({ 
      message: 'Doctor registration submitted successfully. Please wait for admin approval.',
      applicationId: application.id 
    });

  } catch (error) {
    console.error('Error in doctor registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Apply for doctor verification (for existing users)
exports.apply = async (req, res) => {
  try {
    const {
      licenseNumber,
      medicalField,
      specialization,
      experienceYears,
      education,
      previousClinic,
      phone,
      bio
    } = req.body;

    // Check if user already has an application
    const existingApp = await DoctorApplication.findOne({
      where: { user_id: req.user.id }
    });

    if (existingApp) {
      return res.status(400).json({ error: 'Application already submitted' });
    }

    // Create doctor application
    const application = await DoctorApplication.create({
      user_id: req.user.id,
      license_number: licenseNumber,
      medical_field: medicalField,
      specialization: specialization,
      experience_years: experienceYears,
      education: education,
      previous_clinic: previousClinic,
      phone: phone,
      bio: bio
    });

    // Update user status to pending
    await User.update(
      { account_status: 'pending' },
      { where: { id: req.user.id } }
    );

    res.json({ 
      message: 'Application submitted successfully',
      applicationId: application.id 
    });

  } catch (error) {
    console.error('Error submitting doctor application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

// Get doctor application status (for the doctor)
exports.getMyApplication = async (req, res) => {
  try {
    const application = await DoctorApplication.findOne({
      where: { user_id: req.user.id },
      include: [
        {
          model: User,
          attributes: ['name', 'email', 'account_status', 'created_at']
        }
      ]
    });

    if (!application) {
      return res.status(404).json({ error: 'No application found' });
    }

    res.json(application);

  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
};

// Get all pending applications (admin only)
exports.getPendingApplications = async (req, res) => {
  try {
    const applications = await DoctorApplication.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'created_at']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['name'],
          required: false
        }
      ],
      order: [['created_at', 'ASC']]
    });

    res.json(applications);

  } catch (error) {
    console.error('Error fetching pending applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

// Approve doctor application (admin only)
exports.approveApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Get application details
    const application = await DoctorApplication.findByPk(applicationId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Update application status
    await application.update({
      status: 'approved',
      reviewed_by: req.user.id,
      reviewed_at: new Date()
    });

    // Update user status to active
    await User.update(
      {
        account_status: 'active',
        verified_at: new Date(),
        verified_by: req.user.id
      },
      { where: { id: application.user_id } }
    );

    // Create or update doctor profile
    await Doctor.upsert({
      user_id: application.user_id,
      license_number: application.license_number,
      specialization: application.specialization,
      experience_years: application.experience_years,
      phone: application.phone,
      bio: application.bio,
      available: true
    });

    res.json({ message: 'Doctor application approved successfully' });

  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ error: 'Failed to approve application' });
  }
};

// Reject doctor application (admin only)
exports.rejectApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Get application details
    const application = await DoctorApplication.findByPk(applicationId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Update application status
    await application.update({
      status: 'rejected',
      rejection_reason: rejectionReason,
      reviewed_by: req.user.id,
      reviewed_at: new Date()
    });

    // Update user status to rejected
    await User.update(
      {
        account_status: 'rejected',
        verification_notes: rejectionReason
      },
      { where: { id: application.user_id } }
    );

    res.json({ message: 'Doctor application rejected' });

  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ error: 'Failed to reject application' });
  }
};

// Get all applications with status (admin only)
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await DoctorApplication.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'account_status', 'created_at']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['name'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(applications);

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};
