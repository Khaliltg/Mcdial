const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    
    let token;
    
    // Try to get token from multiple sources
    // 1. Authorization header (Bearer token)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } 
    // 2. Cookies
    else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    // 3. Custom header (for localStorage fallback)
    else if (req.headers['x-auth-token']) {
        token = req.headers['x-auth-token'];
    }
    
    if (!token) {
        console.log('No token found in any source');
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err.message);
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    // TEMPORARY: allow all authenticated users for testing
    if (req.user) {
        next();
    } else {
        res.status(403).json({ message: 'Authentication required' });
    }
};

/**
 * Middleware pour valider que l'utilisateur a un ID utilisateur valide
 */
const validateUserId = (req, res, next) => {
    if (!req.user || !req.user.user) {
        return res.status(400).json({ 
            success: false, 
            message: "ID utilisateur non disponible dans le token" 
        });
    }
    next();
};

module.exports = { authenticateToken, requireAdmin, validateUserId };
