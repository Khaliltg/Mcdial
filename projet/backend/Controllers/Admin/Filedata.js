const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Endpoint pour récupérer les colonnes disponibles
testFileColumns = ["tel", "genre", "nom", "prenom", "adresse", "ville", "code", "mail"];
app.get('/columns', (req, res) => {
    res.json({ columns: testFileColumns });
});

// Lancer le serveur
const PORT = 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));