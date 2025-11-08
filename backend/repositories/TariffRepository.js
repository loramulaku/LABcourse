const BaseRepository = require('../core/BaseRepository');
const { TariffItem } = require('../models');

class TariffRepository extends BaseRepository {
  constructor() {
    super(TariffItem);
  }

  async findActive() {
    return await this.findAll({ where: { active: true } });
  }
}

module.exports = TariffRepository;
