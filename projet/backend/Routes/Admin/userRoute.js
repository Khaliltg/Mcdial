// routes/userRoutes.js
const express = require('express');
const { createUser,getUsers,getUserById,getUsersGroups,updateUser} = require('../../Controllers/Admin/User');
//const userController = require('../controllers/Admin/User');

const router = express.Router();
// create user routes


router.post('/create-users',createUser );

router.get( '/users-group', getUsersGroups);

// get all users routes
router.get('/allUsers', getUsers);
// get user by id routes
router.get('/getUserById/:userId', getUserById);

router.put('/users/:userId', updateUser);

module.exports = router;