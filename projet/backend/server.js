require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./config/bd'); // Database connection
const AdminRoute = require('./Routes/Admin/userRoute');
const listRoutes = require('./Routes/Admin/listRoutes');
const phoneRoutes = require('./Routes/Admin/phoneRoutes');
const compagnieRoutes = require('./Routes/Admin/compagniesRoutes');
const prospectRoute = require('./Routes/Admin/prospects');
const UserGroupRoute = require('./Routes/Admin/UserGroupeRoute');
const carrierRoute = require('./Routes/Admin/carriersroute');
const serveurRoute = require('./Routes/Admin/serverRoute');
const app = express();
const loginRoute = require('./Routes/login');
const authRoute = require('./Routes/auth');
const { authenticateToken, requireAdmin } = require('./middleware/auth');
const PORT = process.env.PORT || 8000; // Default to 8000 if PORT is not set
const conferencesRoutes = require('./Routes/Admin/conferencesroute');
const adminLogRoutes = require('./Routes/Admin/adminLogRoutes');
const agentAuthRoutes = require('./Routes/Agent/authRoutes');
const agentRoutes = require('./Routes/Agent/agentRoutes');
const agentCallRoutes = require('./Routes/Agent/callRoutes');
const callCardRoutes = require('./Routes/Agent/callCardRoutes');
// Vicidial routes ont été supprimées

// CORS configuration for cross-origin requests with credentials
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'], // Support both admin and agent frontends
    credentials: true, // Critical for cookies to be accepted
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'x-auth-token'],
    exposedHeaders: ['Set-Cookie'], // Allow Set-Cookie to be exposed
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Allows parsing of urlencoded bodies

// Authentication routes
app.use('/api/login', loginRoute);
app.use('/api/auth', authRoute);

// Agent routes
app.use('/api/agent/auth', agentAuthRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/agent/calls', authenticateToken, agentCallRoutes);
// Register call routes directly under /api/agent as well for backward compatibility
app.use('/api/agent', authenticateToken, agentCallRoutes);
app.use('/api/callcard', authenticateToken, callCardRoutes);

// Route de test pour Vicidial a été supprimée

// Route de test pour Vicidial a été supprimée

// Vicidial routes ont été supprimées

// Protected routes
app.use('/api/conferences', authenticateToken, conferencesRoutes);
app.use('/api/lists', authenticateToken, listRoutes);
app.use('/api/prospects', authenticateToken, prospectRoute);
app.use('/api/admin/user', authenticateToken, requireAdmin, AdminRoute);
app.use('/api/admin/phone', authenticateToken, requireAdmin, phoneRoutes);
app.use('/api/admin/compagnies', authenticateToken, requireAdmin, compagnieRoutes);
app.use('/api/admin/usergroup', authenticateToken, requireAdmin, UserGroupRoute);
app.use('/api/admin/logs', authenticateToken, adminLogRoutes);
app.use('/api/carriers', authenticateToken, requireAdmin, carrierRoute);
app.use('/api/servers', authenticateToken, requireAdmin, serveurRoute);

// Middleware for error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});