const {
    ajouter,
    recuperer,
    getById,
    getCampaignAgents,
    getCampaignLists,
    getStatusCountsByList,
    getStatusCountsByCampaign,
    updateStatus,
    createStatus,
    deleteStatus,
    getPauseCodes,
    createPauseCode,
    updatePauseCode,
    deletePauseCode,
    copyCampaign,
    getCampaignListMix,
    addListMix,
    updateListMix,
    deleteListMix,
    reorderListMix,
    updateCampaign,
    getCampaignPauseCodes
} = require('../../Controllers/Admin/Compagnes');

const express = require('express');
const router = express.Router();

// ajouter une nouvelle compagnie
router.post('/ajouter', ajouter);

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

//recurper les satues de la campaign
router.get('/getStatusCountsByCampaign/:campaign_id', getStatusCountsByCampaign);

// mettre à jour un statut
router.put('/updateStatus/:campaign_id/:status', updateStatus);

// créer un nouveau statut
router.post('/createStatus/:campaign_id', createStatus);

// supprimer un statut
router.delete('/deleteStatus/:campaign_id/:status', deleteStatus);

//recuperer le pause code avec l id du campaigne 
router.get('/getPauseCodes/:campaign_id', getPauseCodes);

// ajouter un nouveau code de pause
router.post('/createPauseCode/:campaign_id', createPauseCode);

// mettre à jour un code de pause
router.put('/updatePauseCode/:campaign_id/:pause_code', updatePauseCode);

// supprimer un code de pause
router.delete('/deletePauseCode/:campaign_id/:pause_code', deletePauseCode);

// copier une compagnie
router.post('/copier/:campaign_id', copyCampaign);

// mettre à jour une campagne
router.put('/update/:id', updateCampaign);
// recuperer les pause codes d'une campaign
router.get('/getPauseCodesDetails/:campaign_id', getCampaignPauseCodes);

// ===== ROUTES POUR LIST MIX =====

// récupérer les list mix d'une campagne
router.get('/listMix/:campaign_id', getCampaignListMix);

// ajouter un nouveau list mix
router.post('/listMix/:campaign_id', addListMix);

// mettre à jour un list mix
router.put('/listMix/:campaign_id/:list_id', updateListMix);

// supprimer un list mix
router.delete('/listMix/:campaign_id/:list_id', deleteListMix);

// réorganiser les list mix
router.put('/listMix/:campaign_id/reorder', reorderListMix);

module.exports = router;