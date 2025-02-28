const {ajouter,recuperer}=require('../../Controllers/Admin/Compagnes')
const express = require('express')
const router =express.Router()

// ajouter une nouvelle compagnie
router.post('/ajouter', ajouter );

//recuperer les compagnies  
router.get('/recuperer', recuperer);

module.exports = router;