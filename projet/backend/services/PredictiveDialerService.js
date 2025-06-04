const db = require('../config/bd');
const AsteriskService = require('./asteriskService');
const logger = require('../utils/logger');

class PredictiveDialerService {
  constructor() {
    this.activeDialers = new Map(); // campaignId -> dialer info
    this.asteriskService = AsteriskService; // Utiliser directement l'objet exporté
  }

  /**
   * Démarre le mode prédictif pour une campagne
   * @param {string} campaignId - ID de la campagne
   * @param {object} options - Options de numérotation
   * @param {string} userId - ID de l'agent qui a démarré le mode prédictif
   */
  async startPredictiveMode(campaignId, level = 'AUTO', userId = null) {
    if (this.activeDialers.has(campaignId)) {
      logger.info(`Le mode prédictif est déjà actif pour la campagne ${campaignId}`);
      return { success: false, message: 'Mode prédictif déjà actif' };
    }

    // Obtenir les informations de la campagne depuis la base de données
    try {
      const [campaignRows] = await db.query(
        'SELECT dial_method, auto_dial_level, adaptive_maximum_level, campaign_name FROM vicidial_campaigns WHERE campaign_id = ?',
        [campaignId]
      );

      if (campaignRows.length === 0) {
        logger.error(`Campagne non trouvée: ${campaignId}`);
        return { success: false, message: 'Campagne non trouvée' };
      }

      const campaign = campaignRows[0];
      
      // Vérifier que la campagne est configurée pour le mode prédictif
      if (campaign.dial_method !== 'RATIO' && campaign.dial_method !== 'ADAPT_HARD_LIMIT' && campaign.dial_method !== 'ADAPT_TAPERED') {
        logger.error(`La campagne ${campaignId} n'est pas configurée pour le mode prédictif (méthode: ${campaign.dial_method})`);
        return { success: false, message: 'Campagne non configurée pour le mode prédictif' };
      }

      // Déterminer le niveau de numérotation
      let dialLevel = 1.0; // Niveau par défaut
      
      if (level === 'AUTO') {
        // Utiliser le niveau configuré dans la campagne
        dialLevel = parseFloat(campaign.auto_dial_level) || 1.0;
      } else if (level === 'MAX') {
        // Utiliser le niveau maximum configuré dans la campagne
        dialLevel = parseFloat(campaign.adaptive_maximum_level) || 2.0;
      } else if (!isNaN(parseFloat(level))) {
        // Utiliser le niveau spécifié
        dialLevel = parseFloat(level);
      }

      // Configuration du dialer
      const config = {
        dialMethod: campaign.dial_method,
        callRatio: dialLevel,
        maxConcurrentCalls: 20,
        minWaitTime: 1000, // Temps minimum entre les appels (ms)
        maxAttempts: 3, // Nombre maximum de tentatives
        intervalMs: 3000, // Intervalle de vérification (ms)
        campaignName: campaign.campaign_name
      };

      // Créer le dialer
      const dialer = {
        campaignId,
        config,
        active: true,
        currentCalls: 0,
        totalCalls: 0,
        successfulCalls: 0,
        intervalId: null,
        startTime: new Date(),
        startedBy: userId
      };

      // Démarrer l'intervalle de numérotation
      dialer.intervalId = setInterval(() => this.dialBatch(campaignId), config.intervalMs);
      this.activeDialers.set(campaignId, dialer);

      // Mettre à jour le statut de la campagne dans la base de données
      // Note: La colonne s'appelle 'auto_dial_level' et non 'dial_level'
      await db.query(
        'UPDATE vicidial_campaigns SET active = "Y", auto_dial_level = ? WHERE campaign_id = ?',
        [dialLevel, campaignId]
      );

      logger.info(`Mode prédictif démarré pour la campagne ${campaignId} avec niveau ${dialLevel}`, config);
      return { 
        success: true, 
        message: 'Mode prédictif démarré', 
        campaignName: campaign.campaign_name,
        dialLevel: dialLevel
      };
    } catch (error) {
      logger.error(`Erreur lors du démarrage du mode prédictif pour la campagne ${campaignId}:`, error);
      return { success: false, message: 'Erreur lors du démarrage du mode prédictif' };
    }
  }

