/**
 * Service pour la communication avec Asterisk via AMI (Asterisk Manager Interface)
 */
const AsteriskManager = require('asterisk-manager');
const config = require('../config/config');

// Variable pour suivre l'état de connexion à Asterisk
let isConnected = false;
let isSimulationMode = false;

// Créer une instance du gestionnaire Asterisk
let ami;

try {
    ami = new AsteriskManager(
        config.asterisk.port,
        config.asterisk.host,
        config.asterisk.username,
        config.asterisk.password,
        true
    );

    // Gérer les événements AMI
    ami.keepConnected();

    ami.on('connect', () => {
        console.log('Connecté à Asterisk Manager Interface');
        isConnected = true;
        isSimulationMode = false;
    });

    ami.on('error', (err) => {
        console.error('Erreur de connexion à Asterisk Manager Interface:', err);
        isConnected = false;
        isSimulationMode = true;
        console.log('Mode simulation activé pour le développement');
    });

    // Ajouter les gestionnaires d'événements supplémentaires uniquement si ami est défini
    if (ami) {
        ami.on('disconnect', () => {
            console.log('Déconnecté d\'Asterisk Manager Interface');
            isConnected = false;
        });

        ami.on('reconnection', () => {
            console.log('Reconnexion à Asterisk Manager Interface');
            isConnected = true;
            isSimulationMode = false;
        });

        ami.on('internalError', (error) => {
            console.error('Erreur interne AMI:', error);
            if (error && error.message) {
                console.error('Message d\'erreur:', error.message);
            }
        });
    }

} catch (error) {
    console.error('Erreur lors de l\'initialisation d\'Asterisk Manager:', error);
    isSimulationMode = true;
    console.log('Mode simulation activé pour le développement');
}

ami.on('disconnect', () => {
  console.log('Déconnecté d\'Asterisk Manager Interface');
  // Tenter de se reconnecter après un délai
  setTimeout(() => {
    console.log('Tentative de reconnexion à Asterisk Manager Interface...');
    ami.connect();
  }, 5000);
});

// Écouter les événements d'appel d'Asterisk
ami.on('managerevent', (event) => {
  if (event.event === 'Newchannel') {
    console.log('Nouvel appel détecté:', event);
  } else if (event.event === 'Hangup') {
    console.log('Fin d\'appel détectée:', event);
  }
});

// Fonction pour initier un appel
function initiateCall(agentExtension, phoneNumber, agentId, leadId = '') {
    return new Promise((resolve, reject) => {
        // Formater le numéro de téléphone (supprimer les espaces, tirets, etc.)
        phoneNumber = formatPhoneNumber(phoneNumber);
        
        console.log(`Initiation d'un appel Asterisk: Agent ${agentId} (${agentExtension}) vers ${phoneNumber}`);
        
        // Si en mode simulation, simuler un appel réussi
        if (isSimulationMode || !isConnected) {
            console.log('Mode simulation: Simulation d\'un appel réussi');
            
            // Générer un ID d'appel unique pour la simulation
            const callId = `SIM-${Date.now()}`;
            
            // Simuler un délai pour l'appel
            setTimeout(() => {
                resolve({
                    success: true,
                    callId: callId,
                    message: 'Appel simulé avec succès',
                    agentExtension,
                    phoneNumber,
                    agentId,
                    leadId
                });
            }, 500);
            return;
        }
        
        // Si connecté à Asterisk, initier un vrai appel
        // Préparer les variables pour l'action Originate
        const originateParams = {
            Channel: `SIP/${agentExtension}`,
            Context: 'from-internal',
            Exten: phoneNumber,
            Priority: 1,
            Callerid: `Agent ${agentId} <${agentExtension}>`,
            Timeout: 30000,
            Async: true,
            Variable: {
                'AGENT_ID': agentId,
                'LEAD_ID': leadId || '0',
                'CAMPAIGN_ID': 'OUTBOUND',
                'RECORD_CALL': 'YES'
            }
        };

        // Exécuter l'action Originate
        ami.action('Originate', originateParams, (err, res) => {
            if (err) {
                console.error('Erreur lors de l\'initiation de l\'appel:', err);
                reject(err);
            } else {
                console.log('Appel initié avec succès:', res);
                
                // Extraire l'ID d'appel de la réponse
                const callId = res.uniqueid || res.actionid || `AST-${Date.now()}`;
                
                resolve({
                    success: true,
                    callId: callId,
                    message: 'Appel initié avec succès',
                    agentExtension,
                    phoneNumber,
                    agentId,
                    leadId,
                    response: res
                });
            }
        });
    });
}

