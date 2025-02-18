const express = require('express');
const cors = require('cors');
const db = require('./config/bd'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT

// Middleware
app.use(cors());
app.use(express.json());


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});