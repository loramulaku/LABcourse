const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

// Helpers
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } // pak më gjatë
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRES_IN || '1d' } // zakonisht ditë
  );
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // dev: false, prod: true
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/', 
  });
}

// SIGN UP
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) 
    return res.status(400).json({ error: 'Të gjitha fushat duhen' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)';
    db.query(query, [name, email, hashed, role || 'user'], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'User u krijua, tash kyçu' });
    });
  } catch (e) {
    res.status(500).json({ error: 'Gabim gjatë signup' });
  }
});

// LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';

  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(400).json({ error: 'Ska user me ketë email' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Password gabim' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    db.query('INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)',
      [user.id, refreshToken],
      (e2) => {
        if (e2) return res.status(500).json({ error: e2.message });
        setRefreshCookie(res, refreshToken);
        res.json({ message: 'Login sukses', accessToken, role: user.role });
      }
    );
  });
});

// REFRESH
router.post('/refresh', (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'Nuk ka refresh token' });

  db.query('SELECT * FROM refresh_tokens WHERE token = ?', [refreshToken], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(403).json({ error: 'Refresh token i pavlefshëm' });

    jwt.verify(refreshToken, process.env.REFRESH_SECRET, (e2, payload) => {
      if (e2) return res.status(403).json({ error: 'Refresh token skadoi' });

      const q = 'SELECT id, role FROM users WHERE id = ? LIMIT 1';
      db.query(q, [payload.id], (e3, r2) => {
        if (e3 || r2.length === 0) return res.status(403).json({ error: 'User jo valid' });

        const user = r2[0];
        const newAccess = generateAccessToken(user);

        // ROTATE refresh token
        const newRefresh = generateRefreshToken(user);
        db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken], () => {
          db.query('INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)', [user.id, newRefresh], () => {
            setRefreshCookie(res, newRefresh);
            // 👉 tani kthejmë edhe rolin bashkë me token
            return res.json({ accessToken: newAccess, role: user.role });
          });
        });
      });
    });
  });
});

// LOGOUT
router.post("/logout", (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    db.query("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken], () => {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
      });
      return res.json({ message: "Logout successful" });
    });
  } else {
    return res.json({ message: "Logout successful" });
  }
});

// Rrugë e mbrojtur vetëm për admin
router.get('/dashboard', authenticateToken, isAdmin, (req, res) => {
  res.json({ message: 'Kjo është dashboard, vetëm admin e sheh' });
});

// Info user-i nga access token
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
