const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

// Create appointment and Stripe checkout session
router.post('/create-checkout-session', authenticateToken, appointmentController.createCheckoutSession);

// Note: Webhook is registered in server.js BEFORE express.json() middleware
// This is required for Stripe signature verification with raw body

// Regenerate Stripe payment link for approved appointment (patient)
router.post('/regenerate-payment-link/:id', authenticateToken, appointmentController.regeneratePaymentLink);

// Verify payment after Stripe checkout
router.get('/verify-payment/:sessionId', authenticateToken, appointmentController.verifyPayment);

// Get my appointments (as patient)
router.get('/my', authenticateToken, appointmentController.getMyAppointments);

// Get all appointments
router.get('/', appointmentController.getAllAppointments);

// Get appointment by ID
router.get('/:id', appointmentController.getAppointmentById);

// Get user's appointments
router.get('/user/:userId', authenticateToken, appointmentController.getUserAppointments);

// Get doctor's appointments
router.get('/doctor/:doctorId', appointmentController.getDoctorAppointments);

// Get available time slots for a doctor
router.get('/slots/available', appointmentController.getAvailableSlots);

// Create appointment
router.post('/', authenticateToken, appointmentController.createAppointment);

// Update appointment
router.put('/:id', authenticateToken, appointmentController.updateAppointment);

// Delete/Cancel appointment
router.delete('/:id', authenticateToken, appointmentController.deleteAppointment);

module.exports = router;
