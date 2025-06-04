/**
 * Configuration globale de l'application
 * Les valeurs peuvent être surchargées par des variables d'environnement
 * Format des variables d'environnement :
 * - DB_* pour la base de données
 * - ASTERISK_* pour la configuration Asterisk
 * - JWT_* pour la configuration JWT
 * - PORT pour le port du serveur
 * - NODE_ENV pour l'environnement (development/production)
 */
module.exports = {
  // Configuration de la base de données
  database: {
    host: process.env.DB_HOST || '213.32.34.38',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'asterisk',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    timezone: 'local',
    charset: 'utf8mb4',
    debug: process.env.NODE_ENV === 'development'
  },
  
  // Configuration JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'votre_secret_jwt',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Configuration Asterisk
  asterisk: {
    host: process.env.ASTERISK_HOST || '213.32.34.38',
    port: process.env.ASTERISK_PORT || 5038, // Port AMI standard
    username: process.env.ASTERISK_USERNAME || 'cron', // Utilisateur AMI confirmé dans manager.conf
    password: process.env.ASTERISK_PASSWORD || '1234', // Mot de passe confirmé dans manager.conf
    webrtcPort: process.env.ASTERISK_WEBRTC_PORT || 8088,
    reconnect: true, // Activer la reconnexion automatique pour plus de stabilité
    reconnectTimeout: 3000, // Délai de reconnexion réduit (3 secondes)
    connectionTimeout: 5000, // Timeout pour la connexion initiale (5 secondes)
    maxReconnectAttempts: 5, // Nombre de tentatives de reconnexion
    keepAlive: true, // Maintenir la connexion active
    keepAliveInterval: 10000, // Envoyer un ping toutes les 10 secondes
    simulationModeEnabled: false, // Désactiver le mode simulation par défaut
    eventMask: 'call,system,user,agent', // Inclure les événements agent pour le suivi des agents
    sipPort: 5060, // Port SIP standard
    sipDomain: '213.32.34.38' // Domaine SIP pour l'enregistrement des extensions
  },
  
  // Configuration du serveur
  server: {
    port: process.env.PORT || 8000,
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    }
  }
};
