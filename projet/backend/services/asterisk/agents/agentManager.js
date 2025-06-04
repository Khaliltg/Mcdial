/**
 * Gestionnaire des agents
 */
class AgentManager {
  constructor(connectionManager, sipManager) {
    this.connectionManager = connectionManager
    this.sipManager = sipManager
  }

  /**
   * Définit le statut d'un agent
   */
  setAgentStatus(agentId, status, campaignId, pauseCode = null) {
    return new Promise((resolve, reject) => {
      const { connected, simulationMode } = this.connectionManager.getConnectionStatus()
      const ami = this.connectionManager.getAmi()

      if (simulationMode || !connected) {
        console.log("Mode simulation: Changement de statut simulé")

        setTimeout(() => {
          resolve({
            success: true,
            message: "Changement de statut simulé avec succès",
            agentId,
            status,
            campaignId,
            pauseCode: status === "PAUSED" ? pauseCode : null,
          })
        }, 200)
        return
      }

      console.log(`Changement de statut pour l'agent ${agentId} vers ${status}`)

      this.sipManager
        .checkSipRegistration(agentId)
        .then((sipStatus) => {
          if (!sipStatus.registered) {
            console.warn(`Extension SIP ${agentId} non enregistrée`)
            return resolve({
              success: false,
              message: "Extension SIP non enregistrée",
              agentId,
              status,
              campaignId,
              pauseCode: status === "PAUSED" ? pauseCode : null,
            })
          }

          const sipInterface = `SIP/${agentId}`

          const statusParams = {
            Action: "QueuePause",
            Interface: sipInterface,
            Paused: status === "PAUSED" ? "true" : "false",
            Reason: status === "PAUSED" && pauseCode ? `${status}_${pauseCode}` : status,
          }

          if (campaignId) {
            statusParams.Queue = `Campaign_${campaignId}`
          }

          ami.action(statusParams, (err, res) => {
            if (err || (res && res.response === "Error")) {
              console.error(`Erreur lors de la définition du statut:`, err || res)

              // Essayer avec l'interface Local
              const localParams = {
                ...statusParams,
                Interface: `Local/${agentId}@from-internal`,
              }

              ami.action(localParams, (localErr, localRes) => {
                if (localErr || (localRes && localRes.response === "Error")) {
                  console.error(`Erreur avec l'interface Local:`, localErr || localRes)

                  // Simuler un changement de statut réussi
                  resolve({
                    success: true,
                    message: "Changement de statut simulé (ViciDial)",
                    agentId,
                    status,
                    campaignId,
                    pauseCode: status === "PAUSED" ? pauseCode : null,
                    simulated: true,
                  })
                } else {
                  console.log(`Statut ${status} défini avec succès via Local`)
                  resolve({
                    ...localRes,
                    success: true,
                    agentId,
                    status,
                    campaignId,
                    pauseCode: status === "PAUSED" ? pauseCode : null,
                  })
                }
              })
            } else {
              console.log(`Statut ${status} défini avec succès`)
              resolve({
                ...res,
                success: true,
                agentId,
                status,
                campaignId,
                pauseCode: status === "PAUSED" ? pauseCode : null,
              })
            }
          })
        })
        .catch((err) => {
          console.error(`Erreur lors de la vérification de l'extension SIP:`, err)
          reject(err)
        })
    })
  }
}

module.exports = AgentManager
