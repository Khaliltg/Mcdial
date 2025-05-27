/**
 * Middleware de limitation de débit pour les requêtes API
 */
const rateLimit = require('express-rate-limit');

// Limiteur pour les requêtes API générales
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  standardHeaders: true, // Retourne les headers 'RateLimit-*' standards
  legacyHeaders: false, // Désactive les headers 'X-RateLimit-*'
  message: {
    status: 429,
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  }
});

// Limiteur plus strict pour les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // Limite chaque IP à 10 tentatives de connexion par heure
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
