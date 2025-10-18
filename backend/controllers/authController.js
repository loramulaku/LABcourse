const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const bcrypt = require('bcrypt'); // Keep for backward compatibility
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
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

// SIGNUP
exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Të gjitha fushat duhen' });
  }

  // Only allow user role signup
  if (role && role !== 'user') {
    return res.status(400).json({ error: 'Doctor accounts can only be created by admin' });
  }

  try {
    // Create user with Sequelize (hooks will auto-hash with Argon2)
    const user = await User.create({
      name,
      email,
      password, // Will be hashed by beforeCreate hook with Argon2
      role: 'user',
    });
    
    // Create user profile
    await UserProfile.create({
      user_id: user.id,
      profile_image: 'uploads/default.png',
    });
    
    res.json({ 
      message: 'User u krijua, tash kyçu',
      userId: user.id 
    });
  } catch (e) {
    console.error('Signup error:', e);
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Gabim gjatë signup' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user by email using Sequelize
    const user = await User.findOne({ 
      where: { email },
      raw: true 
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Ska user me ketë email' });
    }

    // Verify password - support both Argon2 (new) and bcrypt (legacy)
    let match = false;
    
    if (user.password.startsWith('$argon2')) {
      // New Argon2 hash
      match = await argon2.verify(user.password, password);
    } else if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      // Legacy bcrypt hash
      match = await bcrypt.compare(password, user.password);
      
      // If login successful with bcrypt, rehash with Argon2 for future
      if (match) {
        const newHash = await argon2.hash(password, {
          type: argon2.argon2id,
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 4,
        });
        await User.update(
          { password: newHash },
          { 
            where: { id: user.id },
            hooks: false // Skip hook to avoid double-hashing
          }
        );
        console.log(`[LOGIN] ✅ Migrated user ${user.id} from bcrypt to Argon2`);
      }
    } else {
      // Unknown hash format
      console.log('[LOGIN] ❌ Unknown password hash format');
    }
    
    // Log login attempt using Sequelize
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
        status: user.account_status
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token using Sequelize
    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
    });

    // Set refresh token cookie
    setRefreshCookie(res, refreshToken);
    
    res.json({ 
      message: 'Login sukses', 
      accessToken, 
      role: user.role,
      userId: user.id,
      name: user.name
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Gabim gjatë login' });
  }
};

// REFRESH TOKEN
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    console.log('=== BACKEND REFRESH DEBUG START ===');
    console.log('[REFRESH] Request received at:', new Date().toISOString());
    console.log('[REFRESH] Cookies received:', Object.keys(req.cookies || {}));
    console.log('[REFRESH] Refresh token present:', !!refreshToken);
    console.log('[REFRESH] Token (first 30 chars):', refreshToken ? refreshToken.substring(0, 30) + '...' : 'NONE');
    console.log('[REFRESH] User-Agent:', req.headers['user-agent']?.substring(0, 50) + '...');
    console.log('[REFRESH] Origin:', req.headers.origin);
    console.log('[REFRESH] Referer:', req.headers.referer);
    
    if (!refreshToken) {
      console.log('[REFRESH] ❌ No refresh token in cookies');
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ error: 'Nuk ka refresh token' });
    }

    // Check if refresh token exists in database using Sequelize
    console.log('[REFRESH] Looking up token in database...');
    const tokenRecord = await RefreshToken.findOne({
      where: { token: refreshToken },
      raw: true
    });

    console.log('[REFRESH] Token found in DB:', !!tokenRecord);
    if (tokenRecord) {
      console.log('[REFRESH] Token user ID:', tokenRecord.user_id);
    }

    if (!tokenRecord) {
      console.log('[REFRESH] ❌ Token not found in database');
      res.setHeader('Content-Type', 'application/json');
      return res.status(403).json({ error: 'Refresh token i pavlefshëm' });
    }

    // Verify JWT signature
    console.log('[REFRESH] Verifying JWT signature...');
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
      console.log('[REFRESH] JWT verified successfully');
      console.log('[REFRESH] Payload user ID:', payload.id);
    } catch (err) {
      console.log('[REFRESH] ❌ JWT verification failed:', err.message);
      // Delete invalid token from database using Sequelize
      await RefreshToken.destroy({
        where: { token: refreshToken }
      });
      res.setHeader('Content-Type', 'application/json');
      return res.status(403).json({ error: 'Refresh token skadoi' });
    }

    // Get user info using Sequelize
    console.log('[REFRESH] Looking up user in database...');
    const user = await User.findByPk(payload.id, {
      attributes: ['id', 'role'],
      raw: true
    });

    console.log('[REFRESH] User found:', !!user);
    if (user) {
      console.log('[REFRESH] User ID:', user.id, 'Role:', user.role);
    }

    if (!user) {
      console.log('[REFRESH] ❌ User not found in database');
      res.setHeader('Content-Type', 'application/json');
      return res.status(403).json({ error: 'User jo valid' });
    }
    
    // Generate NEW access token
    console.log('[REFRESH] Generating new access token...');
    const newAccessToken = generateAccessToken(user);
    console.log('[REFRESH] New access token generated');
    
    // Generate NEW refresh token (rotation for security)
    console.log('[REFRESH] Generating new refresh token...');
    const newRefreshToken = generateRefreshToken(user);
    console.log('[REFRESH] New refresh token generated');
    
    // Delete old refresh token and create new one using Sequelize
    console.log('[REFRESH] Deleting old refresh token from database...');
    await RefreshToken.destroy({
      where: { token: refreshToken }
    });

    console.log('[REFRESH] Creating new refresh token in database...');
    await RefreshToken.create({
      user_id: user.id,
      token: newRefreshToken,
    });
    
    // Set new refresh token cookie
    console.log('[REFRESH] Setting new refresh token cookie...');
    setRefreshCookie(res, newRefreshToken);
    
    console.log('[REFRESH] ✅ SUCCESS: Returning new access token');
    console.log('[REFRESH] User ID:', user.id, 'Role:', user.role);
    console.log('[REFRESH] New access token (first 30 chars):', newAccessToken.substring(0, 30) + '...');
    console.log('=== BACKEND REFRESH DEBUG END ===');
    
    // Set explicit headers to prevent CORB issues
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ 
      accessToken: newAccessToken, 
      role: user.role 
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Server error' });
  }
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (refreshToken) {
      // Delete refresh token from database using Sequelize
      await RefreshToken.destroy({
        where: { token: refreshToken }
      });
    }
    
    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      path: '/',
    });
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// GET ME
exports.getMe = (req, res) => {
  res.json({ user: req.user });
};

