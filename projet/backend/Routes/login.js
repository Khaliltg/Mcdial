const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/bd');

// Adjust table/column names as needed
router.post('/', async (req, res) => {
    const { user, pass } = req.body;
    if (!user || !pass) {
        return res.status(400).json({ message: 'User and password required' });
    }
    try {
        // Query user by username from vicidial_users
        const [rows] = await db.query('SELECT * FROM vicidial_users WHERE user = ?', [user]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const foundUser = rows[0];
        // Compare password (plain text)
        const valid = pass === foundUser.pass;
        if (!valid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Create JWT
        const token = jwt.sign({
            id: foundUser.id,
            user: foundUser.user,
            user_level: foundUser.user_level
        }, process.env.JWT_SECRET, { expiresIn: '8h' });
        // Set the token as an HTTP-only cookie for authentication
res.cookie('token', token, {
  httpOnly: true,
  maxAge: 28800 * 1000, // 8 hours
  sameSite: 'none', // Required for cross-origin
  secure: false, // Must be false for localhost HTTP
  path: '/', // Ensure cookie is sent to all paths
  domain: 'localhost' // Explicitly set domain for localhost
});

// Set user_level cookie (not httpOnly so frontend can read it)
res.cookie('user_level', foundUser.user_level.toString(), {
  httpOnly: false,
  maxAge: 28800 * 1000,
  sameSite: 'none',
  secure: false,
  path: '/',
  domain: 'localhost'
});

// Log the cookies being set
console.log('Setting cookies:', {
  token: token.substring(0, 10) + '...',
  user_level: foundUser.user_level
});
res.json({ token, user_level: foundUser.user_level });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack });
    }
});

module.exports = router;
