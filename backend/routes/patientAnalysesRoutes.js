const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { AnalysisRequest } = require('../models');

// Get patient's analyses
router.get('/my-analyses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`📊 Fetching analyses for user: ${userId}`);

    const analyses = await AnalysisRequest.findAll({
      where: { patient_id: userId },
      order: [['created_at', 'DESC']],
      attributes: [
        'id',
        'patient_id',
        'laboratory_id',
        'analysis_type',
        'status',
        'priority',
        'scheduled_for',
        'notes',
        'results',
        'results_file_path',
        'created_at',
        'updated_at'
      ]
    });

    console.log(`✅ Found ${analyses.length} analyses for user ${userId}`);

    res.json(analyses);
  } catch (error) {
    console.error('❌ Error fetching patient analyses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analyses',
      message: error.message 
    });
  }
});

// Get specific analysis by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const analysis = await AnalysisRequest.findOne({
      where: { 
        id: id,
        patient_id: userId 
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('❌ Error fetching analysis:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analysis',
      message: error.message 
    });
  }
});

module.exports = router;
