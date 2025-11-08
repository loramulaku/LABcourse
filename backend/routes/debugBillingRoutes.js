// Debug routes have been removed for safety. If you need a debug helper,
// recreate it locally in a non-shared branch. Keeping debug endpoints in
// the main repository can accidentally bypass authentication.

const express = require('express');
const router = express.Router();

// Respond with 404 to ensure this route cannot be accidentally used.
router.use((req, res) => {
  res.status(404).json({ error: 'Debug routes disabled' });
});

module.exports = router;
