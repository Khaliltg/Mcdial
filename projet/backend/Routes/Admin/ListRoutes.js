const express = require('express');
const router = express.Router();
const listControllers = require('../../Controllers/Admin/listControllers');

// Routes pour les listes
router.post('/ajouter', listControllers.createList);
router.get('/afficher', listControllers.getLists);
router.get('/campaigns', listControllers.getCampaigns);
router.get('/corbeille', listControllers.getDeletedLists);
router.get('/getListById/:id', listControllers.getListDetails);
router.delete('/supprimer/:id', listControllers.deleteList);
router.put('/restaurer/:id', listControllers.restoreList);
router.put('/modifier/:id', listControllers.updateList);
router.get('/files/:id', listControllers.getListFiles);

module.exports = router;
