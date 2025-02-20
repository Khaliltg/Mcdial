// routes/userRoutes.js
const express = require('express');
const { createUser,getUsers,getUserById} = require('../../Controllers/Admin/User');
const router = express.Router();
// create user routes
router.post('/create', createUser);
// get all users routes
router.get('/allUsers', getUsers);
// get user by id routes
router.get('/getUserById/:userId', getUserById);

module.exports = router;