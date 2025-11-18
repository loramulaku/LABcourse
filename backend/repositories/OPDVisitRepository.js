'use strict';

const db = require('../models');

class OPDVisitRepository {
  async create(data, transaction) {
    return await db.OPDVisit.create(data, { transaction });
  }

  async findById(id) {
    return await db.OPDVisit.findByPk(id, {
      include: [
        { model: db.User, as: 'patient', attributes: ['id', 'name', 'email'] },
        { model: db.Doctor, as: 'doctor' },
        { model: db.Department, as: 'department' },
        { model: db.Bill, as: 'bill' }
      ]
    });
  }

  async findAll(filter = {}) {
    const where = {};
    if (filter.patientId) where.patient_id = filter.patientId;
    if (filter.doctorId) where.doctor_id = filter.doctorId;
    if (filter.status) where.status = filter.status;
    if (filter.visitType) where.visit_type = filter.visitType;

    return await db.OPDVisit.findAll({
      where,
      include: [
        { model: db.User, as: 'patient', attributes: ['id', 'name'] },
        { model: db.Doctor, as: 'doctor', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async update(id, data, transaction) {
    const visit = await db.OPDVisit.findByPk(id);
    if (!visit) return null;
    return await visit.update(data, { transaction });
  }
}

module.exports = new OPDVisitRepository();
