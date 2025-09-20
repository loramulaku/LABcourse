// backend/routes/doctorApplications.js
const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply for doctor verification (for new doctors)
router.post('/apply', authenticateToken, async (req, res) => {
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
    const [existingApp] = await db.promise().query(
      'SELECT id FROM doctor_applications WHERE user_id = ?',
      [req.user.id]
    );

    if (existingApp.length > 0) {
      return res.status(400).json({ error: 'Application already submitted' });
    }

    // Create doctor application
    const [result] = await db.promise().query(
      `INSERT INTO doctor_applications 
       (user_id, license_number, medical_field, specialization, experience_years, education, previous_clinic, phone, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, licenseNumber, medicalField, specialization, experienceYears, education, previousClinic, phone, bio]
    );

    // Update user status to pending
    await db.promise().query(
      'UPDATE users SET account_status = "pending" WHERE id = ?',
      [req.user.id]
    );

    res.json({ 
      message: 'Application submitted successfully',
      applicationId: result.insertId 
    });

  } catch (error) {
    console.error('Error submitting doctor application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get doctor application status (for the doctor)
router.get('/my-application', authenticateToken, async (req, res) => {
  try {
    const [applications] = await db.promise().query(`
      SELECT 
        da.*,
        u.name,
        u.email,
        u.account_status
      FROM doctor_applications da
      JOIN users u ON da.user_id = u.id
      WHERE da.user_id = ?
    `, [req.user.id]);

    if (applications.length === 0) {
      return res.status(404).json({ error: 'No application found' });
    }

    res.json(applications[0]);

  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Get all pending applications (admin only)
router.get('/pending', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [applications] = await db.promise().query(`
      SELECT 
        da.*,
        u.name,
        u.email,
        u.created_at as user_created_at,
        reviewer.name as reviewed_by_name
      FROM doctor_applications da
      JOIN users u ON da.user_id = u.id
      LEFT JOIN users reviewer ON da.reviewed_by = reviewer.id
      WHERE da.status = 'pending'
      ORDER BY da.created_at ASC
    `);

    res.json(applications);

  } catch (error) {
    console.error('Error fetching pending applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Approve doctor application (admin only)
router.post('/approve/:applicationId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Get application details
    const [applications] = await db.promise().query(
      'SELECT * FROM doctor_applications WHERE id = ?',
      [applicationId]
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = applications[0];

    // Update application status
    await db.promise().query(
      'UPDATE doctor_applications SET status = "approved", reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      [req.user.id, applicationId]
    );

    // Update user status to active
    await db.promise().query(
      'UPDATE users SET account_status = "active", verified_at = NOW(), verified_by = ? WHERE id = ?',
      [req.user.id, application.user_id]
    );

    // Create doctor profile
    await db.promise().query(
      `INSERT INTO doctor_profiles 
       (user_id, license_number, specialization, experience_years, phone, bio)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       license_number = VALUES(license_number),
       specialization = VALUES(specialization),
       experience_years = VALUES(experience_years),
       phone = VALUES(phone),
       bio = VALUES(bio)`,
      [application.user_id, application.license_number, application.specialization, 
       application.experience_years, application.phone, application.bio]
    );

    res.json({ message: 'Doctor application approved successfully' });

  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

// Reject doctor application (admin only)
router.post('/reject/:applicationId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Get application details
    const [applications] = await db.promise().query(
      'SELECT user_id FROM doctor_applications WHERE id = ?',
      [applicationId]
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Update application status
    await db.promise().query(
      'UPDATE doctor_applications SET status = "rejected", rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      [rejectionReason, req.user.id, applicationId]
    );

    // Update user status to rejected
    await db.promise().query(
      'UPDATE users SET account_status = "rejected", verification_notes = ? WHERE id = ?',
      [rejectionReason, applications[0].user_id]
    );

    res.json({ message: 'Doctor application rejected' });

  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

// Get all applications with status (admin only)
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [applications] = await db.promise().query(`
      SELECT 
        da.*,
        u.name,
        u.email,
        u.account_status,
        u.created_at as user_created_at,
        reviewer.name as reviewed_by_name
      FROM doctor_applications da
      JOIN users u ON da.user_id = u.id
      LEFT JOIN users reviewer ON da.reviewed_by = reviewer.id
      ORDER BY da.created_at DESC
    `);

    res.json(applications);

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

module.exports = router;
