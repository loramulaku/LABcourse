'use strict';

const express = require('express');
const router = express.Router();
const opdController = require('../controllers/opdController');
const { authenticateToken, isAdmin, isDoctor } = require('../middleware/auth');

// Require authentication for all OPD routes
router.use(authenticateToken);

// Create a visit (any authenticated user)
router.post('/visits', opdController.createVisit);
// List visits (authenticated)
router.get('/visits', opdController.listVisits);
// Get visit details
router.get('/visits/:id', opdController.getVisit);
// Quick consultation: creates visit + immediate OPD bill (authenticated)
router.post('/visits/quick', opdController.quickConsult);
// Create a bill for an existing visit - only doctor or admin can bill
router.post('/visits/:id/bill', (req, res, next) => {
	if (req.user?.role === 'doctor' || req.user?.role === 'admin') return next();
	return res.status(403).json({ error: 'Akses i ndaluar, duhet doctor ose admin' });
}, opdController.billVisit);

module.exports = router;
