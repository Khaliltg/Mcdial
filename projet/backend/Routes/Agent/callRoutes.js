const express = require("express");
const router = express.Router();
const db = require("../../config/bd"); // Utiliser la connexion existante
const dotenv = require("dotenv");
const { authenticateToken } = require("../../middleware/auth");
const asteriskService = require("../../services/asteriskService");

// Stockage des informations d'appel en cours par agent
const activeCallsByAgent = new Map();

// Écouter les événements d'appel du service Asterisk
asteriskService.on('callConnected', (callData) => {
  console.log('Appel connecté détecté:', callData);
  
  // Récupérer l'agent associé à cet appel
  db.query(
    'SELECT user FROM vicidial_auto_calls WHERE uniqueid = ? OR callerid LIKE ?',
    [callData.uniqueId, `%${callData.uniqueId}%`]
  ).then(([rows]) => {
    if (rows && rows.length > 0) {
      const agentId = rows[0].user;
      console.log(`Appel associé à l'agent ${agentId}`);
      
      // Stocker les informations d'appel pour cet agent
      activeCallsByAgent.set(agentId, {
        ...callData,
        timestamp: Date.now()
      });
    }
  }).catch(err => {
    console.error('Erreur lors de la récupération de l\'agent pour l\'appel:', err);
  });
});

// Écouter les événements de fin d'appel
asteriskService.on('callHangup', (callData) => {
  console.log('Fin d\'appel détectée:', callData);
  
  // Parcourir tous les agents pour trouver celui qui a cet appel
  for (const [agentId, activeCall] of activeCallsByAgent.entries()) {
    if (activeCall.uniqueId === callData.uniqueId) {
      console.log(`Suppression de l'appel pour l'agent ${agentId}`);
      activeCallsByAgent.delete(agentId);
      break;
    }
  }
});

// Charger les variables d'environnement
dotenv.config()

