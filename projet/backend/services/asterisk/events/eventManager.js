/**
 * Gestionnaire des événements AMI
 */
const { EventEmitter } = require("events")

class EventManager extends EventEmitter {
  constructor(connectionManager) {
    super()
    this.connectionManager = connectionManager
    this.setupEventHandlers()
  }

  /**
   * Configure les gestionnaires d'événements AMI
   */
  setupEventHandlers() {
    this.connectionManager.on("connectionChange", (status) => {
      if (status.connected) {
        this.setupAmiEventHandlers()
      }
    })
  }

  /**
   * Configure les gestionnaires d'événements pour l'instance AMI
   */
  setupAmiEventHandlers() {
    const ami = this.connectionManager.getAmi()
    if (!ami) return

    ami.on("managerevent", async (event) => {
      try {
        console.log(`Événement AMI reçu: ${event.event}`, event)

        // Gérer les événements d'appel
        if (event.event === "Newchannel") {
          this.handleNewChannel(event)
        }

        // Gérer les événements de connexion d'appel
        if (event.event === "Bridge" || (event.event === "Newstate" && event.channelstate === "6")) {
          this.handleCallConnected(event)
        }

        // Gérer les événements de fin d'appel
        if (event.event === "Hangup") {
          this.handleCallHangup(event)
        }
      } catch (error) {
        console.error("Erreur lors du traitement d'un événement AMI:", error)
      }
    })
  }

  /**
   * Gère les nouveaux canaux
   */
  handleNewChannel(event) {
    console.log("Nouvel appel détecté:", event)

    if (event.calleridname && event.calleridname.includes("MCDIAL")) {
      console.log("Appel sortant MCDIAL détecté:", event.channel)
      this.emit("newCall", {
        channel: event.channel,
        callerIdName: event.calleridname,
        uniqueId: event.uniqueid,
      })
    }
  }

  /**
   * Gère les appels connectés
   */
  async handleCallConnected(event) {
    console.log("Appel connecté:", event)

    const channel = event.channel || event.channel1
    if (!channel) return

    if (event.calleridname && event.calleridname.includes("MCDIAL")) {
      const uniqueId = event.uniqueid || event.uniqueid1
      if (!uniqueId) return

      console.log(`Appel MCDIAL connecté, uniqueId: ${uniqueId}`)

      try {
        const db = require("../../../config/bd")
        const [callInfo] = await db.query(
          `SELECT vac.*, vl.* 
           FROM vicidial_auto_calls vac 
           JOIN vicidial_list vl ON vac.lead_id = vl.lead_id 
           WHERE vac.uniqueid = ? OR vac.callerid LIKE ?`,
          [uniqueId, `%${uniqueId}%`],
        )

        if (callInfo && callInfo.length > 0) {
          const leadInfo = callInfo[0]

          await db.query('UPDATE vicidial_auto_calls SET status = "LIVE" WHERE uniqueid = ? OR callerid LIKE ?', [
            uniqueId,
            `%${uniqueId}%`,
          ])

          this.emit("callConnected", {
            uniqueId,
            leadId: leadInfo.lead_id,
            phoneNumber: leadInfo.phone_number,
            firstName: leadInfo.first_name,
            lastName: leadInfo.last_name,
            address: leadInfo.address1,
            city: leadInfo.city,
            state: leadInfo.state,
            postalCode: leadInfo.postal_code,
            email: leadInfo.email,
            comments: leadInfo.comments,
          })
        }
      } catch (error) {
        console.error("Erreur lors du traitement de l'appel connecté:", error)
      }
    }
  }

  /**
   * Gère les fins d'appel
   */
  async handleCallHangup(event) {
    console.log("Fin d'appel détectée:", event)

    if (event.calleridname && event.calleridname.includes("MCDIAL")) {
      const uniqueId = event.uniqueid
      if (!uniqueId) return

      console.log(`Fin d'appel MCDIAL, uniqueId: ${uniqueId}`)

      try {
        const db = require("../../../config/bd")
        await db.query('UPDATE vicidial_auto_calls SET status = "DONE" WHERE uniqueid = ? OR callerid LIKE ?', [
          uniqueId,
          `%${uniqueId}%`,
        ])

        this.emit("callHangup", { uniqueId })
      } catch (error) {
        console.error("Erreur lors du traitement de la fin d'appel:", error)
      }
    }
  }
}

module.exports = EventManager
