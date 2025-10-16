/**
 * BaseController - Abstract base class for all controllers
 * Provides common HTTP response methods and error handling
 */
class BaseController {
  constructor() {
    if (new.target === BaseController) {
      throw new Error('BaseController is abstract and cannot be instantiated directly');
    }
  }

  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {*} data - Data to send
   * @param {number} statusCode - HTTP status code
   */
  success(res, data, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  /**
   * Send created response (201)
   * @param {Object} res - Express response object
   * @param {*} data - Data to send
   */
  created(res, data) {
    return this.success(res, data, 201);
  }

  /**
   * Send no content response (204)
   * @param {Object} res - Express response object
   */
  noContent(res) {
    return res.status(204).send();
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {Error} error - Error object
   * @param {number} statusCode - HTTP status code
   */
  error(res, error, statusCode = 500) {
    console.error(`❌ Error in ${this.constructor.name}:`, error);

    const response = {
      success: false,
      error: {
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
      },
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      response.error.stack = error.stack;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send bad request response (400)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  badRequest(res, message) {
    return res.status(400).json({
      success: false,
      error: {
        message,
        code: 'BAD_REQUEST',
      },
    });
  }

  /**
   * Send unauthorized response (401)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  unauthorized(res, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      error: {
        message,
        code: 'UNAUTHORIZED',
      },
    });
  }

  /**
   * Send forbidden response (403)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  forbidden(res, message = 'Forbidden') {
    return res.status(403).json({
      success: false,
      error: {
        message,
        code: 'FORBIDDEN',
      },
    });
  }

  /**
   * Send not found response (404)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      error: {
        message,
        code: 'NOT_FOUND',
      },
    });
  }

  /**
   * Send validation error response (422)
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors
   */
  validationError(res, errors) {
    return res.status(422).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
  }

  /**
   * Wrap async route handlers to catch errors
   * @param {Function} fn - Async function to wrap
   */
  asyncHandler(fn) {
    return async (req, res, next) => {
      try {
        await fn.call(this, req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Bind all methods to maintain 'this' context
   */
  bindMethods() {
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
    methods.forEach((method) => {
      if (method !== 'constructor' && typeof this[method] === 'function') {
        this[method] = this[method].bind(this);
      }
    });
  }
}

module.exports = BaseController;

