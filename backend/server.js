require('dotenv').config(); // Ngarkon variablat nga .env

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

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

// POST - Shto përdorues të ri
app.post('/api/users', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Emri mungon' });

  const query = 'INSERT INTO users (name) VALUES (?)';
  db.query(query, [name], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User u shtua', id: result.insertId });
  });
});

// Nis serverin në portin nga .env ose default 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveri po dëgjon në portin ${PORT}`);
});
