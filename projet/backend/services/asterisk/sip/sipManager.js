/**
 * Gestionnaire des extensions SIP
 */
class SipManager {
  constructor(connectionManager) {
    this.connectionManager = connectionManager
  }

  /**
   * Vérifie la configuration d'une extension SIP
   */
  checkExtensionConfig(extension) {
    return new Promise((resolve, reject) => {
      const logPrefix = `[SIP:${extension}]`
      console.log(`${logPrefix} Début de la vérification de la configuration`)

      if (!extension) {
        const errorMsg = "Aucune extension fournie pour la vérification"
        console.error(`${logPrefix} ${errorMsg}`)
        return reject(new Error(errorMsg))
      }

      const { connected } = this.connectionManager.getConnectionStatus()
      const ami = this.connectionManager.getAmi()

      if (!connected || !ami) {
        const errorMsg = "Pas connecté à Asterisk AMI"
        console.error(`${logPrefix} ${errorMsg}`)
        return reject(new Error(errorMsg))
      }

      console.log(`${logPrefix} Envoi de la commande SIPshowpeer...`)

      const timeout = setTimeout(() => {
        const errorMsg = "Timeout lors de la vérification de la configuration de l'extension"
        console.error(`${logPrefix} ${errorMsg}`)
        reject(new Error(errorMsg))
      }, 30000)

      try {
        ami.action(
          {
            Action: "SIPshowpeer",
            Peer: extension,
          },
          (err, res) => {
            clearTimeout(timeout)

            if (err) {
              const errorMsg = `Erreur lors de la vérification de la configuration: ${err.message}`
              console.error(`${logPrefix} ${errorMsg}`)
              return reject(new Error(errorMsg))
            }

            if (!res) {
              const errorMsg = "Réponse vide du serveur Asterisk"
              console.error(`${logPrefix} ${errorMsg}`)
              return reject(new Error(errorMsg))
            }

            this.processSipShowpeerResponse(res, logPrefix, resolve)
          },
        )
      } catch (error) {
        clearTimeout(timeout)
        const errorMsg = `Erreur lors de l'exécution de SIPshowpeer: ${error.message}`
        console.error(`${logPrefix} ${errorMsg}`)
        reject(new Error(errorMsg))
      }
    })
  }

  /**
   * Traite la réponse de SIPshowpeer
   */
  processSipShowpeerResponse(res, logPrefix, resolve) {
    const statusField = res.status || res.Status
    const addressIp = res["address-ip"] || res.Address
    const addressPort = res["address-port"] || res.Port
    const userAgent = res["sip-useragent"] || res.UserAgent

    const isOnline = statusField && statusField.includes("OK")

    console.log(`${logPrefix} Configuration récupérée:`, {
      peerStatus: statusField || "Inconnu",
      ipAddress: addressIp || "Non définie",
      port: addressPort || "Non défini",
      isOnline: isOnline,
    })

    resolve({
      ...res,
      Status: statusField,
      Address: addressIp,
      Port: addressPort,
      UserAgent: userAgent,
      isOnline: isOnline,
      lastChecked: new Date().toISOString(),
    })
  }

  /**
   * Vérifie l'état d'enregistrement SIP d'une extension
   */
  checkSipRegistration(extension) {
    return new Promise((resolve, reject) => {
      const logPrefix = `[SIP:${extension}]`
      console.log(`${logPrefix} Début de la vérification d'enregistrement SIP`)

      if (!extension) {
        const errorMsg = "Aucune extension fournie pour la vérification SIP"
        console.error(`${logPrefix} ${errorMsg}`)
        return reject(new Error(errorMsg))
      }

      const { connected, simulationMode } = this.connectionManager.getConnectionStatus()
      const ami = this.connectionManager.getAmi()

      if (!connected || simulationMode) {
        console.log(`${logPrefix} Mode simulation ou non connecté`)
        return resolve({
          success: true,
          extension: extension,
          registered: false,
          host: "Simulé",
          port: "Simulé",
          status: "Simulé",
          message: "Mode simulation",
        })
      }

      console.log(`${logPrefix} Vérification de la configuration de l'extension...`)

      this.checkExtensionConfig(extension)
        .then((configRes) => {
          const statusField = configRes.status || configRes.Status
          const addressIp = configRes["address-ip"] || configRes.Address
          const isOnline = statusField && statusField.includes("OK") && addressIp && addressIp !== "(null)"

          if (isOnline) {
            console.log(`${logPrefix} Extension détectée comme enregistrée`)

            const host = configRes["address-ip"] || "Unknown"
            const port = configRes["address-port"] || "Unknown"
            const userAgent = configRes["sip-useragent"] || "Unknown"
            const status = configRes.Status || "Unknown"

            return resolve({
              success: true,
              extension: extension,
              registered: true,
              host: host,
              port: port,
              userAgent: userAgent,
              status: status,
              message: "Extension enregistrée et active",
              lastUpdated: new Date().toISOString(),
            })
          }

          // Vérification supplémentaire avec SIPshowregistry
          this.checkSipRegistry(extension, ami, logPrefix, resolve, reject)
        })
        .catch((err) => {
          console.error(`${logPrefix} Erreur lors de la vérification:`, err)
          reject(err)
        })
    })
  }

