/**
 * Gestionnaire des appels
 */
class CallManager {
  constructor(connectionManager, conferenceManager) {
    this.connectionManager = connectionManager
    this.conferenceManager = conferenceManager
  }

  /**
   * Initie un appel vers un prospect
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
    return new Promise((resolve, reject) => {
      phoneNumber = this.formatPhoneNumber(phoneNumber)

      const logPrefix = `[CALL:${agentId}:${phoneNumber}]`
      console.log(`${logPrefix} Initiation d'un appel Asterisk`)

      const { connected, simulationMode } = this.connectionManager.getConnectionStatus()
      const ami = this.connectionManager.getAmi()

      if (simulationMode || !connected) {
        console.log(`${logPrefix} Mode simulation: Simulation d'un appel réussi`)

        const callId = `SIM-${Date.now()}`
        setTimeout(() => {
          resolve({
            success: true,
            callId: callId,
            message: "Appel simulé avec succès",
            agentExtension,
            phoneNumber,
            agentId,
            leadId,
          })
        }, 500)
        return
      }

      try {
        let conferenceExtension = confExten

        if (!conferenceExtension) {
          conferenceExtension = this.conferenceManager.getAgentConference(agentId)
        }

        if (!conferenceExtension) {
          console.error(`${logPrefix} Aucun numéro de conférence trouvé`)
          return reject(new Error(`Aucun numéro de conférence trouvé pour l'agent ${agentId}`))
        }

        const callerId = this.generateCallerId(phoneNumber, leadId)
        const uniqueId = `MCDIAL-${Date.now()}-${Math.floor(Math.random() * 10000)}`

        ami.action(
          {
            Action: "Originate",
            Channel: `Local/${phoneNumber}@from-internal`,
            Context: "from-internal",
            Exten: conferenceExtension,
            Priority: 1,
            CallerID: callerId,
            Timeout: 30000,
            Async: true,
            Variable: [
              `AGENTID=${agentId}`,
              `LEADID=${leadId}`,
              `CAMPAIGNID=${campaignId}`,
              `SESSIONID=${sessionId || ""}`,
              `CONFEXTEN=${conferenceExtension}`,
              `UNIQUEID=${uniqueId}`,
              `AGENT_EXTENSION=${agentExtension}`,
              `MCDIAL_CALL=1`,
              `PHONE_NUMBER=${phoneNumber}`,
            ],
          },
          (err, res) => {
            if (err) {
              console.error(`${logPrefix} Erreur lors de l'initiation de l'appel:`, err)
              reject(err)
            } else {
              console.log(`${logPrefix} Appel initié avec succès`)

              const callId = res.uniqueid || uniqueId

              resolve({
                success: true,
                callId: callId,
                message: "Appel initié avec succès",
                agentExtension,
                phoneNumber,
                agentId,
                leadId,
                conferenceExtension,
                response: res,
              })
            }
          },
        )
      } catch (error) {
        console.error(`${logPrefix} Erreur lors de l'initiation de l'appel:`, error)
        reject(error)
      }
    })
  }

  /**
   * Termine un appel
   */
  endCall(callId) {
    return new Promise((resolve, reject) => {
      const { connected, simulationMode } = this.connectionManager.getConnectionStatus()
      const ami = this.connectionManager.getAmi()

      if (simulationMode || !connected) {
        console.log(`Mode simulation: Simulation de la fin d'appel pour ${callId}`)

        setTimeout(() => {
          resolve({
            success: true,
            message: "Fin d'appel simulée avec succès",
            callId,
          })
        }, 300)
        return
      }

      const hangupParams = {
        ActionID: `hangup-${Date.now()}`,
        Channel: callId,
      }

      ami.action({ Action: "Hangup", ...hangupParams }, (err, res) => {
        if (err) {
          console.error(`Erreur lors de la terminaison de l'appel ${callId}:`, err)
          reject(err)
        } else {
          console.log(`Appel ${callId} terminé avec succès`)
          resolve({
            success: true,
            message: "Appel terminé avec succès",
            callId,
            response: res,
          })
        }
      })
    })
  }

  /**
   * Récupère les détails d'un appel
   */
  getCallDetails(callId) {
    return new Promise((resolve, reject) => {
      const { connected, simulationMode } = this.connectionManager.getConnectionStatus()
      const ami = this.connectionManager.getAmi()

      if (simulationMode || !connected) {
        console.log(`Mode simulation: Simulation des détails d'appel pour ${callId}`)

        setTimeout(() => {
          resolve({
            success: true,
            callId,
            status: "UP",
            duration: Math.floor(Math.random() * 120) + 10,
            channel: `SIP/random-${callId}`,
            callerIdNum: "+21612345678",
            connectedLineNum: "+21687654321",
          })
        }, 200)
        return
      }

      const statusParams = {
        ActionID: `status-${Date.now()}`,
        Channel: callId,
      }

      ami.action({ Action: "Status", ...statusParams }, (err, res) => {
        if (err) {
          console.error(`Erreur lors de la récupération des détails de l'appel ${callId}:`, err)
          reject(err)
        } else {
          resolve({
            success: true,
            callId,
            status: res.status || "UNKNOWN",
            duration: res.seconds || 0,
            channel: res.channel || "",
            callerIdNum: res.calleridnum || "",
            connectedLineNum: res.connectedlinenum || "",
            response: res,
          })
        }
      })
    })
  }

  /**
   * Formate un numéro de téléphone
   */
  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/[^\d+]/g, "")

    if (!cleaned.startsWith("+")) {
      if (cleaned.startsWith("216")) {
        cleaned = "+" + cleaned
      } else {
        cleaned = "+216" + cleaned
      }
    }

    return cleaned
  }

  /**
   * Génère un CallerID au format Vicidial
   */
  generateCallerId(phoneNumber, leadId) {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const day = now.getDate().toString().padStart(2, "0")
    const hours = now.getHours().toString().padStart(2, "0")
    const minutes = now.getMinutes().toString().padStart(2, "0")
    const seconds = now.getSeconds().toString().padStart(2, "0")
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`

    return `"M${timestamp}${leadId}" <${phoneNumber}>`
  }
}

module.exports = CallManager