// Route pour récupérer les informations d'appel en cours pour un agent
router.get("/active-call", authenticateToken, async (req, res) => {
  try {
    const agentId = req.user.user;
    
    // Vérifier si l'agent a un appel en cours
    const activeCall = activeCallsByAgent.get(agentId);
    
    if (activeCall) {
      // Si l'appel est trop ancien (plus de 30 minutes), le supprimer
      const callAge = Date.now() - activeCall.timestamp;
      if (callAge > 30 * 60 * 1000) { // 30 minutes en millisecondes
        activeCallsByAgent.delete(agentId);
        return res.json({ success: true, hasActiveCall: false });
      }
      
      // Renvoyer les informations de l'appel
      return res.json({
        success: true,
        hasActiveCall: true,
        callData: {
          leadId: activeCall.leadId,
          phoneNumber: activeCall.phoneNumber,
          firstName: activeCall.firstName,
          lastName: activeCall.lastName,
          address: activeCall.address,
          city: activeCall.city,
          state: activeCall.state,
          postalCode: activeCall.postalCode,
          email: activeCall.email,
          comments: activeCall.comments
        }
      });
    } else {
      // Vérifier dans la base de données si l'agent a un appel en cours
      const [callRows] = await db.query(
        `SELECT vac.*, vl.* 
         FROM vicidial_auto_calls vac 
         JOIN vicidial_list vl ON vac.lead_id = vl.lead_id 
         WHERE vac.user = ? AND vac.status IN ('SENT', 'LIVE')`,
        [agentId]
      );
      
      if (callRows && callRows.length > 0) {
        const callInfo = callRows[0];
        
        // Stocker les informations d'appel pour cet agent
        const callData = {
          uniqueId: callInfo.uniqueid,
          leadId: callInfo.lead_id,
          phoneNumber: callInfo.phone_number,
          firstName: callInfo.first_name,
          lastName: callInfo.last_name,
          address: callInfo.address1,
          city: callInfo.city,
          state: callInfo.state,
          postalCode: callInfo.postal_code,
          email: callInfo.email,
          comments: callInfo.comments,
          timestamp: Date.now()
        };
        
        activeCallsByAgent.set(agentId, callData);
        
        return res.json({
          success: true,
          hasActiveCall: true,
          callData: {
            leadId: callData.leadId,
            phoneNumber: callData.phoneNumber,
            firstName: callData.firstName,
            lastName: callData.lastName,
            address: callData.address,
            city: callData.city,
            state: callData.state,
            postalCode: callData.postalCode,
            email: callData.email,
            comments: callData.comments
          }
        });
      } else {
        return res.json({ success: true, hasActiveCall: false });
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des informations d\'appel:', error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

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
      // Récupérer l'adresse IP du serveur Asterisk depuis la base de données
      const [serverInfo] = await db.query(
        "SELECT server_ip FROM servers WHERE active_asterisk_server = 'Y' AND active = 'Y' LIMIT 1"
      );
      
      // Utiliser l'adresse IP récupérée ou une valeur par défaut si non trouvée
      const serverIp = (serverInfo && serverInfo.length > 0) ? serverInfo[0].server_ip : process.env.ASTERISK_HOST || '127.0.0.1';
      
      // Vérifier si l'extension existe déjà dans vicidial_live_agents
      const [existingAgent] = await db.query(
        "SELECT extension FROM vicidial_live_agents WHERE user = ? LIMIT 1",
        [userId]
      );
      
      let extension;
      if (existingAgent && existingAgent.length > 0 && existingAgent[0].extension) {
        extension = existingAgent[0].extension;
      } else {
        // Si aucune extension n'est trouvée, utiliser l'ID utilisateur comme extension par défaut
        // ou une valeur fixe comme 1001 si l'ID utilisateur n'est pas numérique
        extension = userId.match(/^\d+$/) ? userId : '1001';
      }
      
      console.log(`Extension utilisée pour l'agent ${userId}: ${extension}`);
      
      // Générer un numéro de conférence au format correct (8600xxx)
      const confExten = `8600${Math.floor(Math.random() * 900) + 100}`;
      
      // Formater le canal SIP correctement
      const sipChannel = `SIP/${extension}`;
      
      const insertQuery = `
                INSERT INTO vicidial_live_agents 
                (user, server_ip, conf_exten, extension, campaign_id, status, channel,
                 last_update_time, last_state_change, random_id, call_server_ip) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), FLOOR(RAND() * 1000000), ?)
            `

      const [insertResult] = await db.query(insertQuery, [
        userId, 
        serverIp, 
        confExten, 
        extension, 
        campaignId, 
        status, 
        sipChannel,
        serverIp
      ])
      console.log("Agent ajouté à vicidial_live_agents, ID:", insertResult.insertId)

      // Si l'agent est en pause, enregistrer le code de pause
      if (status === "PAUSED" && pauseCode) {
        await recordPauseCode(userId, pauseCode, campaignId)
        console.log("Code de pause enregistré pour le nouvel agent")
      } else if (status === "READY") {
        // Enregistrer le statut READY dans vicidial_agent_log
        await recordAgentStatus(userId, campaignId, status)
        console.log("Statut READY enregistré pour le nouvel agent")
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
                SET status = ?, last_update_time = NOW(), last_state_change = NOW() 
                WHERE user = ? 
                AND campaign_id = ?
            `

      const [updateResult] = await db.query(updateQuery, [status, userId, campaignId])
      console.log("Statut mis à jour, lignes affectées:", updateResult.affectedRows)

      // Enregistrer le changement de statut dans vicidial_agent_log en fonction du type de statut
      if (status === "PAUSED" && pauseCode) {
        // Si l'agent est en pause, enregistrer le code de pause
        await recordPauseCode(userId, pauseCode, campaignId)
        console.log("Code de pause enregistré")
      } else if (status === "READY" || status === "INCALL" || status === "LOGOUT") {
        // Pour les autres statuts, utiliser la fonction générique
        await recordAgentStatus(userId, campaignId, status)
        console.log(`Statut ${status} enregistré dans vicidial_agent_log`)
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

// Fonction pour enregistrer le code de pause et les informations de statut
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

    // Récupérer l'IP du serveur
    const serverIp = process.env.SERVER_IP || '127.0.0.1';
    
    // Récupérer le groupe d'utilisateur
    const userGroupQuery = `
            SELECT user_group 
            FROM vicidial_users 
            WHERE user = ? 
            LIMIT 1
        `;
    
    const [userGroupResults] = await db.query(userGroupQuery, [userId]);
    const userGroup = userGroupResults.length > 0 ? userGroupResults[0].user_group : 'ADMIN';
    
    // Obtenir l'epoch actuel pour l'horodatage
    const currentEpoch = Math.floor(Date.now() / 1000);
    
    // Utiliser comments au lieu de pause_code qui n'existe pas dans la table
    const pauseLogQuery = `
            INSERT INTO vicidial_agent_log 
            (user, server_ip, event_time, campaign_id, comments, pause_epoch, status, user_group, pause_type) 
            VALUES (?, ?, NOW(), ?, ?, ?, 'PAUSED', ?, 'AGENT')
        `;

    await db.query(pauseLogQuery, [userId, serverIp, campaignId, pauseCode, currentEpoch, userGroup]);
    console.log(`Code de pause ${pauseCode} enregistré pour l'agent ${userId}`);

    // Mettre à jour le code de pause dans vicidial_live_agents
    const updatePauseCodeQuery = `
            UPDATE vicidial_live_agents 
            SET status = 'PAUSED', 
                pause_code = ?, 
                last_state_change = NOW() 
            WHERE user = ?
        `;
    
    await db.query(updatePauseCodeQuery, [pauseCode, userId]);
    console.log(`Code de pause mis à jour dans vicidial_live_agents pour l'agent ${userId}`);

    return true;
  } catch (err) {
    console.error("Erreur lors de l'enregistrement du code de pause:", err);
    return false;
  }
}

// Fonction pour enregistrer un changement de statut dans vicidial_agent_log
async function recordAgentStatus(userId, campaignId, status) {
  try {
    // Récupérer l'IP du serveur
    const serverIp = process.env.SERVER_IP || '127.0.0.1';
    
    // Récupérer le groupe d'utilisateur
    const userGroupQuery = `
            SELECT user_group 
            FROM vicidial_users 
            WHERE user = ? 
            LIMIT 1
        `;
    
    const [userGroupResults] = await db.query(userGroupQuery, [userId]);
    const userGroup = userGroupResults.length > 0 ? userGroupResults[0].user_group : 'ADMIN';
    
    // Obtenir l'epoch actuel pour l'horodatage
    const currentEpoch = Math.floor(Date.now() / 1000);
    
    // Déterminer les champs à mettre à jour en fonction du statut
    let epochField = '';
    let typeField = 'API';
    
    if (status === 'READY') {
      epochField = 'wait_epoch';
    } else if (status === 'INCALL') {
      epochField = 'talk_epoch';
    } else if (status === 'LOGOUT') {
      epochField = 'dispo_epoch';
    }
    
    // Enregistrer le changement de statut dans vicidial_agent_log
    const logQuery = `
            INSERT INTO vicidial_agent_log 
            (user, server_ip, event_time, campaign_id, ${epochField}, status, user_group, pause_type) 
            VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)
        `;

    await db.query(logQuery, [userId, serverIp, campaignId, currentEpoch, status, userGroup, typeField]);
    console.log(`Statut ${status} enregistré pour l'agent ${userId}`);

    return true;
  } catch (err) {
    console.error("Erreur lors de l'enregistrement du statut de l'agent:", err);
    return false;
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
    // Récupérer l'adresse IP du serveur Asterisk depuis la base de données
    const [serverInfo2] = await db.query(
      "SELECT server_ip FROM servers WHERE active_asterisk_server = 'Y' AND active = 'Y' LIMIT 1"
    );
    
    // Utiliser l'adresse IP récupérée ou une valeur par défaut si non trouvée
    const serverIp2 = (serverInfo2 && serverInfo2.length > 0) ? serverInfo2[0].server_ip : process.env.ASTERISK_HOST || '127.0.0.1';
    
    // Récupérer l'extension de l'agent
    const [userExtension2] = await db.query(
      "SELECT extension FROM vicidial_users WHERE user = ? LIMIT 1",
      [userId]
    );
    
    const extension2 = userExtension2.length > 0 ? userExtension2[0].extension : userId;
    
    // Générer un numéro de conférence au format correct (8600xxx)
    const confExten2 = `8600${Math.floor(Math.random() * 900) + 100}`;
    
    // Formater le canal SIP correctement
    const sipChannel2 = `SIP/${extension2}`;
    
    const updateStatusQuery = `
            INSERT INTO vicidial_live_agents 
            (user, server_ip, conf_exten, extension, campaign_id, status, channel, 
             last_update_time, random_id, call_server_ip) 
            VALUES (?, ?, ?, ?, ?, 'INCALL', ?, NOW(), FLOOR(RAND() * 1000000), ?)
            ON DUPLICATE KEY UPDATE status = 'INCALL', last_update_time = NOW(), 
            server_ip = ?, conf_exten = ?, extension = ?, channel = ?, call_server_ip = ?
        `

    await db.query(updateStatusQuery, [
      userId, 
      serverIp2, 
      confExten2, 
      extension2, 
      campaignId, 
      sipChannel2,
      serverIp2,
      // For the ON DUPLICATE KEY UPDATE part:
      serverIp2,
      confExten2,
      extension2,
      sipChannel2,
      serverIp2
    ])

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

// Route pour terminer un appel (hangup) - Nouvelle route compatible avec le frontend
router.post("/calls/hangup", authenticateToken, async (req, res) => {
  try {
    const { callId, disposition } = req.body
    const userId = req.user.user
    const campaignId = req.user.campaign_id

    // Validation des données
    if (!callId && !req.user.callId) {
      return res.status(400).json({
        message: "ID d'appel requis",
      })
    }

    // Utiliser l'ID d'appel fourni ou celui stocké dans l'objet utilisateur
    const actualCallId = callId || req.user.callId

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

    await db.query(updateCallQuery, [disposition || "DONE", actualCallId, userId])

    // Mettre à jour l'appel dans vicidial_closer_log
    const updateCloserLogQuery = `
            UPDATE vicidial_closer_log 
            SET status = ?, end_epoch = UNIX_TIMESTAMP(), length_in_sec = UNIX_TIMESTAMP() - UNIX_TIMESTAMP(call_date) 
            WHERE uniqueid = ? 
            AND user = ?
        `

    await db.query(updateCloserLogQuery, [disposition || "DONE", actualCallId, userId])

    // Simuler la fin d'appel (dans un environnement réel, cela serait fait via Asterisk)
    console.log(`Simulation de fin d'appel: Agent ${userId}, Appel ${actualCallId}, Disposition: ${disposition || "DONE"}`)

    res.json({
      message: "Appel terminé avec succès",
      call_id: actualCallId,
      agent_id: userId,
    })
  } catch (err) {
    console.error("Erreur lors de la fin d'appel:", err)
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    })
  }
})

// Route pour terminer un appel (ancienne route maintenue pour compatibilité)
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
      error: err.message
    })
  }
}) // Accolade fermante ajoutée ici

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
  console.log('Début de la requête de démarrage du composeur prédictif');
  console.log('Données reçues:', req.body);
  
  try {
    const { campaignId, level = 'AUTO' } = req.body;
    console.log(`Paramètres: campaignId=${campaignId}, level=${level}`);

    // Vérification des paramètres
    if (!campaignId) {
      console.log('Erreur: ID de campagne manquant');
      return res.status(400).json({
        success: false,
        message: "ID de campagne requis",
      });
    }
    
    // Vérifier si la campagne existe dans la base de données
    try {
      const [campaigns] = await db.query(
        'SELECT campaign_id, campaign_name FROM vicidial_campaigns WHERE campaign_id = ?',
        [campaignId]
      );
      
      if (campaigns.length === 0) {
        console.log(`Erreur: Campagne ${campaignId} non trouvée dans la base de données`);
        return res.status(404).json({
          success: false,
          message: `Campagne ${campaignId} non trouvée`,
        });
      }
      
      console.log(`Campagne ${campaignId} (${campaigns[0].campaign_name}) trouvée, démarrage du composeur...`);
    } catch (dbError) {
      console.error('Erreur lors de la vérification de la campagne:', dbError);
      // Continuer malgré l'erreur de vérification
    }

    // Appel au service Asterisk pour démarrer le composeur
    console.log('Appel du service asteriskService.startPredictiveDialer...');
    const result = await asteriskService.startPredictiveDialer(campaignId, level);
    console.log('Résultat du démarrage du composeur:', result);

    // Réponse réussie
    res.json({
      success: true,
      message: "Composeur prédictif démarré avec succès",
      data: result,
    });
  } catch (error) {
    // Journalisation détaillée de l'erreur
    console.error("Erreur lors du démarrage du composeur prédictif:", error);
    console.error("Détails de l'erreur:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Essayer de démarrer le composeur via une méthode alternative
    try {
      console.log('Tentative de démarrage alternatif du composeur...');
      const [result] = await db.query(
        'UPDATE vicidial_campaigns SET auto_dial_level = ? WHERE campaign_id = ?',
        [level === 'AUTO' ? 1.0 : parseFloat(level), campaignId]
      );
      
      console.log('Résultat de la mise à jour directe de la base de données:', result);
      
      return res.json({
        success: true,
        message: "Composeur prédictif démarré via la méthode alternative",
        method: "database",
        affectedRows: result.affectedRows
      });
    } catch (dbError) {
      console.error('Erreur lors de la tentative alternative:', dbError);
      
      // Renvoyer l'erreur originale
      res.status(500).json({
        success: false,
        message: "Erreur lors du démarrage du composeur prédictif",
        error: error.message,
        details: error.stack
      });
    }
  }
})

