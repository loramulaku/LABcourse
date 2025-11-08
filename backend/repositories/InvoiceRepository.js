const BaseRepository = require('../core/BaseRepository');
const { Invoice } = require('../models');

class InvoiceRepository extends BaseRepository {
  constructor() {
    super(Invoice);
  }

  async findByReference(reference) {
    return await this.findOne({ where: { reference } });
  }

  async findAllWithItems(where = {}) {
    return await this.findAll({ where, include: [{ association: 'items' }, { association: 'payments' }] });
  }
}

module.exports = InvoiceRepository;
