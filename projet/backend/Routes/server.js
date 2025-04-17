const express = require('express');
const cors = require('cors');
const conferencesRoutes = require('./Routes/Admin/conferences');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/admin/conferences', conferencesRoutes);

app.listen(5000, () => {
	console.log('✅ Backend démarré sur http://localhost:8000');
});
