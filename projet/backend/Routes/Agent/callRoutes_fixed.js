const express = require("express")
const router = express.Router()
const db = require("../../config/bd") // Utiliser la connexion existante
const dotenv = require("dotenv")
const { authenticateToken } = require("../../middleware/auth")

// Charger les variables d'environnement
dotenv.config()

// Route pour récupérer les informations de l'agent
router.get("/info", authenticateToken, async (req, res) => {
  try {
    // Les informations de l'agent sont déjà dans le token décodé
    const agentInfo = {
      user: req.user.user,
      full_name: req.user.full_name,
      user_level: req.user.user_level,
      extension: req.user.extension,
      phone_login: req.user.phone_login,
      campaign_id: req.user.campaign_id,
      campaign_name: req.user.campaign_name,
      status: "READY", // Statut par défaut
    }

    // Vérifier le statut actuel de l'agent dans la base de données
    const query = `
            SELECT status 
            FROM vicidial_live_agents 
            WHERE user = ? 
            AND campaign_id = ? 
            LIMIT 1
        `

    const [results] = await db.query(query, [req.user.user, req.user.campaign_id])

    if (results.length > 0) {
      agentInfo.status = results[0].status
    }

    res.json(agentInfo)
  } catch (err) {
    console.error("Erreur lors de la récupération du statut de l'agent:", err)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour mettre à jour le statut de l'agent
router.post("/status", authenticateToken, async (req, res) => {
  try {
    console.log("Reçu une requête de mise à jour de statut:", req.body)
    const { status, pauseCode } = req.body
    const userId = req.user.user
    const campaignId = req.user.campaign_id

    // Validation des données
    if (!status) {
      console.error("Statut manquant dans la requête")
      return res.status(400).json({ message: "Statut requis" })
    }

    // Vérifier si le statut est valide
    const validStatuses = ["READY", "PAUSED", "DIALING", "INCALL", "WAITING", "OFFLINE"]
    if (!validStatuses.includes(status)) {
      console.error("Statut invalide:", status)
      return res.status(400).json({ message: "Statut invalide" })
    }

    console.log(`Mise à jour du statut pour l'agent ${userId} (campagne ${campaignId}): ${status}`)
    if (pauseCode) {
      console.log(`Code de pause: ${pauseCode}`)
    }

    // Vérifier si l'agent existe dans vicidial_live_agents
    const checkQuery = `
            SELECT user 
            FROM vicidial_live_agents 
            WHERE user = ? 
            AND campaign_id = ? 
            LIMIT 1
        `

    const [results] = await db.query(checkQuery, [userId, campaignId])
    console.log("Résultat de la vérification:", results.length > 0 ? "Agent trouvé" : "Agent non trouvé")

    if (results.length === 0) {
      // L'agent n'est pas dans la table, l'ajouter
      const insertQuery = `
                INSERT INTO vicidial_live_agents 
                (user, campaign_id, status, last_update_time, random_id) 
                VALUES (?, ?, ?, NOW(), FLOOR(RAND() * 1000000))
            `

      const [insertResult] = await db.query(insertQuery, [userId, campaignId, status])
      console.log("Agent ajouté à vicidial_live_agents, ID:", insertResult.insertId)

      // Si l'agent est en pause, enregistrer le code de pause
      if (status === "PAUSED" && pauseCode) {
        await recordPauseCode(userId, pauseCode, campaignId)
        console.log("Code de pause enregistré pour le nouvel agent")
      }

      res.json({
        message: "Statut mis à jour (nouvel agent)",
        status,
        agent_id: userId,
        campaign_id: campaignId,
      })
    } else {
      // L'agent existe, mettre à jour son statut
      const updateQuery = `
                UPDATE vicidial_live_agents 
                SET status = ?, last_update_time = NOW() 
                WHERE user = ? 
                AND campaign_id = ?
            `

      const [updateResult] = await db.query(updateQuery, [status, userId, campaignId])
      console.log("Statut mis à jour, lignes affectées:", updateResult.affectedRows)

      // Si l'agent est en pause, enregistrer le code de pause
      if (status === "PAUSED" && pauseCode) {
        await recordPauseCode(userId, pauseCode, campaignId)
        console.log("Code de pause enregistré")
      }

      res.json({
        message: "Statut mis à jour",
        status,
        agent_id: userId,
        campaign_id: campaignId,
        updated: updateResult.affectedRows > 0,
      })
    }
  } catch (err) {
    console.error("Erreur lors de la mise à jour du statut:", err)
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    })
  }
})

// Fonction pour enregistrer le code de pause
async function recordPauseCode(userId, pauseCode, campaignId) {
  try {
    // Vérifier si le code de pause existe
    const checkPauseCodeQuery = `
            SELECT pause_code 
            FROM vicidial_pause_codes 
            WHERE pause_code = ? 
            AND (campaign_id = ? OR campaign_id IS NULL OR campaign_id = '')
            LIMIT 1
        `

    const [pauseCodeResults] = await db.query(checkPauseCodeQuery, [pauseCode, campaignId])

    if (pauseCodeResults.length === 0) {
      console.log(`Code de pause ${pauseCode} non trouvé, utilisation d'un code par défaut`)
      pauseCode = "BREAK" // Code par défaut
    }

    // Enregistrer le code de pause dans vicidial_agent_log
    const pauseLogQuery = `
            INSERT INTO vicidial_agent_log 
            (user, event_time, campaign_id, pause_code) 
            VALUES (?, NOW(), ?, ?)
        `

    await db.query(pauseLogQuery, [userId, campaignId, pauseCode])
    console.log(`Code de pause ${pauseCode} enregistré pour l'agent ${userId}`)

    // Mettre à jour le code de pause dans vicidial_live_agents
    const updatePauseCodeQuery = `
            UPDATE vicidial_live_agents 
            SET pause_code = ? 
            WHERE user = ? 
            AND campaign_id = ?
        `

    await db.query(updatePauseCodeQuery, [pauseCode, userId, campaignId])
    console.log(`Code de pause mis à jour dans vicidial_live_agents pour l'agent ${userId}`)

    return true
  } catch (err) {
    console.error("Erreur lors de l'enregistrement du code de pause:", err)
    return false
  }
}

// Route pour récupérer les codes de pause
router.get("/pause-codes", async (req, res) => {
  try {
    const campaignId = req.user.campaign_id

    // Récupérer les codes de pause spécifiques à la campagne et les codes génériques
    const pauseCodesQuery = `
            SELECT pause_code, pause_code_name, campaign_id, billable 
            FROM vicidial_pause_codes 
            WHERE campaign_id = ? OR campaign_id IS NULL OR campaign_id = ''
            ORDER BY pause_code_name
        `

    const [pauseCodes] = await db.query(pauseCodesQuery, [campaignId])

    if (pauseCodes.length === 0) {
      // Aucun code de pause trouvé, créer un code par défaut
      const defaultCode = {
        pause_code: "BREAK",
        pause_code_name: "Pause standard",
        campaign_id: campaignId,
        billable: "NO",
      }

      try {
        // Insérer le code de pause par défaut
        const insertDefaultCodeQuery = `
                    INSERT INTO vicidial_pause_codes 
                    (pause_code, pause_code_name, campaign_id, billable) 
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE pause_code_name = VALUES(pause_code_name)
                `

        await db.query(insertDefaultCodeQuery, [
          defaultCode.pause_code,
          defaultCode.pause_code_name,
          defaultCode.campaign_id,
          defaultCode.billable,
        ])

        return res.json([defaultCode])
      } catch (insertErr) {
        console.error("Erreur lors de la création du code de pause par défaut:", insertErr)
        return res.json([])
      }
    }

    return res.json(pauseCodes)
  } catch (err) {
    console.error("Erreur lors de la récupération des codes de pause:", err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour vérifier les appels entrants et sortants
router.get("/check-calls", async (req, res) => {
  try {
    const userId = req.user.user
    const campaignId = req.user.campaign_id

    // Vérifier les appels entrants
    const incomingCallsQuery = `
            SELECT uniqueid, phone_number, lead_id, status 
            FROM vicidial_closer_log 
            WHERE user = ? 
            AND campaign_id = ? 
            AND status = 'INCALL' 
            ORDER BY call_date DESC 
            LIMIT 1
        `

    const [incomingCalls] = await db.query(incomingCallsQuery, [userId, campaignId])

    // Vérifier les appels sortants
    const outgoingCallsQuery = `
            SELECT uniqueid, phone_number, lead_id, status 
            FROM vicidial_log 
            WHERE user = ? 
            AND campaign_id = ? 
            AND status = 'INCALL' 
            ORDER BY call_date DESC 
            LIMIT 1
        `

    const [outgoingCalls] = await db.query(outgoingCallsQuery, [userId, campaignId])

    res.json({
      incomingCalls: incomingCalls[0] || null,
      outgoingCalls: outgoingCalls[0] || null,
    })
  } catch (err) {
    console.error("Erreur lors de la vérification des appels:", err)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour initier un appel manuel
router.post("/manual-call", authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, leadId, contactName, agentId } = req.body
    const userId = req.user.user
    const campaignId = req.user.campaign_id || req.body.campaignId
    const extension = req.user.extension

    // Validation des données
    if (!phoneNumber && !leadId) {
      return res.status(400).json({
        message: "Numéro de téléphone ou ID de prospect requis",
      })
    }

    if (!campaignId) {
      return res.status(400).json({
        message: "ID de campagne requis",
      })
    }

    // Si leadId est fourni mais pas phoneNumber, récupérer le numéro de téléphone du prospect
    let finalPhoneNumber = phoneNumber;
    if (!phoneNumber && leadId) {
      const leadQuery = `
                SELECT phone_number 
                FROM vicidial_list 
                WHERE lead_id = ?
                LIMIT 1
            `;
      
      const [leadResults] = await db.query(leadQuery, [leadId]);
      
      if (leadResults.length > 0) {
        finalPhoneNumber = leadResults[0].phone_number;
        console.log(`Numéro de téléphone récupéré pour le prospect ${leadId}: ${finalPhoneNumber}`);
      } else {
        return res.status(404).json({
          message: "Prospect non trouvé",
        });
      }
    }

    // Vérifier si l'agent est déjà en appel
    const checkCallQuery = `
            SELECT status 
            FROM vicidial_live_agents 
            WHERE user = ? 
            AND campaign_id = ? 
            LIMIT 1
        `

    const [results] = await db.query(checkCallQuery, [userId, campaignId])

    if (results.length > 0 && results[0].status === "INCALL") {
      return res.status(400).json({
        message: "L'agent est déjà en appel",
      })
    }

    // Mettre à jour le statut de l'agent
    const updateStatusQuery = `
            INSERT INTO vicidial_live_agents 
            (user, campaign_id, status, last_update_time, random_id) 
            VALUES (?, ?, 'INCALL', NOW(), FLOOR(RAND() * 1000000))
            ON DUPLICATE KEY UPDATE status = 'INCALL', last_update_time = NOW()
        `

    await db.query(updateStatusQuery, [userId, campaignId])

    // Générer un ID unique pour l'appel
    const uniqueId = `M-${Date.now()}-${Math.floor(Math.random() * 1000000)}`

    // Enregistrer l'appel dans vicidial_log
    const logCallQuery = `
            INSERT INTO vicidial_log 
            (uniqueid, lead_id, list_id, campaign_id, call_date, start_epoch, user, phone_code, phone_number, status, user_group) 
            VALUES (?, ?, 0, ?, NOW(), UNIX_TIMESTAMP(), ?, '', ?, 'INCALL', 'ADMIN')
        `

    await db.query(logCallQuery, [uniqueId, leadId || 0, campaignId, userId, finalPhoneNumber])

    // Enregistrer l'appel dans vicidial_closer_log
    const closerLogQuery = `
            INSERT INTO vicidial_closer_log 
            (uniqueid, user, campaign_id, phone_number, lead_id, status, call_date, end_epoch, length_in_sec) 
            VALUES (?, ?, ?, ?, ?, 'INCALL', NOW(), NULL, 0)
        `

    await db.query(closerLogQuery, [uniqueId, userId, campaignId, finalPhoneNumber, leadId || 0])

    // Simuler l'appel (dans un environnement réel, cela serait fait via Asterisk)
    console.log(`Simulation d'appel: Agent ${userId} appelle ${finalPhoneNumber}`)

    // Retourner les informations d'appel
    res.json({
      message: "Appel initié avec succès",
      call_id: uniqueId,
      phone_number: finalPhoneNumber,
      lead_id: leadId || null,
      contact_name: contactName || "Contact",
      agent_id: userId,
      extension,
      campaign_id: campaignId,
    })
  } catch (err) {
    console.error("Erreur lors de l'initiation de l'appel:", err)
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    })
  }
})

// Route pour terminer un appel
router.post("/end-call", authenticateToken, async (req, res) => {
  try {
    const { callId, disposition } = req.body
    const userId = req.user.user
    const campaignId = req.user.campaign_id

    // Validation des données
    if (!callId) {
      return res.status(400).json({
        message: "ID d'appel requis",
      })
    }

    // Mettre à jour le statut de l'agent
    const updateStatusQuery = `
            UPDATE vicidial_live_agents 
            SET status = 'READY', last_update_time = NOW() 
            WHERE user = ? 
            AND campaign_id = ?
        `

    await db.query(updateStatusQuery, [userId, campaignId])

    // Mettre à jour l'appel dans vicidial_log
    const updateCallQuery = `
            UPDATE vicidial_log 
            SET status = ?, end_epoch = UNIX_TIMESTAMP(), length_in_sec = UNIX_TIMESTAMP() - start_epoch 
            WHERE uniqueid = ? 
            AND user = ?
        `

    await db.query(updateCallQuery, [disposition || "DONE", callId, userId])

    // Mettre à jour l'appel dans vicidial_closer_log
    const updateCloserLogQuery = `
            UPDATE vicidial_closer_log 
            SET status = ?, end_epoch = UNIX_TIMESTAMP(), length_in_sec = UNIX_TIMESTAMP() - UNIX_TIMESTAMP(call_date) 
            WHERE uniqueid = ? 
            AND user = ?
        `

    await db.query(updateCloserLogQuery, [disposition || "DONE", callId, userId])

    // Simuler la fin d'appel (dans un environnement réel, cela serait fait via Asterisk)
    console.log(`Simulation de fin d'appel: Agent ${userId}, Appel ${callId}, Disposition: ${disposition || "DONE"}`)

    // Retourner les informations de fin d'appel
    res.json({
      message: "Appel terminé avec succès",
      call_id: callId,
      disposition: disposition || "DONE",
      agent_id: userId,
      campaign_id: campaignId,
    })
  } catch (err) {
    console.error("Erreur lors de la fin de l'appel:", err)
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    })
  }
})

// Route pour mettre un appel en attente
router.post("/hold-call", authenticateToken, async (req, res) => {
  try {
    const { callId, hold } = req.body
    const userId = req.user.user

    // Validation des données
    if (!callId) {
      return res.status(400).json({
        message: "ID d'appel requis",
      })
    }

    // Simuler la mise en attente (dans un environnement réel, cela serait fait via Asterisk)
    console.log(`Simulation de mise en attente: Agent ${userId}, Appel ${callId}, Attente: ${hold ? "OUI" : "NON"}`)

    // Retourner les informations de mise en attente
    res.json({
      message: hold ? "Appel mis en attente" : "Appel repris",
      call_id: callId,
      hold,
      agent_id: userId,
    })
  } catch (err) {
    console.error("Erreur lors de la mise en attente:", err)
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    })
  }
})

