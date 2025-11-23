const express = require('express');
const contactController = require('../controllers/contactController');
const router = express.Router();
router.get('/test', contactController.test);
router.post('/send-message', contactController.upload.single('attachment'), contactController.sendMessage);
router.get('/messages', contactController.getMessages);
module.exports = router;
