require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./config/bd'); // Ensure this path is correct
const AdminRoute = require('./Routes/Admin/userRoute');
const listRoutes = require('./Routes/Admin/listRoutes');
const compagnieRoutes = require('./Routes/Admin/compagniesRoutes');
const prospectRoute = require("./Routes/Admin/prospects");
const UserGroupRoute = require("./Routes/Admin/UserGroupeRoute");
const app = express();
const loginRoute = require('./Routes/login');
const authRoute = require('./Routes/auth');
const { authenticateToken, requireAdmin } = require('./middleware/auth');
const PORT = process.env.PORT || 8000; // Default to 8000 if PORT is not set

// CORS configuration for cross-origin requests with credentials
const corsOptions = {
    origin: 'http://localhost:5173', // Explicitly set frontend origin
    credentials: true, // Critical for cookies to be accepted
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'], // Allow Set-Cookie to be exposed
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Allows parsing of urlencoded bodies
app.use('/api/login', loginRoute);
app.use('/api/auth', authRoute);
app.use('/api/lists', authenticateToken, listRoutes);
app.use('/api/prospects', authenticateToken, prospectRoute);
app.use('/api/admin/user', authenticateToken, requireAdmin, AdminRoute);
app.use('/api/admin/compagnies', authenticateToken, requireAdmin, compagnieRoutes);
app.use('/api/admin/usergroup', authenticateToken, requireAdmin, UserGroupRoute);
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
