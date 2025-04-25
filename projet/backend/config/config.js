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
    host: process.env.ASTERISK_HOST || 'localhost',
    port: process.env.ASTERISK_PORT || 5038,
    username: process.env.ASTERISK_USERNAME || 'admin',
    password: process.env.ASTERISK_PASSWORD || 'password',
    webrtcPort: process.env.ASTERISK_WEBRTC_PORT || 8088
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
