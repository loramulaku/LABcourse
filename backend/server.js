require('dotenv').config(); // Ngarkon variablat nga .env

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const app = express();
app.use(cors());
app.use(express.json());

// Krijo lidhjen me MySQL duke përdorur variablat nga .env
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect(err => {
  if (err) {
    console.error('Gabim në lidhjen me DB:', err);
    process.exit(1); // Ndal serverin nëse nuk lidhet me DB
  }
  console.log('U lidh me sukses me MySQL!');
});

// Endpoint për test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend po funksionon!' });
});

// GET - Merr përdoruesit
app.get('/api/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST - Shto user të ri (dinamik)
app.post('/api/users', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Të gjitha fushat janë të detyrueshme" });
  }

  try {
    // hash password me bcrypt
    const hashedPassword = await bcrypt.hash(password, 10); // hash i passwordit

    const query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    db.query(query, [name, email, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ message: "User u krijua me sukses ✅", id: result.insertId });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// testo nese paswordi nuk dergohet ne frontend
app.get('/api/users', (req, res) => {
  db.query('SELECT id, name, email FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
// api per login 
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Të gjitha fushat janë të detyrueshme" });
  }

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(400).json({ error: "User-i nuk ekziston" });
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Password-i është gabim" });
    }

    // gjenero JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ message: "Login i suksesshëm ✅", token });
  });
});
//Middleware per JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) return res.status(401).json({ error: 'Access denied, no token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalid or expired' });

    req.user = user; // ruaj info të user-it për përdorim më vonë
    next();
  });
};

// Endpoint i mbrojtur me JWT
app.get('/api/users', authenticateToken, (req, res) => {
  const query = 'SELECT id, name, email FROM users';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Nis serverin në portin nga .env ose default 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveri po dëgjon në portin ${PORT}`);
});
