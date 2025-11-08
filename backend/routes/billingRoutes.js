const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/billing/bills - Get all bills
router.get('/bills', isAdmin, billingController.getBills);

// GET /api/billing/bills/:id - Get specific bill
router.get('/bills/:id', isAdmin, billingController.getBill);

// POST /api/billing/bills - Create new bill
router.post('/bills', isAdmin, billingController.createBill);

// PATCH /api/billing/bills/:id/mark-paid - Mark bill as paid
router.patch('/bills/:id/mark-paid', isAdmin, billingController.markAsPaid);

// POST /api/billing/payments - Add payment to bill
router.post('/payments', isAdmin, billingController.addPayment);

// GET /api/billing/bills/:id/payments - Get payment history for a bill
router.get('/bills/:id/payments', isAdmin, billingController.getPaymentHistory);

module.exports = router;