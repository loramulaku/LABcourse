const BaseController = require('../../core/BaseController');
const AuthService = require('../../services/AuthService');
const TokenService = require('../../services/TokenService');
const { AppError } = require('../../core/errors');

/**
 * AuthController - Handles HTTP requests for authentication
 * 
 * This is a clean, object-oriented controller that:
 * - Extends BaseController for common HTTP methods
 * - Uses AuthService for business logic
 * - Uses DTOs for data transfer
 * - Has proper error handling
 * - Follows single responsibility principle
 */
class AuthController extends BaseController {
  constructor() {
    super();
    this.authService = new AuthService();
    this.tokenService = new TokenService();
    
    // Bind methods to maintain 'this' context
    this.bindMethods();
  }

  /**
   * Handle user signup
   * POST /api/auth/signup
   */
  async signup(req, res) {
    try {
      const userResponse = await this.authService.signup(req.body);
      
      return this.created(res, {
        message: 'User created successfully',
        user: userResponse,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * Handle user login
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const authResponse = await this.authService.login(req.body, req.ip);
      
      // Set refresh token cookie
      this.tokenService.setRefreshCookie(res, authResponse.refreshToken);
      
      // Return public response (without refresh token in body)
      return this.success(res, {
        message: 'Login successful',
        accessToken: authResponse.accessToken,
        user: authResponse.user,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * Handle token refresh
   * POST /api/auth/refresh
   */
  async refresh(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      
      const authResponse = await this.authService.refreshToken(refreshToken);
      
      // Set new refresh token cookie
      this.tokenService.setRefreshCookie(res, authResponse.refreshToken);
      
      return this.success(res, {
        accessToken: authResponse.accessToken,
        user: authResponse.user,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * Handle user logout
   * POST /api/auth/logout
   */
  async logout(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      
      await this.authService.logout(refreshToken);
      
      // Clear refresh token cookie
      this.tokenService.clearRefreshCookie(res);
      
      return this.success(res, {
        message: 'Logout successful',
      });
    } catch (error) {
      return this.error(res, error);
    }
  }

  /**
   * Get current user info
   * GET /api/auth/me
   */
  async getMe(req, res) {
    try {
      const userResponse = await this.authService.getUserInfo(req.user.id);
      
      return this.success(res, {
        user: userResponse,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * Get navbar info (profile photo, name, role)
   * GET /api/auth/navbar-info
   */
  async getNavbarInfo(req, res) {
    try {
      // Simplified version - can be enhanced
      const userResponse = await this.authService.getUserInfo(req.user.id);
      
      return this.success(res, {
        id: userResponse.id,
        name: userResponse.name,
        email: userResponse.email,
        role: userResponse.role,
        profilePhoto: '/uploads/avatars/default.png', // Can be enhanced
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const resetToken = await this.authService.forgotPassword(req.body.email);
      
      // In production, send email instead
      const response = {
        message: 'If the email exists, a reset link has been sent.',
      };

      // In development, include token
      if (process.env.NODE_ENV === 'development' && resetToken) {
        response.resetToken = resetToken;
      }
      
      return this.success(res, response);
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * Reset password
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      await this.authService.resetPassword(req.body.token, req.body.newPassword);
      
      return this.success(res, {
        message: 'Password reset successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return this.error(res, error, error.statusCode);
      }
      return this.error(res, error);
    }
  }

  /**
   * Test cookie functionality
   * GET /api/auth/test-cookie
   */
  testCookie(req, res) {
    console.log('\n🧪 === COOKIE TEST ENDPOINT ===');
    console.log('📧 All cookies received:', req.cookies);
    console.log('===========================\n');

    // Set a test cookie
    res.cookie('testCookie', 'testValue123', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60000,
      path: '/',
    });

    return this.success(res, {
      message: 'Cookie test endpoint',
      cookiesReceived: req.cookies,
      testCookieSet: true,
    });
  }
}

module.exports = AuthController;

