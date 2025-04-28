const express = require('express');
const router = express.Router();
const { getRecentAdminLog } = require('../../Controllers/Admin/AdminLog');

// Route to fetch recent admin activity
router.get('/recent-activity', getRecentAdminLog);

module.exports = router;
