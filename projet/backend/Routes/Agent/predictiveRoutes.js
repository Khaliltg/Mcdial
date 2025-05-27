const express = require('express');
const router = express.Router();
const PredictiveDialerService = require('../../services/PredictiveDialerService');
const logger = require('../../utils/logger');
const { authenticateToken } = require('../../middleware/auth');

/**
 * @route   POST /api/predictive/start
 * @desc    Démarrer le mode prédictif pour une campagne
 * @access  Private
 */
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { campaignId, level } = req.body;
    
    if (!campaignId) {
      return res.status(400).json({ success: false, message: 'ID de campagne requis' });
    }

    // Extraire l'ID de l'utilisateur du token JWT
    const userId = req.user && req.user.user ? req.user.user : null;
    
    if (!userId) {
      logger.error(`Tentative de démarrage du mode prédictif sans ID utilisateur valide`);
      return res.status(400).json({ success: false, message: 'ID utilisateur non disponible' });
    }
    
    // Démarrer le mode prédictif avec le niveau spécifié ou AUTO par défaut
    const result = await PredictiveDialerService.startPredictiveMode(campaignId, level || 'AUTO', userId);
    
    if (result.success) {
      logger.info(`Mode prédictif démarré pour la campagne ${campaignId} par l'agent ${userId} avec niveau ${level || 'AUTO'}`);
      return res.status(200).json({ 
        success: true, 
        message: result.message,
        campaignName: result.campaignName,
        dialLevel: result.dialLevel
      });
    
    } else {
      return res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    logger.error('Erreur lors du démarrage du mode prédictif:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors du démarrage du mode prédictif' });
  }
});

/**
 * @route   POST /api/predictive/stop
 * @desc    Arrêter le mode prédictif pour une campagne
 * @access  Private
 */
router.post('/stop', authenticateToken, async (req, res) => {
  try {
    const { campaignId } = req.body;
    
    if (!campaignId) {
      return res.status(400).json({ success: false, message: 'ID de campagne requis' });
    }

    // Extraire l'ID de l'utilisateur du token JWT
    const userId = req.user && req.user.user ? req.user.user : null;
    
    if (!userId) {
      logger.error(`Tentative d'arrêt du mode prédictif sans ID utilisateur valide`);
      return res.status(400).json({ success: false, message: 'ID utilisateur non disponible' });
    }
    
    // Arrêter le mode prédictif
    const result = await PredictiveDialerService.stopPredictiveMode(campaignId);
    
    if (result.success) {
      logger.info(`Mode prédictif arrêté pour la campagne ${campaignId} par l'agent ${userId}`);
      return res.status(200).json({ 
        success: true, 
        message: result.message,
        stats: result.stats
      });
    } else {
      return res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    logger.error('Erreur lors de l\'arrêt du mode prédictif:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'arrêt du mode prédictif' });
  }
});

/**
 * @route   GET /api/predictive/stats/:campaignId
 * @desc    Obtenir les statistiques du mode prédictif pour une campagne
 * @access  Private
 */
router.get('/stats/:campaignId', authenticateToken, (req, res) => {
  try {
    const { campaignId } = req.params;
    
    if (!campaignId) {
      return res.status(400).json({ success: false, message: 'ID de campagne requis' });
    }

    // Obtenir les statistiques
    const stats = PredictiveDialerService.getPredictiveStats(campaignId);
    
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques du mode prédictif:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des statistiques' });
  }
});

/**
 * @route   POST /api/predictive/config
 * @desc    Mettre à jour la configuration du mode prédictif pour une campagne
 * @access  Private
 */
router.post('/config', authenticateToken, async (req, res) => {
  try {
    const { campaignId, config } = req.body;
    
    if (!campaignId || !config) {
      return res.status(400).json({ success: false, message: 'ID de campagne et configuration requis' });
    }

    // Vérifier si le mode prédictif est actif
    const stats = PredictiveDialerService.getPredictiveStats(campaignId);
    
    if (!stats.active) {
      return res.status(400).json({ success: false, message: 'Le mode prédictif n\'est pas actif pour cette campagne' });
    }

    // Arrêter puis redémarrer avec la nouvelle configuration
    PredictiveDialerService.stopPredictiveMode(campaignId);
    const result = await PredictiveDialerService.startPredictiveMode(campaignId, config);
    
    if (result.success) {
      logger.info(`Configuration du mode prédictif mise à jour pour la campagne ${campaignId} par l'agent ${req.user.id}`);
      return res.status(200).json({ success: true, message: 'Configuration mise à jour' });
    } else {
      return res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de la configuration du mode prédictif:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour de la configuration' });
  }
});

/**
 * @route   GET /api/predictive/stats
 * @desc    Obtenir les statistiques du mode prédictif pour une campagne
 * @access  Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { campaignId } = req.query;
    
    if (!campaignId) {
      return res.status(400).json({ success: false, message: 'ID de campagne requis' });
    }

    // Obtenir les statistiques du mode prédictif
    const stats = PredictiveDialerService.getPredictiveStats(campaignId);
    
    // Obtenir des statistiques supplémentaires depuis la base de données si nécessaire
    // Par exemple, le nombre total d'appels pour la journée, etc.
    
    return res.status(200).json({ 
      success: true, 
      stats: stats
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques du mode prédictif:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des statistiques' });
  }
});

module.exports = router;
