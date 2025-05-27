/**
 * Service pour la communication avec Asterisk via AMI (Asterisk Manager Interface)
 * Gère la connexion à Asterisk, les appels et les événements
 */
const AsteriskManager = require('asterisk-manager');
const config = require('../config/config');
const { EventEmitter } = require('events');
const net = require('net');
const util = require('util');
const dns = require('dns');

// Promisify les fonctions nécessaires
const dnsLookup = util.promisify(dns.lookup);
const socketConnect = util.promisify((host, port, cb) => {
  const socket = new net.Socket();
  socket.on('error', () => cb(null, false));
  socket.on('timeout', () => {
    socket.destroy();
    cb(null, false);
  });
  socket.connect(port, host, () => {
    socket.end();
    cb(null, true);
  });
});

/**
 * Vérifie la connectivité au serveur Asterisk
 */
async function checkAsteriskConnectivity() {
  const host = config.asterisk.host;
  const port = config.asterisk.port;
  
  try {
    // Vérifier la résolution DNS
    console.log(`Vérification de la résolution DNS pour ${host}...`);
    const dnsResult = await dnsLookup(host);
    console.log(`Résolution DNS réussie: ${dnsResult.address}`);
    
    // Vérifier la connectivité TCP
    console.log(`Vérification de la connectivité TCP vers ${host}:${port}...`);
    const isReachable = await socketConnect(host, port);
    
    if (!isReachable) {
      throw new Error(`Impossible d'établir une connexion TCP vers ${host}:${port}`);
    }
    
    console.log(`Connexion TCP réussie vers ${host}:${port}`);
    return true;
  } catch (error) {
    console.error('Erreur de connectivité:', error.message);
    console.error('Assurez-vous que:');
    console.error(`1. Le serveur Asterisk est en cours d'exécution sur ${host}:${port}`);
    console.error('2. Le pare-feu autorise les connexions entrantes sur ce port');
    console.error('3. Les informations de connexion sont correctes');
    throw error;
  }
}

// Variables d'état
let isConnected = false;
let isSimulationMode = config.asterisk.simulationModeEnabled || false;
let reconnectAttempts = 0;
let reconnecting = false;
let connectionTimeout = null;
let keepAliveInterval = null;

// Événements personnalisés
const eventEmitter = new EventEmitter();

// Instance du gestionnaire Asterisk
let ami = null;

// Données de simulation pour le mode développement
const SIMULATION_DATA = {
  '5002': {
    Status: 'OK',
    Address: '192.168.1.100',
    Port: '5060',
    Context: 'from-internal',
    QualifyFreq: '60000',
    RegContact: 'sip:5002@192.168.1.100:5060',
    UserAgent: 'MCDial/1.0',
    LastMsg: new Date().toISOString()
  }
};

/**
 * Initialise la connexion à Asterisk AMI
 */
async function initializeAsteriskManager() {
  if (ami) {
    // Nettoyer l'instance existante
    cleanupAmiInstance();
  }

  const amiOptions = {
    port: config.asterisk.port,
    host: config.asterisk.host,
    username: config.asterisk.username,
    password: config.asterisk.password,
    reconnect: config.asterisk.reconnect,
    reconnectTimeout: config.asterisk.reconnectTimeout,
    maxReconnectAttempts: config.asterisk.maxReconnectAttempts,
    keepAlive: config.asterisk.keepAlive,
    keepAliveInterval: config.asterisk.keepAliveInterval,
    events: 'on' // Activer les événements
  };

  try {
    console.log(`Création d'une nouvelle instance AMI pour ${amiOptions.host}:${amiOptions.port}...`);
    
    // Vérifier d'abord la connectivité réseau
    try {
      console.log('Vérification de la connectivité réseau vers le serveur Asterisk...');
      await checkAsteriskConnectivity();
    } catch (connectivityError) {
      console.error('Erreur de connectivité réseau:', connectivityError.message);
      console.log('Activation du mode simulation en raison de problèmes de connectivité');
      isSimulationMode = true;
      return;
    }
    
    // Créer une nouvelle instance
    ami = new AsteriskManager(
      amiOptions.port,
      amiOptions.host,
      amiOptions.username,
      amiOptions.password,
      amiOptions.events
    );

    // Configurer les gestionnaires d'événements
    console.log('Configuration des gestionnaires d\'événements AMI...');
    setupEventHandlers();
    setupAmiEventHandlers(); // S'assurer que les gestionnaires d'événements sont configurés
  
    // Afficher la configuration de connexion (masquer le mot de passe pour des raisons de sécurité)
    const debugConfig = { ...amiOptions, password: '***' };
    console.log('Configuration AMI:', JSON.stringify(debugConfig, null, 2));

    // Démarrer la connexion
    console.log(`Tentative de connexion à Asterisk sur ${amiOptions.host}:${amiOptions.port}...`);
  
    // Démarrer le timeout de connexion avec un délai plus long
    console.log('Démarrage du timeout de connexion...');
    startConnectionTimeout();
  
    // Vérifier les identifiants avant de se connecter
    console.log(`Tentative d'authentification avec l'utilisateur: ${amiOptions.username}`);
    
    // Démarrer la connexion
    console.log('Appel de ami.connect()...');
    try {
      ami.connect();
      console.log('ami.connect() appelé avec succès');
      
      // Vérifier si l'authentification a réussi après un délai
      setTimeout(() => {
        if (!isConnected) {
          console.error('Échec de l\'authentification AMI - vérification des identifiants');
          console.log('Vérifiez que l\'utilisateur AMI a les permissions nécessaires dans manager.conf');
          console.log('Permissions requises: read=system,call,log,verbose,command,agent,user');
          
          // Tenter une reconnexion avec un délai plus long
          reconnectAttempts++;
          if (reconnectAttempts < config.asterisk.maxReconnectAttempts) {
            console.log(`Nouvelle tentative de connexion dans ${config.asterisk.reconnectTimeout * 2}ms...`);
            setTimeout(initializeAsteriskManager, config.asterisk.reconnectTimeout * 2);
          }
        }
      }, config.asterisk.connectionTimeout); // Utiliser le timeout de connexion configuré
    } catch (connectError) {
      console.error('Erreur lors de l\'appel à ami.connect():', connectError);
      throw connectError;
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la connexion AMI:', error);
    isConnected = false;
    reconnectAttempts++;
    
    if (reconnectAttempts < config.asterisk.maxReconnectAttempts) {
      console.log(`Nouvelle tentative de connexion dans ${config.asterisk.reconnectTimeout}ms...`);
      setTimeout(initializeAsteriskManager, config.asterisk.reconnectTimeout);
    } else {
      console.error('Nombre maximum de tentatives de connexion atteint. Activation du mode simulation.');
      isSimulationMode = true;
    }
  }
}

/**
 * Configure les gestionnaires d'événements pour AMI
 */
function setupEventHandlers() {
  if (!ami) return;

  // Gestionnaire d'erreurs
  ami.on('error', (err) => {
    console.error('Erreur de connexion AMI:', err.message);
    isConnected = false;
    eventEmitter.emit('connectionChange', { connected: false, error: err });
    
    // Tenter de se reconnecter si nécessaire
    if (reconnectAttempts < config.asterisk.maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(`Tentative de reconnexion ${reconnectAttempts}/${config.asterisk.maxReconnectAttempts}...`);
      setTimeout(initializeAsteriskManager, config.asterisk.reconnectTimeout);
    } else {
      console.error('Nombre maximum de tentatives de reconnexion atteint');
    }
  });

  // Gestionnaire de connexion réussie
  ami.on('connect', () => {
    console.log('Connecté avec succès à Asterisk AMI');
    isConnected = true;
    reconnectAttempts = 0;
    reconnecting = false;
    clearConnectionTimeout();
    startKeepAlive();
    eventEmitter.emit('connectionChange', { connected: true });
  });

  // Gestionnaire de déconnexion
  ami.on('disconnect', () => {
    console.log('Déconnecté d\'Asterisk AMI');
    isConnected = false;
    eventEmitter.emit('connectionChange', { connected: false });
    
    // Nettoyer les intervalles
    clearKeepAlive();
    
    // Tenter de se reconnecter si nécessaire
    if (config.asterisk.reconnect && !reconnecting) {
      reconnecting = true;
      setTimeout(initializeAsteriskManager, config.asterisk.reconnectTimeout);
    }
  });
}

/**
 * Nettoie l'instance AMI existante
 */
function cleanupAmiInstance() {
  if (!ami) return;
  
  // Supprimer tous les écouteurs
  ami.removeAllListeners();
  
  // Nettoyer les intervalles
  clearKeepAlive();
  clearConnectionTimeout();
  
  // Fermer la connexion si elle est active
  if (isConnected) {
    try {
      ami.disconnect();
    } catch (err) {
      console.error('Erreur lors de la déconnexion d\'AMI:', err);
    }
  }
  
  ami = null;
  isConnected = false;
}

/**
 * Démarre le timeout de connexion
 */
function startConnectionTimeout() {
  clearConnectionTimeout();
  
  // Utiliser un délai plus long pour la connexion initiale (10 secondes)
  const timeoutDuration = config.asterisk.connectionTimeout || 10000;
  
  console.log(`Configuration du timeout de connexion à ${timeoutDuration}ms`);
  
  connectionTimeout = setTimeout(() => {
    if (!isConnected) {
      console.error('Timeout de connexion à Asterisk dépassé');
      console.error('Diagnostic:');
      console.error(`1. Vérifiez que le serveur Asterisk écoute sur ${config.asterisk.host}:${config.asterisk.port}`);
      console.error(`2. Vérifiez que l'utilisateur '${config.asterisk.username}' existe dans /etc/asterisk/manager.conf`);
      console.error(`3. Vérifiez que le mot de passe pour '${config.asterisk.username}' est correct`);
      console.error(`4. Vérifiez que l'utilisateur a les permissions nécessaires (read/write)`);
      
      eventEmitter.emit('connectionChange', { 
        connected: false, 
        error: new Error('Timeout de connexion à Asterisk dépassé') 
      });
      
      // Nettoyer l'instance AMI et préparer une nouvelle tentative
      cleanupAmiInstance();
    }
  }, timeoutDuration);
}

/**
 * Nettoie le timeout de connexion
 */
function clearConnectionTimeout() {
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }
}

