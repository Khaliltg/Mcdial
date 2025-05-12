const express = require('express');
const router = express.Router();
const {
    getUsersGroups,
    getUserGroupById,
    createUserGroup,
    updateUserGroup,
    deleteUserGroup,
    getUsersByUserGroup,
    getCallTimes,
    getAffectedUsersCount,
    bulkChangeUserGroup,
    getHourlyStats,
    getStatusList
} = require("../../Controllers/Admin/UserGroup");

// Routes pour les groupes d'utilisateurs
router.get('/getUsersGroups', getUsersGroups);
router.get('/getUserGroupById/:id', getUserGroupById);
router.post('/createUserGroup', createUserGroup);
router.put('/updateUserGroup/:id', updateUserGroup);
router.delete('/deleteUserGroup/:id', deleteUserGroup);
router.get('/getUsersByUserGroup/:user_group', getUsersByUserGroup);
router.get('/getCallTimes', getCallTimes);

// Nouvelles routes pour la modification en masse des groupes d'utilisateurs
router.get('/getAffectedUsersCount', getAffectedUsersCount);
router.post('/bulkChangeUserGroup', bulkChangeUserGroup);

// Route pour les statistiques horaires des groupes d'utilisateurs
router.post('/getHourlyStats', getHourlyStats);

// Route pour récupérer la liste des statuts
router.get('/getStatusList', getStatusList);

module.exports = router;