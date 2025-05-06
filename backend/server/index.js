const express = require('express');
const cors = require('cors');
const { pool, poolConnect } = require('./db');
const app = express(); // ← kjo është pjesa që mungon

app.use(cors());
app.use(express.json());
app.get('/api/pacientet', async (req, res) => {
    console.log(">> Kërkesë për pacientet");
    try {
      await poolConnect;
      const result = await pool.request().query('SELECT * FROM Pacientet');
      res.json(result.recordset);
    } catch (err) {
      console.error('Gabim në API:', err.message);
      res.status(500).json({ error: 'Gabim serveri' });
    }
  });
  
  app.listen(3001, () => {
    console.log('Serveri po punon në portën 3001');
  });
  