/**
 * Gestionnaire des conférences
 */
class ConferenceManager {
  constructor(connectionManager) {
    this.connectionManager = connectionManager
    this.agentConferences = new Map()
  }

  /**
   * Stocke le numéro de conférence d'un agent
   */
  storeAgentConference(agentId, confExten) {
    console.log(`Stockage du numéro de conférence ${confExten} pour l'agent ${agentId}`)
    this.agentConferences.set(agentId, confExten)
  }

  /**
   * Récupère le numéro de conférence d'un agent
   */
  getAgentConference(agentId) {
    const confExten = this.agentConferences.get(agentId)
    console.log(`Récupération du numéro de conférence pour l'agent ${agentId}: ${confExten || "Non trouvé"}`)
    return confExten || null
  }

  /**
   * Effectue un appel de synchronisation
   */
  makeSyncCall(extension, agentId, sessionId = null) {
    return new Promise((resolve, reject) => {
      const { connected, simulationMode } = this.connectionManager.getConnectionStatus()
      const ami = this.connectionManager.getAmi()

      if (simulationMode || !connected) {
        console.log(`Mode simulation: Appel de synchronisation vers ${extension}`)

        const simulatedConfExten = sessionId || `8600${Math.floor(Math.random() * 900) + 100}`
        this.storeAgentConference(agentId, simulatedConfExten)

        setTimeout(() => {
          resolve({
            success: true,
            message: "Appel de synchronisation simulé avec succès",
            extension,
            agentId,
            confExten: simulatedConfExten,
          })
        }, 300)
        return
      }

      try {
        console.log(`Appel de synchronisation vers l'extension ${extension}`)

        const cleanExtension = extension.replace(/^SIP\//i, "")
        const confExten = sessionId || `8600${Math.floor(Math.random() * 900) + 100}`

        this.storeAgentConference(agentId, confExten)

        const vicidialCallerID = this.generateSyncCallerId(confExten)

        const originateParams = {
          ActionID: `sync-${Date.now()}`,
          Channel: `SIP/${cleanExtension}`,
          Context: "from-internal",
          Priority: 1,
          Timeout: 10000,
          CallerID: `"${vicidialCallerID}" <${vicidialCallerID}>`,
          Async: "true",
          Application: "MeetMe",
          Data: `${confExten},dMq`,
        }

        ami.action({ Action: "Originate", ...originateParams }, (err, res) => {
          if (err) {
            console.error(`Erreur lors de l'appel de synchronisation:`, err)

            // Méthode alternative avec CLI
            const command = `originate SIP/${cleanExtension} application MeetMe ${confExten},dMq`

            ami.action(
              {
                Action: "Command",
                Command: command,
              },
              (cliErr, cliRes) => {
                if (cliErr) {
                  console.error("Erreur avec la méthode alternative CLI:", cliErr)
                  resolve({
                    success: false,
                    message: "Échec de l'appel de synchronisation, mais connexion autorisée",
                    extension: cleanExtension,
                    error: cliErr.message,
                  })
                } else {
                  console.log(`Appel de synchronisation réussi (CLI) vers ${cleanExtension}`)
                  resolve({
                    success: true,
                    message: "Appel de synchronisation effectué avec succès (CLI)",
                    extension: cleanExtension,
                    confExten: confExten,
                    response: cliRes,
                  })
                }
              },
            )
          } else {
            console.log(`Appel de synchronisation réussi vers ${cleanExtension}`)
            resolve({
              success: true,
              message: "Appel de synchronisation effectué avec succès",
              extension: cleanExtension,
              confExten: confExten,
              response: res,
            })
          }
        })
      } catch (error) {
        console.error(`Exception lors de l'appel de synchronisation:`, error)
        resolve({
          success: false,
          message: "Exception lors de l'appel de synchronisation",
          extension,
          error: error.message,
        })
      }
    })
  }

  /**
   * Génère un CallerID pour l'appel de synchronisation
   */
  generateSyncCallerId(confExten) {
    const now = new Date()
    const year = now.getFullYear().toString().slice(2)
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    const seconds = String(now.getSeconds()).padStart(2, "0")

    return `S${year}${month}${day}${hours}${minutes}${seconds}${confExten}`
  }
}

module.exports = ConferenceManager