  /**
   * Arrête le mode prédictif pour une campagne
   * @param {string} campaignId - ID de la campagne
   */
  async stopPredictiveMode(campaignId) {
    const dialer = this.activeDialers.get(campaignId);
    if (!dialer) {
      return { success: false, message: 'Mode prédictif non actif' };
    }

    // Arrêter l'intervalle de numérotation
    clearInterval(dialer.intervalId);
    dialer.active = false;
    
    // Calculer les statistiques
    const endTime = new Date();
    const durationMs = endTime - dialer.startTime;
    const durationMinutes = Math.round(durationMs / 60000);
    
    // Mettre à jour le niveau de numérotation de la campagne dans la base de données, mais ne pas la désactiver
    try {
      await db.query(
        'UPDATE vicidial_campaigns SET auto_dial_level = 0 WHERE campaign_id = ?',
        [campaignId]
      );
      
      // Vérifier la structure de la table vicidial_campaign_stats
      try {
        // Essayer d'abord avec la structure qui inclut stats_date
        await db.query(
          `INSERT INTO vicidial_campaign_stats 
           (campaign_id, stats_date, dialable_leads, calls_today, answers_today, drops_today, pause_time_today) 
           VALUES (?, NOW(), 0, ?, ?, ?, 0) 
           ON DUPLICATE KEY UPDATE 
           calls_today = calls_today + ?, 
           answers_today = answers_today + ?, 
           drops_today = drops_today + ?`,
          [campaignId, dialer.totalCalls, dialer.successfulCalls, dialer.totalCalls - dialer.successfulCalls,
           dialer.totalCalls, dialer.successfulCalls, dialer.totalCalls - dialer.successfulCalls]
        );
      } catch (statsError) {
        // Si la première tentative échoue, essayer sans stats_date
        logger.info('Tentative d\'insertion sans stats_date dans vicidial_campaign_stats');
        await db.query(
          `INSERT INTO vicidial_campaign_stats 
           (campaign_id, dialable_leads, calls_today, answers_today, drops_today, pause_time_today) 
           VALUES (?, 0, ?, ?, ?, 0) 
           ON DUPLICATE KEY UPDATE 
           calls_today = calls_today + ?, 
           answers_today = answers_today + ?, 
           drops_today = drops_today + ?`,
          [campaignId, dialer.totalCalls, dialer.successfulCalls, dialer.totalCalls - dialer.successfulCalls,
           dialer.totalCalls, dialer.successfulCalls, dialer.totalCalls - dialer.successfulCalls]
        );
      }
      
      // Journaliser l'arrêt du mode prédictif
      await db.query(
        `INSERT INTO vicidial_admin_log 
         (event_date, user, ip_address, event_section, event_type, record_id, event_code, event_sql, event_notes) 
         VALUES (NOW(), ?, '127.0.0.1', 'CAMPAIGNS', 'MODIFY', ?, 'STOP PREDICTIVE', '', ?)`,
        [dialer.startedBy || 'SYSTEM', campaignId, `Mode prédictif arrêté après ${durationMinutes} minutes, ${dialer.totalCalls} appels, ${dialer.successfulCalls} réussis`]
      );
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de la base de données pour l'arrêt du mode prédictif:`, error);
    }
    
    // Supprimer le dialer de la liste des dialers actifs
    this.activeDialers.delete(campaignId);

    logger.info(`Mode prédictif arrêté pour la campagne ${campaignId} après ${durationMinutes} minutes, ${dialer.totalCalls} appels, ${dialer.successfulCalls} réussis`);
    return { 
      success: true, 
      message: 'Mode prédictif arrêté',
      stats: {
        duration: durationMinutes,
        totalCalls: dialer.totalCalls,
        successfulCalls: dialer.successfulCalls,
        dropRate: dialer.totalCalls > 0 ? ((dialer.totalCalls - dialer.successfulCalls) / dialer.totalCalls * 100).toFixed(2) + '%' : '0%'
      }
    };
  }

