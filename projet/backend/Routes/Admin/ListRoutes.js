const express = require('express');
const { getLists, createList,getProspects, createProspect,getListById, updateList, softDeleteList,restoreList, getDeletedLists,deleteList} = require('../../Controllers/Admin/listControllers');
const router = express.Router();



//list
router.post('/ajouter', createList);
router.get('/afficher', getLists);
router.get('/getListById/:id',getListById)
router.get('/', getLists);
router.put('/modifier/:id', updateList);
router.delete('/supprimer/:id', deleteList);
router.get('/corbeille', getDeletedLists);
router.post('/restaurer/:id', restoreList); 
router.put('/supprimer/:id', softDeleteList);
//prospect
router.get('/afficher_prospect', getProspects);
router.post('/ajouter_prospect', createProspect);


module.exports = router;