// Route pour arrêter le composeur prédictif
router.post("/predictive/stop", authenticateToken, async (req, res) => {
  console.log('Début de la requête d\'arrêt du composeur prédictif');
  console.log('Données reçues:', req.body);
  
  try {
    const { campaignId } = req.body;
    console.log(`Paramètres: campaignId=${campaignId}`);

    // Vérification des paramètres
    if (!campaignId) {
      console.log('Erreur: ID de campagne manquant');
      return res.status(400).json({
        success: false,
        message: "ID de campagne requis",
      });
    }
    
    // Vérifier si la campagne existe dans la base de données
    try {
      const [campaigns] = await db.query(
        'SELECT campaign_id, campaign_name FROM vicidial_campaigns WHERE campaign_id = ?',
        [campaignId]
      );
      
      if (campaigns.length === 0) {
        console.log(`Erreur: Campagne ${campaignId} non trouvée dans la base de données`);
        return res.status(404).json({
          success: false,
          message: `Campagne ${campaignId} non trouvée`,
        });
      }
      
      console.log(`Campagne ${campaignId} (${campaigns[0].campaign_name}) trouvée, arrêt du composeur...`);
    } catch (dbError) {
      console.error('Erreur lors de la vérification de la campagne:', dbError);
      // Continuer malgré l'erreur de vérification
    }

    // Appel au service Asterisk pour arrêter le composeur
    console.log('Appel du service asteriskService.stopPredictiveDialer...');
    const result = await asteriskService.stopPredictiveDialer(campaignId);
    console.log('Résultat de l\'arrêt du composeur:', result);

    // Réponse réussie
    res.json({
      success: true,
      message: "Composeur prédictif arrêté avec succès",
      data: result,
    });
  } catch (error) {
    // Journalisation détaillée de l'erreur
    console.error("Erreur lors de l'arrêt du composeur prédictif:", error);
    console.error("Détails de l'erreur:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Essayer d'arrêter le composeur via une méthode alternative
    try {
      console.log('Tentative d\'arrêt alternatif du composeur...');
      const [result] = await db.query(
        'UPDATE vicidial_campaigns SET auto_dial_level = 0 WHERE campaign_id = ?',
        [campaignId]
      );
      
      console.log('Résultat de la mise à jour directe de la base de données:', result);
      
      return res.json({
        success: true,
        message: "Composeur prédictif arrêté via la méthode alternative",
        method: "database",
        affectedRows: result.affectedRows
      });
    } catch (dbError) {
      console.error('Erreur lors de la tentative alternative:', dbError);
      
      // Renvoyer l'erreur originale
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'arrêt du composeur prédictif",
        error: error.message,
        details: error.stack
      });
    }
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

// Route pour vérifier les appels entrants (nouvelle version pour le mode prédictif)
router.get("/check", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user;
    const campaignId = req.user.campaign_id;
    
    // Vérifier s'il y a des appels entrants pour cet agent dans le système prédictif
    // Dans un environnement réel, cela interrogerait la table des appels en cours
    
    // Exemple de réponse simulée pour le développement
    const hasIncomingCall = Math.random() > 0.8; // 20% de chance d'avoir un appel entrant
    
    if (hasIncomingCall) {
      // Générer un appel simulé
      const callId = `CALL-${Date.now()}`;
      const phoneNumber = `0${Math.floor(Math.random() * 900000000) + 100000000}`;
      const leadId = `LEAD-${Math.floor(Math.random() * 1000)}`;
      
      // Enregistrer l'appel dans la base de données (simulation)
      console.log(`Appel entrant simulé pour l'agent ${userId}: ${callId} (${phoneNumber})`);
      
      // Répondre avec les détails de l'appel
      return res.json({
        success: true,
        hasIncomingCall: true,
        call: {
          callId: callId,
          phoneNumber: phoneNumber,
          leadId: leadId,
          contactName: "Contact entrant",
          direction: "inbound"
        }
      });
    } else {
      // Pas d'appel entrant
      return res.json({
        success: true,
        hasIncomingCall: false
      });
    }
  } catch (error) {
    console.error("Erreur lors de la vérification des appels:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification des appels",
      error: error.message
    });
  }
})

// Route pour tester les commandes CLI Asterisk
router.post("/test-asterisk-cli", authenticateToken, async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        message: "Commande CLI requise"
      });
    }
    
    console.log(`Exécution de la commande CLI Asterisk: ${command}`);
    
    // Exécuter la commande via l'action 'Command' standard d'AMI
    asteriskService.ami.action({
      Action: 'Command',
      Command: command
    }, (err, cliRes) => {
      if (err) {
        console.error(`Erreur lors de l'exécution de la commande CLI:`, err);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'exécution de la commande CLI",
          error: err.message
        });
      }
      
      console.log(`Résultat de la commande CLI:`, cliRes);
      return res.json({
        success: true,
        message: "Commande CLI exécutée avec succès",
        result: cliRes
      });
    });
  } catch (error) {
    console.error("Erreur lors du test CLI Asterisk:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du test CLI Asterisk",
      error: error.message
    });
  }
})

module.exports = router