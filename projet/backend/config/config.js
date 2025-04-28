/**
 * Configuration globale de l'application
 */
module.exports = {
  // Configuration de la base de données
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'asterisk'
  },
  
  // Configuration JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'votre_secret_jwt',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Configuration Asterisk
  asterisk: {
    host: process.env.ASTERISK_HOST || '213.32.34.33',
    port: process.env.ASTERISK_PORT || 5038, // Port AMI standard (5038) au lieu de 5060 (SIP)
    username: process.env.ASTERISK_USERNAME || 'admin', // Utilisateur AMI standard
    password: process.env.ASTERISK_PASSWORD || 'Mc@2025',
    webrtcPort: process.env.ASTERISK_WEBRTC_PORT || 8088,
    reconnect: false, // Désactiver la reconnexion automatique pour éviter les boucles
    reconnectTimeout: 60000, // Délai de reconnexion plus long (60 secondes)
    maxReconnectAttempts: 3, // Limiter le nombre de tentatives de reconnexion
    simulationModeEnabled: true // Activer le mode simulation si la connexion échoue
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