/**
 * Démarre le keep-alive
 */
function startKeepAlive() {
  clearKeepAlive();
  
  if (config.asterisk.keepAlive) {
    keepAliveInterval = setInterval(() => {
      if (isConnected && ami) {
        ami.action({ Action: 'Ping' }, (err) => {
          if (err) {
            console.error('Erreur de keep-alive:', err.message);
            isConnected = false;
            eventEmitter.emit('connectionChange', { connected: false, error: err });
          }
        });
      }
    }, config.asterisk.keepAliveInterval);
  }
}

/**
 * Nettoie l'intervalle de keep-alive
 */
function clearKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

/**
 * Initialise les gestionnaires d'événements pour l'instance AMI
 */
function setupAmiEventHandlers() {
    if (!ami) return;

    // Gestionnaire d'erreurs global
    ami.on('error', (err) => {
        console.error('Erreur de connexion à Asterisk Manager Interface:', err);
        isConnected = false;
        
        // Activer le mode simulation uniquement après plusieurs échecs
        if (reconnectAttempts >= config.asterisk.maxReconnectAttempts) {
            isSimulationMode = true;
            console.log('Mode simulation activé après échecs de connexion répétés');
        }
    });

    // Gestionnaire de reconnexion
    ami.on('reconnection', () => {
        console.log('Reconnexion à Asterisk Manager Interface');
        isConnected = true;
        isSimulationMode = false;
    });

    // Gestionnaire d'erreurs internes
    ami.on('internalError', (error) => {
        console.error('Erreur interne AMI:', error);
        if (error && error.message) {
            console.error('Message d\'erreur:', error.message);
        }
    });
    
    // Gestionnaire de déconnexion
    ami.on('disconnect', () => {
        console.log('Déconnecté d\'Asterisk Manager Interface');
        isConnected = false;
        
        // Si la reconnexion automatique est désactivée dans la config, gérer manuellement
        if (!config.asterisk.reconnect && !reconnecting) {
            handleManualReconnect();
        }
    });
}



/**
 * Initialise le service Asterisk
 */
async function initializeAsteriskService() {
    if (isSimulationMode) {
        console.log('Mode simulation activé - Connexion à Asterisk désactivée');
        return;
    }

    try {
        console.log('Initialisation du gestionnaire AMI...');
        await initializeAsteriskManager();
        
        // Si nous sommes en mode simulation après l'initialisation, ne pas continuer
        if (isSimulationMode) {
            console.log('Mode simulation activé après tentative de connexion');
            return;
        }
        
        // Configurer les gestionnaires d'événements
        if (ami) {
            console.log('Configuration des gestionnaires d\'événements AMI...');
            
            // Gestionnaire de connexion
            ami.on('connect', () => {
                console.log('Connecté à Asterisk Manager Interface');
                isConnected = true;
                reconnectAttempts = 0;
                reconnecting = false;
                isSimulationMode = false;
                
                // Vérifier l'état des extensions SIP après la connexion
                setTimeout(() => {
                    checkAllSipExtensions().catch(err => {
                        console.error('Erreur lors de la vérification des extensions SIP:', err);
                    });
                }, 2000);
            });
            
            // Gestionnaire de déconnexion
            ami.on('disconnect', handleDisconnect);
            
            // Gestionnaire d'erreurs
            ami.on('error', (err) => {
                console.error('Erreur de connexion AMI:', err);
                isConnected = false;
                
                // Si nous avons dépassé le nombre maximum de tentatives, activer le mode simulation
                if (reconnectAttempts >= config.asterisk.maxReconnectAttempts) {
                    console.log('Activation du mode simulation après échecs de connexion répétés');
                    isSimulationMode = true;
                }
            });
        }
    } catch (error) {
        console.error('Échec de l\'initialisation AMI:', error);
        isSimulationMode = true;
    }
}

/**
 * Gère la déconnexion d'Asterisk
 */
function handleDisconnect() {
    console.log('Déconnexion détectée d\'Asterisk Manager Interface');
    isConnected = false;
    
    // Si la reconnexion automatique est désactivée dans la config, gérer manuellement
    if (!config.asterisk.reconnect && !reconnecting) {
        handleManualReconnect();
    }
}

/**
 * Gère la reconnexion manuelle à Asterisk
 */
function handleManualReconnect() {
    if (reconnecting) return;
    
    reconnecting = true;
    reconnectAttempts++;
    
    // Vérifier si le nombre maximal de tentatives est atteint
    const maxAttempts = config.asterisk.maxReconnectAttempts;
    const timeout = config.asterisk.reconnectTimeout;
    
    if (reconnectAttempts > maxAttempts) {
        console.log(`Nombre maximal de tentatives de reconnexion atteint (${maxAttempts}). Activation du mode simulation.`);
        isSimulationMode = true;
        reconnecting = false;
        return;
    }
    
    console.log(`Tentative de reconnexion ${reconnectAttempts}/${maxAttempts} programmée dans ${timeout}ms...`);
    
    setTimeout(() => {
        if (!isConnected && ami) {
            console.log('Tentative de reconnexion à Asterisk Manager Interface...');
            try {
                ami.connect();
            } catch (error) {
                console.error('Erreur lors de la tentative de reconnexion:', error);
                reconnecting = false;
                
                // Si toutes les tentatives échouent, activer le mode simulation
                if (reconnectAttempts >= maxAttempts) {
                    console.log('Activation du mode simulation après échec des reconnexions.');
                    isSimulationMode = true;
                } else {
                    // Réessayer la reconnexion
                    handleManualReconnect();
                }
            }
        } else {
            reconnecting = false;
        }
    }, timeout);
}

