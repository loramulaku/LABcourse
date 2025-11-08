const express = require('express');
const BillingController = require('../../controllers/oop/BillingController');

const router = express.Router();
const controller = new BillingController();

// Admin billing endpoints
router.post('/invoices', controller.createInvoice);
router.get('/invoices', controller.listInvoices);
router.get('/invoices/:id', controller.getInvoice);
router.post('/invoices/:id/pay', controller.recordPayment);

module.exports = router;