// Fonction pour définir le statut d'un agent
function setAgentStatus(agentId, status, campaignId) {
    return new Promise((resolve, reject) => {
        // Si en mode simulation, simuler un changement de statut réussi
        if (isSimulationMode || !isConnected) {
            console.log('Mode simulation: Simulation d\'un changement de statut réussi');
            console.log(`Simulation: Agent ${agentId} dans la campagne ${campaignId} passe au statut ${status}`);
            
            // Simuler un délai pour le changement de statut
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'Changement de statut simulé avec succès',
                    agentId,
                    status,
                    campaignId
                });
            }, 200);
            return;
        }
        
        // Si connecté à Asterisk, effectuer un vrai changement de statut
        // Préparer les variables pour l'action
        const statusParams = {
            Action: 'QueuePause',
            Interface: `Agent/${agentId}`,
            Paused: status === 'PAUSED' ? 'true' : 'false',
            Queue: `Campaign_${campaignId}`,
            Reason: status
        };

        // Exécuter l'action
        ami.action(statusParams, (err, res) => {
            if (err) {
                console.error(`Erreur lors de la définition du statut ${status} pour l'agent ${agentId}:`, err);
                reject(err);
            } else {
                console.log(`Statut ${status} défini avec succès pour l'agent ${agentId}:`, res);
                resolve(res);
            }
        });
    });
}

// Fonction pour démarrer le composeur prédictif
function startPredictiveDialer(campaignId, level = 'AUTO') {
    return new Promise((resolve, reject) => {
        // Si en mode simulation, simuler un démarrage réussi du composeur
        if (isSimulationMode || !isConnected) {
            console.log('Mode simulation: Simulation du démarrage du composeur prédictif');
            console.log(`Simulation: Composeur prédictif démarré pour la campagne ${campaignId} au niveau ${level}`);
            
            // Simuler un délai pour le démarrage du composeur
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'Démarrage du composeur simulé avec succès',
                    campaignId,
                    level
                });
            }, 300);
            return;
        }
        
        // Si connecté à Asterisk, démarrer réellement le composeur
        // Préparer les variables pour l'action
        const dialerParams = {
            Action: 'VicidialStartDialing',
            Campaign: campaignId,
            Level: level
        };

        // Exécuter l'action
        ami.action(dialerParams, (err, res) => {
            if (err) {
                console.error(`Erreur lors du démarrage du composeur prédictif pour la campagne ${campaignId}:`, err);
                reject(err);
            } else {
                console.log(`Composeur prédictif démarré avec succès pour la campagne ${campaignId}:`, res);
                resolve(res);
            }
        });
    });
}

// Fonction pour arrêter le composeur prédictif
function stopPredictiveDialer(campaignId) {
    return new Promise((resolve, reject) => {
        // Si en mode simulation, simuler un arrêt réussi du composeur
        if (isSimulationMode || !isConnected) {
            console.log('Mode simulation: Simulation de l\'arrêt du composeur prédictif');
            console.log(`Simulation: Composeur prédictif arrêté pour la campagne ${campaignId}`);
            
            // Simuler un délai pour l'arrêt du composeur
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'Arrêt du composeur simulé avec succès',
                    campaignId
                });
            }, 300);
            return;
        }
        
        // Si connecté à Asterisk, arrêter réellement le composeur
        // Préparer les variables pour l'action
        const dialerParams = {
            Action: 'VicidialStopDialing',
            Campaign: campaignId
        };

        // Exécuter l'action
        ami.action(dialerParams, (err, res) => {
            if (err) {
                console.error(`Erreur lors de l'arrêt du composeur prédictif pour la campagne ${campaignId}:`, err);
                reject(err);
            } else {
                console.log(`Composeur prédictif arrêté avec succès pour la campagne ${campaignId}:`, res);
                resolve(res);
            }
        });
    });
}

/**
 * Formate un numéro de téléphone pour Asterisk
 * @param {string} phoneNumber - Numéro de téléphone à formater
 * @returns {string} - Numéro formaté
 */
