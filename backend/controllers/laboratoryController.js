const { Laboratory, User, AnalysisType, PatientAnalysis } = require('../models');

const laboratoryController = {
  // Get all laboratories
  async getAllLaboratories(req, res) {
    try {
      const laboratories = await Laboratory.findAll({
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'account_status'],
            where: { account_status: 'active' },
          },
        ],
        order: [['created_at', 'DESC']],
      });

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
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'account_status'],
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

  // Create laboratory
  async createLaboratory(req, res) {
    try {
      const labData = req.body;

      const laboratory = await Laboratory.create(labData);

      res.status(201).json(laboratory);
    } catch (error) {
      console.error('Error creating laboratory:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Laboratory profile already exists for this user' });
      }
      res.status(500).json({ error: 'Failed to create laboratory' });
    }
  },

  // Update laboratory
  async updateLaboratory(req, res) {
    try {
      const labId = req.params.id;
      const updates = req.body;

      const laboratory = await Laboratory.findByPk(labId);

      if (!laboratory) {
        return res.status(404).json({ error: 'Laboratory not found' });
      }

      await laboratory.update(updates);

      res.json(laboratory);
    } catch (error) {
      console.error('Error updating laboratory:', error);
      res.status(500).json({ error: 'Failed to update laboratory' });
    }
  },

  // Delete laboratory
  async deleteLaboratory(req, res) {
    try {
      const labId = req.params.id;

      const laboratory = await Laboratory.findByPk(labId);

      if (!laboratory) {
        return res.status(404).json({ error: 'Laboratory not found' });
      }

      await laboratory.destroy();

      res.json({ message: 'Laboratory deleted successfully' });
    } catch (error) {
      console.error('Error deleting laboratory:', error);
      res.status(500).json({ error: 'Failed to delete laboratory' });
    }
  },

  // Get laboratory analyses
  async getLaboratoryAnalyses(req, res) {
    try {
      const labId = req.params.id;

      const analyses = await PatientAnalysis.findAll({
        where: { laboratory_id: labId },
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
          },
          {
            model: AnalysisType,
            attributes: ['name', 'description'],
          },
        ],
        order: [['created_at', 'DESC']],
      });

      res.json(analyses);
    } catch (error) {
      console.error('Error fetching laboratory analyses:', error);
      res.status(500).json({ error: 'Failed to fetch analyses' });
    }
  },

  // Get analysis types for a laboratory
  async getAnalysisTypes(req, res) {
    try {
      const labId = req.params.id;

      const analysisTypes = await AnalysisType.findAll({
        where: { laboratory_id: labId },
        order: [['name', 'ASC']],
      });

      res.json(analysisTypes);
    } catch (error) {
      console.error('Error fetching analysis types:', error);
      res.status(500).json({ error: 'Failed to fetch analysis types' });
    }
  },

  // Create analysis type
  async createAnalysisType(req, res) {
    try {
      const analysisTypeData = req.body;

      const analysisType = await AnalysisType.create(analysisTypeData);

      res.status(201).json(analysisType);
    } catch (error) {
      console.error('Error creating analysis type:', error);
      res.status(500).json({ error: 'Failed to create analysis type' });
    }
  },

  // Update analysis type
  async updateAnalysisType(req, res) {
    try {
      const analysisTypeId = req.params.id;
      const updates = req.body;

      const analysisType = await AnalysisType.findByPk(analysisTypeId);

      if (!analysisType) {
        return res.status(404).json({ error: 'Analysis type not found' });
      }

      await analysisType.update(updates);

      res.json(analysisType);
    } catch (error) {
      console.error('Error updating analysis type:', error);
      res.status(500).json({ error: 'Failed to update analysis type' });
    }
  },

  // Delete analysis type
  async deleteAnalysisType(req, res) {
    try {
      const analysisTypeId = req.params.id;

      const analysisType = await AnalysisType.findByPk(analysisTypeId);

      if (!analysisType) {
        return res.status(404).json({ error: 'Analysis type not found' });
      }

      await analysisType.destroy();

      res.json({ message: 'Analysis type deleted successfully' });
    } catch (error) {
      console.error('Error deleting analysis type:', error);
      res.status(500).json({ error: 'Failed to delete analysis type' });
    }
  },
};

module.exports = laboratoryController;