  /**
   * Vérifie l'enregistrement via SIPshowregistry
   */
  checkSipRegistry(extension, ami, logPrefix, resolve, reject) {
    const timeout = setTimeout(() => {
      const errorMsg = "Timeout lors de la vérification de l'enregistrement SIP"
      console.error(`${logPrefix} ${errorMsg}`)
      reject(new Error(errorMsg))
    }, 10000)

    ami.action(
      {
        Action: "SIPshowregistry",
        Filter: `Peer=${extension}`,
      },
      (err, res) => {
        clearTimeout(timeout)

        if (err) {
          const errorMsg = `Erreur lors de la vérification de l'enregistrement SIP: ${err.message}`
          console.error(`${logPrefix} ${errorMsg}`)
          return reject(new Error(errorMsg))
        }

        if (!res || !res.events || res.events.length === 0) {
          console.log(`${logPrefix} Aucun enregistrement SIP trouvé`)
          return resolve({
            success: true,
            extension: extension,
            registered: false,
            host: "Unknown",
            port: "Unknown",
            status: "Non enregistré",
            message: "Extension non enregistrée dans Asterisk",
            lastUpdated: new Date().toISOString(),
          })
        }

        const registration = res.events[0]
        const isRegistered = registration.Status === "Registered"

        resolve({
          success: true,
          extension: extension,
          registered: isRegistered,
          host: registration.Host || "Unknown",
          port: registration.Port || "Unknown",
          userAgent: registration.UserAgent || "Unknown",
          status: registration.Status || "Unknown",
          message: isRegistered ? "Extension enregistrée" : "Extension non enregistrée",
          lastUpdated: new Date().toISOString(),
        })
      },
    )
  }

  /**
   * Récupère les canaux actifs pour une extension
   */
  getActiveChannels(extension) {
    return new Promise((resolve, reject) => {
      const { connected, simulationMode } = this.connectionManager.getConnectionStatus()
      const ami = this.connectionManager.getAmi()

      if (simulationMode || !connected) {
        console.log("Mode simulation: Simulation de canaux actifs")
        resolve({
          success: true,
          extension: extension,
          channels: [],
          message: "Simulated active channels",
        })
        return
      }

      ami.action({ Action: "CoreShowChannels" }, (err, res) => {
        if (err) {
          console.error("Erreur lors de la récupération des canaux actifs:", err)
          reject(err)
        } else {
          let channels = []
          if (res && res.events) {
            channels = res.events
              .filter(
                (event) =>
                  event.channel && event.event === "CoreShowChannel" && event.channel.includes(`SIP/${extension}`),
              )
              .map((event) => ({
                channel: event.channel,
                state: event.channelstatedesc,
                callerIdNum: event.calleridnum,
                callerIdName: event.calleridname,
                duration: event.duration,
                application: event.application,
                bridgedChannel: event.bridgedchannel || null,
              }))
          }

          resolve({
            success: true,
            extension: extension,
            channels: channels,
            count: channels.length,
            message: channels.length > 0 ? "Canaux actifs trouvés" : "Aucun canal actif",
          })
        }
      })
    })
  }
}

module.exports = SipManager