// Démarrer le service au chargement du module
initializeAsteriskService();

// Configurer le keepAlive si activé
if (config.asterisk.keepAlive) {
    console.log(`Configuration du keepAlive avec intervalle de ${config.asterisk.keepAliveInterval}ms`);
    // Le ping sera géré par asterisk-manager si keepAlive est activé
}

/**
 * Vérifie si le service est en mode simulation
 * @returns {boolean} True si en mode simulation, false sinon
 */
function isInSimulationMode() {
    return isSimulationMode;
}

/**
 * Vérifie si le service est connecté à Asterisk
 * @returns {boolean} True si connecté, false sinon
 */
function isAsteriskConnected() {
    return isConnected && !isSimulationMode;
}

// Fonction pour vérifier la configuration d'une extension SIP
function checkExtensionConfig(extension) {
    return new Promise((resolve, reject) => {
        const logPrefix = `[SIP:${extension}]`;
        console.log(`${logPrefix} Début de la vérification de la configuration`);
        
        if (!extension) {
            const errorMsg = 'Aucune extension fournie pour la vérification';
            console.error(`${logPrefix} ${errorMsg}`);
            return reject(new Error(errorMsg));
        }

        if (!isConnected) {
            const errorMsg = 'Pas connecté à Asterisk AMI';
            console.error(`${logPrefix} ${errorMsg}`);
            
            // Tenter de se reconnecter si possible
            if (reconnectAttempts < config.asterisk.maxReconnectAttempts) {
                console.log(`${logPrefix} Tentative de reconnexion...`);
                ami.connect();
            }
            
            return reject(new Error(errorMsg));
        }

        console.log(`${logPrefix} Envoi de la commande SIPshowpeer...`);
        
        // Ajouter un timeout généreux pour les connexions lentes
        const timeout = setTimeout(() => {
            const errorMsg = 'Timeout lors de la vérification de la configuration de l\'extension (30s écoulées)';
            console.error(`${logPrefix} ${errorMsg}`);
            console.error(`${logPrefix} Vérifiez que l'extension ${extension} existe dans la configuration SIP d'Asterisk`);
            console.error(`${logPrefix} Vérifiez également que le serveur Asterisk est accessible et répond aux commandes AMI`);
            reject(new Error(errorMsg));
        }, 30000); // 30 secondes de timeout pour les connexions lentes
        
        // Vérifier si l'instance ami est valide
        if (!ami || typeof ami.action !== 'function') {
            clearTimeout(timeout);
            const errorMsg = 'Instance AMI non initialisée ou invalide';
            console.error(`${logPrefix} ${errorMsg}`);
            return reject(new Error(errorMsg));
        }

        try {
            ami.action({
                Action: 'SIPshowpeer',
                Peer: extension
            }, (err, res) => {
                clearTimeout(timeout); // Annuler le timeout
                
                if (err) {
                    const errorMsg = `Erreur lors de la vérification de la configuration: ${err.message || 'Raison inconnue'}`;
                    console.error(`${logPrefix} ${errorMsg}`, {
                        error: err,
                        stack: err.stack
                    });
                    
                    // Vérifier si c'est une erreur de timeout AMI
                    if (err.message && err.message.includes('timeout')) {
                        console.error(`${logPrefix} Le serveur Asterisk ne répond pas dans le délai imparti`);
                        console.error(`${logPrefix} Vérifiez que le service Asterisk est en cours d'exécution`);
                        console.error(`${logPrefix} Vérifiez que le port AMI (${config.asterisk.port}) est accessible`);
                        console.error(`${logPrefix} Vérifiez les logs d'Asterisk pour des erreurs`);
                    }
                    
                    return reject(new Error(errorMsg));
                }
                
                // Vérifier si la réponse est valide
                if (!res) {
                    const errorMsg = 'Réponse vide du serveur Asterisk';
                    console.error(`${logPrefix} ${errorMsg}`);
                    return reject(new Error(errorMsg));
                }
                
                // Suite du traitement de la réponse...
                processSipShowpeerResponse(res);
            });
            
            // Fonction pour traiter la réponse de SIPshowpeer
            function processSipShowpeerResponse(res) {
                // Vérifier si nous avons le champ 'status' qui contient 'OK'
                const statusField = res.status || res.Status;
                const addressIp = res['address-ip'] || res.Address;
                const addressPort = res['address-port'] || res.Port;
                const userAgent = res['sip-useragent'] || res.UserAgent;
                
                // Déterminer si l'extension est en ligne
                const isOnline = statusField && statusField.includes('OK');
                
                console.log(`${logPrefix} Configuration récupérée:`, {
                    peerStatus: statusField || 'Inconnu',
                    ipAddress: addressIp || 'Non définie',
                    port: addressPort || 'Non défini',
                    context: res.context || res.Context || 'Non défini',
                    userAgent: userAgent || 'Non défini',
                    isOnline: isOnline,
                    isQualified: res.qualifyfreq !== undefined || res.QualifyFreq !== undefined
                });

                // Vérifier si l'extension est correctement configurée
                if (isOnline) {
                    console.log(`${logPrefix} Extension correctement configurée et en ligne`);
                } else if (statusField === 'UNKNOWN') {
                    console.warn(`${logPrefix} Extension inconnue ou mal configurée`);
                } else {
                    console.warn(`${logPrefix} État de l'extension:`, statusField);
                }

                // Ajouter des champs standardisés pour une utilisation cohérente
                resolve({
                    ...res,
                    Status: statusField,
                    Address: addressIp,
                    Port: addressPort,
                    UserAgent: userAgent,
                    isOnline: isOnline,
                    lastChecked: new Date().toISOString()
                });
            }
        } catch (error) {
            clearTimeout(timeout);
            const errorMsg = `Erreur lors de l'exécution de SIPshowpeer: ${error.message || 'Erreur inconnue'}`;
            console.error(`${logPrefix} ${errorMsg}`, {
                error: error,
                stack: error.stack
            });
            reject(new Error(errorMsg));
        }
    });
}

