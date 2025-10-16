/**
 * BaseDTO - Base class for Data Transfer Objects
 * DTOs define the shape of data transferred between layers
 */
class BaseDTO {
  /**
   * Create DTO from plain object
   * @param {Object} data - Raw data
   */
  constructor(data = {}) {
    this.fromObject(data);
  }

  /**
   * Populate DTO from object - to be implemented by subclasses
   * @param {Object} data - Raw data
   */
  fromObject(data) {
    throw new Error('fromObject() must be implemented by subclass');
  }

  /**
   * Convert DTO to plain object
   * @returns {Object}
   */
  toObject() {
    const obj = {};
    for (const key in this) {
      if (this.hasOwnProperty(key) && this[key] !== undefined) {
        obj[key] = this[key];
      }
    }
    return obj;
  }

  /**
   * Convert to JSON
   * @returns {Object}
   */
  toJSON() {
    return this.toObject();
  }

  /**
   * Validate DTO - to be implemented by subclasses if needed
   * @throws {ValidationError}
   */
  validate() {
    // Override in subclasses if validation is needed
  }
}

module.exports = BaseDTO;