  /**
   * Numéroter un lot de prospects
   * @param {string} campaignId - ID de la campagne
   */
  async dialBatch(campaignId) {
    const dialer = this.activeDialers.get(campaignId);
    if (!dialer || !dialer.active) return;

    try {
      // 1. Obtenir le nombre d'agents disponibles et leur statut
      const agentStats = await this.getAgentStats(campaignId);
      
      // Afficher les statistiques d'agents pour débogage
      logger.info(`Statistiques d'agents pour la campagne ${campaignId}: ${JSON.stringify(agentStats)}`);
      
      if (agentStats.availableCount <= 0) {
        logger.info(`Aucun agent disponible pour la campagne ${campaignId}, pause de la numérotation`);
        
        // Vérifier s'il y a des agents assignés à cette campagne mais pas en statut READY
        const [nonReadyAgents] = await db.query(
          'SELECT user, status, external_status FROM vicidial_live_agents WHERE campaign_id = ?',
          [campaignId]
        );
        
        if (nonReadyAgents && nonReadyAgents.length > 0) {
          logger.info(`Agents assignés à la campagne ${campaignId} mais pas disponibles: ${JSON.stringify(nonReadyAgents)}`);
        }
        
        return;
      }
      
      // 2. Calculer le nombre d'appels à passer en fonction de la méthode de numérotation
      let callsToMake = 0;
      
      if (dialer.config.dialMethod === 'RATIO') {
        // Méthode de ratio fixe
        callsToMake = Math.max(0, Math.ceil(agentStats.availableCount * dialer.config.callRatio) - agentStats.activeCalls);
      } else if (dialer.config.dialMethod === 'ADAPT_HARD_LIMIT' || dialer.config.dialMethod === 'ADAPT_TAPERED') {
        // Méthode adaptative
        const dropRate = agentStats.totalCalls > 0 ? (agentStats.dropCalls / agentStats.totalCalls) : 0;
        const targetDropRate = 0.03; // 3% taux d'abandon cible
        
        if (dropRate > targetDropRate * 1.1) {
          // Taux d'abandon trop élevé, réduire le niveau
          dialer.config.callRatio = Math.max(1.0, dialer.config.callRatio - 0.1);
        } else if (dropRate < targetDropRate * 0.9) {
          // Taux d'abandon faible, augmenter le niveau
          dialer.config.callRatio = Math.min(dialer.config.callRatio + 0.1, 4.0);
        }
        
        callsToMake = Math.max(0, Math.ceil(agentStats.availableCount * dialer.config.callRatio) - agentStats.activeCalls);
        
        // Pour ADAPT_HARD_LIMIT, ne jamais dépasser le nombre d'agents disponibles * 4
        if (dialer.config.dialMethod === 'ADAPT_HARD_LIMIT') {
          callsToMake = Math.min(callsToMake, agentStats.availableCount * 4 - agentStats.activeCalls);
        }
      }
      
      if (callsToMake <= 0) {
        logger.debug(`Pas besoin de nouveaux appels pour la campagne ${campaignId}, appels actifs: ${agentStats.activeCalls}, ratio: ${dialer.config.callRatio}`);
        return;
      }

      logger.info(`Tentative d'appel de ${callsToMake} prospects pour la campagne ${campaignId}`);

      // 3. Obtenir les prospects à appeler
      const leads = await this.getLeadsToCall(campaignId, callsToMake, dialer.config.maxAttempts);
      if (leads.length === 0) {
        logger.info(`Aucun prospect à appeler pour la campagne ${campaignId}`);
        
        // Vérifier s'il y a des prospects dans la base de données
        const [totalLeads] = await db.query(
          'SELECT COUNT(*) as count FROM vicidial_list',
          []
        );
        
        logger.info(`Nombre total de prospects dans la base de données: ${totalLeads[0]?.count || 0}`);
        return;
      }
      
      logger.info(`${leads.length} prospects trouvés à appeler pour la campagne ${campaignId}`);

      // 4. Passer les appels
      for (const lead of leads) {
        const callResult = await this.dialLead(campaignId, lead);
        
        if (callResult.success) {
          dialer.currentCalls++;
          dialer.totalCalls++;
          
          // Si l'appel est réussi, mettre à jour les statistiques
          if (callResult.status === 'ANSWER') {
            dialer.successfulCalls++;
          }
        }
        
        // Attendre un peu entre chaque appel pour ne pas surcharger le système
        await new Promise(resolve => setTimeout(resolve, dialer.config.minWaitTime));
      }

      logger.info(`Batch de ${leads.length} appels lancé pour la campagne ${campaignId} avec ratio ${dialer.config.callRatio.toFixed(2)}`);
    } catch (error) {
      logger.error(`Erreur lors de la numérotation pour la campagne ${campaignId}:`, error);
    }
  }

