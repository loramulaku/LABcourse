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

// Get booked time slots for a laboratory
router.get('/:id/booked-slots', async (req, res) => {
    try {
        const bookedSlots = await Laboratory.getBookedTimeSlots(req.params.id);
        res.json(bookedSlots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get booked hours for a specific date
router.get('/:id/booked-hours/:date', async (req, res) => {
    try {
        const bookedHours = await Laboratory.getBookedHoursForDate(req.params.id, req.params.date);
        res.json(bookedHours);
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
        if (error.message.includes('already booked')) {
            return res.status(400).json({ error: error.message });
        }
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

// Admin routes for laboratory management
// Create laboratory (admin only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const laboratoryId = await Laboratory.create(req.body);
        res.status(201).json({ id: laboratoryId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update laboratory (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        await Laboratory.update(req.params.id, req.body);
        res.json({ message: 'Laboratory updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete laboratory (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        await Laboratory.delete(req.params.id);
        res.json({ message: 'Laboratory deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;