// TEST COOKIE
exports.testCookie = (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  res.json({ 
    hasCookie: !!refreshToken,
    cookieLength: refreshToken ? refreshToken.length : 0 
  });
};

// GET NAVBAR INFO
exports.getNavbarInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get basic user info using Sequelize
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email'],
      raw: true
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profilePhoto = '/uploads/avatars/default.png';
    let firstName = '';
    let lastName = '';

    if (userRole === 'admin') {
      // Get admin profile info using Sequelize
      const { AdminProfile } = require('../models');
      const adminProfile = await AdminProfile.findOne({
        where: { user_id: userId },
        attributes: ['avatar_path', 'first_name', 'last_name'],
        raw: true
      });

      if (adminProfile && adminProfile.avatar_path && 
          adminProfile.avatar_path !== '/uploads/avatars/default.png') {
        profilePhoto = adminProfile.avatar_path.startsWith('/')
          ? adminProfile.avatar_path
          : `/${adminProfile.avatar_path}`;
        firstName = adminProfile.first_name || '';
        lastName = adminProfile.last_name || '';
      }
    } else {
      // Get user profile info using Sequelize
      const userProfile = await UserProfile.findOne({
        where: { user_id: userId },
        attributes: ['profile_image'],
        raw: true
      });

      if (userProfile && userProfile.profile_image && 
          userProfile.profile_image !== 'uploads/avatars/default.png') {
        profilePhoto = userProfile.profile_image.startsWith('/')
          ? userProfile.profile_image
          : `/${userProfile.profile_image}`;
      }
    }

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
    console.error('Error in navbar-info:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Find user using Sequelize
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'name', 'email'],
      raw: true
    });
    
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent.' });
    }
    
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, action: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Log using Sequelize
    await AuditLog.create({
      user_id: user.id,
      action: 'password_reset_requested',
      details: `Password reset requested for ${email}`,
    });

    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);

    res.json({ 
      message: 'If the email exists, a reset link has been sent.',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.action !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Update password using Sequelize (hooks will auto-hash with Argon2)
    await User.update(
      { password: newPassword },
      { 
        where: { id: decoded.id }
        // hooks enabled - will hash with Argon2
      }
    );

    // Log using Sequelize
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
};

// SECURITY: Validate user role from server-side
exports.validateRole = async (req, res) => {
  try {
    console.log('[AUTH] Role validation request received');
    
    // Get user from token (already validated by middleware)
    const userId = req.user.id;
    
    // Fetch fresh user data from database
    const user = await User.findByPk(userId, {
      attributes: ['id', 'role', 'account_status', 'email']
    });
    
    if (!user) {
      console.log('[AUTH] ❌ User not found for role validation');
      return res.status(401).json({ error: 'User not found' });
    }
    
    if (user.account_status !== 'active') {
      console.log('[AUTH] ❌ User account not active:', user.account_status);
      return res.status(401).json({ error: 'Account not active' });
    }
    
    console.log('[AUTH] ✅ Role validation successful:', user.role);
    
    // Return server-validated role
    res.json({
      role: user.role,
      account_status: user.account_status,
      email: user.email
    });
    
  } catch (error) {
    console.error('[AUTH] ❌ Role validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
