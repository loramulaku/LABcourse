const jwt  = require('jsonwebtoken');
const store = require('../store/inMemory');

// Verifies the Bearer token and attaches req.user.
// Rejects if the token was never issued or was invalidated by logout.
module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.slice(7);
  if (!store.activeTokens.has(token)) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    store.activeTokens.delete(token);
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
};
