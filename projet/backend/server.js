require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/bd'); 
const AdminRoute = require('./Routes/Admin/userRoute');
const listRoutes = require('./Routes/Admin/listRoutes');

const app = express();
const PORT = process.env.PORT ;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/lists', listRoutes);
app.use('/api/prospects', listRoutes)




//Routes pour l admin 
app.use('/api/admin/user', AdminRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(r.route.path);
    }
});
