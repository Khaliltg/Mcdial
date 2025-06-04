const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const db = require("../../config/bd")
const { authenticateToken } = require("../../middleware/auth")
const asteriskService = require("../../services/asteriskService")
const forceAgentPaused = require("../../scripts/forceAgentPaused")

// Route pour l'authentification téléphonique (étape 1)
router.post("/phone-login", async (req, res) => {
  const { phoneLogin, phonePassword } = req.body

  if (!phoneLogin || !phonePassword) {
    return res.status(400).json({ message: "Identifiant et mot de passe téléphonique requis" })
  }

  try {
    // Vérifier les identifiants téléphoniques dans la table phones
    // Utilisation de la même structure que Vicidial
    const [rows] = await db.query('SELECT * FROM phones WHERE login = ? AND active = "Y"', [phoneLogin])

    if (rows.length === 0) {
      return res.status(401).json({ message: "Identifiants téléphoniques invalides" })
    }

    const phone = rows[0]

    // Comparer le mot de passe (en texte brut comme dans Vicidial)
    const valid = phonePassword === phone.pass

    if (!valid) {
      return res.status(401).json({ message: "Identifiants téléphoniques invalides" })
    }

    // Récupérer les informations importantes du téléphone
    const extension = phone.extension
    const dialplan_number = phone.dialplan_number
    const voicemail_id = phone.voicemail_id
    const phone_ip = phone.phone_ip

    // Créer un token de session pour l'étape téléphonique
    const phoneSessionToken = jwt.sign(
      {
        phone_id: phone.id,
        phone_login: phone.login,
        extension: extension,
        dialplan_number: dialplan_number,
        voicemail_id: voicemail_id,
        phone_ip: phone_ip,
        step: "phone",
      },
      process.env.JWT_SECRET || 'votre_secret_jwt',
      { expiresIn: '1h' }
    ); // Durée de 1 heure pour la sécurité

    // Retourner le token de session téléphonique
    res.json({
      success: true,
      phoneSessionToken,
      extension: extension,
      message: "Authentification téléphonique réussie",
    })
  } catch (err) {
    console.error("Erreur lors de l'authentification téléphonique:", err)
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    })
  }
})

// Route pour l'authentification utilisateur (étape 2)
router.post("/user-login", async (req, res) => {
  const { userLogin, userPassword } = req.body

  if (!userLogin || !userPassword) {
    return res.status(400).json({ message: "Identifiant et mot de passe utilisateur requis" })
  }

  // Vérifier le token de session téléphonique
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token de session téléphonique requis" })
  }

  const phoneSessionToken = authHeader.split(" ")[1]

  try {
    // Vérifier et décoder le token de session téléphonique
    const decoded = jwt.verify(phoneSessionToken, process.env.JWT_SECRET)

    if (decoded.step !== "phone") {
      return res.status(401).json({ message: "Token de session téléphonique invalide" })
    }

    // Vérifier les identifiants utilisateur dans la table vicidial_users comme dans Vicidial
    const [rows] = await db.query("SELECT * FROM vicidial_users WHERE user = ? AND user_level > 0", [userLogin])

    if (rows.length === 0) {
      return res.status(401).json({ message: "Identifiants utilisateur invalides" })
    }

    const user = rows[0]

    // Comparer le mot de passe (en texte brut comme dans Vicidial)
    const valid = userPassword === user.pass

    if (!valid) {
      return res.status(401).json({ message: "Identifiants utilisateur invalides" })
    }

    // Vérifier que l'utilisateur est un agent (user_level approprié)
    // Dans Vicidial, les agents ont généralement un user_level de 1
    if (user.user_level > 4) {
      // Agents ont un user_level <= 4
      return res.status(403).json({ message: "Accès non autorisé pour ce type d'utilisateur" })
    }

    // Récupérer les campagnes disponibles pour cet utilisateur
    // Dans Vicidial, les campagnes sont filtrées par active='Y'
    const [campaigns] = await db.query(`
            SELECT campaign_id as id, campaign_name as name, active, dial_method,
                   dial_timeout, lead_filter_id, hopper_level, auto_dial_level
            FROM vicidial_campaigns 
            WHERE active = 'Y'
            ORDER BY campaign_name
        `)

    // Créer un token de session utilisateur avec toutes les informations nécessaires
    const userSessionToken = jwt.sign(
      {
        phone_id: decoded.phone_id,
        phone_login: decoded.phone_login,
        extension: decoded.extension,
        dialplan_number: decoded.dialplan_number,
        voicemail_id: decoded.voicemail_id,
        phone_ip: decoded.phone_ip,
        user_id: user.user_id,
        user: user.user,
        full_name: user.full_name,
        user_level: user.user_level,
        step: "user",
      },
      process.env.JWT_SECRET || 'votre_secret_jwt',
      { expiresIn: '24h' }
    ); // Durée de 24 heures pour la sécurité

    // Retourner le token de session utilisateur et les campagnes
    res.json({
      success: true,
      userSessionToken,
      campaigns,
      user_level: user.user_level,
      full_name: user.full_name,
      message: "Authentification utilisateur réussie",
    })
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token de session téléphonique expiré ou invalide" })
    }

    console.error("Erreur lors de l'authentification utilisateur:", err)
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    })
  }
})