// Fonction pour vérifier l'état d'enregistrement SIP d'une extension
function checkSipRegistration(extension) {
    return new Promise((resolve, reject) => {
        const logPrefix = `[SIP:${extension}]`;
        console.log(`${logPrefix} Début de la vérification d'enregistrement SIP`);
        
        if (!extension) {
            const errorMsg = 'Aucune extension fournie pour la vérification SIP';
            console.error(`${logPrefix} ${errorMsg}`);
            return reject(new Error(errorMsg));
        }

        console.log(`${logPrefix} État de connexion AMI:`, { 
            isConnected, 
            isSimulationMode,
            reconnectAttempts
        });

        // Vérifier d'abord l'instance AMI
        if (!ami) {
            const errorMsg = 'Instance AMI non initialisée';
            console.error(`${logPrefix} ${errorMsg}`);
            
            // Essayer de réinitialiser la connexion
            if (reconnectAttempts < config.asterisk.maxReconnectAttempts) {
                console.log(`${logPrefix} Tentative de réinitialisation de la connexion...`);
                try {
                    initializeAsteriskManager();
                    return reject(new Error('Connexion en cours de réinitialisation, veuillez réessayer'));
                } catch (err) {
                    console.error(`${logPrefix} Échec de la réinitialisation:`, err);
                    return reject(new Error('Impossible de réinitialiser la connexion'));
                }
            }
            
            return reject(new Error(errorMsg));
        }
        
        // Vérifier la connexion AMI
        if (!isConnected) {
            const errorMsg = 'Pas connecté à Asterisk AMI';
            console.error(`${logPrefix} ${errorMsg}`);
            
            // Tenter de se reconnecter si possible
            if (reconnectAttempts < config.asterisk.maxReconnectAttempts) {
                console.log(`${logPrefix} Tentative de reconnexion...`);
                try {
                    ami.connect();
                } catch (err) {
                    console.error(`${logPrefix} Échec de la tentative de reconnexion:`, err);
                }
            }
            
            return reject(new Error(errorMsg));
        }

        console.log(`${logPrefix} Vérification de la configuration de l'extension...`);
        
        // Vérifier la configuration de l'extension
        checkExtensionConfig(extension)
            .then(configRes => {
                console.log(`${logPrefix} Configuration de l'extension vérifiée:`, {
                    peerStatus: configRes.Status || 'Inconnu',
                    ipAddress: configRes.Address || 'Inconnue'
                });
                
                console.log(`${logPrefix} Vérification de l'état d'enregistrement SIP...`);
                
                // Utiliser directement les informations de SIPshowpeer pour déterminer si l'extension est enregistrée
                // Si status contient "OK" et que nous avons une adresse IP, l'extension est considérée comme enregistrée
                const statusField = configRes.status || configRes.Status;
                const addressIp = configRes['address-ip'] || configRes.Address;
                const isOnline = statusField && statusField.includes('OK') && addressIp && addressIp !== '(null)';
                
                if (isOnline) {
                    console.log(`${logPrefix} Extension détectée comme enregistrée via SIPshowpeer`);
                    
                    // Extraire les informations importantes
                    const host = configRes['address-ip'] || 'Unknown';
                    const port = configRes['address-port'] || 'Unknown';
                    const userAgent = configRes['sip-useragent'] || 'Unknown';
                    const regContact = configRes['reg-contact'] || 'Unknown';
                    const status = configRes.Status || 'Unknown';
                    
                    return resolve({
                        success: true,
                        extension: extension,
                        registered: true,
                        host: host,
                        port: port,
                        userAgent: userAgent,
                        regContact: regContact,
                        status: status,
                        message: 'Extension enregistrée et active',
                        lastUpdated: new Date().toISOString(),
                        details: configRes
                    });
                }
                
                // Si nous n'avons pas pu déterminer l'état d'enregistrement à partir de SIPshowpeer,
                // vérifions avec SIPshowregistry comme méthode de secours
                console.log(`${logPrefix} Vérification supplémentaire avec SIPshowregistry...`);
                
                const timeout = setTimeout(() => {
                    const errorMsg = 'Timeout lors de la vérification de l\'enregistrement SIP';
                    console.error(`${logPrefix} ${errorMsg}`);
                    reject(new Error(errorMsg));
                }, 10000); // 10 secondes de timeout
                
                ami.action({ 
                    Action: 'SIPshowregistry', 
                    Filter: `Peer=${extension}` 
                }, (err, res) => {
                    clearTimeout(timeout); // Annuler le timeout
                    
                    if (err) {
                        const errorMsg = `Erreur lors de la vérification de l'enregistrement SIP: ${err.message || 'Raison inconnue'}`;
                        console.error(`${logPrefix} ${errorMsg}`, {
                            error: err,
                            stack: err.stack
                        });
                        return reject(new Error(errorMsg));
                    }

                    console.log(`${logPrefix} Réponse SIPshowregistry reçue:`, {
                        hasEvents: !!(res?.events?.length),
                        eventCount: res?.events?.length || 0
                    });

                    // Si nous avons déjà déterminé que l'extension est enregistrée via SIPshowpeer,
                    // nous n'avons pas besoin de continuer
                    if (!res || !res.events || res.events.length === 0) {
                        console.log(`${logPrefix} Aucun enregistrement SIP trouvé via SIPshowregistry`);
                        
                        // Vérifier une dernière fois si l'extension est active via SIPpeers
                        return checkSipPeerStatus(extension)
                            .then(peerStatus => {
                                if (peerStatus.isRegistered) {
                                    return resolve({
                                        success: true,
                                        extension: extension,
                                        registered: true,
                                        host: peerStatus.host || 'Unknown',
                                        port: peerStatus.port || 'Unknown',
                                        userAgent: 'Unknown',
                                        status: 'Enregistré',
                                        message: 'Extension enregistrée via SIPpeers',
                                        lastUpdated: new Date().toISOString()
                                    });
                                } else {
                                    return resolve({
                                        success: true,
                                        extension: extension,
                                        registered: false,
                                        host: 'Unknown',
                                        port: 'Unknown',
                                        userAgent: 'Unknown',
                                        status: 'Non enregistré',
                                        message: 'Extension non enregistrée dans Asterisk',
                                        lastUpdated: new Date().toISOString()
                                    });
                                }
                            })
                            .catch(err => {
                                console.error(`${logPrefix} Erreur lors de la vérification SIPpeers:`, err);
                                return resolve({
                                    success: true,
                                    extension: extension,
                                    registered: false,
                                    host: 'Unknown',
                                    port: 'Unknown',
                                    userAgent: 'Unknown',
                                    status: 'Non enregistré',
                                    message: 'Extension non enregistrée dans Asterisk',
                                    lastUpdated: new Date().toISOString()
                                });
                            });
                    }

                    // Analyser la réponse
                    const registration = res.events[0];
                    const isRegistered = registration.Status === 'Registered';
                    
                    console.log(`${logPrefix} État d'enregistrement SIP:`, {
                        registered: isRegistered,
                        status: registration.Status,
                        host: registration.Host || 'Non défini',
                        port: registration.Port || 'Non défini',
                        userAgent: registration.UserAgent || 'Non défini'
                    });

                    resolve({
                        success: true,
                        extension: extension,
                        registered: isRegistered,
                        host: registration.Host || 'Unknown',
                        port: registration.Port || 'Unknown',
                        userAgent: registration.UserAgent || 'Unknown',
                        status: registration.Status || 'Unknown',
                        message: isRegistered ? 'Extension enregistrée' : 'Extension non enregistrée',
                        lastUpdated: new Date().toISOString()
                    });
                });
            })
            .catch(err => {
                console.error(`${logPrefix} Erreur lors de la vérification de la configuration:`, {
                    message: err.message,
                    stack: err.stack
                });
                
                // Si c'est une erreur de configuration, on peut quand même essayer de vérifier l'état d'enregistrement
                console.log(`${logPrefix} Tentative de vérification de l'état d'enregistrement malgré l'erreur de configuration...`);
                
                const timeout = setTimeout(() => {
                    console.error(`${logPrefix} Timeout lors de la vérification de l'enregistrement SIP (après erreur de configuration)`);
                    reject(new Error('Timeout lors de la vérification de l\'enregistrement SIP'));
                }, 10000);
                
                ami.action({ 
                    Action: 'SIPshowpeer',
                    Peer: extension
                }, (peerErr, peerRes) => {
                    clearTimeout(timeout);
                    
                    if (peerErr) {
                        console.error(`${logPrefix} Échec de la vérification de l'état du peer:`, peerErr);
                        return reject(new Error(`Impossible de vérifier l'état du peer: ${peerErr.message || 'Erreur inconnue'}`));
                    }
                    
                    const peerStatus = peerRes.Status || 'Unknown';
                    const isRegistered = peerStatus === 'OK';
                    
                    console.log(`${logPrefix} État du peer récupéré directement:`, {
                        peerStatus,
                        isRegistered,
                        ipAddress: peerRes.Address || 'Inconnue'
                    });
                    
                    resolve({
                        success: true,
                        extension: extension,
                        registered: isRegistered,
                        host: peerRes.Address || 'Unknown',
                        port: peerRes.Port || 'Unknown',
                        userAgent: 'Unknown',
                        status: peerStatus,
                        message: isRegistered ? 'Extension enregistrée (via peer)' : 'Extension non enregistrée (via peer)',
                        lastUpdated: new Date().toISOString(),
                        fromPeerCheck: true
                    });
                });
            });
    });
}


