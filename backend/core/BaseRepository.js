/**
 * BaseRepository - Abstract base class for all repository classes
 * Repositories handle all database operations (CRUD)
 */
class BaseRepository {
  /**
   * @param {Object} model - Sequelize model
   */
  constructor(model) {
    if (new.target === BaseRepository) {
      throw new Error('BaseRepository is abstract and cannot be instantiated directly');
    }
    this.model = model;
  }

  /**
   * Find all records
   * @param {Object} options - Sequelize query options
   * @returns {Promise<Array>}
   */
  async findAll(options = {}) {
    return await this.model.findAll(options);
  }

  /**
   * Find one record
   * @param {Object} options - Sequelize query options
   * @returns {Promise<Object|null>}
   */
  async findOne(options = {}) {
    return await this.model.findOne(options);
  }

  /**
   * Find by primary key
   * @param {number} id - Record ID
   * @param {Object} options - Sequelize query options
   * @returns {Promise<Object|null>}
   */
  async findById(id, options = {}) {
    return await this.model.findByPk(id, options);
  }

  /**
   * Create new record
   * @param {Object} data - Data for new record
   * @param {Object} options - Sequelize query options
   * @returns {Promise<Object>}
   */
  async create(data, options = {}) {
    console.log(`💾 [BaseRepository] ${this.model.name} - Creating record:`, JSON.stringify(data, null, 2));
    try {
      const result = await this.model.create(data, options);
      console.log(`✅ [BaseRepository] ${this.model.name} - Record created with ID:`, result.id);
      console.log(`📊 [BaseRepository] ${this.model.name} - Full result:`, JSON.stringify(result.toJSON(), null, 2));
      return result;
    } catch (error) {
      console.error(`❌ [BaseRepository] ${this.model.name} - Error creating record:`, error.message);
      console.error(`Stack:`, error.stack);
      throw error;
    }
  }

  /**
   * Update record
   * @param {number} id - Record ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    const record = await this.findById(id);
    if (!record) {
      return null;
    }
    return await record.update(data);
  }

  /**
   * Delete record
   * @param {number} id - Record ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const record = await this.findById(id);
    if (!record) {
      return false;
    }
    await record.destroy();
    return true;
  }

  /**
   * Count records
   * @param {Object} options - Sequelize query options
   * @returns {Promise<number>}
   */
  async count(options = {}) {
    return await this.model.count(options);
  }

  /**
   * Check if record exists
   * @param {Object} where - Where clause
   * @returns {Promise<boolean>}
   */
  async exists(where) {
    const count = await this.model.count({ where });
    return count > 0;
  }

  /**
   * Bulk create records
   * @param {Array} records - Array of records to create
   * @param {Object} options - Sequelize query options
   * @returns {Promise<Array>}
   */
  async bulkCreate(records, options = {}) {
    return await this.model.bulkCreate(records, options);
  }

  /**
   * Find with pagination
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Records per page
   * @param {Object} options - Additional Sequelize options
   * @returns {Promise<Object>} { rows, total, pages }
   */
  async paginate(page = 1, limit = 10, options = {}) {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await this.model.findAndCountAll({
      ...options,
      limit,
      offset,
    });

    return {
      rows,
      total: count,
      page,
      pages: Math.ceil(count / limit),
      limit,
    };
  }

  /**
   * Execute raw query with model
   * @param {Function} queryFn - Query function to execute
   * @returns {Promise<*>}
   */
  async executeQuery(queryFn) {
    try {
      return await queryFn(this.model);
    } catch (error) {
      console.error(`❌ Query error in ${this.constructor.name}:`, error);
      throw error;
    }
  }
}

module.exports = BaseRepository;

