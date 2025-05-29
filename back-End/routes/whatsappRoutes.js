const express = require('express');
const router = express.Router();
const { sendWhatsAppMessage } = require('../controllers/whatsappController');

console.log('Loading whatsappRoutes.js');
console.log('sendWhatsAppMessage:', sendWhatsAppMessage); // Should log [Function: asyncUtilWrap]

router.post('/send-whatsapp/:id', sendWhatsAppMessage);

module.exports = router;