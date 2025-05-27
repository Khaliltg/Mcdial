/**
 * Module de journalisation simple pour McDial
 * Wrapper autour de console avec des fonctionnalités supplémentaires
 */

const logger = {
  /**
   * Journalise un message d'information
   * @param {string} message - Message à journaliser
   * @param {any} data - Données supplémentaires (optionnel)
   */
  info: (message, data) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[INFO] ${timestamp} - ${message}`, data);
    } else {
      console.log(`[INFO] ${timestamp} - ${message}`);
    }
  },

  /**
   * Journalise un message d'erreur
   * @param {string} message - Message d'erreur
   * @param {Error|any} error - Objet d'erreur ou données supplémentaires
   */
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    if (error instanceof Error) {
      console.error(`[ERROR] ${timestamp} - ${message}`, error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    } else if (error) {
      console.error(`[ERROR] ${timestamp} - ${message}`, error);
    } else {
      console.error(`[ERROR] ${timestamp} - ${message}`);
    }
  },

  /**
   * Journalise un message d'avertissement
   * @param {string} message - Message d'avertissement
   * @param {any} data - Données supplémentaires (optionnel)
   */
  warn: (message, data) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.warn(`[WARN] ${timestamp} - ${message}`, data);
    } else {
      console.warn(`[WARN] ${timestamp} - ${message}`);
    }
  },

  /**
   * Journalise un message de débogage
   * @param {string} message - Message de débogage
   * @param {any} data - Données supplémentaires (optionnel)
   */
  debug: (message, data) => {
    // Ne journaliser que si le mode debug est activé
    if (process.env.DEBUG === 'true') {
      const timestamp = new Date().toISOString();
      if (data) {
        console.debug(`[DEBUG] ${timestamp} - ${message}`, data);
      } else {
        console.debug(`[DEBUG] ${timestamp} - ${message}`);
      }
    }
  }
};

module.exports = logger;
