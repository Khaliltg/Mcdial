const {ajouter,recuperer,getById,getCampaignAgents,getCampaignLists,getStatusCountsByList}=require('../../Controllers/Admin/Compagnes')
const express = require('express')
const router =express.Router()

// ajouter une nouvelle compagnie
router.post('/ajouter', ajouter );

//recuperer les compagnies  
router.get('/recuperer', recuperer);

//recuperer une compagnie par id
router.get('/getById/:id', getById);

//recuperer les agents d'une compagnie
router.get('/getCampaignAgents/:campaign_id', getCampaignAgents);

//recuperer les listes d'une compagnie
router.get('/getCampaignLists/:campaign_id', getCampaignLists);

//recuperer le nombre de statuts par liste
router.get('/getStatusCountsByList/:list_ids', getStatusCountsByList);
module.exports = router;