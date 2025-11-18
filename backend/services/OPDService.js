'use strict';

const db = require('../models');
const OPDVisitRepository = require('../repositories/OPDVisitRepository');

class OPDService {
  async createVisit({ patientId, doctorId, departmentId, visitType, notes, consultationFee }, user) {
    const transaction = await db.sequelize.transaction();
    try {
      const visit = await OPDVisitRepository.create({
        patient_id: patientId,
        doctor_id: doctorId || null,
        department_id: departmentId || null,
        visit_type: visitType || 'consultation',
        notes: notes || null,
        consultation_fee: consultationFee || null,
        billed: false
      }, transaction);

      await transaction.commit();
      return visit;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async listVisits(filter) {
    return await OPDVisitRepository.findAll(filter);
  }

  async getVisit(id) {
    return await OPDVisitRepository.findById(id);
  }

  // Quick consultation: create visit and bill immediately using existing Bill model
  async quickConsult({ patientId, doctorId, departmentId, fee, notes }, user) {
    const transaction = await db.sequelize.transaction();
    try {
      const visit = await OPDVisitRepository.create({
        patient_id: patientId,
        doctor_id: doctorId || null,
        department_id: departmentId || null,
        visit_type: 'quick',
        notes: notes || null,
        consultation_fee: fee || null,
        billed: false
      }, transaction);

      // Create a Bill for OPD visit
      const bill = await db.Bill.create({
        patientId: patientId,
        totalAmount: fee || 0,
        paidAmount: 0,
        notes: `OPD quick consultation: ${notes || ''}`,
        billType: 'opd',
        paymentMethod: null,
        isPaid: false
      }, { transaction });

      // Create bill item
      await db.BillItem.create({
        billId: bill.id,
        description: 'OPD Consultation',
        quantity: 1,
        amount: fee || 0
      }, { transaction });

      // Link bill to visit
      await visit.update({ bill_id: bill.id, billed: true }, { transaction });

      await transaction.commit();

      const created = await OPDVisitRepository.findById(visit.id);
      return { visit: created, bill };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  // Create OPD bill for an existing visit
  async billVisit(visitId, { items, paymentMethod }, user) {
    const transaction = await db.sequelize.transaction();
    try {
      const visit = await OPDVisitRepository.findById(visitId);
      if (!visit) throw new Error('Visit not found');

      const totalAmount = items.reduce((sum, it) => sum + (parseFloat(it.amount) * parseInt(it.quantity || 1)), 0);

      const bill = await db.Bill.create({
        patientId: visit.patient_id,
        totalAmount,
        paidAmount: 0,
        notes: `OPD visit billing for visit ${visit.id}`,
        billType: 'opd',
        paymentMethod: paymentMethod || null,
        isPaid: false
      }, { transaction });

      await Promise.all(items.map(it => db.BillItem.create({
        billId: bill.id,
        description: it.description,
        quantity: it.quantity || 1,
        amount: it.amount
      }, { transaction })));

      await visit.update({ bill_id: bill.id, billed: true }, { transaction });

      await transaction.commit();

      const fullBill = await db.Bill.findByPk(bill.id, { include: [{ model: db.BillItem, as: 'items' }] });
      return { visit: await OPDVisitRepository.findById(visit.id), bill: fullBill };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

module.exports = new OPDService();
