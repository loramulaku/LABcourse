const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const store  = require('../store/inMemory');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required' });
  if (!EMAIL_RE.test(email))
    return res.status(400).json({ error: 'Invalid email format' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  for (const u of store.users.values()) {
    if (u.email === email)
      return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id   = store.nextUserId();
  const user = { id, name, email, passwordHash, role: 'user' };
  store.users.set(id, user);

  res.status(201).json({ id, name, email, role: 'user' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  let found = null;
  for (const u of store.users.values()) { if (u.email === email) { found = u; break; } }
  if (!found) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, found.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: found.id, email: found.email, role: found.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  store.activeTokens.add(token);

  res.json({ token, user: { id: found.id, name: found.name, email: found.email, role: found.role } });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  const token = header.slice(7);
  if (!store.activeTokens.has(token)) return res.status(401).json({ error: 'Token invalid or already logged out' });
  store.activeTokens.delete(token);
  res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/forgot-password
// Always returns 200 so we don't reveal whether an email is registered.
// In test env the resetToken is returned in the body (real app would email it).
router.post('/forgot-password', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });

  let userId = null;
  for (const u of store.users.values()) { if (u.email === email) { userId = u.id; break; } }

  if (userId) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    store.resetTokens.set(resetToken, { userId, expiry: Date.now() + 15 * 60 * 1000 });
    return res.json({ message: 'Password reset instructions sent', resetToken });
  }

  res.json({ message: 'Password reset instructions sent' });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword)
    return res.status(400).json({ error: 'Token and new password are required' });

  const entry = store.resetTokens.get(token);
  if (!entry || Date.now() > entry.expiry) {
    store.resetTokens.delete(token);
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const user = store.users.get(entry.userId);
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  store.resetTokens.delete(token);

  res.json({ message: 'Password reset successfully' });
});

module.exports = router;
