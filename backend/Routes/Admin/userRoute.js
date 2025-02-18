// routes/userRoutes.js
const express = require('express');
const { createUser,getUsers} = require('../../Controllers/Admin/User');
const router = express.Router();
// create user routes
router.post('/create', createUser);
// get all users routes
router.get('/allUsers', getUsers);

module.exports = router;