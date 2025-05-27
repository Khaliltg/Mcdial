/**
 * Script pour forcer le statut PAUSED pour un agent dans ViciDial
 * Ce script peut être exécuté périodiquement pour maintenir le statut PAUSED
 */

const db = require('../config/bd');

async function forceAgentPaused(agentId, pauseCode = 'LOGIN') {
  try {
    console.log(`Forçage du statut PAUSED pour l'agent ${agentId}...`);
    
    // Vérifier si l'agent existe dans vicidial_live_agents
    const [agents] = await db.query(
      `SELECT user, status FROM vicidial_live_agents WHERE user = ?`,
      [agentId]
    );
    
    if (agents.length === 0) {
      console.log(`Agent ${agentId} non trouvé dans vicidial_live_agents`);
      return false;
    }
    
    console.log(`Statut actuel de l'agent ${agentId}: ${agents[0].status}`);
    
    // Si l'agent n'est pas déjà en PAUSED, forcer le statut
    if (agents[0].status !== 'PAUSED') {
      // Mettre à jour avec tous les champs nécessaires
      const [result] = await db.query(
        `UPDATE vicidial_live_agents 
         SET status = 'PAUSED', 
             pause_code = ?, 
             external_pause_code = ?, 
             external_status = 'PAUSED',
             comments = 'Forcé en pause par script',
             last_state_change = NOW()
         WHERE user = ?`,
        [pauseCode, pauseCode, agentId]
      );
      
      console.log(`Mise à jour effectuée: ${result.affectedRows} ligne(s) modifiée(s)`);
      
      // Vérifier que la mise à jour a fonctionné
      const [updatedAgent] = await db.query(
        `SELECT user, status, pause_code FROM vicidial_live_agents WHERE user = ?`,
        [agentId]
      );
      
      if (updatedAgent.length > 0) {
        console.log(`Nouveau statut: ${updatedAgent[0].status}, Code de pause: ${updatedAgent[0].pause_code}`);
        return updatedAgent[0].status === 'PAUSED';
      }
    } else {
      console.log(`L'agent ${agentId} est déjà en statut PAUSED`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors du forçage du statut PAUSED:', error);
    return false;
  }
}

// Exporter la fonction pour l'utiliser dans d'autres modules
module.exports = forceAgentPaused;

// Si le script est exécuté directement (node forceAgentPaused.js <agentId>)
if (require.main === module) {
  const agentId = process.argv[2];
  
  if (!agentId) {
    console.error('Usage: node forceAgentPaused.js <agentId>');
    process.exit(1);
  }
  
  forceAgentPaused(agentId)
    .then(success => {
      console.log(`Opération ${success ? 'réussie' : 'échouée'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erreur:', error);
      process.exit(1);
    });
}
