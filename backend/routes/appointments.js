const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

// Create appointment and Stripe checkout session
router.post('/create-checkout-session', authenticateToken, appointmentController.createCheckoutSession);

// Webhook to confirm payment
router.post('/webhook', express.raw({ type: 'application/json' }), appointmentController.webhookHandler);

// Regenerate Stripe payment link for approved appointment (patient)
router.post('/regenerate-payment-link/:id', authenticateToken, appointmentController.regeneratePaymentLink);

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
