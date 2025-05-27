const express = require("express");
const router = express.Router();
const db = require("../../config/bd");
const { authenticateToken } = require("../../middleware/auth");
const asteriskService = require("../../services/asteriskService");
const logger = require("../../utils/logger");

/**
 * @route   POST /api/agent/sync/call-state
 * @desc    Synchroniser l'état d'un appel entre l'application et Asterisk
 * @access  Private
 */
router.post("/call-state", authenticateToken, async (req, res) => {
  try {
    const { callId, forceSync } = req.body;
    const userId = req.user.user;
    const campaignId = req.user.campaign_id;
    
    if (!callId) {
      return res.status(400).json({
        success: false,
        message: "ID d'appel requis"
      });
    }
    
    // Si forceSync est vrai, cela signifie que l'appel est déjà terminé côté Asterisk
    // mais que l'état de l'application doit être mis à jour
    if (forceSync === true) {
      logger.info(`Fin d'appel forcée pour l'appel ${callId} (désynchronisation détectée)`);
      
      // Mettre à jour les enregistrements dans la base de données pour indiquer que l'appel est terminé
      try {
        // Mettre à jour vicidial_log si l'appel existe
        await db.query(
          `UPDATE vicidial_log 
           SET status = 'DONE', end_epoch = UNIX_TIMESTAMP() 
           WHERE uniqueid = ? AND end_epoch IS NULL`,
          [callId]
        );
        
        // Mettre à jour vicidial_closer_log si l'appel existe
        await db.query(
          `UPDATE vicidial_closer_log 
           SET status = 'DONE', end_epoch = UNIX_TIMESTAMP() 
           WHERE uniqueid = ? AND end_epoch IS NULL`,
          [callId]
        );
        
        // Mettre à jour le statut de l'agent si nécessaire
        await db.query(
          `UPDATE vicidial_live_agents 
           SET status = 'READY', last_update_time = NOW() 
           WHERE user = ? AND status = 'INCALL'`,
          [userId]
        );
        
        logger.info(`État de l'appel ${callId} mis à jour dans la base de données (fin forcée)`);
        
        return res.json({
          success: true,
          message: "État de l'appel mis à jour (fin forcée)",
          callId
        });
      } catch (dbError) {
        logger.error("Erreur lors de la mise à jour de l'état de l'appel:", dbError);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la mise à jour de l'état de l'appel",
          error: dbError.message
        });
      }
    }
    
    // Vérifier l'état réel de l'appel dans Asterisk
    try {
      const channels = await asteriskService.getActiveChannels(req.user.extension);
      
      const hasActiveCall = channels && channels.count > 0;
      
      return res.json({
        success: true,
        hasActiveCall,
        channels: channels || [],
        callId
      });
    } catch (error) {
      logger.error("Erreur lors de la vérification de l'état de l'appel:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification de l'état de l'appel",
        error: error.message
      });
    }
  } catch (error) {
    logger.error("Erreur lors de la synchronisation de l'état de l'appel:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
});

/**
 * @route   POST /api/agent/sync/reset-call-state
 * @desc    Réinitialiser l'état d'un appel dans la base de données
 * @access  Private
 */
router.post("/reset-call-state", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user;
    
    // Mettre à jour le statut de l'agent
    await db.query(
      `UPDATE vicidial_live_agents 
       SET status = 'READY', last_update_time = NOW() 
       WHERE user = ? AND status = 'INCALL'`,
      [userId]
    );
    
    // Marquer tous les appels non terminés comme terminés
    await db.query(
      `UPDATE vicidial_log 
       SET status = 'DONE', end_epoch = UNIX_TIMESTAMP() 
       WHERE user = ? AND end_epoch IS NULL`,
      [userId]
    );
    
    // Marquer tous les appels entrants non terminés comme terminés
    await db.query(
      `UPDATE vicidial_closer_log 
       SET status = 'DONE', end_epoch = UNIX_TIMESTAMP() 
       WHERE user = ? AND end_epoch IS NULL`,
      [userId]
    );
    
    logger.info(`État des appels réinitialisé pour l'agent ${userId}`);
    
    return res.json({
      success: true,
      message: "État des appels réinitialisé avec succès"
    });
  } catch (error) {
    logger.error("Erreur lors de la réinitialisation de l'état des appels:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
});

module.exports = router;