/**
 * Vérifie l'état d'une extension SIP spécifique en utilisant SIPpeers
 * @param {string} extension - L'extension SIP à vérifier
 * @returns {Promise<Object>} - Promesse résolue avec l'état de l'extension
 */
function checkSipPeerStatus(extension) {
    return new Promise((resolve, reject) => {
        const logPrefix = `[SIP:${extension}]`;
        
        if (!isConnected || isSimulationMode) {
            console.log(`${logPrefix} Mode simulation ou non connecté: Simulation de l'état du peer`);
            return resolve({
                isRegistered: false,
                status: 'Simulé',
                host: 'Simulé',
                port: 'Simulé'
            });
        }
        
        console.log(`${logPrefix} Vérification de l'état via SIPpeers...`);
        
        ami.action({ Action: 'SIPpeers' }, (err, res) => {
            if (err) {
                console.error(`${logPrefix} Erreur lors de la récupération des peers SIP:`, err);
                return reject(err);
            }
            
            if (!res) {
                console.log(`${logPrefix} Aucune réponse de SIPpeers`);
                return resolve({ isRegistered: false });
            }
            
            // Afficher la réponse complète pour le débogage
            console.log(`${logPrefix} Réponse SIPpeers reçue:`, {
                hasResponse: !!res,
                hasEvents: !!(res.events && res.events.length),
                eventCount: res.events ? res.events.length : 0,
                responseKeys: res ? Object.keys(res) : []
            });
            
            // Vérifier si nous avons des événements
            if (!res.events || !Array.isArray(res.events) || res.events.length === 0) {
                console.log(`${logPrefix} Aucun événement dans la réponse SIPpeers`);
                
                // Essayer de vérifier directement avec la commande CLI
                return checkExtensionWithCLI(extension)
                    .then(cliResult => {
                        return resolve(cliResult);
                    })
                    .catch(() => {
                        return resolve({ isRegistered: false });
                    });
            }
            
            // Filtrer les événements PeerEntry pour trouver l'extension spécifique
            const peerEntries = res.events.filter(event => 
                event.event === 'PeerEntry' && 
                (event.objectname === extension || event.objectname.startsWith(`${extension}/`))
            );
            
            if (peerEntries.length === 0) {
                console.log(`${logPrefix} Extension non trouvée dans la liste des peers SIP`);
                return resolve({ isRegistered: false });
            }
            
            // Analyser l'état de l'extension
            const peer = peerEntries[0];
            console.log(`${logPrefix} Peer SIP trouvé:`, {
                objectName: peer.objectname,
                status: peer.status,
                address: peer.ipaddress,
                port: peer.ipport
            });
            
            // Vérifier si l'extension est enregistrée (statut OK)
            const isRegistered = peer.status && peer.status.includes('OK');
            const ipParts = peer.ipaddress ? peer.ipaddress.split('/') : [];
            const host = ipParts.length > 0 ? ipParts[0] : 'Unknown';
            
            return resolve({
                isRegistered,
                status: peer.status || 'Unknown',
                host,
                port: peer.ipport || 'Unknown',
                dynamic: peer.dynamic === 'yes',
                objectName: peer.objectname
            });
        });
    });
}

/**
 * Vérifie l'état d'une extension SIP en utilisant une commande CLI Asterisk
 * @param {string} extension - L'extension SIP à vérifier
 * @returns {Promise<Object>} - Promesse résolue avec l'état de l'extension
 */
function checkExtensionWithCLI(extension) {
    return new Promise((resolve, reject) => {
        const logPrefix = `[SIP:${extension}]`;
        
        if (!isConnected || isSimulationMode) {
            console.log(`${logPrefix} Mode simulation ou non connecté: Simulation de l'état du peer via CLI`);
            return resolve({
                isRegistered: false,
                status: 'Simulé',
                host: 'Simulé',
                port: 'Simulé'
            });
        }
        
        console.log(`${logPrefix} Vérification de l'état via commande CLI...`);
        
        // Utiliser la commande 'sip show peer' pour obtenir les informations de l'extension
        ami.action({
            Action: 'Command',
            Command: `sip show peer ${extension}`
        }, (err, res) => {
            if (err) {
                console.error(`${logPrefix} Erreur lors de l'exécution de la commande CLI:`, err);
                return reject(err);
            }
            
            if (!res || !res.data) {
                console.log(`${logPrefix} Aucune réponse valide de la commande CLI`);
                return resolve({ isRegistered: false });
            }
            
            // Analyser la sortie de la commande
            const output = res.data;
            console.log(`${logPrefix} Réponse CLI reçue, longueur: ${output.length} caractères`);
            
            // Vérifier si l'extension existe
            if (output.includes('Peer not found')) {
                console.log(`${logPrefix} Extension non trouvée via CLI`);
                return resolve({ isRegistered: false });
            }
            
            // Extraire les informations importantes
            const statusMatch = output.match(/Status\s*:\s*([^\r\n]+)/);
            const addressMatch = output.match(/Addr->IP\s*:\s*([^\r\n]+)/);
            const userAgentMatch = output.match(/Useragent\s*:\s*([^\r\n]+)/);
            
            const status = statusMatch ? statusMatch[1].trim() : 'Unknown';
            const address = addressMatch ? addressMatch[1].trim() : 'Unknown';
            const userAgent = userAgentMatch ? userAgentMatch[1].trim() : 'Unknown';
            
            // Déterminer si l'extension est enregistrée
            const isRegistered = status.includes('OK');
            
            console.log(`${logPrefix} Informations extraites via CLI:`, {
                status,
                address,
                userAgent,
                isRegistered
            });
            
            // Extraire l'adresse IP et le port
            let host = 'Unknown';
            let port = 'Unknown';
            
            if (address && address !== 'Unknown') {
                const parts = address.split(':');
                host = parts[0];
                port = parts.length > 1 ? parts[1] : 'Unknown';
            }
            
            return resolve({
                isRegistered,
                status,
                host,
                port,
                userAgent,
                source: 'CLI'
            });
        });
    });
}

// Fonction pour vérifier toutes les extensions SIP enregistrées
function checkAllSipExtensions() {
    if (!isConnected || isSimulationMode) {
        console.log('Mode simulation ou non connecté: Impossible de vérifier toutes les extensions SIP');
        return Promise.resolve([]);
    }
    
    return new Promise((resolve, reject) => {
        ami.action({ Action: 'SIPpeers' }, (err, res) => {
            if (err) {
                console.error('Erreur lors de la récupération des peers SIP:', err);
                reject(err);
            } else {
                console.log('Liste des peers SIP reçue');
                
                // Récupérer les événements PeerEntry qui contiennent les informations sur les extensions
                if (res && res.events) {
                    const peerEntries = res.events.filter(event => event.event === 'PeerEntry');
                    console.log(`${peerEntries.length} extensions SIP trouvées`);
                    
                    // Pour chaque extension, vérifier son état d'enregistrement
                    const registrationPromises = peerEntries.map(peer => {
                        const objectName = peer.objectname;
                        return checkSipRegistration(objectName);
                    });
                    
                    Promise.all(registrationPromises)
                        .then(results => {
                            console.log('Vérification de toutes les extensions terminée');
                            resolve(results);
                        })
                        .catch(error => {
                            console.error('Erreur lors de la vérification des extensions:', error);
                            reject(error);
                        });
                } else {
                    console.log('Aucune extension SIP trouvée ou format de réponse inattendu');
                    resolve([]);
                }
            }
        });
    });
}

