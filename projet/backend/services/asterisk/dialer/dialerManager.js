/**
 * Gestionnaire du composeur prédictif
 */
class DialerManager {
  constructor(connectionManager) {
    this.connectionManager = connectionManager
  }

  /**
   * Démarre le composeur prédictif
   */
  startPredictiveDialer(campaignId, level = "AUTO") {
    return new Promise((resolve, reject) => {
      const { connected, simulationMode } = this.connectionManager.getConnectionStatus()
      const ami = this.connectionManager.getAmi()

      if (simulationMode || !connected) {
        console.log("Mode simulation: Démarrage du composeur simulé")

        setTimeout(() => {
          resolve({
            success: true,
            message: "Démarrage du composeur simulé avec succès",
            campaignId,
            level,
          })
        }, 300)
        return
      }

      try {
        console.log(`Démarrage du composeur prédictif pour la campagne ${campaignId}`)

        const dialLevel = level === "AUTO" ? 1.0 : Number.parseFloat(level)

        ami.action(
          {
            Action: "Command",
            Command: `campaign dial_level ${campaignId} ${dialLevel}`,
          },
          (campaignErr, campaignRes) => {
            if (
              campaignErr ||
              (campaignRes && campaignRes.content && campaignRes.content.includes("No such command"))
            ) {
              console.log("Commande campaign dial_level non disponible")
              this.useAlternativeMethod(campaignId, dialLevel, resolve, reject)
            } else {
              console.log(`Commande campaign dial_level exécutée avec succès`)
              resolve({
                success: true,
                message: "Composeur démarré avec succès via Asterisk CLI",
                campaignId,
                level,
                method: "cli",
                response: campaignRes,
              })
            }
          },
        )
      } catch (error) {
        console.error(`Exception lors du démarrage du composeur:`, error)
        reject(error)
      }
    })
  }

  /**
   * Arrête le composeur prédictif
   */
  stopPredictiveDialer(campaignId) {
    return new Promise((resolve, reject) => {
      const { connected, simulationMode } = this.connectionManager.getConnectionStatus()
      const ami = this.connectionManager.getAmi()

      if (simulationMode || !connected) {
        console.log("Mode simulation: Arrêt du composeur simulé")

        setTimeout(() => {
          resolve({
            success: true,
            message: "Arrêt du composeur simulé avec succès",
            campaignId,
          })
        }, 300)
        return
      }

      try {
        console.log(`Arrêt du composeur prédictif pour la campagne ${campaignId}`)

        ami.action(
          {
            Action: "Command",
            Command: `campaign dial_level ${campaignId} 0`,
          },
          (campaignErr, campaignRes) => {
            if (
              campaignErr ||
              (campaignRes && campaignRes.content && campaignRes.content.includes("No such command"))
            ) {
              console.log("Commande campaign dial_level non disponible, essai avec vdad stop")

              ami.action(
                {
                  Action: "Command",
                  Command: `vdad stop ${campaignId}`,
                },
                (vdadErr, vdadRes) => {
                  if (vdadErr || (vdadRes && vdadRes.content && vdadRes.content.includes("No such command"))) {
                    console.log("Utilisation de la méthode alternative (DB)")
                    this.stopCampaignDialing(campaignId)
                      .then((result) => {
                        resolve({
                          success: true,
                          message: "Composeur arrêté avec succès via base de données",
                          campaignId,
                          method: "database",
                          result,
                        })
                      })
                      .catch((dbErr) => {
                        reject(dbErr)
                      })
                  } else {
                    console.log(`Commande vdad stop exécutée avec succès`)
                    resolve({
                      success: true,
                      message: "Composeur arrêté avec succès via CLI (vdad stop)",
                      campaignId,
                      method: "cli",
                      response: vdadRes,
                    })
                  }
                },
              )
            } else {
              console.log(`Commande campaign dial_level 0 exécutée avec succès`)
              resolve({
                success: true,
                message: "Composeur arrêté avec succès via CLI",
                campaignId,
                method: "cli",
                response: campaignRes,
              })
            }
          },
        )
      } catch (error) {
        console.error(`Exception lors de l'arrêt du composeur:`, error)

        this.stopCampaignDialing(campaignId)
          .then((result) => {
            resolve({
              success: true,
              message: "Composeur arrêté avec succès après exception",
              campaignId,
              method: "database",
              result,
            })
          })
          .catch((dbErr) => {
            reject(dbErr)
          })
      }
    })
  }

  /**
   * Méthode alternative utilisant la base de données
   */
  useAlternativeMethod(campaignId, level, resolve, reject) {
    console.log("Utilisation de la méthode alternative (base de données)")
    this.updateCampaignDialLevel(campaignId, level)
      .then((result) => {
        resolve({
          success: true,
          message: "Composeur démarré avec succès via base de données",
          campaignId,
          level,
          method: "database",
          result,
        })
      })
      .catch((dbErr) => {
        reject(dbErr)
      })
  }

  /**
   * Met à jour le niveau de composition dans la base de données
   */
  async updateCampaignDialLevel(campaignId, level) {
    const db = require("../../../config/bd")

    try {
      const dialLevel = level === "AUTO" ? 1.0 : Number.parseFloat(level)

      const [result] = await db.query("UPDATE vicidial_campaigns SET auto_dial_level = ? WHERE campaign_id = ?", [
        dialLevel,
        campaignId,
      ])

      if (result.affectedRows === 0) {
        throw new Error(`Aucune campagne trouvée avec l'ID ${campaignId}`)
      }

      return { success: true, affectedRows: result.affectedRows }
    } catch (error) {
      throw error
    }
  }

  /**
   * Arrête la composition dans la base de données
   */
  async stopCampaignDialing(campaignId) {
    const db = require("../../../config/bd")

    try {
      const [result] = await db.query("UPDATE vicidial_campaigns SET auto_dial_level = 0 WHERE campaign_id = ?", [
        campaignId,
      ])

      if (result.affectedRows === 0) {
        throw new Error(`Aucune campagne trouvée avec l'ID ${campaignId}`)
      }

      return { success: true, affectedRows: result.affectedRows }
    } catch (error) {
      throw error
    }
  }
}

module.exports = DialerManager
