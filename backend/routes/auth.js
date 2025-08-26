//rregullat per log in/sign up 
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // ✅ kjo shtohet
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// SIGN UP
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Të gjitha fushat duhen" });

  const hashed = await bcrypt.hash(password, 10);
  const query = "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)";
  db.query(query, [name, email, hashed, role || "user"], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "User u krijua ✅, tash kyçu" });
  });
});

// LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(400).json({ error: "Ska user me ketë email" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Password gabim" });

    // krijo token ku futim id + rolin
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login sukses ✅", token, role: user.role });
  });
});

// DASHBOARD – vetëm admin
router.get('/dashboard', authenticateToken, isAdmin, (req, res) => {
  res.json({ message: "Kjo është dashboard, vetëm admin e sheh 🚀" });
});

module.exports = router;
