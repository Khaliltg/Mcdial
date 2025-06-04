/**
 * Service principal Asterisk - Point d'entrée unifié
 */
const ConnectionManager = require("./connection/connectionManager")
const SipManager = require("./sip/sipManager")
const CallManager = require("./calls/callManager")
const ConferenceManager = require("./conference/conferenceManager")
const AgentManager = require("./agents/agentManager")
const DialerManager = require("./dialer/dialerManager")
const EventManager = require("./events/eventManager")

/**
 * Classe principale du service Asterisk
 */
class AsteriskService {
  constructor() {
    // Initialiser les gestionnaires
    this.connectionManager = new ConnectionManager()
    this.sipManager = new SipManager(this.connectionManager)
    this.conferenceManager = new ConferenceManager(this.connectionManager)
    this.callManager = new CallManager(this.connectionManager, this.conferenceManager)
    this.agentManager = new AgentManager(this.connectionManager, this.sipManager)
    this.dialerManager = new DialerManager(this.connectionManager)
    this.eventManager = new EventManager(this.connectionManager)

    // Initialiser la connexion
    this.initialize()
  }

  /**
   * Initialise le service Asterisk
   */
  async initialize() {
    try {
      console.log("Initialisation du service Asterisk...")
      await this.connectionManager.initializeConnection()
      console.log("Service Asterisk initialisé avec succès")
    } catch (error) {
      console.error("Erreur lors de l'initialisation du service Asterisk:", error)
    }
  }

  // Méthodes publiques - délégation vers les gestionnaires appropriés

  // Connexion
  getAsteriskStatus() {
    const status = this.connectionManager.getConnectionStatus()
    return {
      ...status,
      host: require("../../config/config").asterisk.host,
      port: require("../../config/config").asterisk.port,
    }
  }

  isInSimulationMode() {
    return this.connectionManager.getConnectionStatus().simulationMode
  }

  isAsteriskConnected() {
    const { connected, simulationMode } = this.connectionManager.getConnectionStatus()
    return connected && !simulationMode
  }

  // SIP
  checkSipRegistration(extension) {
    return this.sipManager.checkSipRegistration(extension)
  }

  checkExtensionConfig(extension) {
    return this.sipManager.checkExtensionConfig(extension)
  }

  getActiveChannels(extension) {
    return this.sipManager.getActiveChannels(extension)
  }

  // Appels
  initiateCall(agentExtension, phoneNumber, agentId, leadId, campaignId, sessionId, confExten) {
    return this.callManager.initiateCall(agentExtension, phoneNumber, agentId, leadId, campaignId, sessionId, confExten)
  }

  endCall(callId) {
    return this.callManager.endCall(callId)
  }

  getCallDetails(callId) {
    return this.callManager.getCallDetails(callId)
  }

  formatPhoneNumber(phoneNumber) {
    return this.callManager.formatPhoneNumber(phoneNumber)
  }

  // Conférences
  makeSyncCall(extension, agentId, sessionId) {
    return this.conferenceManager.makeSyncCall(extension, agentId, sessionId)
  }

  // Agents
  setAgentStatus(agentId, status, campaignId, pauseCode) {
    return this.agentManager.setAgentStatus(agentId, status, campaignId, pauseCode)
  }

  // Composeur
  startPredictiveDialer(campaignId, level) {
    return this.dialerManager.startPredictiveDialer(campaignId, level)
  }

  stopPredictiveDialer(campaignId) {
    return this.dialerManager.stopPredictiveDialer(campaignId)
  }

  // Méthodes utilitaires
  async ensureCampaignActive(campaignId) {
    return this.dialerManager.ensureCampaignActive(campaignId)
  }

  // Événements
  on(event, listener) {
    return this.eventManager.on(event, listener)
  }

  once(event, listener) {
    return this.eventManager.once(event, listener)
  }

  off(event, listener) {
    return this.eventManager.off(event, listener)
  }

  emit(event, ...args) {
    return this.eventManager.emit(event, ...args)
  }

  // Accès direct à l'instance AMI
  get ami() {
    return this.connectionManager.getAmi()
  }
}

// Créer et exporter une instance unique
const asteriskService = new AsteriskService()
module.exports = asteriskService