// Fonction pour récupérer les canaux actifs pour une extension
function getActiveChannels(extension) {
    return new Promise((resolve, reject) => {
        // Si en mode simulation, simuler des canaux actifs
        if (isSimulationMode || !isConnected) {
            console.log('Mode simulation: Simulation de canaux actifs');
            resolve({
                success: true,
                extension: extension,
                channels: [],
                message: 'Simulated active channels'
            });
            return;
        }

        // Si connecté à Asterisk, récupérer les canaux actifs réels
        ami.action({ Action: 'CoreShowChannels' }, (err, res) => {
            if (err) {
                console.error('Erreur lors de la récupération des canaux actifs:', err);
                reject(err);
            } else {
                console.log('Réponse CoreShowChannels reçue');
                
                // Filtrer les canaux pour l'extension spécifiée
                let channels = [];
                if (res && res.events) {
                    channels = res.events
                        .filter(event => 
                            event.channel && 
                            event.event === 'CoreShowChannel' && 
                            event.channel.includes(`SIP/${extension}`))
                        .map(event => ({
                            channel: event.channel,
                            state: event.channelstatedesc,
                            callerIdNum: event.calleridnum,
                            callerIdName: event.calleridname,
                            duration: event.duration,
                            application: event.application,
                            bridgedChannel: event.bridgedchannel || null
                        }));
                }
                
                console.log(`${channels.length} canaux actifs trouvés pour l'extension ${extension}`);
                
                resolve({
                    success: true,
                    extension: extension,
                    channels: channels,
                    count: channels.length,
                    message: channels.length > 0 ? 'Canaux actifs trouvés' : 'Aucun canal actif'
                });
            }
        });
    });
}

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
            Action: 'Originate',
            Channel: `SIP/${agentExtension}`,
            Context: 'from-internal', // Contexte pour les appels sortants
            Exten: phoneNumber,
            Priority: 1,
            CallerID: `Agent ${agentId} <${agentExtension}>`,
            Variable: `UNIQUEID=${callId},OUTBOUND_CALL=1,CAMPAIGN_ID=${campaignId || 'default'}`,
            Async: 'yes'
        };

        // Exécuter l'action Originate
        ami.action({ Action: 'Originate', ...originateParams }, (err, res) => {
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
function setAgentStatus(agentId, status, campaignId, pauseCode = null) {
    return new Promise((resolve, reject) => {
        // Si en mode simulation, simuler un changement de statut réussi
        if (isSimulationMode || !isConnected) {
            console.log('Mode simulation: Simulation d\'un changement de statut réussi');
            console.log(`Simulation: Agent ${agentId} dans la campagne ${campaignId} passe au statut ${status}`);
            
            if (status === 'PAUSED' && pauseCode) {
                console.log(`Simulation: Code de pause utilisé: ${pauseCode}`);
            }
            
            // Simuler un délai pour le changement de statut
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'Changement de statut simulé avec succès',
                    agentId,
                    status,
                    campaignId,
                    pauseCode: status === 'PAUSED' ? pauseCode : null
                });
            }, 200);
            return;
        }
        
        console.log(`Tentative de changement de statut pour l'agent ${agentId} vers ${status} dans la campagne ${campaignId}`);
        if (status === 'PAUSED' && pauseCode) {
            console.log(`Code de pause spécifié: ${pauseCode}`);
        }
        
        // Vérifier d'abord si l'extension SIP est enregistrée
        checkSipRegistration(agentId)
            .then(sipStatus => {
                if (!sipStatus.registered) {
                    console.warn(`Extension SIP ${agentId} non enregistrée, impossible de changer le statut`);
                    return resolve({
                        success: false,
                        message: 'Extension SIP non enregistrée',
                        agentId,
                        status,
                        campaignId,
                        pauseCode: status === 'PAUSED' ? pauseCode : null
                    });
                }
                
                // Dans ViciDial, les agents sont gérés différemment
                // Essayons d'abord avec l'interface SIP standard
                const sipInterface = `SIP/${agentId}`;
                
                console.log(`Tentative avec l'interface ${sipInterface}...`);
                
                // Préparer les variables pour l'action
                const statusParams = {
                    Action: 'QueuePause',
                    Interface: sipInterface,
                    Paused: status === 'PAUSED' ? 'true' : 'false',
                    Reason: status === 'PAUSED' && pauseCode ? `${status}_${pauseCode}` : status
                };
                
                // Si un ID de campagne est fourni, l'ajouter aux paramètres
                if (campaignId) {
                    statusParams.Queue = `Campaign_${campaignId}`;
                }
                
                // Exécuter l'action
                ami.action(statusParams, (err, res) => {
                    if (err || (res && res.response === 'Error')) {
                        console.error(`Erreur lors de la définition du statut ${status} pour l'agent ${agentId}:`, err || res);
                        
                        // Essayer avec l'interface Local en cas d'échec
                        console.log(`Tentative avec l'interface Local/${agentId}@from-internal...`);
                        
                        const localParams = {
                            ...statusParams,
                            Interface: `Local/${agentId}@from-internal`
                        };
                        
                        ami.action(localParams, (localErr, localRes) => {
                            if (localErr || (localRes && localRes.response === 'Error')) {
                                console.error(`Erreur avec l'interface Local:`, localErr || localRes);
                                
                                // Utiliser une approche alternative compatible avec ViciDial
                                console.log('Utilisation d\'une approche alternative pour ViciDial...');
                                
                                // Simuler un changement de statut réussi pour le moment
                                resolve({
                                    success: true,
                                    message: 'Changement de statut simulé (ViciDial)',
                                    agentId,
                                    status,
                                    campaignId,
                                    pauseCode: status === 'PAUSED' ? pauseCode : null,
                                    simulated: true
                                });
                            } else {
                                console.log(`Statut ${status} défini avec succès pour l'agent ${agentId} via Local:`, localRes);
                                resolve({
                                    ...localRes,
                                    success: true,
                                    agentId,
                                    status,
                                    campaignId,
                                    pauseCode: status === 'PAUSED' ? pauseCode : null
                                });
                            }
                        });
                    } else {
                        console.log(`Statut ${status} défini avec succès pour l'agent ${agentId}:`, res);
                        resolve({
                            ...res,
                            success: true,
                            agentId,
                            status,
                            campaignId,
                            pauseCode: status === 'PAUSED' ? pauseCode : null
                        });
                    }
                });
            })
            .catch(err => {
                console.error(`Erreur lors de la vérification de l'extension SIP ${agentId}:`, err);
                reject(err);
            });
    });
}

/**
 * Effectue un appel de synchronisation vers l'extension de l'agent
 * Cette fonction est utilisée pour vérifier que l'agent est prêt à recevoir des appels
 * @param {string} extension - L'extension SIP de l'agent
 * @param {string} agentId - L'identifiant de l'agent
 * @returns {Promise<Object>} - Promesse résolue avec le résultat de l'appel
 */
