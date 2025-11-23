const { Laboratory, User, AnalysisType, PatientAnalysis } = require('../models');
const { Op } = require('sequelize');
const AnalysisService = require('../services/AnalysisService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/analysis-results');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'result-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Helper function to get current lab ID
const getCurrentLabId = async (userId) => {
  const lab = await Laboratory.findOne({
    where: { user_id: userId },
    attributes: ['id']
  });
  return lab ? lab.id : null;
};

const laboratoryController = {
  // Get all laboratories
  async getAllLaboratories(req, res) {
    try {
      console.log('📋 Fetching all laboratories...');
      
      const laboratories = await Laboratory.findAll({
        include: [{
          model: User,
          attributes: ['id', 'name', 'email', 'account_status'],
          where: { account_status: 'active' },
        }],
        order: [['created_at', 'DESC']],
      });

      console.log(`Found ${laboratories.length} active laboratories`);
      res.json(laboratories);
    } catch (error) {
      console.error('Error fetching laboratories:', error);
      res.status(500).json({ error: 'Failed to fetch laboratories' });
    }
  },

  // Get laboratory by ID
  async getLaboratoryById(req, res) {
    try {
      const labId = req.params.id;

      const laboratory = await Laboratory.findByPk(labId, {
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'account_status'],
          },
          {
            model: AnalysisType,
            attributes: ['id', 'name', 'description', 'price', 'unit'],
          },
        ],
      });

      if (!laboratory) {
        return res.status(404).json({ error: 'Laboratory not found' });
      }

      res.json(laboratory);
    } catch (error) {
      console.error('Error fetching laboratory:', error);
      res.status(500).json({ error: 'Failed to fetch laboratory' });
    }
  },

  // Get laboratory by user ID
  async getLaboratoryByUserId(req, res) {
    try {
      const userId = req.params.userId;

      const laboratory = await Laboratory.findOne({
        where: { user_id: userId },
        include: [{
          model: User,
          attributes: ['id', 'name', 'email', 'account_status'],
        }],
      });

      if (!laboratory) {
        return res.status(404).json({ error: 'Laboratory not found' });
      }

      res.json(laboratory);
    } catch (error) {
      console.error('Error fetching laboratory:', error);
      res.status(500).json({ error: 'Failed to fetch laboratory' });
    }
  },

  // Dashboard: Get patient history
  async getDashboardHistory(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.status(404).json({ error: 'Lab not found' });

      const analyses = await PatientAnalysis.findAll({
        where: { laboratory_id: labId },
        include: [{
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email']
        }, {
          model: AnalysisType,
          attributes: ['name', 'description']
        }],
        order: [['created_at', 'DESC']]
      });

      res.json(analyses);
    } catch (error) {
      console.error('Error fetching dashboard history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Dashboard: Get appointments
  async getDashboardAppointments(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.status(404).json({ error: 'Lab not found' });

      const appointments = await PatientAnalysis.findAll({
        where: { laboratory_id: labId },
        include: [{
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email', 'phone']
        }, {
          model: AnalysisType,
          attributes: ['name', 'price']
        }],
        order: [['scheduled_date', 'ASC']]
      });

      res.json(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Dashboard: Get appointments grouped by date
  async getAppointmentsByDate(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.json([]);

      const analyses = await PatientAnalysis.findAll({
        where: { laboratory_id: labId },
        include: [{
          model: User,
          as: 'patient',
          attributes: ['name', 'email']
        }, {
          model: AnalysisType,
          attributes: ['name']
        }],
        order: [['scheduled_date', 'ASC']]
      });

      // Group by date
      const grouped = analyses.reduce((acc, analysis) => {
        const date = analysis.scheduled_date ? analysis.scheduled_date.toString().split('T')[0] : 'No Date';
        if (!acc[date]) acc[date] = [];
        acc[date].push(analysis);
        return acc;
      }, {});

      res.json(grouped);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update analysis status
  async updateStatus(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const { id } = req.params;
      const { status, notes } = req.body;

      const analysis = await PatientAnalysis.findOne({
        where: { id, laboratory_id: labId }
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }

      const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'pending_result'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      await analysis.update({
        status,
        notes: notes || analysis.notes
      });

      res.json({ message: 'Status updated successfully', analysis });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Upload result PDF
  async uploadResult(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const { id } = req.params;
      const { result_note } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'PDF file is required' });
      }

      const analysis = await PatientAnalysis.findOne({
        where: { id, laboratory_id: labId }
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found or access denied' });
      }

      const resultPdfPath = `/uploads/analysis-results/${req.file.filename}`;

      await analysis.update({
        result_pdf_path: resultPdfPath,
        result_note: result_note || '',
        status: 'pending_result',
        completed_at: new Date()
      });

      res.json({
        message: 'Result uploaded successfully',
        analysis
      });
    } catch (error) {
      console.error('Error uploading result:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Submit result (mark as completed)
  async submitResult(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const { id } = req.params;

      const analysis = await PatientAnalysis.findOne({
        where: { id, laboratory_id: labId }
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      await analysis.update({
        status: 'completed',
        completed_at: new Date()
      });

      res.json({ message: 'Result submitted successfully' });
    } catch (error) {
      console.error('Error submitting result:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get lab profile
  async getLabProfile(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.status(404).json({ error: 'Lab not found' });

      const laboratory = await Laboratory.findByPk(labId, {
        include: [{
          model: User,
          attributes: ['name', 'email']
        }]
      });

      res.json(laboratory);
    } catch (error) {
      console.error('Error fetching lab profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update lab profile
  async updateLabProfile(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.status(404).json({ error: 'Lab not found' });

      const { address, phone, email, description, working_hours } = req.body;

      const laboratory = await Laboratory.findByPk(labId);
      await laboratory.update({
        address,
        phone,
        email,
        description,
        working_hours
      });

      res.json({ message: 'Profile updated successfully', laboratory });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get lab's analysis types
  async getMyAnalysisTypes(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.json([]);

      const types = await AnalysisType.findAll({
        where: { laboratory_id: labId },
        order: [['name', 'ASC']]
      });

      res.json(types);
    } catch (error) {
      console.error('Error fetching analysis types:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Create analysis type
  async createAnalysisType(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.status(404).json({ error: 'Lab not found' });

      const { name, description, normal_range, unit, price } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const analysisType = await AnalysisType.create({
        name,
        description,
        normal_range,
        unit,
        price,
        laboratory_id: labId
      });

      res.status(201).json(analysisType);
    } catch (error) {
      console.error('Error creating analysis type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update analysis type
  async updateAnalysisType(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const { id } = req.params;
      const { name, description, normal_range, unit, price } = req.body;

      const analysisType = await AnalysisType.findOne({
        where: { id, laboratory_id: labId }
      });

      if (!analysisType) {
        return res.status(404).json({ error: 'Analysis type not found or access denied' });
      }

      await analysisType.update({
        name,
        description,
        normal_range,
        unit,
        price
      });

      res.json({ message: 'Analysis type updated successfully', analysisType });
    } catch (error) {
      console.error('Error updating analysis type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete analysis type
  async deleteAnalysisType(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const { id } = req.params;

      const analysisType = await AnalysisType.findOne({
        where: { id, laboratory_id: labId }
      });

      if (!analysisType) {
        return res.status(404).json({ error: 'Analysis type not found or access denied' });
      }

      await analysisType.destroy();
      res.json({ message: 'Analysis type deleted successfully' });
    } catch (error) {
      console.error('Error deleting analysis type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get confirmed analyses
  async getConfirmedAnalyses(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.json([]);

      const analyses = await PatientAnalysis.findAll({
        where: {
          laboratory_id: labId,
          status: 'confirmed'
        },
        include: [{
          model: User,
          as: 'patient',
          attributes: ['name', 'email']
        }, {
          model: AnalysisType,
          attributes: ['name']
        }],
        order: [['scheduled_date', 'ASC']]
      });

      res.json(analyses);
    } catch (error) {
      console.error('Error fetching confirmed analyses:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get pending result analyses
  async getPendingResults(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      if (!labId) return res.json([]);

      const analyses = await PatientAnalysis.findAll({
        where: {
          laboratory_id: labId,
          status: 'pending_result',
          result_pdf_path: { [Op.ne]: null }
        },
        include: [{
          model: User,
          as: 'patient',
          attributes: ['name', 'email']
        }, {
          model: AnalysisType,
          attributes: ['name']
        }],
        order: [['completed_at', 'DESC']]
      });

      res.json(analyses);
    } catch (error) {
      console.error('Error fetching pending results:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Mark as pending
  async markAsPending(req, res) {
    try {
      const labId = await getCurrentLabId(req.user.id);
      const { id } = req.params;

      const analysis = await PatientAnalysis.findOne({
        where: { id, laboratory_id: labId }
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      await analysis.update({ status: 'pending' });
      res.json({ message: 'Marked as pending successfully' });
    } catch (error) {
      console.error('Error marking as pending:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Admin: Create laboratory
  async createLaboratory(req, res) {
    try {
      const { name, login_email, password, address, phone, email, description, working_hours } = req.body;

      if (!name || !login_email || !password) {
        return res.status(400).json({ error: 'Name, login email, and password are required' });
      }

      // Check if user exists
      const existingUser = await User.findOne({ where: { email: login_email } });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Create user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email: login_email,
        password: hashedPassword,
        role: 'lab',
        account_status: 'active'
      });

      // Create laboratory
      const laboratory = await Laboratory.create({
        user_id: user.id,
        address,
        phone,
        email,
        description,
        working_hours
      });

      res.status(201).json({ message: 'Laboratory created successfully', laboratory });
    } catch (error) {
      console.error('Error creating laboratory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Admin: Update laboratory
  async updateLaboratory(req, res) {
    try {
      const labId = req.params.id;
      const { name, login_email, address, phone, email, description, working_hours } = req.body;

      const laboratory = await Laboratory.findByPk(labId, {
        include: [{ model: User }]
      });

      if (!laboratory) {
        return res.status(404).json({ error: 'Laboratory not found' });
      }

      // Update user
      await laboratory.User.update({
        name,
        email: login_email
      });

      // Update laboratory
      await laboratory.update({
        address,
        phone,
        email,
        description,
        working_hours
      });

      res.json({ message: 'Laboratory updated successfully', laboratory });
    } catch (error) {
      console.error('Error updating laboratory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Admin: Delete laboratory
  async deleteLaboratory(req, res) {
    try {
      const labId = req.params.id;

      const laboratory = await Laboratory.findByPk(labId);
      if (!laboratory) {
        return res.status(404).json({ error: 'Laboratory not found' });
      }

      await laboratory.destroy();
      await User.destroy({ where: { id: laboratory.user_id } });

      res.json({ message: 'Laboratory deleted successfully' });
    } catch (error) {
      console.error('Error deleting laboratory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get analysis types by laboratory
  async getAnalysisTypesByLab(req, res) {
    try {
      const analysisService = new AnalysisService();
      const types = await analysisService.getTypesByLaboratory(req.params.id);
      res.json(types);
    } catch (error) {
      console.error('Error fetching analysis types:', error);
      res.status(500).json({ error: 'Failed to fetch analysis types' });
    }
  },

  // Admin: Create analysis type for lab
  async adminCreateAnalysisType(req, res) {
    try {
      const { name, description, normal_range, unit, price, laboratory_id } = req.body;

      if (!name || !laboratory_id) {
        return res.status(400).json({ error: 'Name and laboratory_id are required' });
      }

      const analysisType = await AnalysisType.create({
        name,
        description,
        normal_range,
        unit,
        price,
        laboratory_id
      });

      res.status(201).json(analysisType);
    } catch (error) {
      console.error('Error creating analysis type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get minimal labs list for dropdown
  async getMinimalLabsList(req, res) {
    try {
      const labs = await Laboratory.findAll({
        attributes: ['id'],
        include: [{
          model: User,
          attributes: ['name']
        }]
      });

      const formatted = labs.map(lab => ({
        id: lab.id,
        name: lab.User?.name || 'Unknown Lab'
      }));

      res.json(formatted);
    } catch (error) {
      console.error('Error fetching labs list:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Request analysis (patient)
  async requestAnalysis(req, res) {
    try {
      console.log('Analysis request received:', req.body);
      const { laboratory_id, analysis_type_id, scheduled_date, notes } = req.body;

      if (!laboratory_id || !analysis_type_id || !scheduled_date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const analysis = await PatientAnalysis.create({
        patient_id: req.user.id,
        laboratory_id,
        analysis_type_id,
        scheduled_date,
        notes,
        status: 'pending'
      });

      res.status(201).json({
        success: true,
        message: 'Analysis requested successfully',
        analysis
      });
    } catch (error) {
      console.error('Error requesting analysis:', error);
      res.status(500).json({ error: 'Failed to request analysis' });
    }
  },

  // Get my analyses (patient)
  async getMyAnalyses(req, res) {
    try {
      const analysisService = new AnalysisService();
      const analyses = await analysisService.getPatientAnalyses(req.user.id);
      res.json(analyses);
    } catch (error) {
      console.error('Error fetching my analyses:', error);
      res.status(500).json({ error: 'Failed to fetch analyses' });
    }
  },
};

// Export controller and upload middleware
laboratoryController.upload = upload;
module.exports = laboratoryController;
