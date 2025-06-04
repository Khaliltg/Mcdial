/**
 * Service Asterisk principal - Version refactorisée
 * Point d'entrée principal qui utilise l'architecture modulaire
 */

// Importer le service principal depuis le nouveau module
const asteriskService = require("./asterisk/index")

// Pas besoin d'instancier car index.js exporte déjà un objet avec toutes les méthodes

/**
 * Interface de compatibilité pour maintenir l'API existante
 * Ce fichier sert de pont entre l'ancienne API et la nouvelle architecture
 */

// Exporter toutes les méthodes publiques avec la même signature qu'avant
module.exports = {
  // === Méthodes de gestion des appels ===

  /**
   * Initie un appel vers un prospect et le transfère vers la conférence de l'agent
   * @param {string} agentExtension - Extension de l'agent
   * @param {string} phoneNumber - Numéro de téléphone du prospect
   * @param {string} agentId - ID de l'agent
   * @param {string} leadId - ID du prospect (optionnel)
   * @param {string} campaignId - ID de la campagne (optionnel)
   * @param {string} sessionId - ID de session (optionnel)
   * @param {string} confExten - Extension de conférence (optionnel)
   * @returns {Promise<Object>} Résultat de l'appel
   */
  initiateCall(
    agentExtension,
    phoneNumber,
    agentId,
    leadId = "",
    campaignId = "default",
    sessionId = null,
    confExten = null,
  ) {
    return asteriskService.initiateCall(
      agentExtension,
      phoneNumber,
      agentId,
      leadId,
      campaignId,
      sessionId,
      confExten,
    )
  },

  /**
   * Termine un appel Asterisk en cours
   * @param {string} callId - ID de l'appel Asterisk
   * @returns {Promise<Object>} Résultat de la terminaison
   */
  endCall(callId) {
    return asteriskService.endCall(callId)
  },

  /**
   * Récupère les détails d'un appel Asterisk
   * @param {string} callId - ID de l'appel Asterisk
   * @returns {Promise<Object>} Détails de l'appel
   */
  getCallDetails(callId) {
    return asteriskService.getCallDetails(callId)
  },

  /**
   * Formate un numéro de téléphone pour Asterisk
   * @param {string} phoneNumber - Numéro de téléphone à formater
   * @returns {string} Numéro formaté
   */
  formatPhoneNumber(phoneNumber) {
    return asteriskService.formatPhoneNumber(phoneNumber)
  },

  // === Méthodes de gestion du composeur prédictif ===

  /**
   * Démarre le composeur prédictif pour une campagne
   * @param {string} campaignId - ID de la campagne
   * @param {string} level - Niveau de composition ('AUTO' ou valeur numérique)
   * @returns {Promise<Object>} Résultat du démarrage
   */
  startPredictiveDialer(campaignId, level = "AUTO") {
    return asteriskService.startPredictiveDialer(campaignId, level)
  },

  /**
   * Arrête le composeur prédictif pour une campagne
   * @param {string} campaignId - ID de la campagne
   * @returns {Promise<Object>} Résultat de l'arrêt
   */
  stopPredictiveDialer(campaignId) {
    return asteriskService.stopPredictiveDialer(campaignId)
  },

  // === Méthodes de gestion des extensions SIP ===

  /**
   * Vérifie l'état d'enregistrement SIP d'une extension
   * @param {string} extension - Extension SIP à vérifier
   * @returns {Promise<Object>} État d'enregistrement
   */
  checkSipRegistration(extension) {
    return asteriskService.checkSipRegistration(extension)
  },

  /**
   * Vérifie la configuration d'une extension SIP
   * @param {string} extension - Extension SIP à vérifier
   * @returns {Promise<Object>} Configuration de l'extension
   */
  checkExtensionConfig(extension) {
    return asteriskService.checkExtensionConfig(extension)
  },

  /**
   * Récupère les canaux actifs pour une extension
   * @param {string} extension - Extension SIP
   * @returns {Promise<Object>} Canaux actifs
   */
  getActiveChannels(extension) {
    return asteriskService.getActiveChannels(extension)
  },

  // === Méthodes de gestion des agents ===

  /**
   * Définit le statut d'un agent
   * @param {string} agentId - ID de l'agent
   * @param {string} status - Nouveau statut ('READY', 'PAUSED', etc.)
   * @param {string} campaignId - ID de la campagne
   * @param {string} pauseCode - Code de pause (optionnel)
   * @returns {Promise<Object>} Résultat du changement de statut
   */
  setAgentStatus(agentId, status, campaignId, pauseCode = null) {
    return asteriskService.setAgentStatus(agentId, status, campaignId, pauseCode)
  },

  // === Méthodes de gestion des conférences ===

  /**
   * Effectue un appel de synchronisation vers l'extension de l'agent
   * @param {string} extension - Extension SIP de l'agent
   * @param {string} agentId - ID de l'agent
   * @param {string} sessionId - ID de session (optionnel)
   * @returns {Promise<Object>} Résultat de l'appel de synchronisation
   */
  makeSyncCall(extension, agentId, sessionId = null) {
    return asteriskService.makeSyncCall(extension, agentId, sessionId)
  },

  // === Méthodes utilitaires ===

  /**
   * S'assure qu'une campagne est marquée comme active dans la base de données
   * @param {string} campaignId - ID de la campagne
   * @returns {Promise<Object>} Résultat de l'opération
   */
  ensureCampaignActive(campaignId) {
    return asteriskService.ensureCampaignActive(campaignId)
  },

  // === Méthodes d'état et de statut ===

  /**
   * Vérifie si le service est en mode simulation
   * @returns {boolean} True si en mode simulation
   */
  isInSimulationMode() {
    return asteriskService.isInSimulationMode()
  },

  /**
   * Vérifie si le service est connecté à Asterisk
   * @returns {boolean} True si connecté
   */
  isAsteriskConnected() {
    return asteriskService.isAsteriskConnected()
  },

  /**
   * Récupère l'état actuel de la connexion Asterisk
   * @returns {Object} État de la connexion
   */
  getAsteriskStatus() {
    return asteriskService.getAsteriskStatus()
  },

  // === Méthodes de gestion des événements ===

  /**
   * Ajoute un écouteur d'événement
   * @param {string} event - Nom de l'événement
   * @param {Function} listener - Fonction d'écoute
   */
  on(event, listener) {
    return asteriskService.on(event, listener)
  },

  /**
   * Ajoute un écouteur d'événement unique
   * @param {string} event - Nom de l'événement
   * @param {Function} listener - Fonction d'écoute
   */
  once(event, listener) {
    return asteriskService.once(event, listener)
  },

  /**
   * Supprime un écouteur d'événement
   * @param {string} event - Nom de l'événement
   * @param {Function} listener - Fonction d'écoute
   */
  off(event, listener) {
    return asteriskService.off(event, listener)
  },

  /**
   * Émet un événement
   * @param {string} event - Nom de l'événement
   * @param {...any} args - Arguments de l'événement
   */
  emit(event, ...args) {
    return asteriskService.emit(event, ...args)
  },

  // === Accès direct à l'instance AMI (pour compatibilité) ===

  /**
   * Accès direct à l'instance AMI pour les tests
   * @returns {Object} Instance AMI
   */
  get ami() {
    return asteriskService.ami
  },

  // === Méthodes d'accès aux gestionnaires internes ===

  /**
   * Accès au gestionnaire de connexion (pour tests avancés)
   * @returns {ConnectionManager} Gestionnaire de connexion
   */
  getConnectionManager() {
    return asteriskService.connectionManager
  },

  /**
   * Accès au gestionnaire SIP (pour tests avancés)
   * @returns {SipManager} Gestionnaire SIP
   */
  getSipManager() {
    return asteriskService.sipManager
  },

  /**
   * Accès au gestionnaire d'appels (pour tests avancés)
   * @returns {CallManager} Gestionnaire d'appels
   */
  getCallManager() {
    return asteriskService.callManager
  },

  /**
   * Accès au gestionnaire de conférences (pour tests avancés)
   * @returns {ConferenceManager} Gestionnaire de conférences
   */
  getConferenceManager() {
    return asteriskService.conferenceManager
  },

  /**
   * Accès au gestionnaire d'agents (pour tests avancés)
   * @returns {AgentManager} Gestionnaire d'agents
   */
  getAgentManager() {
    return asteriskService.agentManager
  },

  /**
   * Accès au gestionnaire de composeur (pour tests avancés)
   * @returns {DialerManager} Gestionnaire de composeur
   */
  getDialerManager() {
    return asteriskService.dialerManager
  },

  /**
   * Accès au gestionnaire d'événements (pour tests avancés)
   * @returns {EventManager} Gestionnaire d'événements
   */
  getEventManager() {
    return asteriskService.eventManager
  },

  // === Méthodes de cycle de vie ===

  /**
   * Initialise manuellement le service (si nécessaire)
   * @returns {Promise<void>}
   */
  async initialize() {
    return asteriskService.initialize()
  },

  /**
   * Nettoie et ferme toutes les connexions
   * @returns {Promise<void>}
   */
  async cleanup() {
    if (asteriskService.connectionManager) {
      asteriskService.connectionManager.cleanupConnection()
    }
  },

  /**
   * Redémarre le service
   * @returns {Promise<void>}
   */
  async restart() {
    await this.cleanup()
    await this.initialize()
  },
}

