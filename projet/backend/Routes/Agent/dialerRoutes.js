/**
 * Routes pour la gestion du composeur prédictif
 * Ces routes permettent de démarrer/arrêter le mode prédictif et d'obtenir des statistiques
 */
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Services
const PredictiveDialerService = require('../../services/PredictiveDialerService');

// Middlewares
const { authenticateToken } = require('../../middlewares/auth');
const { validateUserId } = require('../../middlewares/validation');

// Rate limiter pour les API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limite chaque IP à 100 requêtes par fenêtre
});

/**
 * @route   POST /api/dialer/start
 * @desc    Démarre le mode prédictif pour une campagne
 * @access  Private
 */
router.post('/start', [
    apiLimiter,
    authenticateToken,
    validateUserId,
    body('level').optional().isString().withMessage('Le niveau doit être une chaîne de caractères'),
    body('campaignId').optional().isString().withMessage('L\'ID de campagne doit être une chaîne de caractères')
], async (req, res, next) => {
    try {
        // Validation des entrées
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.user.user;
        const campaignId = req.body.campaignId || req.user.campaign_id;
        const level = req.body.level || 'AUTO';

        // Démarrer le mode prédictif
        const result = await PredictiveDialerService.startPredictiveMode(campaignId, level, userId);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (err) {
        console.error('Erreur lors du démarrage du mode prédictif:', err);
        next(err);
    }
});

/**
 * @route   POST /api/dialer/stop
 * @desc    Arrête le mode prédictif pour une campagne
 * @access  Private
 */
router.post('/stop', [
    apiLimiter,
    authenticateToken,
    validateUserId,
    body('campaignId').optional().isString().withMessage('L\'ID de campagne doit être une chaîne de caractères')
], async (req, res, next) => {
    try {
        // Validation des entrées
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const campaignId = req.body.campaignId || req.user.campaign_id;

        // Arrêter le mode prédictif
        const result = await PredictiveDialerService.stopPredictiveMode(campaignId);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (err) {
        console.error('Erreur lors de l\'arrêt du mode prédictif:', err);
        next(err);
    }
});

/**
 * @route   GET /api/dialer/stats
 * @desc    Obtient les statistiques du mode prédictif pour une campagne
 * @access  Private
 */
router.get('/stats', [
    apiLimiter,
    authenticateToken,
    validateUserId
], async (req, res, next) => {
    try {
        const campaignId = req.query.campaignId || req.user.campaign_id;

        // Obtenir les statistiques
        const stats = PredictiveDialerService.getPredictiveStats(campaignId);
        
        res.status(200).json(stats);
    } catch (err) {
        console.error('Erreur lors de la récupération des statistiques du mode prédictif:', err);
        next(err);
    }
});

/**
 * @route   GET /api/dialer/agent-stats
 * @desc    Obtient les statistiques des agents pour une campagne
 * @access  Private
 */
router.get('/agent-stats', [
    apiLimiter,
    authenticateToken,
    validateUserId
], async (req, res, next) => {
    try {
        const campaignId = req.query.campaignId || req.user.campaign_id;

        // Obtenir les statistiques des agents
        const agentStats = await PredictiveDialerService.getAgentStats(campaignId);
        
        res.status(200).json(agentStats);
    } catch (err) {
        console.error('Erreur lors de la récupération des statistiques des agents:', err);
        next(err);
    }
});

module.exports = router;
