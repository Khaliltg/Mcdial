const express = require('express');
const router = express.Router();
const db = require('../../config/bd');
const { authenticateJWT, authenticateToken } = require('../../middleware/auth');
const asteriskService = require('../../services/asteriskService');
const rateLimit = require('express-rate-limit');
const { validationResult } = require('express-validator');

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Validate user input
const validateUserId = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('API Error:', err);
    if (err instanceof Error) {
        return res.status(500).json({ 
            message: 'Internal server error', 
            error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred' 
        });
    }
    next(err);
};

// Route pour récupérer les informations de l'agent authentifié
router.get('/info', [apiLimiter, authenticateToken, validateUserId], async (req, res, next) => {
    try {
        // Récupérer l'ID de l'utilisateur à partir du token (déjà vérifié par le middleware)
        const userId = req.user.user;
        
        // Validate user ID
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Use parameterized queries to prevent SQL injection
        const [userInfo] = await db.query(`
            SELECT user_id, user, full_name, user_level 
            FROM vicidial_users 
            WHERE user = ?
        `, [userId]);

        if (userInfo.length === 0) {
            return res.status(404).json({ message: 'Agent non trouvé' });
        }
        
        // Récupérer les informations de l'agent dans vicidial_live_agents
        const [liveAgentInfo] = await db.query(`
            SELECT status, campaign_id, extension, conf_exten, calls_today
            FROM vicidial_live_agents 
            WHERE user = ?
        `, [userId]);
        
        // Récupérer les informations de la campagne si l'agent est dans une campagne
        let campaignInfo = null;
        if (liveAgentInfo.length > 0 && liveAgentInfo[0].campaign_id) {
            const [campaigns] = await db.query(`
                SELECT campaign_id, campaign_name, dial_method, auto_dial_level
                FROM vicidial_campaigns 
                WHERE campaign_id = ?
            `, [liveAgentInfo[0].campaign_id]);
            
            if (campaigns.length > 0) {
                campaignInfo = campaigns[0];
            }
        }
        
        // Récupérer les statistiques d'appels de l'agent
        const [callStats] = await db.query(`
            SELECT COUNT(*) as total_calls,
                   SUM(CASE WHEN status IN ('ANSWERED', 'HUMAN', 'SALE') THEN 1 ELSE 0 END) as completed_calls
            FROM vicidial_log
            WHERE user = ? AND call_date >= CURDATE()
        `, [userId]);
        
        // Calculer le taux de réussite
        const totalCalls = callStats[0].total_calls || 0;
        const completedCalls = callStats[0].completed_calls || 0;
        const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;
        
        // Construire la réponse
        const response = {
            user_id: userInfo[0].user_id,
            user: userInfo[0].user,
            full_name: userInfo[0].full_name,
            user_level: userInfo[0].user_level,
            status: liveAgentInfo.length > 0 ? liveAgentInfo[0].status : 'DÉCONNECTÉ',
            extension: liveAgentInfo.length > 0 ? liveAgentInfo[0].extension : req.user.extension,
            campaign_id: liveAgentInfo.length > 0 ? liveAgentInfo[0].campaign_id : req.user.campaign_id,
            campaign_name: campaignInfo ? campaignInfo.campaign_name : req.user.campaign_name,
            calls_today: liveAgentInfo.length > 0 ? liveAgentInfo[0].calls_today : 0,
            success_rate: successRate,
            total_calls: totalCalls,
            completed_calls: completedCalls
        };

        res.json(response);
    } catch (err) {
        next(err);
    }
});

// Route pour mettre à jour le statut de l'agent
router.post('/update-status', [apiLimiter, authenticateToken, validateUserId], async (req, res, next) => {
    const { status, pauseCode } = req.body;
    
    if (!status) {
        return res.status(400).json({ message: 'Statut requis' });
    }

    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Vérifier si l'agent existe déjà
        const [existingAgent] = await db.query(`
            SELECT user_id 
            FROM vicidial_live_agents 
            WHERE user = ? 
            AND campaign_id = ?
            LIMIT 1
        `, [userId, campaignId]);
        
        if (existingAgent.length === 0) {
            // Si l'agent n'existe pas, l'ajouter
            await db.query(`
                INSERT INTO vicidial_live_agents 
                (user, campaign_id, status, last_update_time, random_id) 
                VALUES (?, ?, ?, NOW(), FLOOR(RAND() * 1000000))
            `, [userId, campaignId, status]);
        } else {
            // Si l'agent existe, mettre à jour son statut
            await db.query(`
                UPDATE vicidial_live_agents 
                SET status = ?, last_update_time = NOW() 
                WHERE user = ? 
                AND campaign_id = ?
            `, [status, userId, campaignId]);
        }
        
        // Si c'est une pause, enregistrer le code de pause
        if (status === 'PAUSED' && pauseCode) {
            await db.query(`
                INSERT INTO vicidial_pause_data 
                (user, campaign_id, pause_code, entry_date) 
                VALUES (?, ?, ?, NOW())
            `, [userId, campaignId, pauseCode]);
        }
        
        res.json({ message: 'Statut mis à jour avec succès', status });
    } catch (err) {
        next(err);
    }
});