function makeSyncCall(extension, agentId) {
    return new Promise((resolve, reject) => {
        // Si en mode simulation, simuler un appel de synchronisation réussi
        if (isSimulationMode || !isConnected) {
            console.log(`Mode simulation: Simulation d'un appel de synchronisation vers l'extension ${extension}`);
            
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'Appel de synchronisation simulé avec succès',
                    extension,
                    agentId
                });
            }, 300);
            return;
        }
        
        try {
            console.log(`Tentative d'appel de synchronisation vers l'extension ${extension} pour l'agent ${agentId}`);
            
            // Nettoyer l'extension (retirer le préfixe SIP/ s'il existe)
            const cleanExtension = extension.replace(/^SIP\//i, '');
            
            // Utiliser l'action Originate pour effectuer un appel vers l'extension
            const originateParams = {
                ActionID: `sync-${Date.now()}`,
                Channel: `SIP/${cleanExtension}`,
                Exten: 's',              // Extension spéciale pour les appels de synchronisation
                Context: 'from-internal', // Contexte standard pour les appels internes
                Priority: 1,
                Timeout: 10000,          // 10 secondes de timeout
                CallerID: `Sync <${cleanExtension}>`, // ID d'appelant personnalisé
                Async: 'true',           // Appel asynchrone
                Application: 'Playback', // Application à exécuter quand l'appel est répondu
                Data: 'agent-loginok'    // Message à jouer ("Agent connecté avec succès")
            };
            
            // Exécuter l'action Originate
            ami.action({ Action: 'Originate', ...originateParams }, (err, res) => {
                if (err) {
                    console.error(`Erreur lors de l'appel de synchronisation vers ${cleanExtension}:`, err);
                    
                    // Essayer une approche alternative - utiliser la commande CLI
                    console.log('Tentative avec une approche alternative (commande CLI)...');
                    
                    const command = `originate SIP/${cleanExtension} extension s@from-internal`;
                    
                    ami.action({
                        Action: 'Command',
                        Command: command
                    }, (cliErr, cliRes) => {
                        if (cliErr) {
                            console.error('Erreur avec la méthode alternative CLI:', cliErr);
                            // On résout quand même pour ne pas bloquer la connexion de l'agent
                            resolve({
                                success: false,
                                message: 'Échec de l\'appel de synchronisation, mais connexion autorisée',
                                extension: cleanExtension,
                                error: cliErr.message
                            });
                        } else {
                            console.log(`Appel de synchronisation effectué avec succès (méthode CLI) vers ${cleanExtension}`);
                            resolve({
                                success: true,
                                message: 'Appel de synchronisation effectué avec succès (méthode CLI)',
                                extension: cleanExtension,
                                response: cliRes
                            });
                        }
                    });
                } else {
                    console.log(`Appel de synchronisation effectué avec succès vers ${cleanExtension}:`, res);
                    resolve({
                        success: true,
                        message: 'Appel de synchronisation effectué avec succès',
                        extension: cleanExtension,
                        response: res
                    });
                }
            });
        } catch (error) {
            console.error(`Exception lors de l'appel de synchronisation:`, error);
            // On résout quand même pour ne pas bloquer la connexion de l'agent
            resolve({
                success: false,
                message: 'Exception lors de l\'appel de synchronisation, mais connexion autorisée',
                extension,
                error: error.message
            });
        }
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
        
        // Si connecté à Asterisk, essayer d'utiliser les commandes CLI disponibles
        try {
            console.log(`Tentative de démarrage du composeur prédictif pour la campagne ${campaignId} au niveau ${level}`);
            
            // D'abord, obtenir la liste des commandes disponibles pour voir ce qui est disponible
            ami.action({
                Action: 'Command',
                Command: 'core show help'
            }, (err, res) => {
                if (err) {
                    console.error('Erreur lors de la récupération des commandes disponibles:', err);
                    // Continuer avec la méthode alternative
                    useAlternativeMethod();
                    return;
                }
                
                console.log('Liste des commandes disponibles obtenue, recherche des commandes ViciDial...');
                
                // Essayer la commande 'campaign' qui peut être disponible dans certaines installations ViciDial
                ami.action({
                    Action: 'Command',
                    Command: `campaign dial_level ${campaignId} ${level}`
                }, (campaignErr, campaignRes) => {
                    if (campaignErr || (campaignRes && campaignRes.content && campaignRes.content.includes('No such command'))) {
                        console.log('Commande campaign dial_level non disponible, essai avec dialplan reload...');
                        
                        // Essayer de recharger le dialplan pour appliquer les changements
                        ami.action({
                            Action: 'Command',
                            Command: 'dialplan reload'
                        }, (dialplanErr, dialplanRes) => {
                            // Quelle que soit l'issue, utiliser la méthode alternative
                            console.log('Rechargement du dialplan terminé, utilisation de la méthode alternative...');
                            useAlternativeMethod();
                        });
                    } else {
                        console.log(`Commande campaign dial_level exécutée avec succès pour ${campaignId}:`, campaignRes);
                        // Mettre à jour la base de données également pour assurer la cohérence
                        updateCampaignDialLevel(campaignId, level)
                            .then(() => {
                                resolve({
                                    success: true,
                                    message: 'Composeur démarré avec succès via Asterisk CLI',
                                    campaignId,
                                    level,
                                    method: 'cli',
                                    response: campaignRes
                                });
                            })
                            .catch(dbErr => {
                                console.warn('Avertissement: Mise à jour de la base de données échouée après CLI réussi:', dbErr);
                                // Continuer quand même car la commande CLI a réussi
                                resolve({
                                    success: true,
                                    message: 'Composeur démarré avec succès via Asterisk CLI (sans mise à jour DB)',
                                    campaignId,
                                    level,
                                    method: 'cli',
                                    response: campaignRes
                                });
                            });
                    }
                });
            });
            
            // Fonction pour utiliser la méthode alternative (mise à jour de la base de données)
            function useAlternativeMethod() {
                console.log('Utilisation de la méthode alternative (mise à jour de la base de données)...');
                updateCampaignDialLevel(campaignId, level)
                    .then(result => {
                        console.log(`Composeur prédictif démarré avec succès pour la campagne ${campaignId} via DB`);
                        resolve({
                            success: true,
                            message: 'Composeur démarré avec succès via base de données',
                            campaignId,
                            level,
                            method: 'database',
                            result
                        });
                    })
                    .catch(dbErr => {
                        console.error(`Erreur lors du démarrage du composeur prédictif pour la campagne ${campaignId}:`, dbErr);
                        reject(dbErr);
                    });
            }
        
        } catch (error) {
            console.error(`Exception lors du démarrage du composeur prédictif:`, error);
            reject(error);
        }
    });
}

// Fonction auxiliaire pour mettre à jour le niveau de composition dans la base de données
function updateCampaignDialLevel(campaignId, level) {
    const db = require('../config/bd');
    return new Promise(async (resolve, reject) => {
        try {
            // Convertir le niveau en nombre si c'est 'AUTO', utiliser une valeur par défaut de 1.0
            const dialLevel = level === 'AUTO' ? 1.0 : parseFloat(level);
            
            // Mettre à jour la table vicidial_campaigns
            const [result] = await db.query(
                'UPDATE vicidial_campaigns SET auto_dial_level = ? WHERE campaign_id = ?',
                [dialLevel, campaignId]
            );
            
            if (result.affectedRows === 0) {
                reject(new Error(`Aucune campagne trouvée avec l'ID ${campaignId}`));
            } else {
                resolve({
                    success: true,
                    affectedRows: result.affectedRows
                });
            }
        } catch (error) {
            reject(error);
        }
    });
}

// Fonction auxiliaire pour mettre à jour le niveau de composition à 0 dans la base de données
function stopCampaignDialing(campaignId) {
    const db = require('../config/bd');
    return new Promise(async (resolve, reject) => {
        try {
            // Mettre à jour la table vicidial_campaigns pour arrêter la composition
            const [result] = await db.query(
                'UPDATE vicidial_campaigns SET auto_dial_level = 0 WHERE campaign_id = ?',
                [campaignId]
            );
            
            if (result.affectedRows === 0) {
                reject(new Error(`Aucune campagne trouvée avec l'ID ${campaignId}`));
            } else {
                resolve({
                    success: true,
                    affectedRows: result.affectedRows
                });
            }
        } catch (error) {
            reject(error);
        }
    });
}

