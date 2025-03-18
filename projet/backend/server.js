require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/bd'); 

const AdminRoute = require('./Routes/Admin/userRoute');
const listRoutes = require('./Routes/Admin/listRoutes');
const compagnieRoutes = require('./Routes/Admin/compagniesRoutes');

const app = express();
const PORT = process.env.PORT;


const corsOptions = {
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/lists', listRoutes);
app.use('/api/prospects', listRoutes);
app.use('/api/admin/user', AdminRoute);
app.use('/api/admin/compagnies', compagnieRoutes);
app.use(express.static('public'));


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.get('*', (req, res) => {
  res.sendFile(path.resolve('public', 'index.html'));
});