const express = require('express');
const { getLists, createList,getProspects, createProspect} = require('../../Controllers/Admin/listControllers');
const router = express.Router();



//list
router.post('/ajouter', createList);
router.get('/afficher', getLists);

//prospect
router.get('/afficher_prospect', getProspects);
router.post('/ajouter_prospect', createProspect);


module.exports = router;