function formatPhoneNumber(phoneNumber) {
  // Supprimer tous les caractères non numériques sauf le +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Si le numéro ne commence pas par +, ajouter le préfixe international
  if (!cleaned.startsWith('+')) {
    // Vérifier si le numéro commence déjà par un préfixe international
    if (cleaned.startsWith('216')) {
      cleaned = '+' + cleaned;
      console.log(`Numéro formaté avec préfixe existant: ${cleaned}`);
    } else {
      // Ajouter le préfixe tunisien par défaut
      cleaned = '+216' + cleaned;
      console.log(`Numéro formaté avec ajout du préfixe tunisien: ${cleaned}`);
    }
  } else {
    console.log(`Numéro déjà au format international: ${cleaned}`);
  }
  
  // Vérifier que le numéro a une longueur raisonnable (E.164 = 15 chiffres max)
  if (cleaned.length > 16) { // +[15 chiffres max]
    console.warn(`Attention: Numéro de téléphone anormalement long: ${cleaned}`);
  } else if (cleaned.length < 8) {
    console.warn(`Attention: Numéro de téléphone anormalement court: ${cleaned}`);
  }
  
  return cleaned;
}

/**
 * Termine un appel Asterisk en cours
 * @param {string} callId - ID de l'appel Asterisk
 * @returns {Promise} - Promesse résolue lorsque l'appel est terminé
 */
function endCall(callId) {
  return new Promise((resolve, reject) => {
    // Si en mode simulation, simuler la fin d'un appel
    if (isSimulationMode || !isConnected) {
      console.log(`Mode simulation: Simulation de la fin d'appel pour ${callId}`);
      
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Fin d\'appel simulée avec succès',
          callId
        });
      }, 300);
      return;
    }
    
    // Si connecté à Asterisk, terminer réellement l'appel
    // Préparer les variables pour l'action Hangup
    const hangupParams = {
      ActionID: `hangup-${Date.now()}`,
      Channel: callId
    };
    
    // Exécuter l'action Hangup
    ami.action('Hangup', hangupParams, (err, res) => {
      if (err) {
        console.error(`Erreur lors de la terminaison de l'appel ${callId}:`, err);
        reject(err);
      } else {
        console.log(`Appel ${callId} terminé avec succès:`, res);
        resolve({
          success: true,
          message: 'Appel terminé avec succès',
          callId,
          response: res
        });
      }
    });
  });
}

/**
 * Récupère les détails d'un appel Asterisk
 * @param {string} callId - ID de l'appel Asterisk
 * @returns {Promise} - Promesse résolue avec les détails de l'appel
 */
function getCallDetails(callId) {
  return new Promise((resolve, reject) => {
    // Si en mode simulation, simuler les détails d'un appel
    if (isSimulationMode || !isConnected) {
      console.log(`Mode simulation: Simulation des détails d'appel pour ${callId}`);
      
      setTimeout(() => {
        resolve({
          success: true,
          callId,
          status: 'UP',
          duration: Math.floor(Math.random() * 120) + 10, // 10-130 secondes
          channel: `SIP/random-${callId}`,
          callerIdNum: '+21612345678',
          connectedLineNum: '+21687654321'
        });
      }, 200);
      return;
    }
    
    // Si connecté à Asterisk, récupérer réellement les détails de l'appel
    // Préparer les variables pour l'action Status
    const statusParams = {
      ActionID: `status-${Date.now()}`,
      Channel: callId
    };
    
    // Exécuter l'action Status
    ami.action('Status', statusParams, (err, res) => {
      if (err) {
        console.error(`Erreur lors de la récupération des détails de l'appel ${callId}:`, err);
        reject(err);
      } else {
        console.log(`Détails de l'appel ${callId} récupérés avec succès:`, res);
        resolve({
          success: true,
          callId,
          status: res.status || 'UNKNOWN',
          duration: res.seconds || 0,
          channel: res.channel || '',
          callerIdNum: res.calleridnum || '',
          connectedLineNum: res.connectedlinenum || '',
          response: res
        });
      }
    });
  });
}

module.exports = {
  ami,
  initiateCall,
  endCall,
  getCallDetails,
  setAgentStatus,
  startPredictiveDialer,
  stopPredictiveDialer,
  formatPhoneNumber
};