  /**
   * Obtenir les statistiques des agents pour une campagne
   * @param {string} campaignId - ID de la campagne
   * @returns {Object} Statistiques des agents
   */
  async getAgentStats(campaignId) {
    try {
      // Obtenir le nombre d'agents disponibles (l'un des deux statuts doit être READY)
      const [readyAgents] = await db.query(
        'SELECT COUNT(*) as count FROM vicidial_live_agents WHERE campaign_id = ? AND (status = "READY" OR external_status = "READY")',
        [campaignId]
      );
      
      // Obtenir le nombre d'agents en appel (vérifier à la fois status et external_status)
      const [busyAgents] = await db.query(
        'SELECT COUNT(*) as count FROM vicidial_live_agents WHERE campaign_id = ? AND (status = "INCALL" OR external_status = "INCALL")',
        [campaignId]
      );
      
      // Obtenir le nombre d'appels actifs
      const [activeCalls] = await db.query(
        'SELECT COUNT(*) as count FROM vicidial_auto_calls WHERE campaign_id = ? AND status IN ("SENT", "RINGING", "LIVE", "XFER")',
        [campaignId]
      );
      
      // Obtenir les statistiques d'appels pour aujourd'hui
      const [callStats] = await db.query(
        'SELECT calls_today, answers_today, drops_today FROM vicidial_campaign_stats WHERE campaign_id = ?',
        [campaignId]
      );
      
      const stats = {
        availableCount: readyAgents[0]?.count || 0,
        busyCount: busyAgents[0]?.count || 0,
        totalAgents: (readyAgents[0]?.count || 0) + (busyAgents[0]?.count || 0),
        activeCalls: activeCalls[0]?.count || 0,
        totalCalls: callStats[0]?.calls_today || 0,
        answeredCalls: callStats[0]?.answers_today || 0,
        dropCalls: callStats[0]?.drops_today || 0
      };
      
      return stats;
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques des agents:', error);
      return {
        availableCount: 0,
        busyCount: 0,
        totalAgents: 0,
        activeCalls: 0,
        totalCalls: 0,
        answeredCalls: 0,
        dropCalls: 0
      };
    }
  }

