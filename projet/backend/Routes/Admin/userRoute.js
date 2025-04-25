// routes/userRoutes.js
const express = require('express');
const { createUser, getUsers, getUserById, getUsersGroups, updateUser, copyUser, getUserStats, getUserStatistics, getActiveUsersCount } = require('../../Controllers/Admin/User');

const router = express.Router();

// Create user routes
router.post('/create-users', createUser);

// Get all users routes
router.get('/allUsers', getUsers);

// Get user groups
router.get('/users-group', getUsersGroups);

// Get user by id routes
router.get('/getUserById/:userId', getUserById);

// Update user
router.put('/users/:userId', updateUser);

// Copy user route
router.post('/copyUser', copyUser);

// Get user stats routes
router.get('/userStats/:user', getUserStats);

// Get comprehensive user statistics
router.get('/user/:user/stats', getUserStatistics);

// Get active users count
router.get('/active-users-count', getActiveUsersCount);

module.exports = router;