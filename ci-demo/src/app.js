// App factory — does NOT call .listen() so supertest can mount it directly.
const express = require('express');

function createApp() {
  const app = express();
  app.use(express.json());

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/shop', require('./routes/shop'));

  app.get('/health', (req, res) => res.json({ status: 'OK' }));

  return app;
}

module.exports = createApp;
