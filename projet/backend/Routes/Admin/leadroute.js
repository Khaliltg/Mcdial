const express = require('express');
const router = express.Router();
const prospectController = require('../Controllers/Admin/prospectControllers');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload-leads', upload.single('file'), prospectController.uploadLeads);

module.exports = router;
