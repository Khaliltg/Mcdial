require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/bd'); 

const AdminRoute = require('./Routes/Admin/userRoute');
const listRoutes = require('./Routes/Admin/listRoutes');
const compagnieRoutes = require('./Routes/Admin/compagniesRoutes');

const app = express();
const PORT = process.env.PORT;

// Middleware
const corsOptions = {
  origin: '*', // Spécifiez l'origine de votre frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Autoriser les méthodes nécessaires
  allowedHeaders: ['Content-Type', 'Authorization'], // Autoriser les en-têtes nécessaires
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/lists', listRoutes);
app.use('/api/prospects', listRoutes);
app.use('/api/admin/user', AdminRoute);
app.use('/api/admin/compagnies', compagnieRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});