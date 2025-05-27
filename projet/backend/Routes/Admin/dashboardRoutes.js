const express = require('express');
const router = express.Router();
const DashboardController = require('../../Controllers/Admin/DashboardController'); // Assurez-vous que le chemin est correct

router.get('/realtime-data', DashboardController.getRealtimeStats);

module.exports = router;