// Route pour la sélection de campagne (étape 3)
router.post("/select-campaign", async (req, res) => {
  console.log('Début de la sélection de campagne');
  console.log('Requête reçue:', {
    campaignId: req.body.campaignId,
    headers: {
      authorization: req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'null'
    }
  });

  const { campaignId } = req.body

  if (!campaignId) {
    console.error("Erreur: ID de campagne manquant");
    return res.status(400).json({ 
      message: "ID de campagne requis",
      error: "Campaign ID is required"
    });
  }

  // Vérifier le token de session utilisateur
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Erreur: Token d'autorisation manquant ou invalide");
    return res.status(401).json({ 
      message: "Token de session utilisateur requis",
      error: "Bearer token required"
    });
  }

  const userSessionToken = authHeader.split(" ")[1];
  console.log('Token utilisateur reçu:', userSessionToken.substring(0, 20) + '...');

  try {
    // Vérifier et décoder le token de session utilisateur
    console.log('Début de la vérification du token JWT');
    const decoded = jwt.verify(userSessionToken, process.env.JWT_SECRET || "votre_secret_jwt");
    console.log('Token JWT vérifié avec succès');

    if (decoded.step !== "user") {
      console.error("Erreur: Étape du token invalide:", decoded.step);
      return res.status(401).json({ 
        message: "Token de session utilisateur invalide",
        error: "Invalid token step"
      });
    }

    // Récupérer les informations de l'utilisateur et de l'extension
    const extension = decoded.extension;
    console.log('Extension SIP:', extension);
    console.log('Début de la vérification de l\'enregistrement SIP');

    try {
      console.log('Vérification de l\'enregistrement SIP pour l\'extension:', extension);
      
      const sipStatus = await asteriskService.checkSipRegistration(extension);
      console.log('Résultat de la vérification SIP:', {
        registered: sipStatus.registered,
        status: sipStatus.status,
        host: sipStatus.host,
        port: sipStatus.port,
        userAgent: sipStatus.userAgent
      });
      
      if (!sipStatus.registered) {
        console.error('Erreur: Extension non enregistrée');
        console.error('Détails de l\'enregistrement:', sipStatus);
        
        // Vérifier si l'extension existe dans Asterisk
        const config = await asteriskService.checkExtensionConfig(extension);
        console.log('Configuration de l\'extension:', config);
        
        if (!config.exists) {
          return res.status(400).json({
            message: 'Extension non configurée dans Asterisk',
            error: 'Extension not configured',
            details: config
          });
        }

        // Si l'extension existe mais n'est pas enregistrée, attendre un peu
        console.log('Extension configurée mais non enregistrée, attente de 5 secondes...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Réessayer la vérification
        const sipStatusRetry = await asteriskService.checkSipRegistration(extension);
        console.log('Nouvelle vérification SIP:', sipStatusRetry);
        
        if (!sipStatusRetry.registered) {
          return res.status(400).json({
            message: 'Extension SIP non enregistrée après attente',
            error: 'SIP registration failed',
            details: sipStatusRetry
          });
        }
      }

      // Si l'extension est enregistrée, effectuer un appel de synchronisation
      console.log('Extension SIP enregistrée avec succès');
      console.log('Détails de l\'enregistrement:', {
        host: sipStatus.host,
        port: sipStatus.port,
        userAgent: sipStatus.userAgent
      });
      
      // Effectuer un appel de synchronisation vers l'extension de l'agent
      // Cette étape est importante pour vérifier que l'agent est prêt à recevoir des appels
      // C'est équivalent à ce que fait ViciDial lors de la connexion d'un agent
      try {
        console.log('Début de l\'appel de synchronisation vers l\'extension', extension);
        const syncCallResult = await asteriskService.makeSyncCall(extension, decoded.user);
        console.log('Résultat de l\'appel de synchronisation:', {
          success: syncCallResult.success,
          message: syncCallResult.message
        });
        
        // Même en cas d'échec de l'appel de synchronisation, on continue avec la connexion
        // car l'appel de synchronisation est une vérification supplémentaire, pas un bloqueur
      } catch (syncError) {
        console.error('Erreur lors de l\'appel de synchronisation:', syncError);
        // Continuer malgré l'erreur
      }

      // Récupérer les informations de la campagne sélectionnée
      let campaignInfo;
      try {
        // S'assurer que la campagne est active
        const activationResult = await asteriskService.ensureCampaignActive(campaignId);
        console.log(`Vérification/activation de la campagne ${campaignId}:`, activationResult);
        
        const [campaignRows] = await db.query(
          `SELECT campaign_id, campaign_name, dial_method, auto_dial_level 
           FROM vicidial_campaigns 
           WHERE campaign_id = ?`,
          [campaignId]
        );
        
        if (campaignRows.length === 0) {
          // Si la campagne n'existe pas, utiliser des valeurs par défaut
          campaignInfo = {
            campaign_id: campaignId,
            campaign_name: `Campagne ${campaignId}`,
            dial_method: "MANUAL",
            auto_dial_level: "1.0"
          };
          console.log(`Campagne ${campaignId} non trouvée, utilisation de valeurs par défaut`);
        } else {
          campaignInfo = campaignRows[0];
          console.log(`Informations de la campagne ${campaignId} récupérées:`, campaignInfo);
        }
      } catch (dbError) {
        console.error('Erreur lors de la récupération des informations de la campagne:', dbError);
        // En cas d'erreur, utiliser des valeurs par défaut
        campaignInfo = {
          campaign_id: campaignId,
          campaign_name: `Campagne ${campaignId}`,
          dial_method: "MANUAL",
          auto_dial_level: "1.0"
        };
      }
      
      // Mettre à jour le statut de l'agent dans Asterisk - par défaut en PAUSED
      try {
        // Définir un code de pause par défaut pour l'agent qui vient de se connecter
        const defaultPauseCode = 'LOGIN';
        const pauseReason = 'Agent connecté, en attente de disponibilité';
        
        console.log(`Mise en pause de l'agent ${decoded.user} avec le code ${defaultPauseCode}`);
        
        // Vérifier d'abord si l'extension existe dans Asterisk
        let extensionExists = true;
        try {
          const sipStatus = await asteriskService.checkSipRegistration(extension);
          console.log(`Vérification de l'extension ${extension}:`, sipStatus);
          extensionExists = sipStatus && sipStatus.registered;
        } catch (sipError) {
          console.warn(`Erreur lors de la vérification de l'extension ${extension}:`, sipError.message);
          extensionExists = false;
        }
        
        if (extensionExists) {
          // Si l'extension existe, mettre l'agent en pause avec le code de pause par défaut
          console.log(`Extension ${extension} trouvée, mise à jour du statut dans Asterisk...`);
          await asteriskService.setAgentStatus(decoded.user, 'PAUSED', campaignId, defaultPauseCode);
          console.log('Statut de l\'agent mis à jour avec succès dans Asterisk: PAUSED');
        } else {
          console.log(`Extension ${extension} non trouvée dans Asterisk, mise à jour uniquement dans la base de données...`);
        }
        
        // Dans tous les cas, enregistrer le statut dans la base de données avec un statut PAUSED forcé
        try {
          // Vérifier si l'agent existe déjà dans vicidial_live_agents
          const [existingAgents] = await db.query(
            `SELECT user, status FROM vicidial_live_agents WHERE user = ? LIMIT 1`,
            [decoded.user]
          );
          
          if (existingAgents.length > 0) {
            // Mettre à jour l'agent existant avec FORCE sur le statut PAUSED
            console.log(`Statut actuel de l'agent ${decoded.user} dans la base: ${existingAgents[0].status}`);
            
            // Utiliser une requête avec plus de paramètres pour s'assurer que le statut est bien PAUSED
            await db.query(
              `UPDATE vicidial_live_agents 
               SET status = 'PAUSED', 
                   campaign_id = ?, 
                   last_update_time = NOW(), 
                   last_state_change = NOW(),
                   pause_code = ?,
                   comments = 'Agent en pause après connexion',
                   external_pause_code = ?,
                   external_status = 'PAUSED'
               WHERE user = ?`,
              [campaignId, defaultPauseCode, defaultPauseCode, decoded.user]
            );
            console.log(`Agent ${decoded.user} mis à jour dans vicidial_live_agents avec statut PAUSED forcé`);
            
            // Vérifier que la mise à jour a bien été effectuée
            const [updatedAgent] = await db.query(
              `SELECT user, status, pause_code FROM vicidial_live_agents WHERE user = ? LIMIT 1`,
              [decoded.user]
            );
            
            if (updatedAgent.length > 0) {
              console.log(`Statut après mise à jour: ${updatedAgent[0].status}, Code de pause: ${updatedAgent[0].pause_code}`);
            }
          } else {
            // Insérer un nouvel agent avec tous les paramètres nécessaires
            await db.query(
              `INSERT INTO vicidial_live_agents 
               (user, campaign_id, status, last_update_time, last_state_change, random_id, 
                pause_code, comments, external_pause_code, external_status) 
               VALUES (?, ?, 'PAUSED', NOW(), NOW(), FLOOR(RAND() * 1000000), 
                ?, 'Agent en pause après connexion', ?, 'PAUSED')`,
              [decoded.user, campaignId, defaultPauseCode, defaultPauseCode]
            );
            console.log(`Agent ${decoded.user} inséré dans vicidial_live_agents avec statut PAUSED forcé`);
            
            // Vérifier que l'insertion a bien été effectuée
            const [newAgent] = await db.query(
              `SELECT user, status, pause_code FROM vicidial_live_agents WHERE user = ? LIMIT 1`,
              [decoded.user]
            );
            
            if (newAgent.length > 0) {
              console.log(`Statut après insertion: ${newAgent[0].status}, Code de pause: ${newAgent[0].pause_code}`);
            }
          }
          
          // Enregistrer le code de pause dans vicidial_agent_log
          const [result] = await db.query(
            `INSERT INTO vicidial_agent_log 
            (user, event_time, campaign_id, pause_type, pause_trigger, sub_status) 
            VALUES (?, NOW(), ?, 'AGENT', 'LOGIN', ?)`,
            [decoded.user, campaignId, defaultPauseCode]
          );
          
          console.log(`Enregistrement du code de pause ${defaultPauseCode} pour l'agent ${decoded.user}:`, 
            result.affectedRows > 0 ? 'Réussi' : 'Échec');
        } catch (dbError) {
          console.error('Erreur lors de la mise à jour des tables de la base de données:', dbError);
          // Continuer malgré l'erreur d'enregistrement dans la base de données
        }
        
        console.log('Statut de l\'agent mis à jour avec succès: PAUSED');
        
        // Utiliser le script forceAgentPaused pour garantir le statut PAUSED
        // Vérification immédiate
        await forceAgentPaused(decoded.user, defaultPauseCode);
        
        // Vérification après 1 seconde
        setTimeout(async () => {
          try {
            console.log(`Vérification du statut après 1 seconde pour l'agent ${decoded.user}...`);
            await forceAgentPaused(decoded.user, defaultPauseCode);
          } catch (error) {
            console.error('Erreur lors de la vérification après 1 seconde:', error);
          }
        }, 1000);
        
        // Vérification après 2 secondes
        setTimeout(async () => {
          try {
            console.log(`Vérification du statut après 2 secondes pour l'agent ${decoded.user}...`);
            await forceAgentPaused(decoded.user, defaultPauseCode);
          } catch (error) {
            console.error('Erreur lors de la vérification après 2 secondes:', error);
          }
        }, 2000);
        
        // Vérification après 5 secondes
        setTimeout(async () => {
          try {
            console.log(`Vérification du statut après 5 secondes pour l'agent ${decoded.user}...`);
            await forceAgentPaused(decoded.user, defaultPauseCode);
          } catch (error) {
            console.error('Erreur lors de la vérification après 5 secondes:', error);
          }
        }, 5000);
        
        // Planifier une vérification périodique toutes les 10 secondes pendant 5 minutes
        let checkCount = 0;
        const maxChecks = 30; // 5 minutes (30 vérifications * 10 secondes)
        const statusCheckInterval = setInterval(async () => {
          try {
            checkCount++;
            if (checkCount > maxChecks) {
              clearInterval(statusCheckInterval);
              console.log(`Fin des vérifications périodiques du statut pour l'agent ${decoded.user}`);
              return;
            }
            
            console.log(`Vérification périodique #${checkCount} pour l'agent ${decoded.user}...`);
            
            // Utiliser le script forceAgentPaused pour garantir le statut PAUSED
            const success = await forceAgentPaused(decoded.user, defaultPauseCode);
            
            if (success) {
              console.log(`Vérification périodique #${checkCount}: Statut PAUSED confirmé pour l'agent ${decoded.user}`);
            } else {
              console.log(`Vérification périodique #${checkCount}: Impossible de confirmer le statut PAUSED pour l'agent ${decoded.user}`);
              
              // Tentative directe de mise à jour en cas d'échec du script
              await db.query(
                `UPDATE vicidial_live_agents 
                 SET status = 'PAUSED', 
                     pause_code = ?,
                     comments = 'FORCE PAUSED',
                     external_pause_code = ?,
                     external_status = 'PAUSED',
                     last_state_change = NOW()
                 WHERE user = ?`,
                [defaultPauseCode, defaultPauseCode, decoded.user]
              );
              
              console.log(`Vérification périodique #${checkCount}: Tentative directe de correction effectuée`);
            }
          } catch (error) {
            console.error(`Erreur lors de la vérification périodique #${checkCount} du statut:`, error);
          }
        }, 10000);
        
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut de l\'agent:', error);
        // Ne pas bloquer la connexion en cas d'erreur de mise à jour du statut
        console.warn('Continuation de la connexion malgré l\'erreur de mise à jour du statut');
      }

      // Créer le token final avec toutes les informations nécessaires
      const finalToken = jwt.sign(
        {
          user: decoded.user,
          full_name: decoded.full_name || "Agent",
          extension: extension,
          phone_login: decoded.phone_login || "agent",
          campaign_id: campaignId,
          campaign_name: campaignInfo.campaign_name,
          user_level: decoded.user_level || 1,
          step: "complete"
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      
      // Définir les cookies avant d'envoyer la réponse
      try {
        // Définir le cookie JWT
        res.cookie("jwt", finalToken, {
          httpOnly: true,
          maxAge: 8 * 60 * 60 * 1000, // 8 heures
          sameSite: "lax",
          secure: false, // Désactivé pour le développement local
          path: "/",
        });

        // Ajouter un cookie non-httpOnly pour le user_level
        res.cookie("user_level", decoded.user_level ? decoded.user_level.toString() : "1", {
          httpOnly: false,
          maxAge: 8 * 60 * 60 * 1000,
          sameSite: "lax",
          secure: false,
          path: "/",
        });

        // Ajouter un cookie spécifique pour l'authentification réussie
        res.cookie("auth_success", "true", {
          httpOnly: false,
          maxAge: 8 * 60 * 60 * 1000,
          sameSite: "lax",
          secure: false,
          path: "/",
        });
      } catch (cookieError) {
        console.error("Erreur lors de la définition des cookies:", cookieError);
        // Continuer malgré l'erreur
      }
      
      // Retourner la réponse de succès avec le token
      console.log("Envoi de la réponse avec token:", finalToken.substring(0, 20) + '...');
      res.json({
        success: true,
        token: finalToken, // Inclure le token dans la réponse
        message: 'Connexion réussie',
        user: decoded.user,
        full_name: decoded.full_name || "Agent",
        extension: extension,
        phone_login: decoded.phone_login || "agent",
        campaign: {
          id: campaignId,
          name: campaignInfo.campaign_name,
          dial_method: campaignInfo.dial_method,
          auto_dial_level: campaignInfo.auto_dial_level,
        },
        status: 'connected',
        sipStatus: sipStatus
      });

    } catch (error) {
      console.error('Erreur lors de la vérification SIP:', error);
      return res.status(500).json({
        message: 'Erreur lors de la vérification SIP',
        error: error.message
      });
    }


    // Vérifier si l'agent est déjà connecté dans vicidial_live_agents
    const [existingAgent] = await db.query(
      "SELECT user FROM vicidial_live_agents WHERE user = ?",
      [decoded.user]
    );
    
    if (existingAgent.length > 0) {
      // On peut choisir de mettre à jour l'entrée existante ou de retourner un message d'erreur
      // Ici, on met à jour l'entrée existante
      await db.query(
        `UPDATE vicidial_live_agents SET 
         campaign_id = ?, 
         status = 'PAUSED', 
         pause_code = 'LOGIN',
         comments = 'Agent en pause après connexion',
         external_pause_code = 'LOGIN',
         external_status = 'PAUSED',
         last_update_time = NOW(),
         last_state_change = NOW()
         WHERE user = ?`,
        [campaignId, decoded.user]
      );
      
      console.log(`Agent existant ${decoded.user} mis à jour avec statut PAUSED dans vicidial_live_agents`);
    } else {
      // Insérer l'agent dans la table vicidial_live_agents
      // Récupérer l'adresse IP du serveur Asterisk depuis la base de données
      const [serverInfo] = await db.query(
        "SELECT server_ip FROM servers WHERE active_asterisk_server = 'Y' AND active = 'Y' LIMIT 1"
      );
      
      // Utiliser l'adresse IP récupérée ou une valeur par défaut si non trouvée
      const serverIp = (serverInfo && serverInfo.length > 0) ? serverInfo[0].server_ip : process.env.ASTERISK_HOST || '127.0.0.1';
      
      // Récupérer l'ID de l'agent depuis vicidial_users pour le champ user_level
      const [userInfo] = await db.query(
        "SELECT user_level FROM vicidial_users WHERE user = ?",
        [decoded.user]
      );
      
      const userLevel = userInfo.length > 0 ? userInfo[0].user_level : 1;
      
      // Générer un numéro de conférence au format correct (8600xxx)
      const confExten = `8600${Math.floor(Math.random() * 900) + 100}`;
      
      // Formater le canal SIP correctement
      const sipChannel = `SIP/${decoded.extension}`;
      
      // Insérer l'agent avec statut PAUSED
      await db.query(
        `INSERT INTO vicidial_live_agents (
          user, server_ip, conf_exten, extension, campaign_id, status, lead_id, 
          channel, uniqueid, callerid, user_level, random_id, last_call_time, 
          last_update_time, last_call_finish, closer_campaigns, call_server_ip,
          pause_code, comments, external_pause_code, external_status, last_state_change
        ) 
        VALUES (?, ?, ?, ?, ?, 'PAUSED', 0, 
          ?, '', '', ?, FLOOR(RAND()*10000000), 
          NOW(), NOW(), NOW(), '', ?,
          'LOGIN', 'Agent en pause après connexion', 'LOGIN', 'PAUSED', NOW())
        `,
        [
          decoded.user,
          serverIp,
          confExten,
          decoded.extension,
          campaignId,
          sipChannel,
          userLevel,
          serverIp
        ]
      );
      
      console.log(`Nouvel agent ${decoded.user} inséré avec statut PAUSED dans vicidial_live_agents`);
    }
    
    // La réponse est maintenant envoyée dans le bloc try/catch précédent lors de la vérification SIP
  } catch (err) {
    // Vérifier si la réponse a déjà été envoyée
    if (res.headersSent) {
      console.error("ERREUR dans select-campaign (réponse déjà envoyée):", err);
      return; // Ne rien faire si la réponse a déjà été envoyée
    }
    
    console.error("ERREUR dans select-campaign:", err);
    console.error("Détails de l'erreur:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });

    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token de session utilisateur expiré ou invalide", error: err.message });
    }

    return res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
      details: err.stack,
    });
  }
})

