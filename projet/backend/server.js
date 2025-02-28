require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/bd'); 
const userRoutes = require('./Routes/Admin/userRoute');
const compagnieRoutes = require('./Routes/Admin/compagniesRoutes')
const app = express();
const PORT = process.env.PORT ;

// Middleware
app.use(cors());
app.use(express.json());


//Routes pour l admin 
app.use('/api/admin/user', userRoutes);
app.use('/api/admin/compagnies', compagnieRoutes);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});