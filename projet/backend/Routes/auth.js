const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /api/auth/logout
 * @desc Logout user by clearing authentication cookies
 * @access Private
 */
router.post('/logout', authenticateToken, (req, res) => {
    try {
        // Clear all authentication cookies
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'none',
            secure: false,
            path: '/',
            domain: 'localhost'
        });
        
        res.clearCookie('user_level', {
            httpOnly: false,
            sameSite: 'none',
            secure: false,
            path: '/',
            domain: 'localhost'
        });
        
        console.log('User logged out successfully');
        res.status(200).json({ success: true, message: 'Déconnexion réussie' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la déconnexion', 
            error: err.message 
        });
    }
});

module.exports = router;
