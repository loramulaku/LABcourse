const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const patientController = require('../controllers/patientController');

const router = express.Router();

// Get patient's own analyses
router.get('/my-analyses', authenticateToken, patientController.getMyAnalyses);

// Get patient's accommodations (IPD records)
router.get('/my-accommodations', authenticateToken, async (req, res) => {
  try {
    const { IPDPatient, Ward, Room, Bed } = require('../models');
    const records = await IPDPatient.findAll({
      where: { patient_id: req.user.id },
      include: [
        { model: Ward, as: 'ward', attributes: ['id', 'name', 'type'] },
        { model: Room, as: 'room', attributes: ['id', 'room_number', 'room_type'] },
        { model: Bed, as: 'bed', attributes: ['id', 'bed_number', 'bed_type'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const accommodations = records.map(r => ({
      id: r.id,
      status: r.status,
      diagnosis: r.diagnosis,
      admitted_at: r.admitted_at || r.created_at,
      discharged_at: r.discharged_at,
      ward_name: r.ward?.name || 'N/A',
      room_number: r.room?.room_number || 'N/A',
      room_type: r.room?.room_type || 'Standard',
      bed_number: r.bed?.bed_number || 'N/A',
    }));

    res.json(accommodations);
  } catch (error) {
    console.error('Error fetching patient accommodations:', error);
    res.status(500).json({ error: 'Failed to fetch accommodations' });
  }
});

// Download result PDF (patient's own results only)
router.get('/download-result/:id', authenticateToken, patientController.downloadResult);

// View result PDF (inline)
router.get('/view-result/:id', authenticateToken, patientController.viewResult);

module.exports = router;