// Route pour mettre un appel en sourdine
router.post("/mute-call", authenticateToken, async (req, res) => {
  try {
    const { callId, mute } = req.body
    const userId = req.user.user

    // Validation des données
    if (!callId) {
      return res.status(400).json({
        message: "ID d'appel requis",
      })
    }

    // Simuler la mise en sourdine (dans un environnement réel, cela serait fait via Asterisk)
    console.log(`Simulation de mise en sourdine: Agent ${userId}, Appel ${callId}, Sourdine: ${mute ? "OUI" : "NON"}`)

    // Retourner les informations de mise en sourdine
    res.json({
      message: mute ? "Appel mis en sourdine" : "Sourdine désactivée",
      call_id: callId,
      mute,
      agent_id: userId,
    })
  } catch (err) {
    console.error("Erreur lors de la mise en sourdine:", err)
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    })
  }
})

// Route pour transférer un appel
router.post("/transfer-call", authenticateToken, async (req, res) => {
  try {
    const { callId, targetExtension, targetAgent } = req.body
    const userId = req.user.user

    // Validation des données
    if (!callId) {
      return res.status(400).json({
        message: "ID d'appel requis",
      })
    }

    if (!targetExtension && !targetAgent) {
      return res.status(400).json({
        message: "Extension cible ou agent cible requis",
      })
    }

    // Simuler le transfert (dans un environnement réel, cela serait fait via Asterisk)
    console.log(
      `Simulation de transfert: Agent ${userId}, Appel ${callId}, Cible: ${
        targetAgent || targetExtension
      }`
    )

    // Retourner les informations de transfert
    res.json({
      message: "Appel transféré avec succès",
      call_id: callId,
      target_extension: targetExtension,
      target_agent: targetAgent,
      agent_id: userId,
    })
  } catch (err) {
    console.error("Erreur lors du transfert:", err)
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    })
  }
})

