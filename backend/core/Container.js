/**
 * Container - Simple Dependency Injection Container
 * 
 * This is a lightweight DI container for managing dependencies.
 * Benefits:
 * - Centralized dependency management
 * - Easy testing (can inject mocks)
 * - Loose coupling between components
 * - Single source of truth for instances
 */
class Container {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
  }

  /**
   * Register a service
   * @param {string} name - Service name
   * @param {Function} factory - Factory function that creates the service
   * @param {boolean} singleton - Whether to create a singleton instance
   */
  register(name, factory, singleton = true) {
    this.services.set(name, { factory, singleton });
  }

  /**
   * Get a service instance
   * @param {string} name - Service name
   * @returns {*} Service instance
   */
  get(name) {
    const service = this.services.get(name);
    
    if (!service) {
      throw new Error(`Service '${name}' not found in container`);
    }

    // Return singleton instance if already created
    if (service.singleton && this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Create new instance
    const instance = service.factory(this);

    // Store singleton
    if (service.singleton) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Check if service exists
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear() {
    this.services.clear();
    this.singletons.clear();
  }

  /**
   * Clear singleton instances (useful for testing)
   */
  clearSingletons() {
    this.singletons.clear();
  }
}

// Create global container instance
const container = new Container();

// Register core services
const UserRepository = require('../repositories/UserRepository');
const RefreshTokenRepository = require('../repositories/RefreshTokenRepository');
const AuditLogRepository = require('../repositories/AuditLogRepository');
const TokenService = require('../services/TokenService');
const AuthService = require('../services/AuthService');
const AuthController = require('../controllers/oop/AuthController');

// Register repositories (singletons)
container.register('UserRepository', () => new UserRepository());
container.register('RefreshTokenRepository', () => new RefreshTokenRepository());
container.register('AuditLogRepository', () => new AuditLogRepository());

// Register services (singletons)
container.register('TokenService', () => new TokenService());
container.register('AuthService', () => new AuthService());

// Register controllers (singletons)
container.register('AuthController', () => new AuthController());

module.exports = container;

