const express = require('express');
const router = express.Router();
const prospectController = require('../../Controllers/Admin/prospectControllers');
const multer = require('multer');

// Setup multer for handling file uploads
const storage = multer.memoryStorage(); // Use memory storage for easy buffer access
const upload = multer({ storage: storage });

// Route to add a new prospect
router.post('/ajouter_prospect', prospectController.addProspect);

// Route to upload leads from a file
router.post('/upload_leads', upload.single('file'), prospectController.uploadLeads);

module.exports = router;