  /**
   * Obtenir les prospects à appeler
   * @param {string} campaignId - ID de la campagne
   * @param {number} limit - Nombre maximum de prospects
   * @param {number} maxAttempts - Nombre maximum de tentatives
   */
  async getLeadsToCall(campaignId, limit, maxAttempts) {
    try {
      // Vérifier les listes associées à la campagne
      const [lists] = await db.query(
        'SELECT list_id FROM vicidial_lists WHERE campaign_id = ?',
        [campaignId]
      );
      
      logger.info(`Listes trouvées pour la campagne ${campaignId}: ${JSON.stringify(lists)}`);
      
      if (lists.length === 0) {
        logger.warn(`Aucune liste trouvée pour la campagne ${campaignId}`);
        
        // Vérifier s'il y a des prospects directement associés à la campagne
        const [directLeads] = await db.query(
          'SELECT COUNT(*) as count FROM vicidial_list WHERE campaign_id = ?',
          [campaignId]
        );
        
        logger.info(`Prospects directement associés à la campagne ${campaignId}: ${directLeads[0]?.count || 0}`);
        
        if (directLeads[0]?.count > 0) {
          // Utiliser les prospects directement associés à la campagne
          const [rows] = await db.query(
            `SELECT * FROM vicidial_list 
             WHERE campaign_id = ? 
             AND status NOT IN ('COMP', 'DNC', 'INVALID')
             LIMIT ?`,
            [campaignId, limit]
          );
          
          logger.info(`${rows.length} prospects trouvés directement dans la campagne ${campaignId}`);
          return rows;
        }
        
        return [];
      }
      
      // Requête pour obtenir les prospects non appelés ou avec moins de maxAttempts tentatives
      const [rows] = await db.query(
        `SELECT vl.* 
         FROM vicidial_list vl
         LEFT JOIN vicidial_log vlog ON vl.lead_id = vlog.lead_id
         WHERE vl.list_id IN (
           SELECT list_id FROM vicidial_lists WHERE campaign_id = ?
         ) 
         AND (vlog.uniqueid IS NULL OR (
           SELECT COUNT(*) FROM vicidial_log 
           WHERE lead_id = vl.lead_id
         ) < ?)
         AND vl.status NOT IN ('COMP', 'DNC', 'INVALID')
         GROUP BY vl.lead_id
         ORDER BY vl.entry_date DESC
         LIMIT ?`,
        [campaignId, maxAttempts, limit]
      );
      
      logger.info(`${rows.length} prospects trouvés pour la campagne ${campaignId}`);
      return rows;
    } catch (error) {
      logger.error('Erreur lors de la récupération des prospects:', error);
      return [];
    }
  }

