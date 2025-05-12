// routes/Admin/timeclockRoutes.js

const express = require('express');
const router = express.Router();

// Importation du contrôleur
const timeclockController = require('../../Controllers/Admin/timeclockController');

// Définition de la route et du callback
router.get('/', timeclockController.getTimeclockReport);

module.exports = router;
