require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const connection = require('./config/bd'); // Database connection

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
const agentTimeRoutes = require('./Routes/Admin/agentTimeRoutes');
const timeclockRoutes = require('./Routes/Admin/timeclockRoutes');
const realtimeRoute = require('./Routes/Admin/realtimeRoute');
const dashboardRoutes = require('./Routes/Admin/dashboardRoutes');

const loginRoute = require('./Routes/login');
const authRoute = require('./Routes/auth');
const { authenticateToken, requireAdmin } = require('./middleware/auth');

const PORT = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
    credentials: true,
  },
});

// Middlewares
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'x-auth-token'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Authentication routes
app.use('/api/login', loginRoute);
app.use('/api/auth', authRoute);

// Agent routes
app.use('/api/agent/auth', agentAuthRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/agent/calls', authenticateToken, agentCallRoutes);
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
app.use('/api/admin/dashboard', authenticateToken, requireAdmin, dashboardRoutes);

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