// Route pour vérifier la validité du token
router.post("/verify-token", authenticateToken, (req, res) => {
  try {
    // Le middleware auth.js a déjà vérifié le token
    res.json({
      valid: true,
      user: req.user,
    })
  } catch (err) {
    console.error("Erreur lors de la vérification du token:", err)
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    })
  }
})

// Route pour la déconnexion de l'agent
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est bien authentifié
    if (!req.user || !req.user.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const agentUser = req.user.user;
    console.log(`Déconnexion de l'agent ${agentUser}`);

    // Mettre à jour le statut de l'agent dans Asterisk via le service
    try {
      await asteriskService.setAgentStatus(agentUser, 'LOGOUT', req.user.campaign_id || '');
      console.log(`Statut de l'agent ${agentUser} mis à jour dans Asterisk: LOGOUT`);
    } catch (asteriskErr) {
      console.error("Erreur lors de la mise à jour du statut dans Asterisk:", asteriskErr);
      // On continue malgré l'erreur
    }

    // S'assurer que la campagne reste active
    if (req.user && req.user.campaign_id) {
      try {
        const activationResult = await asteriskService.ensureCampaignActive(req.user.campaign_id);
        console.log(`Vérification/activation de la campagne ${req.user.campaign_id} lors de la déconnexion:`, activationResult);
      } catch (campaignErr) {
        console.error("Erreur lors de la vérification/activation de la campagne:", campaignErr);
        // On continue malgré l'erreur
      }
    }
    
    // Supprimer l'agent de la table vicidial_live_agents
    const [result] = await db.query(
      "DELETE FROM vicidial_live_agents WHERE user = ?",
      [agentUser]
    );

    console.log(`Suppression de l'agent ${agentUser} de vicidial_live_agents:`, result.affectedRows > 0 ? 'Réussi' : 'Aucune entrée trouvée');

    // Effacer les cookies d'authentification
    res.clearCookie('jwt');
    res.clearCookie('user_level');
    res.clearCookie('auth_success');

    // Retourner un message de succès
    res.json({
      success: true,
      message: "Déconnexion réussie"
    });
  } catch (err) {
    console.error("Erreur lors de la déconnexion:", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la déconnexion",
      error: err.message
    });
  }
});

// Route pour rafraîchir le token
router.post("/refresh", async (req, res) => {
  try {
    // Récupérer le token JWT depuis les cookies ou l'en-tête Authorization
    let token = null

    // Vérifier d'abord dans les cookies
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt
    }
    // Sinon, vérifier dans l'en-tête Authorization
    else {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1]
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Token non fourni" })
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Créer un nouveau token avec les mêmes informations mais une nouvelle date d'expiration
    const newToken = jwt.sign(
      {
        ...decoded,
        iat: Math.floor(Date.now() / 1000), // Nouvelle date d'émission
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    )

    // Définir le nouveau token dans un cookie
    res.cookie("jwt", newToken, {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000, // 8 heures
      sameSite: "lax",
      secure: false, // Désactivé pour le développement local
      path: "/",
    })

    // Retourner le nouveau token
    res.json({
      success: true,
      token: newToken,
      message: "Token rafraîchi avec succès",
    })
  } catch (err) {
    console.error("Erreur lors du rafraîchissement du token:", err)

    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expiré ou invalide" })
    }

    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    })
  }
})

module.exports = router
