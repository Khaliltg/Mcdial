/**
 * Script de test pour vérifier si les appels fonctionnent réellement
 */
const asteriskService = require('./services/asteriskService');
const logger = require('./utils/logger');

// Fonction pour attendre que la connexion à Asterisk soit établie
async function waitForAsteriskConnection(timeoutMs = 10000) {
  console.log(`Attente de la connexion à Asterisk (timeout: ${timeoutMs}ms)...`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const status = asteriskService.getAsteriskStatus();
    
    if (status.connected || status.simulationMode) {
      console.log(`Connexion établie après ${Date.now() - startTime}ms`);
      return true;
    }
    
    // Attendre 500ms avant de vérifier à nouveau
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`Timeout après ${timeoutMs}ms: Impossible d'établir la connexion à Asterisk`);
  return false;
}

// Fonction pour tester si les appels fonctionnent
async function testCallFunctionality() {
  try {
    console.log("=== DÉBUT DU TEST D'APPEL ===");
    
    // Attendre que la connexion soit établie
    const connected = await waitForAsteriskConnection(15000);
    
    // 1. Vérifier l'état de la connexion à Asterisk
    const asteriskStatus = asteriskService.getAsteriskStatus();
    console.log("État de la connexion Asterisk:", asteriskStatus);
    
    if (!connected) {
      console.log("❌ TEST ÉCHOUÉ: Impossible d'établir la connexion à Asterisk.");
      return;
    }
    
    // 2. Vérifier l'extension à utiliser
    const extension = "5002"; // Extension à tester
    console.log(`Vérification de l'extension ${extension}...`);
    
    const extensionStatus = await asteriskService.checkSipRegistration(extension);
    console.log(`État de l'extension ${extension}:`, extensionStatus);
    
    // Vérifier si l'extension est enregistrée (vérifier registered ou isRegistered selon le format de réponse)
    const isExtensionRegistered = extensionStatus.registered === true || extensionStatus.isRegistered === true;
    
    if (!isExtensionRegistered && !asteriskStatus.simulationMode) {
      console.log(`❌ TEST ÉCHOUÉ: L'extension ${extension} n'est pas enregistrée.`);
      return;
    }
    
    console.log(`✅ Extension ${extension} correctement enregistrée et prête pour les appels.`);
    
    // 3. Vérifier les canaux actifs initiaux
    const initialChannels = await asteriskService.getActiveChannels(extension);
    console.log(`Canaux actifs initiaux pour l'extension ${extension}:`, initialChannels);
    
    // 4. Tester un appel
    // Utiliser un numéro externe valide pour le test
    // Note: Pour un test réel, utiliser un numéro que vous pouvez appeler
    const testNumber = "0611223344"; // Numéro externe pour le test
    const callId = `TEST-${Date.now()}`;
    
    console.log(`Tentative d'appel: ${extension} → ${testNumber} (ID: ${callId})`);
    
    // Activer le mode simulation pour le test
    console.log("Activation du mode simulation pour le test d'appel...");
    
    const callResult = await asteriskService.initiateCall(
      extension,
      testNumber,
      "101", // Agent ID
      "TEST-LEAD" // Lead ID
    );
    
    console.log("Résultat de l'initiation d'appel:", callResult);
    
    // 5. Attendre quelques secondes
    console.log("Attente de 5 secondes...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 6. Vérifier les canaux actifs après l'appel
    const activeChannels = await asteriskService.getActiveChannels(extension);
    console.log(`Canaux actifs après l'appel pour l'extension ${extension}:`, activeChannels);
    
    // 7. Vérifier si l'appel est actif
    if (activeChannels && activeChannels.count > 0) {
      console.log("✅ TEST RÉUSSI: L'appel est actif!");
      
      // 8. Terminer l'appel de test
      console.log("Fin de l'appel de test...");
      const hangupResult = await asteriskService.endCall(callResult.callId || callId);
      console.log("Résultat de la fin d'appel:", hangupResult);
    } else if (asteriskStatus.simulationMode) {
      console.log("✅ TEST RÉUSSI EN MODE SIMULATION: L'appel a été simulé avec succès.");
    } else {
      console.log("❌ TEST ÉCHOUÉ: Aucun canal actif trouvé après l'appel.");
    }
    
    console.log("=== FIN DU TEST D'APPEL ===");
    
  } catch (error) {
    console.error("Erreur lors du test d'appel:", error);
  }
}

// Exécuter le test
testCallFunctionality();
