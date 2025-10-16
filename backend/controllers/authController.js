const jwt = require('jsonwebtoken');
const { User, UserProfile, RefreshToken, AuditLog } = require('../models');

// Helper functions
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRES_IN || '7d' }
  );
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  console.log('🍪 Refresh token cookie set');
}

// Controllers
const authController = {
  // SIGNUP - Only for regular users
  async signup(req, res) {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Të gjitha fushat duhen' });
    }

    // Only allow user role signup, doctors are added by admin
    if (role && role !== 'user') {
      return res.status(400).json({ error: 'Doctor accounts can only be created by admin' });
    }

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Create user (password will be hashed automatically by model hook)
      const user = await User.create({
        name,
        email,
        password,
        role: 'user',
      });

      // Create user profile entry
      await UserProfile.create({
        user_id: user.id,
        profile_image: 'uploads/default.png',
      });

      res.json({
        message: 'User u krijua, tash kyçu',
        userId: user.id,
      });
    } catch (error) {
      console.error('Signup error:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Gabim gjatë signup' });
    }
  },

  // LOGIN
  async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        // Log failed attempt
        await AuditLog.create({
          action: 'login_failed',
          details: `Failed login attempt for email: ${email} from ${req.ip || 'unknown'}`,
          ip_address: req.ip || 'unknown',
        });
        return res.status(400).json({ error: 'Ska user me ketë email' });
      }

      const match = await user.verifyPassword(password);

      // Log login attempt
      await AuditLog.create({
        user_id: user.id,
        action: match ? 'login_success' : 'login_failed',
        details: `Login attempt from ${req.ip || 'unknown'}`,
        ip_address: req.ip || 'unknown',
      });

      if (!match) {
        return res.status(400).json({ error: 'Password gabim' });
      }

      // Check account status
      if (user.account_status !== 'active') {
        return res.status(403).json({
          error: `Your account is ${user.account_status}. Please contact admin.`,
          status: user.account_status,
        });
      }

      console.log('✅ Password match, generating tokens for user:', user.id);

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      console.log('🔑 Access token generated (expires in', process.env.JWT_EXPIRES_IN || '15m', ')');
      console.log('🔑 Refresh token generated (expires in', process.env.REFRESH_EXPIRES_IN || '7d', ')');

      // Store refresh token
      await RefreshToken.create({
        user_id: user.id,
        token: refreshToken,
      });

      console.log('✅ Refresh token stored in database');

      setRefreshCookie(res, refreshToken);
      console.log('📤 Sending login response with access token');

      res.json({
        message: 'Login sukses',
        accessToken,
        role: user.role,
        userId: user.id,
        name: user.name,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Gabim gjatë login' });
    }
  },

  // REFRESH TOKEN
  async refresh(req, res) {
    console.log('\n🔄 ===== REFRESH TOKEN REQUEST =====');
    console.log('📧 Cookies received:', req.cookies);

    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      console.log('❌ No refresh token found in cookies');
      return res.status(401).json({ error: 'Nuk ka refresh token' });
    }

    console.log('✅ Refresh token found in cookie');

    try {
      // Check if token exists in database
      const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshToken },
      });

      if (!tokenRecord) {
        console.log('❌ Refresh token not found in database');
        return res.status(403).json({ error: 'Refresh token i pavlefshëm' });
      }

      console.log('✅ Refresh token found in database for user:', tokenRecord.user_id);

      // Verify JWT signature
      const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
      console.log('✅ JWT verified, payload:', payload);

      // Get user from database
      const user = await User.findByPk(payload.id);

      if (!user) {
        console.log('❌ User not found');
        return res.status(403).json({ error: 'User jo valid' });
      }

      console.log('✅ User found:', user.id, 'Role:', user.role);

      // Generate new tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      console.log('🔄 Rotating refresh token...');

      // Delete old refresh token and store new one
      await tokenRecord.destroy();
      await RefreshToken.create({
        user_id: user.id,
        token: newRefreshToken,
      });

      console.log('✅ Refresh token rotated successfully');

      setRefreshCookie(res, newRefreshToken);
      console.log('===== REFRESH TOKEN SUCCESS =====\n');

      res.json({
        accessToken: newAccessToken,
        role: user.role,
      });
    } catch (error) {
      console.error('❌ Refresh error:', error.message);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(403).json({ error: 'Refresh token skadoi' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  // LOGOUT
  async logout(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        // Delete refresh token from database
        await RefreshToken.destroy({
          where: { token: refreshToken },
        });
        console.log('✅ Refresh token deleted from database');
      }

      // Clear the refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/',
      });

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  },

  // GET USER INFO
  async getMe(req, res) {
    res.json({ user: req.user });
  },

  // GET NAVBAR INFO
  async getNavbarInfo(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // Get basic user info
      const user = await User.findByPk(userId, {
        attributes: ['id', 'name', 'email'],
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let profilePhoto = '/uploads/avatars/default.png';
      let firstName = '';
      let lastName = '';

      if (userRole === 'admin') {
        // Get admin profile info
        const { AdminProfile } = require('../models');
        const adminProfile = await AdminProfile.findOne({
          where: { user_id: userId },
        });

        if (
          adminProfile &&
          adminProfile.avatar_path &&
          adminProfile.avatar_path !== '/uploads/avatars/default.png'
        ) {
          profilePhoto = adminProfile.avatar_path.startsWith('/')
            ? adminProfile.avatar_path
            : `/${adminProfile.avatar_path}`;
          firstName = adminProfile.first_name || '';
          lastName = adminProfile.last_name || '';
        }
      } else {
        // Get user profile info
        const userProfile = await UserProfile.findOne({
          where: { user_id: userId },
        });

        if (
          userProfile &&
          userProfile.profile_image &&
          userProfile.profile_image !== 'uploads/avatars/default.png'
        ) {
          profilePhoto = userProfile.profile_image.startsWith('/')
            ? userProfile.profile_image
            : `/${userProfile.profile_image}`;
          console.log(`📸 Found user profile image: ${profilePhoto}`);
        }
      }

      console.log(`🔍 Navbar info for user ${userId} (${userRole}):`, {
        userId,
        userRole,
        profilePhoto,
      });

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole,
        profilePhoto,
        firstName,
        lastName,
      });
    } catch (err) {
      console.error('❌ Error in navbar-info:', err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // FORGOT PASSWORD
  async forgotPassword(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: 'If the email exists, a reset link has been sent.' });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { id: user.id, email: user.email, action: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Log password reset request
      await AuditLog.create({
        user_id: user.id,
        action: 'password_reset_requested',
        details: `Password reset requested for ${email}`,
      });

      // TODO: Send email with reset link
      console.log(`Password reset token for ${email}: ${resetToken}`);
      console.log(
        `Reset URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
      );

      res.json({
        message: 'If the email exists, a reset link has been sent.',
        // Remove this in production - only for development
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      });
    } catch (error) {
      console.error('Error in forgot password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // RESET PASSWORD
  async resetPassword(req, res) {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.action !== 'password_reset') {
        return res.status(400).json({ error: 'Invalid reset token' });
      }

      // Update password (will be hashed automatically by model hook)
      await User.update(
        { password: newPassword },
        { where: { id: decoded.id }, individualHooks: true }
      );

      // Log password reset
      await AuditLog.create({
        user_id: decoded.id,
        action: 'password_reset_completed',
        details: `Password reset completed for user ${decoded.id}`,
      });

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      console.error('Error resetting password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // TEST COOKIE
  testCookie(req, res) {
    console.log('\n🧪 === COOKIE TEST ENDPOINT ===');
    console.log('📧 All cookies received:', req.cookies);
    console.log('📧 Cookie header:', req.headers.cookie);
    console.log('===========================\n');

    // Set a test cookie
    res.cookie('testCookie', 'testValue123', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60000, // 1 minute
      path: '/',
    });

    res.json({
      message: 'Cookie test endpoint',
      cookiesReceived: req.cookies,
      cookieHeader: req.headers.cookie,
      testCookieSet: true,
    });
  },
};

module.exports = authController;