// Route pour démarrer le composeur prédictif
router.post("/predictive/start", authenticateToken, async (req, res) => {
  try {
    const { campaignId, level } = req.body

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: "ID de campagne requis",
      })
    }

    const result = await asteriskService.startPredictiveDialer(campaignId, level)

    res.json({
      success: true,
      message: "Composeur prédictif démarré avec succès",
      data: result,
    })
  } catch (error) {
    console.error("Erreur lors du démarrage du composeur prédictif:", error)
    res.status(500).json({
      success: false,
      message: "Erreur lors du démarrage du composeur prédictif",
      error: error.message,
    })
  }
})

// Route pour arrêter le composeur prédictif
router.post("/predictive/stop", authenticateToken, async (req, res) => {
  try {
    const { campaignId } = req.body

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: "ID de campagne requis",
      })
    }

    const result = await asteriskService.stopPredictiveDialer(campaignId)

    res.json({
      success: true,
      message: "Composeur prédictif arrêté avec succès",
      data: result,
    })
  } catch (error) {
    console.error("Erreur lors de l'arrêt du composeur prédictif:", error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'arrêt du composeur prédictif",
      error: error.message,
    })
  }
})

// Route pour vérifier le statut Asterisk d'un agent
router.get("/asterisk-status/:agentId", authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    
    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: "ID d'agent requis"
      });
    }
    
    // Vérifier si l'agent est enregistré dans Asterisk
    // Dans un environnement réel, vous interrogeriez Asterisk via AMI
    // Ici, nous simulons une vérification
    
    // Vérifier si l'agent existe dans vicidial_live_agents
    const checkQuery = `
      SELECT user, status, campaign_id, conf_exten 
      FROM vicidial_live_agents 
      WHERE user = ? 
      LIMIT 1
    `;
    
    const [results] = await db.query(checkQuery, [agentId]);
    
    if (results.length === 0) {
      return res.json({
        success: true,
        registered: false,
        message: "Agent non enregistré dans Asterisk"
      });
    }
    
    // Vérifier si l'extension SIP est enregistrée
    // Dans un environnement réel, vous feriez une requête AMI à Asterisk
    // Ici, nous supposons que si l'agent est dans vicidial_live_agents, son extension est enregistrée
    
    return res.json({
      success: true,
      registered: true,
      status: results[0].status,
      extension: results[0].conf_exten,
      campaignId: results[0].campaign_id
    });
  } catch (err) {
    console.error("Erreur lors de la vérification du statut Asterisk de l'agent:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: err.message
    });
  }
});

// Route pour vérifier les appels entrants
router.get("/check-calls", authenticateToken, async (req, res) => {
  try {
    // Simuler la vérification des appels entrants
    // Dans une implémentation réelle, cela interrogerait Asterisk

    // Exemple de réponse simulée
    const hasIncomingCall = Math.random() > 0.8 // 20% de chance d'avoir un appel entrant

    if (hasIncomingCall) {
      res.json({
        success: true,
        incomingCalls: {
          uniqueid: `CALL-${Date.now()}`,
          phone_number: `0${Math.floor(Math.random() * 900000000) + 100000000}`,
          lead_id: `LEAD-${Math.floor(Math.random() * 1000)}`,
          contact_name: "Contact entrant",
          direction: "inbound",
        },
      })
    } else {
      res.json({
        success: true,
        incomingCalls: null,
      })
    }
  } catch (error) {
    console.error("Erreur lors de la vérification des appels:", error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification des appels",
      error: error.message,
    })
  }
})

module.exports = router
