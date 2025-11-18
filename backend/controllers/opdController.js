'use strict';

const OPDService = require('../services/OPDService');

exports.createVisit = async (req, res) => {
  try {
    const { patientId, doctorId, departmentId, visitType, notes, consultationFee } = req.body;
    const visit = await OPDService.createVisit({ patientId, doctorId, departmentId, visitType, notes, consultationFee }, req.user);
    res.status(201).json({ visit });
  } catch (err) {
    console.error('Error creating OPD visit:', err);
    res.status(500).json({ error: err.message || 'Failed to create visit' });
  }
};

exports.listVisits = async (req, res) => {
  try {
    const filter = {
      patientId: req.query.patientId,
      doctorId: req.query.doctorId,
      status: req.query.status,
      visitType: req.query.visitType
    };
    const visits = await OPDService.listVisits(filter);
    res.json({ visits });
  } catch (err) {
    console.error('Error listing OPD visits:', err);
    res.status(500).json({ error: 'Failed to list visits' });
  }
};

exports.getVisit = async (req, res) => {
  try {
    const visit = await OPDService.getVisit(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    res.json({ visit });
  } catch (err) {
    console.error('Error getting OPD visit:', err);
    res.status(500).json({ error: 'Failed to fetch visit' });
  }
};

exports.quickConsult = async (req, res) => {
  try {
    const { patientId, doctorId, departmentId, fee, notes } = req.body;
    const result = await OPDService.quickConsult({ patientId, doctorId, departmentId, fee, notes }, req.user);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error in quick consult:', err);
    res.status(500).json({ error: err.message || 'Quick consult failed' });
  }
};

exports.billVisit = async (req, res) => {
  try {
    const visitId = req.params.id;
    const { items, paymentMethod } = req.body;
    const result = await OPDService.billVisit(visitId, { items, paymentMethod }, req.user);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error billing OPD visit:', err);
    res.status(500).json({ error: err.message || 'Failed to bill visit' });
  }
};
