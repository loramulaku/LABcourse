// routes/laboratoryRoutes.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Laboratory = require('../models/Laboratory');
const Analysis = require('../models/Analysis');

const router = express.Router();

// Get all laboratories
router.get('/', async (req, res) => {
    try {
        const laboratories = await Laboratory.getAll();
        res.json(laboratories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get specific laboratory
router.get('/:id', async (req, res) => {
    try {
        const laboratory = await Laboratory.getById(req.params.id);
        if (!laboratory) {
            return res.status(404).json({ error: 'Laboratory not found' });
        }
        res.json(laboratory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get analysis types for a laboratory
router.get('/:id/analysis-types', async (req, res) => {
    try {
        const types = await Analysis.getTypesByLaboratory(req.params.id);
        res.json(types);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Request analysis (protected route)
router.post('/request-analysis', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const analysisRequest = await Analysis.createRequest({
            user_id: userId,
            ...req.body
        });
        res.status(201).json({ id: analysisRequest });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get patient's analyses (protected route)
router.get('/my-analyses', authenticateToken, async (req, res) => {
    try {
        const analyses = await Analysis.getPatientAnalyses(req.user.id);
        res.json(analyses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;