// Route pour reprendre les appels après une pause
router.post('/resume', [apiLimiter, authenticateToken, validateUserId], async (req, res, next) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Mettre à jour le statut de l'agent
        await db.query(`
            UPDATE vicidial_live_agents 
            SET status = 'READY', last_update_time = NOW() 
            WHERE user = ? 
            AND campaign_id = ?
        `, [userId, campaignId]);
        
        res.json({ message: 'Agent prêt à reprendre les appels' });
    } catch (err) {
        next(err);
    }
});

// Route pour mettre l'agent en mode non prêt
router.post('/not-ready', [apiLimiter, authenticateToken, validateUserId], async (req, res, next) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Mettre à jour le statut de l'agent
        await db.query(`
            UPDATE vicidial_live_agents 
            SET status = 'NOT_READY', last_update_time = NOW() 
            WHERE user = ? 
            AND campaign_id = ?
        `, [userId, campaignId]);
        
        res.json({ message: 'Agent en mode non prêt' });
    } catch (err) {
        next(err);
    }
});

// Route pour vérifier les permissions de dial manuel
router.get('/manual-dial-permissions', [apiLimiter, authenticateToken, validateUserId], async (req, res, next) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Vérifier les permissions dans vicidial_users
        const [userPermissions] = await db.query(`
            SELECT manual_dial 
            FROM vicidial_users 
            WHERE user = ?
        `, [userId]);
        
        // Vérifier les permissions dans vicidial_campaigns
        const [campaignPermissions] = await db.query(`
            SELECT manual_dial 
            FROM vicidial_campaigns 
            WHERE campaign_id = ?
        `, [campaignId]);
        
        // L'agent peut faire des appels manuels s'il a les permissions à la fois au niveau utilisateur et campagne
        const canManualDial = (userPermissions.length > 0 && userPermissions[0].manual_dial === 'Y') &&
                             (campaignPermissions.length > 0 && campaignPermissions[0].manual_dial === 'Y');
        
        res.json({ canManualDial });
    } catch (err) {
        next(err);
    }
});

// Route pour obtenir les numéros de la campagne
router.get('/campaign-numbers', [apiLimiter, authenticateToken, validateUserId], async (req, res, next) => {
    try {
        const campaignId = req.user.campaign_id;
        const limit = parseInt(req.query.limit) || 10; // Nombre de numéros à récupérer
        
        // Récupérer les numéros disponibles pour la campagne
        const [numbers] = await db.query(`
            SELECT phone_number, first_name, last_name, lead_id 
            FROM vicidial_list 
            WHERE campaign_id = ? 
            AND status = 'NEW' 
            LIMIT ?
        `, [campaignId, limit]);
        
        res.json(numbers);
    } catch (err) {
        next(err);
    }
});

// Route pour obtenir les données d'un prospect
router.get('/prospect-data', [apiLimiter, authenticateToken, validateUserId], async (req, res, next) => {
    try {
        // Log all request parameters for debugging
        console.log('All request query parameters:', req.query);
        console.log('All request headers:', req.headers);
        
        // Accept both parameter naming conventions
        const phoneNumber = req.query.phoneNumber || req.query.phone;
        const leadId = req.query.leadId || req.query.lead_id;
        
        console.log('Fetching prospect data with:', { phoneNumber, leadId });
        
        if (!phoneNumber && !leadId) {
            console.log('Error: No phone number or lead ID provided');
            return res.status(400).json({ message: 'Numéro de téléphone ou ID de prospect requis' });
        }

        // Construire la requête en fonction des paramètres fournis
        const query = leadId ? `
            SELECT * 
            FROM vicidial_list 
            WHERE lead_id = ?
        ` : `
            SELECT * 
            FROM vicidial_list 
            WHERE phone_number = ?
        `;

        console.log('Executing SQL query:', query.replace(/\s+/g, ' ').trim());
        console.log('With parameters:', [leadId || phoneNumber]);

        const [results] = await db.query(query, [leadId || phoneNumber]);
        console.log('Query results count:', results.length);
        
        if (results.length === 0) {
            console.log('Error: No prospect found with the provided parameters');
            return res.status(404).json({ message: 'Prospect non trouvé' });
        }

        console.log('Raw prospect data:', results[0]);

        // Formater les dates pour l'affichage
        const prospect = results[0];
        const formattedProspect = {
            ...prospect,
            entry_date: new Date(prospect.entry_date).toLocaleDateString('fr-FR'),
            last_local_call_date: prospect.last_local_call_date ? new Date(prospect.last_local_call_date).toLocaleDateString('fr-FR') : null,
            last_state_change: prospect.last_state_change ? new Date(prospect.last_state_change).toLocaleDateString('fr-FR') : null
        };

        console.log('Formatted prospect data to be sent:', formattedProspect);
        res.json(formattedProspect);
    } catch (err) {
        next(err);
    }
});

// Route pour arrêter le mode prédictif
router.post('/stop-predictive', [apiLimiter, authenticateToken, validateUserId], async (req, res, next) => {
    try {
        const userId = req.user.user;
        const { campaignId } = req.body;
        
        // Mettre à jour le statut de l'agent
        await db.query(`
            UPDATE vicidial_live_agents 
            SET status = 'READY', last_update_time = NOW() 
            WHERE user = ? 
            AND campaign_id = ?
        `, [userId, campaignId]);
        
        res.json({ message: 'Mode prédictif arrêté' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
