require('dotenv').config();

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt';
const JWT_EXPIRE_PHONE = '1h'; // Durée de vie du token téléphone
const JWT_EXPIRE_USER = '24h'; // Durée de vie du token utilisateur

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const connection = require('./config/bd'); // Database connection

// Middleware d'erreur global
const errorHandler = (err, req, res, next) => {
    console.error('Erreur:', err);
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Session expirée',
            error: 'Le token JWT a expiré',
            details: err
        });
    }

    res.status(500).json({
        message: 'Erreur serveur',
        error: err.message
    });
};

// Application
const app = express();
app.use(errorHandler); // Utiliser le middleware d'erreur global

// Routes
const AdminRoute = require('./Routes/Admin/userRoute');
const listRoutes = require('./Routes/Admin/listRoutes');
const phoneRoutes = require('./Routes/Admin/phoneRoutes');
const compagnieRoutes = require('./Routes/Admin/compagniesRoutes');
const prospectRoute = require('./Routes/Admin/prospects');
const UserGroupRoute = require('./Routes/Admin/UserGroupeRoute');
const carrierRoute = require('./Routes/Admin/carriersroute');
const serveurRoute = require('./Routes/Admin/serverRoute');
const conferencesRoutes = require('./Routes/Admin/conferencesroute');
const adminLogRoutes = require('./Routes/Admin/adminLogRoutes');
const agentAuthRoutes = require('./Routes/Agent/authRoutes');
const agentRoutes = require('./Routes/Agent/agentRoutes');
const agentCallRoutes = require('./Routes/Agent/callRoutes');
const callCardRoutes = require('./Routes/Agent/callCardRoutes');
const endCallRoute = require('./Routes/Agent/endCallRoute');
const sipRoutes = require('./Routes/Agent/sipRoutes');
const sipStatusRoutes = require('./Routes/Agent/sipStatusRoutes');
const predictiveRoutes = require('./Routes/Agent/predictiveRoutes');
const syncRoutes = require('./Routes/Agent/syncRoutes');
const agentTimeRoutes = require('./Routes/Admin/agentTimeRoutes');
const timeclockRoutes = require('./Routes/Admin/timeclockRoutes');
const realtimeRoute = require('./Routes/Admin/realtimeRoute');
const loginRoute = require('./Routes/login');
const authRoute = require('./Routes/auth');
const { authenticateToken, requireAdmin } = require('./middleware/auth');

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
    credentials: true,
  },
});

// Middlewares
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
app.use(express.static('public'));

// Authentication routes
app.use('/api/login', loginRoute);
app.use('/api/auth', authRoute);

// Agent routes
app.use('/api/agent/auth', agentAuthRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/agent/calls', authenticateToken, agentCallRoutes);
app.use('/api/agent/sip', authenticateToken, sipRoutes);
app.use('/api/agent/sip-status', authenticateToken, sipStatusRoutes);
app.use('/api/predictive', authenticateToken, predictiveRoutes);
app.use('/api/agent/sync', authenticateToken, syncRoutes);
// Register call routes directly under /api/agent as well for backward compatibility
app.use('/api/agent', authenticateToken, agentCallRoutes);
app.use('/api/agent/end-call', authenticateToken, endCallRoute);
app.use('/api/callcard', authenticateToken, callCardRoutes);
app.use('/api/agent-time', authenticateToken, agentTimeRoutes);
app.use('/api/timeclock', authenticateToken, timeclockRoutes);

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
app.use('/api/realtime', authenticateToken, requireAdmin, realtimeRoute);

// WebSocket - Envoi des données en temps réel toutes les 5 secondes
io.on('connection', (socket) => {
  console.log('🟢 Client WebSocket connecté');

  const interval = setInterval(async () => {
    try {
      const [agents] = await connection.query(`
        SELECT 
          vla.user,
          vu.full_name,
          vla.status,
          vla.campaign_id,
          vla.extension AS station,
          vla.calls_today,
          vla.last_state_change,
          TIMESTAMPDIFF(SECOND, vla.last_state_change, NOW()) AS seconds_in_status
        FROM vicidial_live_agents vla
        JOIN vicidial_users vu ON vu.user = vla.user
        WHERE vla.status IN ('READY', 'INCALL', 'PAUSED', 'WAITING')
      `);

      const [hopper] = await connection.query(`
        SELECT COUNT(*) AS leads_in_hopper FROM vicidial_hopper
      `);

      socket.emit('realtime-update', {
        agents,
        hopper: hopper[0],
      });
    } catch (err) {
      console.error('Erreur WebSocket :', err);
    }
  }, 5000);

  socket.on('disconnect', () => {
    console.log('🔴 Client déconnecté du WebSocket');
    clearInterval(interval);
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(PORT, () => {
  console.log(`✅ Serveur HTTP + WebSocket démarré sur le port ${PORT}`);
});