  /**
   * Passer un appel à un prospect
   * @param {string} campaignId - ID de la campagne
   * @param {object} lead - Données du prospect
   */
  async dialLead(campaignId, lead) {
    try {
      // 1. Vérifier si le prospect est déjà en cours d'appel
      const [existingCalls] = await db.query(
        'SELECT COUNT(*) as count FROM vicidial_auto_calls WHERE lead_id = ? AND status NOT IN ("DONE", "XFER")',
        [lead.lead_id]
      );
      
      if (existingCalls[0].count > 0) {
        logger.info(`Le prospect ${lead.lead_id} est déjà en cours d'appel, ignoré`);
        return { success: false, message: "Prospect déjà en cours d'appel" };
      }
      
      // 2. Obtenir les informations de la campagne
      const [campaignRows] = await db.query(
        'SELECT dial_prefix FROM vicidial_campaigns WHERE campaign_id = ?',
        [campaignId]
      );
      
      const dialPrefix = campaignRows[0]?.dial_prefix || '';
      
      // 3. Mettre à jour le statut du prospect dans vicidial_list
      await db.query(
        'UPDATE vicidial_list SET status = "QUEUE", last_local_call_time = NOW() WHERE lead_id = ?',
        [lead.lead_id]
      );

      // 4. Générer un identifiant unique pour l'appel
      const uniqueId = `MCDIAL-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const callerId = `MCDIAL_${uniqueId.substring(0, 15)}`;
      
      // 5. Enregistrer l'appel dans vicidial_log
      await db.query(
        `INSERT INTO vicidial_log 
         (uniqueid, lead_id, campaign_id, call_date, status, user, phone_number, alt_dial) 
         VALUES (?, ?, ?, NOW(), "QUEUE", "MCDIAL_SYSTEM", ?, "MAIN")`,
        [uniqueId, lead.lead_id, campaignId, lead.phone_number]
      );
      
      // 6. Enregistrer l'appel dans vicidial_auto_calls pour le suivi
      await db.query(
        `INSERT INTO vicidial_auto_calls 
         (server_ip, campaign_id, status, lead_id, uniqueid, callerid, channel, phone_number, call_time, call_type) 
         VALUES ("127.0.0.1", ?, "SENT", ?, ?, ?, ?, ?, NOW(), "OUT")`,
        [campaignId, lead.lead_id, uniqueId, callerId, `SIP/MCDIAL_OUTBOUND`, lead.phone_number]
      );
      
      // 7. Trouver un agent disponible pour cette campagne (l'un des deux statuts doit être READY)
      const [availableAgents] = await db.query(
        `SELECT user, extension, conf_exten 
         FROM vicidial_live_agents 
         WHERE campaign_id = ? AND (status = "READY" OR external_status = "READY") 
         LIMIT 1`,
        [campaignId]
      );
      
      if (availableAgents.length === 0) {
        logger.warn(`Aucun agent disponible pour la campagne ${campaignId} au moment de l'appel`);
        return { success: false, message: "Aucun agent disponible" };
      }
      
      const agent = availableAgents[0];
      logger.info(`Agent disponible trouvé pour l'appel: ${agent.user} (extension: ${agent.extension})`);
      
      // 8. Envoyer la commande d'appel à Asterisk
      const phoneNumber = dialPrefix + lead.phone_number;
      const result = await this.asteriskService.initiateCall(
        agent.extension,   // Extension de l'agent disponible
        phoneNumber,       // Numéro à appeler
        agent.user,        // ID de l'agent
        lead.lead_id,      // ID du prospect
        campaignId,        // ID de la campagne
        null,              // Session ID
        agent.conf_exten   // Numéro de conférence de l'agent
      );

      // 8. Gérer le résultat
      if (result.success) {
        // Mettre à jour le statut de l'agent en INCALL
        await db.query(
          'UPDATE vicidial_live_agents SET status = "INCALL", external_status = "INCALL", lead_id = ?, last_update_time = NOW() WHERE user = ?',
          [lead.lead_id, agent.user]
        );
        
        // Mettre à jour le statut de l'appel dans vicidial_log
        await db.query(
          'UPDATE vicidial_log SET status = "SENT", user = ? WHERE uniqueid = ?',
          [agent.user, uniqueId]
        );
        
        // Mettre à jour le statut dans vicidial_auto_calls
        await db.query(
          'UPDATE vicidial_auto_calls SET status = "LIVE", user = ? WHERE uniqueid = ?',
          [agent.user, uniqueId]
        );
        
        // Mettre à jour les statistiques de la campagne
        await db.query(
          `INSERT INTO vicidial_campaign_stats 
           (campaign_id, stats_date, dialable_leads, calls_today) 
           VALUES (?, CURDATE(), 0, 1) 
           ON DUPLICATE KEY UPDATE calls_today = calls_today + 1`,
          [campaignId]
        );
        
        logger.info(`Appel initié pour le prospect ${lead.lead_id} (${lead.phone_number}) dans la campagne ${campaignId}`);
        return { success: true, uniqueId, lead_id: lead.lead_id, status: 'SENT' };
      } else {
        // Mettre à jour le statut du prospect en cas d'échec
        await db.query(
          'UPDATE vicidial_list SET status = "PDROP" WHERE lead_id = ?',
          [lead.lead_id]
        );
        
        // Mettre à jour le statut de l'appel dans vicidial_log
        await db.query(
          'UPDATE vicidial_log SET status = "PDROP" WHERE uniqueid = ?',
          [uniqueId]
        );
        
        // Mettre à jour le statut dans vicidial_auto_calls
        await db.query(
          'UPDATE vicidial_auto_calls SET status = "DONE" WHERE uniqueid = ?',
          [uniqueId]
        );
        
        // Mettre à jour les statistiques de la campagne
        await db.query(
          `INSERT INTO vicidial_campaign_stats 
           (campaign_id, stats_date, dialable_leads, calls_today, drops_today) 
           VALUES (?, CURDATE(), 0, 1, 1) 
           ON DUPLICATE KEY UPDATE calls_today = calls_today + 1, drops_today = drops_today + 1`,
          [campaignId]
        );
        
        logger.error(`Échec de l'appel pour le prospect ${lead.lead_id} (${lead.phone_number}) dans la campagne ${campaignId}:`, result.message);
        return { success: false, message: result.message, status: 'PDROP' };
      }
    } catch (error) {
      logger.error(`Erreur lors de l'appel du prospect ${lead.lead_id}:`, error);
      return { success: false, message: error.message, status: 'ERROR' };
    }
  }

  /**
   * Gérer un appel répondu
   * @param {string} callId - ID de l'appel
   * @param {string} agentId - ID de l'agent (si disponible)
   */
  async handleAnsweredCall(callId, agentId = null) {
    try {
      const dialer = this.getDialerByCampaignId(callId);
      if (dialer) {
        dialer.currentCalls--;
        dialer.successfulCalls++;
      }

      // Mettre à jour l'historique des appels
      await db.query(
        'UPDATE call_history SET status = "ANSWERED", answer_time = NOW() WHERE call_id = ?',
        [callId]
      );

      // Si un agent est spécifié, lui assigner l'appel
      if (agentId) {
        await db.query(
          'UPDATE call_history SET agent_id = ? WHERE call_id = ?',
          [agentId, callId]
        );
      }

      logger.info(`Appel ${callId} répondu${agentId ? ` et assigné à l'agent ${agentId}` : ''}`);
      return { success: true };
    } catch (error) {
      logger.error(`Erreur lors du traitement de l'appel répondu ${callId}:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Gérer un appel terminé
   * @param {string} callId - ID de l'appel
   * @param {string} status - Statut de fin d'appel
   */
  async handleCallEnded(callId, status) {
    try {
      const dialer = this.getDialerByCampaignId(callId);
      if (dialer) {
        dialer.currentCalls--;
      }

      // Mettre à jour l'historique des appels
      await db.query(
        'UPDATE call_history SET status = ?, end_time = NOW() WHERE call_id = ?',
        [status, callId]
      );

      // Obtenir l'ID du prospect
      const [rows] = await db.query(
        'SELECT lead_id FROM call_history WHERE call_id = ?',
        [callId]
      );

      if (rows.length > 0) {
        const leadId = rows[0].lead_id;
        
        // Mettre à jour le statut du prospect en fonction du résultat
        let leadStatus;
        switch (status) {
          case 'ANSWERED':
            leadStatus = 'CONTACTED';
            break;
          case 'NOANSWER':
          case 'BUSY':
          case 'FAILED':
            leadStatus = 'RETRY';
            break;
          case 'COMPLETED':
            leadStatus = 'COMPLETED';
            break;
          default:
            leadStatus = 'RETRY';
        }

        await db.query(
          'UPDATE leads SET status = ? WHERE lead_id = ?',
          [leadStatus, leadId]
        );
      }

      logger.info(`Appel ${callId} terminé avec statut ${status}`);
      return { success: true };
    } catch (error) {
      logger.error(`Erreur lors du traitement de fin d'appel ${callId}:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtenir le dialer associé à un appel
   * @param {string} callId - ID de l'appel
   */
  async getDialerByCampaignId(callId) {
    try {
      const [rows] = await db.query(
        'SELECT campaign_id FROM call_history WHERE call_id = ?',
        [callId]
      );

      if (rows.length > 0) {
        const campaignId = rows[0].campaign_id;
        return this.activeDialers.get(campaignId);
      }
      
      return null;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du dialer pour l'appel ${callId}:`, error);
      return null;
    }
  }

  /**
   * Obtenir les statistiques du mode prédictif
   * @param {string} campaignId - ID de la campagne
   */
  getPredictiveStats(campaignId) {
    const dialer = this.activeDialers.get(campaignId);
    if (!dialer) {
      return { active: false };
    }

    return {
      active: dialer.active,
      currentCalls: dialer.currentCalls,
      totalCalls: dialer.totalCalls,
      successfulCalls: dialer.successfulCalls,
      callRatio: dialer.config.callRatio,
      startTime: dialer.startTime
    };
  }
}

module.exports = new PredictiveDialerService();
