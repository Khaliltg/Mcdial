/**
 * Script de test pour vérifier la synchronisation agent-Asterisk
 */
const asteriskService = require('../services/asteriskService');
const config = require('../config/config');
const db = require('../config/bd');

// Informations de test pour l'agent
const testAgent = {
  agentId: 'agent123',
  extension: '1001',
  campaignId: 'camp001'
};

console.log('=== Test de synchronisation agent-Asterisk ===');
console.log(`Agent ID: ${testAgent.agentId}`);
console.log(`Extension: ${testAgent.extension}`);
console.log(`Campagne: ${testAgent.campaignId}`);
console.log('==============================================');

// Fonction pour tester la mise à jour du statut de l'agent
async function testSetAgentStatus() {
  try {
    console.log('Test de mise à jour du statut agent...');
    const result = await asteriskService.setAgentStatus(
      testAgent.agentId,
      'READY',
      testAgent.campaignId
    );
    
    console.log('Résultat:', result);
    
    if (result.success) {
      console.log('✅ Statut agent mis à jour avec succès');
      
      // Vérifier dans la base de données
      const query = `
        SELECT user, status, campaign_id
        FROM vicidial_live_agents
        WHERE user = ?
        LIMIT 1
      `;
      
      const [rows] = await db.query(query, [testAgent.agentId]);
      
      if (rows.length > 0) {
        console.log('✅ Agent trouvé dans la base de données:');
        console.log(rows[0]);
      } else {
        console.log('❌ Agent non trouvé dans la base de données');
      }
    } else {
      console.error('❌ Échec de la mise à jour du statut agent');
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Fonction pour tester l'initiation d'un appel
async function testInitiateCall() {
  try {
    console.log('\nTest d\'initiation d\'appel...');
    const result = await asteriskService.initiateCall(
      testAgent.extension,
      '+21612345678', // Numéro de test
      testAgent.agentId
    );
    
    console.log('Résultat:', result);
    
    if (result.success) {
      console.log('✅ Appel initié avec succès');
      console.log(`ID d'appel: ${result.callId}`);
    } else {
      console.error('❌ Échec de l\'initiation d\'appel');
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter les tests séquentiellement
async function runTests() {
  try {
    // Attendre que la connexion soit établie
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tester la mise à jour du statut
    await testSetAgentStatus();
    
    // Tester l'initiation d'appel
    await testInitiateCall();
    
    // Fermer les connexions
    console.log('\nTests terminés, fermeture des connexions...');
    if (asteriskService.ami && asteriskService.ami.connected) {
      asteriskService.ami.disconnect();
    }
    await db.end();
    
    console.log('Connexions fermées.');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'exécution des tests:', error);
    process.exit(1);
  }
}

// Lancer les tests
runTests();
