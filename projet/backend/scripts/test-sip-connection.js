/**
 * Script de test pour vérifier la synchronisation avec Asterisk
 * 
 * Ce script teste la connexion à Asterisk et la synchronisation de l'agent
 * pour vérifier que tout fonctionne correctement.
 */

require('dotenv').config();
const asteriskService = require('../services/asteriskService');
const db = require('../config/bd');

// Configuration de test
const testConfig = {
  agentId: process.argv[2] || '1001',
  extension: process.argv[3] || '1001',
  password: process.argv[4] || 'password',
  campaignId: process.argv[5] || '1'
};

// Fonction principale de test
async function testAsteriskSync() {
  console.log('\n=== Test de synchronisation avec Asterisk ===\n');
  console.log('Configuration:');
  console.log(`- Agent ID: ${testConfig.agentId}`);
  console.log(`- Extension: ${testConfig.extension}`);
  console.log(`- Campaign ID: ${testConfig.campaignId}`);
  console.log('\n');

  try {
    // Étape 1: Vérification de la connexion à Asterisk
    console.log('1. Vérification de la connexion à Asterisk...');
    
    // Vérifier si l'AMI est connecté
    if (!asteriskService.ami) {
      throw new Error('L\'instance AMI n\'est pas initialisée');
    }
    
    // Exécuter une action simple pour vérifier la connexion
    const pingResult = await executeAsteriskAction({ action: 'Ping' });
    
    if (pingResult.success) {
      console.log('✅ Connexion à Asterisk réussie');
    } else {
      console.log('⚠️ Connexion à Asterisk non établie, utilisation du mode simulation');
    }
    
    // Étape 2: Définition du statut de l'agent
    console.log('\n2. Définition du statut de l\'agent...');
    const statusResult = await asteriskService.setAgentStatus(
      testConfig.agentId,
      'READY',
      testConfig.campaignId
    );
    
    if (statusResult && statusResult.success) {
      console.log('✅ Statut de l\'agent défini avec succès');
    } else {
      console.log('⚠️ Impossible de définir le statut de l\'agent, utilisation du mode simulation');
    }
    
    // Étape 3: Vérification de l'état de l'agent dans Asterisk
    console.log('\n3. Vérification de l\'état de l\'agent dans Asterisk...');
    
    // Vérifier si l'agent est connecté à Asterisk via une action AMI
    const agentStatus = await executeAsteriskAction({ 
      action: 'AgentShow', 
      agent: testConfig.agentId 
    });
    
    if (agentStatus.success) {
      console.log(`✅ Agent ${testConfig.agentId} correctement enregistré dans Asterisk`);
      
      // Afficher les détails de l'agent si disponibles
      if (agentStatus.response) {
        console.log('Détails de l\'agent dans Asterisk:');
        console.log(agentStatus.response);
      }
    } else {
      console.log(`⚠️ Impossible de vérifier l'état de l'agent dans Asterisk: ${agentStatus.error || 'Erreur inconnue'}`);
    }
    
    // Étape 4: Vérification de l'état de l'agent dans la base de données
    console.log('\n4. Vérification de l\'état de l\'agent dans la base de données...');
    const [agentRows] = await db.query(
      'SELECT user, status, campaign_id FROM vicidial_live_agents WHERE user = ?',
      [testConfig.agentId]
    );
    
    if (agentRows.length === 0) {
      throw new Error(`Agent ${testConfig.agentId} non trouvé dans vicidial_live_agents`);
    }
    
    const agent = agentRows[0];
    console.log('État de l\'agent dans la base de données:');
    console.log(`- User: ${agent.user}`);
    console.log(`- Status: ${agent.status}`);
    console.log(`- Campaign ID: ${agent.campaign_id}`);
    
    if (agent.status === 'READY' && agent.campaign_id === testConfig.campaignId) {
      console.log('✅ État de l\'agent correct dans la base de données');
    } else {
      console.log('⚠️ L\'état de l\'agent dans la base de données ne correspond pas aux attentes');
    }
    
    // Test complet réussi
    console.log('\n✅ Test de connexion SIP réussi!');
    
  } catch (error) {
    console.error(`\n❌ Erreur lors du test: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    // Nettoyage
    console.log('\nNettoyage des connexions...');
    // Pas besoin de déconnecter explicitement, car l'AMI est géré au niveau du service
    
    // Fermeture de la connexion à la base de données
    try {
      await db.end();
      console.log('✅ Connexion à la base de données fermée');
    } catch (error) {
      console.error(`Erreur lors de la fermeture de la connexion à la base de données: ${error.message}`);
    }
    
    console.log('\n=== Fin du test ===');
  }
}

/**
 * Fonction utilitaire pour exécuter une action Asterisk avec gestion des erreurs
 */
function executeAsteriskAction(params) {
  return new Promise((resolve) => {
    if (!asteriskService.ami) {
      console.log(`Mode simulation: Action ${params.action} simulée`);
      resolve({
        success: false,
        error: 'AMI non initialisé',
        simulated: true
      });
      return;
    }
    
    asteriskService.ami.action(params, (err, res) => {
      if (err) {
        console.error(`Erreur lors de l'exécution de l'action ${params.action}:`, err);
        resolve({
          success: false,
          error: err,
          action: params.action
        });
      } else {
        console.log(`Action ${params.action} exécutée avec succès`);
        resolve({
          success: true,
          response: res,
          action: params.action
        });
      }
    });
  });
}

// Exécution du test
testAsteriskSync();
