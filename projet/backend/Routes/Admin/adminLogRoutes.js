const express = require('express');
const router = express.Router();
const adminLogController = require('../../Controllers/Admin/AdminLogController');

// Route to get recent activities
router.get('/recent-activities', adminLogController.getRecentActivities);

module.exports = router;
