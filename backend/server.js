require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

// lidhja me databazë
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});
db.connect(err => {
  if (err) throw err;
  console.log("✅ U lidh me MySQL");
});
global.db = db; // ta përdorim te routes

// rruget e auth (signup/login)
app.use('/api/auth', authRoutes);

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server po punon te porta ${PORT}`));
