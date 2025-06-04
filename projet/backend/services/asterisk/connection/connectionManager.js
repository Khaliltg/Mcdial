/**
 * Gestionnaire de connexion AMI
 */
const AsteriskManager = require("asterisk-manager")
const config = require("../../../config/config")
const { EventEmitter } = require("events")
const net = require("net")
const util = require("util")
const dns = require("dns")

// Promisify les fonctions nécessaires
const dnsLookup = util.promisify(dns.lookup)
const socketConnect = util.promisify((host, port, cb) => {
  const socket = new net.Socket()
  socket.on("error", () => cb(null, false))
  socket.on("timeout", () => {
    socket.destroy()
    cb(null, false)
  })
  socket.connect(port, host, () => {
    socket.end()
    cb(null, true)
  })
})

class ConnectionManager extends EventEmitter {
  constructor() {
    super()
    this.ami = null
    this.isConnected = false
    this.isSimulationMode = false
    this.reconnectAttempts = 0
    this.reconnecting = false
    this.connectionTimeout = null
    this.keepAliveInterval = null
  }

  /**
   * Vérifie la connectivité au serveur Asterisk
   */
  async checkAsteriskConnectivity() {
    const host = config.asterisk.host
    const port = config.asterisk.port

    try {
      console.log(`Vérification de la résolution DNS pour ${host}...`)
      const dnsResult = await dnsLookup(host)
      console.log(`Résolution DNS réussie: ${dnsResult.address}`)

      console.log(`Vérification de la connectivité TCP vers ${host}:${port}...`)
      const isReachable = await socketConnect(host, port)

      if (!isReachable) {
        throw new Error(`Impossible d'établir une connexion TCP vers ${host}:${port}`)
      }

      console.log(`Connexion TCP réussie vers ${host}:${port}`)
      return true
    } catch (error) {
      console.error("Erreur de connectivité:", error.message)
      throw error
    }
  }

  /**
   * Initialise la connexion à Asterisk AMI
   */
  async initializeConnection() {
    if (this.ami) {
      this.cleanupConnection()
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
      events: "on",
    }

    try {
      console.log(`Création d'une nouvelle instance AMI pour ${amiOptions.host}:${amiOptions.port}...`)

      try {
        await this.checkAsteriskConnectivity()
      } catch (connectivityError) {
        console.error("Erreur de connectivité réseau:", connectivityError.message)
        console.log("Activation du mode simulation en raison de problèmes de connectivité")
        this.isSimulationMode = true
        return
      }

      this.ami = new AsteriskManager(
        amiOptions.port,
        amiOptions.host,
        amiOptions.username,
        amiOptions.password,
        amiOptions.events,
      )

      this.setupEventHandlers()
      this.startConnectionTimeout()

      console.log("Appel de ami.connect()...")
      this.ami.connect()
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la connexion AMI:", error)
      this.handleConnectionError()
    }
  }

  /**
   * Configure les gestionnaires d'événements
   */
  setupEventHandlers() {
    if (!this.ami) return

    this.ami.on("error", (err) => {
      console.error("Erreur de connexion AMI:", err.message)
      this.isConnected = false
      this.emit("connectionChange", { connected: false, error: err })
      this.handleReconnection()
    })

    this.ami.on("connect", () => {
      console.log("Connecté avec succès à Asterisk AMI")
      this.isConnected = true
      this.reconnectAttempts = 0
      this.reconnecting = false
      this.clearConnectionTimeout()
      this.startKeepAlive()
      this.emit("connectionChange", { connected: true })
    })

    this.ami.on("disconnect", () => {
      console.log("Déconnecté d'Asterisk AMI")
      this.isConnected = false
      this.emit("connectionChange", { connected: false })
      this.clearKeepAlive()

      if (config.asterisk.reconnect && !this.reconnecting) {
        this.handleReconnection()
      }
    })
  }

  /**
   * Gère les erreurs de connexion
   */
  handleConnectionError() {
    this.isConnected = false
    this.reconnectAttempts++

    if (this.reconnectAttempts < config.asterisk.maxReconnectAttempts) {
      console.log(`Nouvelle tentative de connexion dans ${config.asterisk.reconnectTimeout}ms...`)
      setTimeout(() => this.initializeConnection(), config.asterisk.reconnectTimeout)
    } else {
      console.error("Nombre maximum de tentatives de connexion atteint. Activation du mode simulation.")
      this.isSimulationMode = true
    }
  }

  /**
   * Gère la reconnexion
   */
  handleReconnection() {
    if (this.reconnectAttempts < config.asterisk.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${config.asterisk.maxReconnectAttempts}...`)
      setTimeout(() => this.initializeConnection(), config.asterisk.reconnectTimeout)
    } else {
      console.error("Nombre maximum de tentatives de reconnexion atteint")
      this.isSimulationMode = true
    }
  }

  /**
   * Démarre le timeout de connexion
   */
  startConnectionTimeout() {
    this.clearConnectionTimeout()

    const timeoutDuration = config.asterisk.connectionTimeout || 10000
    console.log(`Configuration du timeout de connexion à ${timeoutDuration}ms`)

    this.connectionTimeout = setTimeout(() => {
      if (!this.isConnected) {
        console.error("Timeout de connexion à Asterisk dépassé")
        this.emit("connectionChange", {
          connected: false,
          error: new Error("Timeout de connexion à Asterisk dépassé"),
        })
        this.cleanupConnection()
      }
    }, timeoutDuration)
  }

  /**
   * Nettoie le timeout de connexion
   */
  clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
  }

  /**
   * Démarre le keep-alive
   */
  startKeepAlive() {
    this.clearKeepAlive()

    if (config.asterisk.keepAlive) {
      this.keepAliveInterval = setInterval(() => {
        if (this.isConnected && this.ami) {
          this.ami.action({ Action: "Ping" }, (err) => {
            if (err) {
              console.error("Erreur de keep-alive:", err.message)
              this.isConnected = false
              this.emit("connectionChange", { connected: false, error: err })
            }
          })
        }
      }, config.asterisk.keepAliveInterval)
    }
  }

  /**
   * Nettoie l'intervalle de keep-alive
   */
  clearKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = null
    }
  }

  /**
   * Nettoie la connexion
   */
  cleanupConnection() {
    if (!this.ami) return

    this.ami.removeAllListeners()
    this.clearKeepAlive()
    this.clearConnectionTimeout()

    if (this.isConnected) {
      try {
        this.ami.disconnect()
      } catch (err) {
        console.error("Erreur lors de la déconnexion d'AMI:", err)
      }
    }

    this.ami = null
    this.isConnected = false
  }

  // Getters
  getAmi() {
    return this.ami
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      simulationMode: this.isSimulationMode,
      reconnectAttempts: this.reconnectAttempts,
      reconnecting: this.reconnecting,
    }
  }
}

module.exports = ConnectionManager
