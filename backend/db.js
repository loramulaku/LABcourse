const mysql = require('mysql2');
require('dotenv').config();

// Use a pooled connection so models can call getConnection() for transactions
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ MySQL connection pool error:', err.message);
  } else {
    console.log('✅ MySQL pool ready');
    conn.release();
  }
});

module.exports = pool;
