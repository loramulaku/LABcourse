const { PatientAnalysis, AnalysisType, Laboratory, User } = require('../models');
const path = require('path');
const fs = require('fs');

const patientController = {
  // Get patient's own analyses
  async getMyAnalyses(req, res) {
    try {
      const analyses = await PatientAnalysis.findAll({
        where: { user_id: req.user.id },
        include: [
          {
            model: AnalysisType,
            attributes: ['name', 'price']
          },
          {
            model: Laboratory,
            attributes: ['address', 'phone'],
            include: [{
              model: User,
              attributes: ['name']
            }]
          }
        ],
        order: [['appointment_date', 'DESC']]
      });

      res.json(analyses);
    } catch (error) {
      console.error('Error fetching patient analyses:', error);
      res.status(500).json({ error: 'Failed to fetch analyses' });
    }
  },

  // Download result PDF
  async downloadResult(req, res) {
    try {
      const analysisId = req.params.id;

      // Verify the analysis belongs to the current user
      const analysis = await PatientAnalysis.findOne({
        where: {
          id: analysisId,
          user_id: req.user.id,
          status: 'completed'
        },
        attributes: ['result_pdf_path']
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Result not found or not ready' });
      }

      const filePath = analysis.result_pdf_path;

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Result file not found' });
      }

      // Set appropriate headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="result-${analysisId}.pdf"`);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error downloading file' });
        }
      });
    } catch (error) {
      console.error('Error downloading result:', error);
      res.status(500).json({ error: 'Failed to download result' });
    }
  },

  // View result PDF (inline)
  async viewResult(req, res) {
    try {
      const analysisId = req.params.id;

      // Verify the analysis belongs to the current user
      const analysis = await PatientAnalysis.findOne({
        where: {
          id: analysisId,
          user_id: req.user.id,
          status: 'completed'
        },
        attributes: ['result_pdf_path']
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Result not found or not ready' });
      }

      const filePath = analysis.result_pdf_path;

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Result file not found' });
      }

      // Set appropriate headers for PDF viewing
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error viewing file' });
        }
      });
    } catch (error) {
      console.error('Error viewing result:', error);
      res.status(500).json({ error: 'Failed to view result' });
    }
  },
};

module.exports = patientController;
