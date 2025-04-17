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
    bulkChangeUserGroup
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

module.exports = router;