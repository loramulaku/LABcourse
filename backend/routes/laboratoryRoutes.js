// routes/laboratoryRoutes.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Laboratory = require('../models/Laboratory');
const Analysis = require('../models/Analysis');
const db = require('../db');

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

// Get analysis types for a specific laboratory
router.get('/:id/analysis-types', async (req, res) => {
    try {
        const types = await Analysis.getTypesByLaboratory(req.params.id);
        res.json(types);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get available time slots for a specific date and laboratory
router.get('/:id/available-slots/:date', async (req, res) => {
    try {
        const labId = req.params.id;
        const date = req.params.date;
        
        console.log(`Getting available slots for lab ${labId} on date ${date}`);
        
        // Generate all possible 30-minute slots for the day (8 AM to 6 PM)
        const allPossibleSlots = [];
        const startHour = 8;
        const endHour = 18;
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                // Create datetime string in UTC format to avoid timezone issues
                const timeString = `${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00.000Z`;
                const slotTime = new Date(timeString);
                const slotISO = slotTime.toISOString();
                
                // Check availability using the same method as the booking validation
                const isAvailable = await Laboratory.isTimeSlotAvailableForDisplay(labId, slotISO);
                
                // Format display time correctly
                const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayTime = `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
                
                allPossibleSlots.push({
                    time: slotISO,
                    displayTime: displayTime,
                    isAvailable: isAvailable,
                    originalTimeString: timeString
                });
            }
        }
        
        console.log(`Generated ${allPossibleSlots.length} slots, ${allPossibleSlots.filter(s => !s.isAvailable).length} blocked`);
        
        res.json(allPossibleSlots);
    } catch (error) {
        console.error('Error in available-slots endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Check if a specific date is fully booked
router.get('/:id/date-status/:date', async (req, res) => {
    try {
        const labId = req.params.id;
        const date = req.params.date;
        
        const isFullyBooked = await Laboratory.isDateFullyBooked(labId, date);
        
        res.json({ isFullyBooked });
    } catch (error) {
        console.error('Error checking date status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Request analysis (protected route)
router.post('/request-analysis', authenticateToken, async (req, res) => {
    try {
        console.log('Analysis request received:', req.body);
        console.log('User ID:', req.user.id);
        
        const userId = req.user.id;
        const requestData = {
            user_id: userId,
            ...req.body
        };
        
        console.log('Request data:', requestData);
        
        const analysisRequest = await Analysis.createRequest(requestData);
        res.status(201).json({ id: analysisRequest });
    } catch (error) {
        console.error('Error in analysis request:', error);
        console.error('Error stack:', error.stack);
        if (error.message === 'TIME_SLOT_BOOKED') {
            return res.status(400).json({ 
                error: 'TIME_SLOT_BOOKED',
                message: 'This time slot is not available. Please select an available time slot from the calendar.'
            });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
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

// Test endpoint to check current reservations by laboratory
router.get('/test-reservations/:labId/:date', async (req, res) => {
    try {
        const labId = req.params.labId;
        const date = req.params.date;
        
        const [rows] = await db.promise().query(
            `SELECT pa.*, at.name as analysis_name, l.name as laboratory_name 
             FROM patient_analyses pa 
             JOIN analysis_types at ON pa.analysis_type_id = at.id 
             JOIN laboratories l ON pa.laboratory_id = l.id 
             WHERE pa.laboratory_id = ? 
             AND DATE(pa.appointment_date) = ?
             AND pa.status != "cancelled"
             ORDER BY pa.appointment_date`,
            [labId, date]
        );
        
        res.json({
            laboratory_id: labId,
            date: date,
            reservations: rows,
            count: rows.length
        });
    } catch (error) {
        console.error('Error fetching test reservations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cleanup endpoint to remove all test data
router.post('/cleanup-test-data', async (req, res) => {
    try {
        console.log('Cleaning up all test data...');
        
        // Delete all test reservations
        const [result] = await db.promise().query(
            'DELETE FROM patient_analyses WHERE notes LIKE ? OR notes = ? OR notes = ? OR notes LIKE ?',
            ['%Test%', 'ee', '5', '%test%']
        );
        
        console.log(`Deleted ${result.affectedRows} test reservations`);
        
        res.json({
            success: true,
            message: 'Test data cleaned up successfully',
            deletedRows: result.affectedRows
        });
    } catch (error) {
        console.error('Error cleaning up test data:', error);
        res.status(500).json({ 
            error: 'Failed to clean up test data', 
            details: error.message
        });
    }
});

// Cleanup endpoint to remove ALL reservations (for testing)
router.post('/cleanup-all-data', async (req, res) => {
    try {
        console.log('Cleaning up ALL reservation data...');
        
        // Delete ALL reservations
        const [result] = await db.promise().query('DELETE FROM patient_analyses');
        
        console.log(`Deleted ${result.affectedRows} reservations`);
        
        res.json({
            success: true,
            message: 'All reservation data cleaned up successfully',
            deletedRows: result.affectedRows
        });
    } catch (error) {
        console.error('Error cleaning up all data:', error);
        res.status(500).json({ 
            error: 'Failed to clean up all data', 
            details: error.message
        });
    }
});

module.exports = router;