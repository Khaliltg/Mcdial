const AsteriskService = require('./services/asteriskService');
const config = require('./config/config');
const logger = require('./utils/logger');

// Configuration Asterisk
const asteriskConfig = {
  port: 5038,
  host: "213.32.34.38",
  username: "cron",
  password: config.ASTERISK_PASSWORD || "1234", // Utilisez le mot de passe configuré
  reconnect: true,
  reconnectTimeout: 3000,
  maxReconnectAttempts: 5,
  keepAlive: true,
  keepAliveInterval: 10000,
  events: "on"
};

// Initialiser le service Asterisk
const asteriskService = new AsteriskService(asteriskConfig);

// Fonction pour tester un appel
async function testCall() {
  try {
    // Se connecter à Asterisk
    await asteriskService.connect();
    logger.info("Connecté à Asterisk pour le test d'appel");
    
    // Extension à utiliser pour le test
    const extension = "5002"; // Remplacez par l'extension à tester
    
    // Vérifier si l'extension est enregistrée
    const peerInfo = await asteriskService.checkSIPPeer(extension);
    logger.info(`État de l'extension ${extension}:`, peerInfo);
    
    if (peerInfo.isOnline) {
      // Générer un ID d'appel unique
      const callId = `TEST-CALL-${Date.now()}`;
      
      // Numéro à appeler pour le test (peut être un numéro interne ou externe)
      const testNumber = "5001"; // Remplacez par un numéro valide pour votre test
      
      logger.info(`Tentative d'appel de test: Extension ${extension} appelle ${testNumber}`);
      
      // Initier l'appel
      const result = await asteriskService.originateCall(
        extension,
        testNumber,
        `Test <${extension}>`,
        callId
      );
      
      logger.info(`Résultat de l'appel de test:`, result);
      
      // Attendre 10 secondes
      logger.info("Attente de 10 secondes pour vérifier l'état de l'appel...");
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Vérifier les canaux actifs
      const channels = await asteriskService.getActiveChannels(extension);
      logger.info(`Canaux actifs pour l'extension ${extension}:`, channels);
      
      if (channels && channels.count > 0) {
        logger.info("✅ TEST RÉUSSI: L'appel est actif!");
      } else {
        logger.info("❌ TEST ÉCHOUÉ: Aucun canal actif trouvé pour l'appel de test.");
      }
    } else {
      logger.error(`❌ TEST ÉCHOUÉ: L'extension ${extension} n'est pas en ligne.`);
    }
    
    // Déconnexion
    await asteriskService.disconnect();
    logger.info("Test d'appel terminé");
    
  } catch (error) {
    logger.error("Erreur lors du test d'appel:", error);
  } finally {
    process.exit(0);
  }
}

// Exécuter le test
testCall();
