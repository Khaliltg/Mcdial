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
            SELECT status, campaign_id, extension, conf_exten, calls_today, pause_code, comments, external_pause_code
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
            pauseCode: liveAgentInfo.length > 0 && liveAgentInfo[0].status === 'PAUSED' ? liveAgentInfo[0].pause_code : null,
            pauseReason: liveAgentInfo.length > 0 && liveAgentInfo[0].status === 'PAUSED' ? liveAgentInfo[0].comments : null,
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
                (user, campaign_id, status, external_status, last_update_time, random_id) 
                VALUES (?, ?, ?, ?, NOW(), FLOOR(RAND() * 1000000))
            `, [userId, campaignId, status, status]);
        } else {
            // Si l'agent existe, mettre à jour son statut
            await db.query(`
                UPDATE vicidial_live_agents 
                SET status = ?, external_status = ?, last_update_time = NOW() 
                WHERE user = ? 
                AND campaign_id = ?
            `, [status, status, userId, campaignId]);
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

// Route pour obtenir les numéros d'une campagne spécifique (nouvelle route avec format /campaign/numbers)
router.get('/campaign/numbers', [apiLimiter, authenticateToken, validateUserId], async (req, res, next) => {
    try {
        // Utiliser l'ID de campagne fourni dans la requête ou celui de l'utilisateur
        const campaignId = req.query.campaignId || req.user.campaign_id;
        const limit = parseInt(req.query.limit) || 10; // Nombre de numéros à récupérer
        
        console.log(`Récupération des numéros pour la campagne: ${campaignId}`);
        
        // Récupérer les numéros disponibles pour la campagne en utilisant une jointure
        // Nous utilisons la table vicidial_lists pour obtenir les listes associées à la campagne
        const [numbers] = await db.query(`
            SELECT vl.phone_number, vl.first_name, vl.last_name, vl.lead_id 
            FROM vicidial_list vl
            JOIN vicidial_lists vls ON vl.list_id = vls.list_id
            WHERE vls.campaign_id = ? 
            AND vl.status = 'NEW' 
            LIMIT ?
        `, [campaignId, limit]);
        
        res.json(numbers);
    } catch (err) {
        console.error('Erreur lors de la récupération des numéros de campagne:', err);
        next(err);
    }
});

// Route pour obtenir les données d'un prospect
// Route pour récupérer les données d'un prospect par ID (nouvelle route compatible avec le frontend)
router.get('/prospect/:leadId', [apiLimiter, authenticateToken, validateUserId], async (req, res, next) => {
    try {
        let leadId = req.params.leadId;
        
        console.log('Fetching prospect data with lead ID:', leadId);
        
        if (!leadId) {
            console.log('Error: No lead ID provided');
            return res.status(400).json({ message: 'ID de prospect requis' });
        }
        
        // Extraire l'ID numérique si le format est LEAD-XXX
        let numericLeadId = leadId;
        if (leadId.startsWith('LEAD-')) {
            numericLeadId = leadId.substring(5); // Enlever le préfixe 'LEAD-'
            console.log(`ID au format LEAD-XXX détecté, extraction de l'ID numérique: ${numericLeadId}`);
        }

        // Requête SQL pour récupérer les données du prospect
        const query = `
            SELECT * 
            FROM vicidial_list 
            WHERE lead_id = ?
        `;

        console.log('Executing SQL query:', query.replace(/\s+/g, ' ').trim());
        console.log('With parameters:', [numericLeadId]);

        const [results] = await db.query(query, [numericLeadId]);
        console.log('Query results count:', results.length);
        
        if (results.length === 0) {
            console.log('Error: No prospect found with the provided lead ID');
            return res.status(404).json({ message: 'Prospect non trouvé' });
        }

        // Transformer les données pour le frontend
        const prospectData = {
            id: results[0].lead_id,
            firstName: results[0].first_name,
            lastName: results[0].last_name,
            phoneNumber: results[0].phone_number,
            address: results[0].address1,
            city: results[0].city,
            state: results[0].state,
            postalCode: results[0].postal_code,
            email: results[0].email,
            notes: results[0].comments,
            // Ajouter d'autres champs selon les besoins
        };

        res.json(prospectData);
    } catch (error) {
        console.error('Error fetching prospect data:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Route existante pour récupérer les données d'un prospect (maintenue pour compatibilité)
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

// Route pour récupérer les statistiques réelles de la campagne
router.get('/campaign/stats', [apiLimiter, authenticateToken, validateUserId], async (req, res, next) => {
    try {
        // Récupérer l'ID de la campagne depuis le token ou la requête
        const campaignId = req.query.campaignId || req.user.campaign_id;
        
        if (!campaignId) {
            return res.status(400).json({ message: 'ID de campagne requis' });
        }
        
        console.log(`Récupération des statistiques pour la campagne: ${campaignId}`);
        
        // 1. Statistiques générales de la campagne
        const [campaignStats] = await db.query(`
            SELECT 
                campaign_id,
                campaign_name,
                active,
                hopper_level,
                auto_dial_level,
                dial_method
            FROM vicidial_campaigns
            WHERE campaign_id = ?
        `, [campaignId]);
        
        if (campaignStats.length === 0) {
            return res.status(404).json({ message: 'Campagne non trouvée' });
        }
        
        // 2. Statistiques d'appels pour aujourd'hui
        const [todayStats] = await db.query(`
            SELECT 
                COUNT(*) as total_calls,
                SUM(CASE WHEN status IN ('ANSWERED', 'HUMAN', 'SALE') THEN 1 ELSE 0 END) as answered_calls,
                SUM(CASE WHEN status = 'SALE' THEN 1 ELSE 0 END) as successful_calls,
                AVG(CASE WHEN length_in_sec > 0 THEN length_in_sec ELSE NULL END) as avg_duration
            FROM vicidial_log
            WHERE campaign_id = ? AND call_date >= CURDATE()
        `, [campaignId]);
        
        // 3. Statistiques des agents actifs dans cette campagne
        const [agentStats] = await db.query(`
            SELECT 
                COUNT(*) as total_agents,
                SUM(CASE WHEN status = 'READY' THEN 1 ELSE 0 END) as ready_agents,
                SUM(CASE WHEN status = 'PAUSED' THEN 1 ELSE 0 END) as paused_agents,
                SUM(CASE WHEN status = 'INCALL' THEN 1 ELSE 0 END) as incall_agents
            FROM vicidial_live_agents
            WHERE campaign_id = ?
        `, [campaignId]);
        
        // 4. Statistiques des 7 derniers jours
        const [weeklyStats] = await db.query(`
            SELECT 
                DATE(call_date) as date,
                COUNT(*) as total_calls,
                SUM(CASE WHEN status IN ('ANSWERED', 'HUMAN', 'SALE') THEN 1 ELSE 0 END) as answered_calls
            FROM vicidial_log
            WHERE campaign_id = ? AND call_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(call_date)
            ORDER BY date ASC
        `, [campaignId]);
        
        // Calculer les taux et pourcentages
        const totalCalls = todayStats[0].total_calls || 0;
        const answeredCalls = todayStats[0].answered_calls || 0;
        const successfulCalls = todayStats[0].successful_calls || 0;
        const avgDuration = Math.round(todayStats[0].avg_duration || 0);
        
        const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0;
        const successRate = answeredCalls > 0 ? Math.round((successfulCalls / answeredCalls) * 100) : 0;
        
        // Construire la réponse
        const response = {
            campaign: {
                id: campaignStats[0].campaign_id,
                name: campaignStats[0].campaign_name,
                status: campaignStats[0].active === 'Y' ? 'Actif' : 'Inactif',
                hopperLevel: campaignStats[0].hopper_level,
                dialLevel: campaignStats[0].auto_dial_level,
                dialMethod: campaignStats[0].dial_method
            },
            today: {
                totalCalls,
                answeredCalls,
                successfulCalls,
                answerRate,
                successRate,
                avgDuration
            },
            agents: {
                total: agentStats[0].total_agents || 0,
                ready: agentStats[0].ready_agents || 0,
                paused: agentStats[0].paused_agents || 0,
                inCall: agentStats[0].incall_agents || 0
            },
            weekly: weeklyStats.map(day => ({
                date: new Date(day.date).toLocaleDateString('fr-FR'),
                totalCalls: day.total_calls,
                answeredCalls: day.answered_calls,
                answerRate: day.total_calls > 0 ? Math.round((day.answered_calls / day.total_calls) * 100) : 0
            }))
        };
        
        res.json(response);
    } catch (err) {
        console.error('Erreur lors de la récupération des statistiques de campagne:', err);
        next(err);
    }
});

module.exports = router;
