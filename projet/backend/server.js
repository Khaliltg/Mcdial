require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/bd'); // Assurez-vous que ce chemin est correct
const AdminRoute = require('./Routes/Admin/userRoute');
const listRoutes = require('./Routes/Admin/listRoutes');
const compagnieRoutes = require('./Routes/Admin/compagniesRoutes');
const prospectRoute = require('./Routes/Admin/prospects');
const app = express();
const PORT = process.env.PORT || 8000; // Par défaut 8000 si PORT n'est pas défini
const conferencesRoutes = require('./Routes/Admin/conferencesroute');

const corsOptions = {
    origin: '*', // Spécifiez l'origine de votre frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Permet l'analyse des corps urlencoded
app.use('/api/conferences', conferencesRoutes);

// Middleware pour gérer les erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.use('/api/lists', listRoutes);
app.use('/api/prospects', prospectRoute);
app.use('/api/admin/user', AdminRoute);
app.use('/api/admin/compagnies', compagnieRoutes);
app.use(express.static('public'));

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
