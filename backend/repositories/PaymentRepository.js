const BaseRepository = require('../core/BaseRepository');
const { Payment } = require('../models');

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  async findByProviderRef(ref) {
    return await this.findOne({ where: { provider_ref: ref } });
  }
}

module.exports = PaymentRepository;
