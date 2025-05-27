/**
 * Script de test pour vérifier la connexion à Asterisk
 */
const asteriskService = require('../services/asteriskService');
const config = require('../config/config');

console.log('=== Test de connexion à Asterisk ===');
console.log(`Serveur: ${config.asterisk.host}:${config.asterisk.port}`);
console.log(`Utilisateur: ${config.asterisk.username}`);
console.log('====================================');

// Attendre un peu pour voir les logs de connexion
setTimeout(() => {
  // Vérifier si la connexion est établie
  if (asteriskService.ami && asteriskService.ami.connected) {
    console.log('✅ Connexion établie avec succès!');
    
    // Tester une action simple
    console.log('Test d\'une action simple (CoreStatus)...');
    asteriskService.ami.action({
      Action: 'CoreStatus'
    }, (err, res) => {
      if (err) {
        console.error('❌ Erreur lors de l\'exécution de l\'action:', err);
      } else {
        console.log('✅ Action exécutée avec succès:');
        console.log(res);
      }
      
      // Fermer la connexion après le test
      console.log('Fermeture de la connexion...');
      asteriskService.ami.disconnect();
      process.exit(0);
    });
  } else {
    console.error('❌ Échec de la connexion à Asterisk');
    console.log('Mode simulation:', asteriskService.isSimulationMode ? 'Activé' : 'Désactivé');
    process.exit(1);
  }
}, 3000); // Attendre 3 secondes pour la connexion
