const express = require('express');
const router = express.Router();
const { getTimeclockReport } = require('../../Controllers/Admin/timeclockController');

router.get('/get', getTimeclockReport);

module.exports = router;
