// routes/realtime.js
const express = require('express');
const router = express.Router();
const realtimeController = require('../../Controllers/Admin/realtimeController');

router.get('/', realtimeController.getRealtimeReport);

module.exports = router;
