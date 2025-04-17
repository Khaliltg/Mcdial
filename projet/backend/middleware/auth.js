const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // Debug logging
    console.log('COOKIES:', req.cookies);
    console.log('AUTH HEADER:', req.headers['authorization']);
    console.log('X-AUTH-TOKEN:', req.headers['x-auth-token']);
    
    let token;
    
    // Try to get token from multiple sources
    // 1. Authorization header (Bearer token)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log('Using token from Authorization header');
    } 
    // 2. Cookies
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
        console.log('Using token from cookies');
    }
    // 3. Custom header (for localStorage fallback)
    else if (req.headers['x-auth-token']) {
        token = req.headers['x-auth-token'];
        console.log('Using token from X-Auth-Token header');
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
        console.log('Token verified successfully for user:', user.user);
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

module.exports = { authenticateToken, requireAdmin };
