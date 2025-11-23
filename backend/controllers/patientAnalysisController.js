const { AnalysisRequest } = require('../models');

const patientAnalysisController = {
  // Get patient's analyses
  async getMyAnalyses(req, res) {
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
  },

  // Get specific analysis by ID
  async getAnalysisById(req, res) {
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
  },

  // Create new analysis request
  async createAnalysisRequest(req, res) {
    try {
      const userId = req.user.id;
      const analysisData = {
        ...req.body,
        patient_id: userId
      };

      const analysis = await AnalysisRequest.create(analysisData);

      console.log(`✅ Created analysis request ${analysis.id} for user ${userId}`);

      res.status(201).json(analysis);
    } catch (error) {
      console.error('❌ Error creating analysis request:', error);
      res.status(500).json({ 
        error: 'Failed to create analysis request',
        message: error.message 
      });
    }
  },

  // Update analysis request
  async updateAnalysisRequest(req, res) {
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

      await analysis.update(req.body);

      res.json(analysis);
    } catch (error) {
      console.error('❌ Error updating analysis:', error);
      res.status(500).json({ 
        error: 'Failed to update analysis',
        message: error.message 
      });
    }
  },

  // Cancel analysis request
  async cancelAnalysisRequest(req, res) {
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

      await analysis.update({ status: 'cancelled' });

      res.json({ 
        success: true,
        message: 'Analysis request cancelled',
        analysis 
      });
    } catch (error) {
      console.error('❌ Error cancelling analysis:', error);
      res.status(500).json({ 
        error: 'Failed to cancel analysis',
        message: error.message 
      });
    }
  },
};

module.exports = patientAnalysisController;
