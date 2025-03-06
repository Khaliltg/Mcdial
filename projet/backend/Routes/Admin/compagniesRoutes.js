const {ajouter,recuperer,getById,getCampaignAgents}=require('../../Controllers/Admin/Compagnes')
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


module.exports = router;