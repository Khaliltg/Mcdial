require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/bd'); // Ensure this path is correct
const AdminRoute = require('./Routes/Admin/userRoute');
const listRoutes = require('./Routes/Admin/listRoutes');
const compagnieRoutes = require('./Routes/Admin/compagniesRoutes');
const prospectRoute = require("./Routes/Admin/prospects");
const app = express();
const PORT = process.env.PORT || 8000; // Default to 8000 if PORT is not set

const corsOptions = {
    origin: '*', // Specify your frontend's origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Allows parsing of urlencoded bodies
app.use('/api/lists', listRoutes);
app.use('/api/prospects', prospectRoute);
app.use('/api/admin/user', AdminRoute);
app.use('/api/admin/compagnies', compagnieRoutes);
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
