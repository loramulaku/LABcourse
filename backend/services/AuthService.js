const BaseService = require('../core/BaseService');
const UserRepository = require('../repositories/UserRepository');
const RefreshTokenRepository = require('../repositories/RefreshTokenRepository');
const AuditLogRepository = require('../repositories/AuditLogRepository');
const TokenService = require('./TokenService');
const AuthValidator = require('../validators/AuthValidator');
const { SignupDTO, LoginDTO, UserResponseDTO, AuthResponseDTO } = require('../dto/auth');
const { 
  UnauthorizedError, 
  ConflictError, 
  NotFoundError,
  ForbiddenError 
} = require('../core/errors');

/**
 * AuthService - Handles authentication business logic
 */
class AuthService extends BaseService {
  constructor() {
    super();
    this.userRepository = new UserRepository();
    this.refreshTokenRepository = new RefreshTokenRepository();
    this.auditLogRepository = new AuditLogRepository();
    this.tokenService = new TokenService();
  }

  /**
   * Register new user
   * @param {Object} signupData - Signup data
   * @returns {Promise<Object>} Created user
   */
  async signup(signupData) {
    this.log('Processing signup request');

    // Validate input
    AuthValidator.validateSignup(signupData);

    // Create DTO
    const dto = new SignupDTO(signupData);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    // Only allow 'user' role for self-signup
    if (dto.role && dto.role !== 'user') {
      throw new ForbiddenError('Doctor accounts can only be created by admin');
    }

    // Create user with profile
    const user = await this.userRepository.createWithProfile({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: 'user',
    });

    this.log(`User created successfully: ${user.id}`);

    return UserResponseDTO.fromModel(user);
  }

  /**
   * Login user
   * @param {Object} loginData - Login credentials
   * @param {string} ipAddress - Client IP address
   * @returns {Promise<Object>} Auth response with tokens
   */
  async login(loginData, ipAddress = 'unknown') {
    this.log('Processing login request');

    // Validate input
    AuthValidator.validateLogin(loginData);

    // Create DTO
    const dto = new LoginDTO(loginData);

    // Find user
    const user = await this.userRepository.findByEmail(dto.email);
    
    if (!user) {
      // Log failed attempt
      await this.auditLogRepository.log({
        action: 'login_failed',
        details: `Failed login attempt for email: ${dto.email}`,
        ipAddress,
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(dto.password);

    // Log attempt
    await this.auditLogRepository.log({
      userId: user.id,
      action: isPasswordValid ? 'login_success' : 'login_failed',
      details: `Login attempt from ${ipAddress}`,
      ipAddress,
    });

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account status
    if (user.account_status !== 'active') {
      throw new ForbiddenError(
        `Your account is ${user.account_status}. Please contact admin.`
      );
    }

    // Generate tokens
    const tokens = this.tokenService.generateTokenPair(user);

    // Store refresh token
    await this.refreshTokenRepository.createToken(user.id, tokens.refreshToken);

    this.log(`User logged in successfully: ${user.id}`);

    // Return auth response
    return new AuthResponseDTO({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: UserResponseDTO.fromModel(user),
    });
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    this.log('Processing token refresh');

    if (!refreshToken) {
      throw new UnauthorizedError('No refresh token provided');
    }

    // Check if token exists in database
    const tokenRecord = await this.refreshTokenRepository.findByToken(refreshToken);
    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Verify JWT signature
    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    // Get user
    const user = await this.userRepository.findSafeById(payload.id);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Generate new tokens
    const tokens = this.tokenService.generateTokenPair(user);

    // Rotate refresh token (delete old, create new)
    await this.refreshTokenRepository.rotateToken(
      refreshToken,
      user.id,
      tokens.refreshToken
    );

    this.log(`Token refreshed successfully for user: ${user.id}`);

    return new AuthResponseDTO({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: UserResponseDTO.fromModel(user),
    });
  }

  /**
   * Logout user
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Promise<boolean>}
   */
  async logout(refreshToken) {
    this.log('Processing logout');

    if (refreshToken) {
      await this.refreshTokenRepository.deleteByToken(refreshToken);
      this.log('Refresh token deleted');
    }

    return true;
  }

  /**
   * Get user info by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getUserInfo(userId) {
    const user = await this.userRepository.findWithProfile(userId);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    return UserResponseDTO.fromModel(user);
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<string>} Reset token (in production, send via email)
   */
  async forgotPassword(email) {
    AuthValidator.validateForgotPassword({ email });

    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists for security
      this.log(`Password reset requested for non-existent email: ${email}`);
      return null;
    }

    // Generate reset token
    const resetToken = this.tokenService.generateAccessToken({
      id: user.id,
      action: 'password_reset',
    });

    // Log password reset request
    await this.auditLogRepository.log({
      userId: user.id,
      action: 'password_reset_requested',
      details: `Password reset requested for ${email}`,
    });

    this.log(`Password reset token generated for user: ${user.id}`);

    // TODO: Send email with reset link
    return resetToken;
  }

  /**
   * Reset password
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>}
   */
  async resetPassword(token, newPassword) {
    AuthValidator.validateResetPassword({ token, newPassword });

    // Verify token
    const payload = this.tokenService.verifyAccessToken(token);

    if (payload.action !== 'password_reset') {
      throw new UnauthorizedError('Invalid reset token');
    }

    // Update password
    const user = await this.userRepository.findById(payload.id);
    if (!user) {
      throw new NotFoundError('User');
    }

    await user.update({ password: newPassword });

    // Log password reset
    await this.auditLogRepository.log({
      userId: user.id,
      action: 'password_reset_completed',
      details: `Password reset completed for user ${user.id}`,
    });

    this.log(`Password reset successfully for user: ${user.id}`);

    return true;
  }
}

module.exports = AuthService;