// === Gestion des événements de processus ===

// Nettoyer les connexions lors de l'arrêt du processus
process.on("SIGINT", async () => {
  console.log("Signal SIGINT reçu, nettoyage des connexions Asterisk...")
  try {
    await module.exports.cleanup()
    console.log("Nettoyage terminé")
  } catch (error) {
    console.error("Erreur lors du nettoyage:", error)
  }
  process.exit(0)
})

process.on("SIGTERM", async () => {
  console.log("Signal SIGTERM reçu, nettoyage des connexions Asterisk...")
  try {
    await module.exports.cleanup()
    console.log("Nettoyage terminé")
  } catch (error) {
    console.error("Erreur lors du nettoyage:", error)
  }
  process.exit(0)
})

// Gestion des erreurs non capturées
process.on("uncaughtException", (error) => {
  console.error("Erreur non capturée dans asteriskService:", error)
  // Ne pas arrêter le processus, juste logger l'erreur
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Promesse rejetée non gérée dans asteriskService:", reason)
  // Ne pas arrêter le processus, juste logger l'erreur
})

// === Initialisation automatique ===

// Initialiser automatiquement le service au chargement du module
console.log("Chargement du service Asterisk...")
asteriskService.initialize().catch((error) => {
  console.error("Erreur lors de l'initialisation automatique du service Asterisk:", error)
})

console.log("Service Asterisk chargé et en cours d'initialisation...")
