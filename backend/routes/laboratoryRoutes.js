// routes/laboratoryRoutes.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Laboratory = require('../models/Laboratory');
const Analysis = require('../models/Analysis');
const db = require('../db');

const router = express.Router();

// Test endpoint to check database connection
router.get('/test-db', async (req, res) => {
    try {
        console.log('Testing database connection...');
        
        // Test laboratories table
        const [labs] = await db.promise().query('SELECT COUNT(*) as count FROM laboratories');
        console.log('Laboratories count:', labs[0].count);
        
        // Test analysis_types table
        const [types] = await db.promise().query('SELECT COUNT(*) as count FROM analysis_types');
        console.log('Analysis types count:', types[0].count);
        
        // Test patient_analyses table
        const [analyses] = await db.promise().query('SELECT COUNT(*) as count FROM patient_analyses');
        console.log('Patient analyses count:', analyses[0].count);
        
        res.json({
            success: true,
            message: 'Database connection successful',
            counts: {
                laboratories: labs[0].count,
                analysis_types: types[0].count,
                patient_analyses: analyses[0].count
            }
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ 
            error: 'Database connection failed', 
            details: error.message,
            stack: error.stack
        });
    }
});

// Test endpoint to check time slot generation
router.get('/test-time-slots/:date', async (req, res) => {
    try {
        const date = req.params.date;
        console.log('Testing time slot generation for date:', date);
        
        // Generate a few test slots
        const testSlots = [];
        for (let hour = 8; hour < 10; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${date} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                const slotTime = new Date(timeString);
                
                testSlots.push({
                    time: slotTime.toISOString(),
                    displayTime: slotTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    originalTimeString: timeString
                });
            }
        }
        
        res.json({
            success: true,
            date: date,
            testSlots: testSlots
        });
    } catch (error) {
        console.error('Time slot test error:', error);
        res.status(500).json({ 
            error: 'Time slot test failed', 
            details: error.message
        });
    }
});

// Test endpoint to create sample bookings for testing
router.post('/test-create-booking/:labId/:date/:time', async (req, res) => {
    try {
        const { labId, date, time } = req.params;
        const appointmentDateTime = `${date} ${time}:00`;
        
        console.log('Creating test booking:', { labId, date, time, appointmentDateTime });
        
        // Insert a test booking
        const [result] = await db.promise().query(
            'INSERT INTO patient_analyses (user_id, analysis_type_id, laboratory_id, appointment_date, notes, status) VALUES (?, ?, ?, ?, ?, ?)',
            [1, 1, labId, appointmentDateTime, 'Test booking for red slot display', 'pending']
        );
        
        res.json({
            success: true,
            message: 'Test booking created',
            bookingId: result.insertId,
            appointmentDateTime: appointmentDateTime
        });
    } catch (error) {
        console.error('Test booking creation error:', error);
        res.status(500).json({ 
            error: 'Test booking creation failed', 
            details: error.message
        });
    }
});

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

// Get blocked time slots with 30-minute margins for a specific date
router.get('/:id/blocked-slots/:date', async (req, res) => {
    try {
        const blockedSlots = await Laboratory.getTimeSlotsWithMargins(req.params.id, req.params.date);
        res.json(blockedSlots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Check if a date is fully booked
router.get('/:id/date-status/:date', async (req, res) => {
    try {
        const isFullyBooked = await Laboratory.isDateFullyBooked(req.params.id, req.params.date);
        res.json({ isFullyBooked, date: req.params.date });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get available time slots for a specific date (30-minute intervals)
router.get('/:id/available-slots/:date', async (req, res) => {
    try {
        const labId = req.params.id;
        const date = req.params.date;
        
        console.log(`Getting available slots for lab ${labId} on date ${date}`);
        
        const blockedSlots = await Laboratory.getTimeSlotsWithMargins(labId, date);
        console.log('Blocked slots:', blockedSlots);
        
        // Generate all possible 30-minute slots for the day (8 AM to 6 PM)
        const allPossibleSlots = [];
        const startHour = 8;
        const endHour = 18;
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                // Create datetime string in local timezone format
                const timeString = `${date} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                const slotTime = new Date(timeString);
                const slotISO = slotTime.toISOString();
                
                const isAvailable = !blockedSlots.includes(slotISO);
                
                allPossibleSlots.push({
                    time: slotISO,
                    displayTime: slotTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    isAvailable: isAvailable,
                    originalTimeString: timeString
                });
                
                // Log each slot for debugging
                if (hour <= 10) { // Only log first few slots to avoid spam
                    console.log(`Slot ${timeString}: ${isAvailable ? 'Available' : 'Blocked'}`);
                }
            }
        }
        
        console.log(`Generated ${allPossibleSlots.length} slots, ${allPossibleSlots.filter(s => !s.isAvailable).length} blocked`);
        
        res.json(allPossibleSlots);
    } catch (error) {
        console.error('Error in available-slots endpoint:', error);
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