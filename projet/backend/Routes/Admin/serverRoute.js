const express = require('express');
const router = express.Router();
const serverController = require('../../Controllers/Admin/serverController');

// Récupérer tous les serveurs
router.get('/', serverController.getAllServers);

// Mettre à jour un serveur existant
router.put('/:id', serverController.updateServer);

// Ajouter un nouveau serveur
router.post('/', serverController.addServer);

module.exports = router;
