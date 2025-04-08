const express = require('express');
const router = express.Router();
const listControllers = require('../../Controllers/Admin/listControllers');
const uploadLeadsController = require('../../Controllers/Admin/prospectControllers');
const multer = require('multer');

// Setup multer for handling file uploads
const storage = multer.memoryStorage(); // Use memory storage for easy buffer access
const upload = multer({ storage: storage }).single('file'); // Expect a single file with the name 'file'

// Routes for managing lists
router.post('/ajouter', listControllers.createList);
router.get('/afficher', listControllers.getLists);
router.get('/campaigns', listControllers.getCampaigns);
router.get('/corbeille', listControllers.getDeletedLists);
router.get('/getListById/:id', listControllers.getListDetails);
router.delete('/supprimer/:id', listControllers.deleteList);
router.put('/restaurer/:id', listControllers.restoreList);
router.put('/modifier/:id', listControllers.updateList);
router.get('/files/:id', listControllers.getListFiles);

// Route for uploading leads
router.post('/upload_leads', upload, uploadLeadsController.uploadLeads); // Use multer for file uploads

router.delete('/supprimer-definitivement/:id', listControllers.deleteListPermanently);

module.exports = router;