// Fonction pour arrêter le composeur prédictif
function stopPredictiveDialer(campaignId) {
    return new Promise((resolve, reject) => {
        console.log(`Début de l'arrêt du composeur prédictif pour la campagne ${campaignId}`);
        
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
        
        // Si connecté à Asterisk, essayer différentes commandes CLI disponibles
        try {
            console.log(`Tentative d'arrêt du composeur prédictif pour la campagne ${campaignId}`);
            
            // D'abord, essayer de trouver les commandes disponibles
            ami.action({
                Action: 'Command',
                Command: 'core show help'
            }, (err, res) => {
                if (err) {
                    console.error('Erreur lors de la récupération des commandes disponibles:', err);
                    // Continuer avec la méthode alternative
                    useAlternativeMethod();
                    return;
                }
                
                console.log('Liste des commandes disponibles obtenue, recherche des commandes ViciDial...');
                
                // Essayer la commande 'campaign' qui peut être disponible dans certaines installations ViciDial
                ami.action({
                    Action: 'Command',
                    Command: `campaign dial_level ${campaignId} 0`
                }, (campaignErr, campaignRes) => {
                    if (campaignErr || (campaignRes && campaignRes.content && campaignRes.content.includes('No such command'))) {
                        console.log('Commande campaign dial_level non disponible, essai avec vdad stop...');
                        
                        // Essayer la commande 'vdad stop' qui peut être disponible dans certaines installations ViciDial
                        ami.action({
                            Action: 'Command',
                            Command: `vdad stop ${campaignId}`
                        }, (vdadErr, vdadRes) => {
                            if (vdadErr || (vdadRes && vdadRes.content && vdadRes.content.includes('No such command'))) {
                                console.log('Commande vdad stop non disponible, essai avec dialplan reload...');
                                
                                // Essayer de recharger le dialplan pour appliquer les changements
                                ami.action({
                                    Action: 'Command',
                                    Command: 'dialplan reload'
                                }, (dialplanErr, dialplanRes) => {
                                    // Quelle que soit l'issue, utiliser la méthode alternative
                                    console.log('Rechargement du dialplan terminé, utilisation de la méthode alternative...');
                                    useAlternativeMethod();
                                });
                            } else {
                                console.log(`Commande vdad stop exécutée avec succès pour ${campaignId}:`, vdadRes);
                                // Mettre à jour la base de données également pour assurer la cohérence
                                stopCampaignDialing(campaignId)
                                    .then(() => {
                                        resolve({
                                            success: true,
                                            message: 'Composeur arrêté avec succès via Asterisk CLI (vdad stop)',
                                            campaignId,
                                            method: 'cli',
                                            response: vdadRes
                                        });
                                    })
                                    .catch(dbErr => {
                                        console.warn('Avertissement: Mise à jour de la base de données échouée après CLI réussi:', dbErr);
                                        // Continuer quand même car la commande CLI a réussi
                                        resolve({
                                            success: true,
                                            message: 'Composeur arrêté avec succès via Asterisk CLI (sans mise à jour DB)',
                                            campaignId,
                                            method: 'cli',
                                            response: vdadRes
                                        });
                                    });
                            }
                        });
                    } else {
                        console.log(`Commande campaign dial_level exécutée avec succès pour ${campaignId}:`, campaignRes);
                        // Mettre à jour la base de données également pour assurer la cohérence
                        stopCampaignDialing(campaignId)
                            .then(() => {
                                resolve({
                                    success: true,
                                    message: 'Composeur arrêté avec succès via Asterisk CLI',
                                    campaignId,
                                    method: 'cli',
                                    response: campaignRes
                                });
                            })
                            .catch(dbErr => {
                                console.warn('Avertissement: Mise à jour de la base de données échouée après CLI réussi:', dbErr);
                                // Continuer quand même car la commande CLI a réussi
                                resolve({
                                    success: true,
                                    message: 'Composeur arrêté avec succès via Asterisk CLI (sans mise à jour DB)',
                                    campaignId,
                                    method: 'cli',
                                    response: campaignRes
                                });
                            });
                    }
                });
            });
            
            // Fonction pour utiliser la méthode alternative (mise à jour de la base de données)
            function useAlternativeMethod() {
                console.log('Utilisation de la méthode alternative (mise à jour de la base de données)...');
                stopCampaignDialing(campaignId)
                    .then(result => {
                        console.log(`Composeur prédictif arrêté avec succès pour la campagne ${campaignId} via DB`);
                        resolve({
                            success: true,
                            message: 'Composeur arrêté avec succès via base de données',
                            campaignId,
                            method: 'database',
                            result
                        });
                    })
                    .catch(dbErr => {
                        console.error(`Erreur lors de l'arrêt du composeur prédictif pour la campagne ${campaignId}:`, dbErr);
                        reject(dbErr);
                    });
            }
        } catch (error) {
            console.error(`Exception lors de l'arrêt du composeur prédictif:`, error);
            
            // Essayer la méthode alternative en cas d'exception
            console.log('Exception attrapée, tentative avec la méthode alternative...');
            stopCampaignDialing(campaignId)
                .then(result => {
                    resolve({
                        success: true,
                        message: 'Composeur arrêté avec succès après exception',
                        campaignId,
                        method: 'database',
                        result
                    });
                })
                .catch(dbErr => {
                    reject(dbErr);
                });
        }
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
      
      // Essayer de se reconnecter si on est déconnecté mais pas en mode simulation
      if (!isConnected && !isSimulationMode && config.asterisk.reconnect) {
        console.log('Tentative de reconnexion avant d\'exécuter l\'action...');
        try {
          ami.connect();
          // Attendre un peu pour voir si la connexion s'établit
          setTimeout(() => {
            if (isConnected) {
              // Si reconnecté, réessayer l'action réelle
              console.log('Reconnexion réussie, nouvelle tentative de fin d\'appel');
              endCall(callId).then(resolve).catch(reject);
              return;
            } else {
              // Sinon, continuer en mode simulation
              console.log('Reconnexion échouée, poursuite en mode simulation');
              resolve({
                success: true,
                message: 'Fin d\'appel simulée avec succès',
                callId
              });
            }
          }, 2000); // Attendre 2 secondes pour la reconnexion
          return;
        } catch (error) {
          console.error('Erreur lors de la tentative de reconnexion:', error);
        }
      }
      
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
    ami.action({ Action: 'Hangup', ...hangupParams }, (err, res) => {
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
    ami.action({ Action: 'Status', ...statusParams }, (err, res) => {
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

/**
 * Récupère l'état actuel de la connexion Asterisk
 * @returns {Object} - État de la connexion Asterisk
 */
function getAsteriskStatus() {
  return {
    connected: isConnected,
    simulationMode: isSimulationMode,
    reconnectAttempts: reconnectAttempts,
    reconnecting: reconnecting,
    host: config.asterisk.host,
    port: config.asterisk.port
  };
}

module.exports = {
    initiateCall,
    endCall,
    startPredictiveDialer,
    stopPredictiveDialer,
    checkSipRegistration,
    checkExtensionConfig,
    getActiveChannels,
    setAgentStatus,
    formatPhoneNumber,
    getCallDetails,
    getAsteriskStatus,
    isInSimulationMode,
    isAsteriskConnected,
    makeSyncCall,
    // Exposer l'instance AMI pour les tests directs
    get ami() {
        return ami;
    }
};
