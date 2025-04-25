const express = require('express');
const router = express.Router();
const db = require('../../config/bd');
const { authenticateJWT, authenticateToken } = require('../../middleware/auth');
const asteriskService = require('../../services/asteriskService');
// Suppression de l'import du service Twilio

// Route pour récupérer les informations de l'agent authentifié
router.get('/info', authenticateToken, async (req, res) => {
    try {
        // Récupérer l'ID de l'utilisateur à partir du token (déjà vérifié par le middleware)
        const userId = req.user.user;
        
        // Récupérer les informations de l'agent depuis la base de données
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
            callStats: {
                today: totalCalls,
                completed: completedCalls,
                successRate: successRate
            }
        };
        
        res.json(response);
        
    } catch (err) {
        console.error('Erreur lors de la récupération des informations de l\'agent:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Route pour mettre à jour le statut de l'agent
router.post('/update-status', authenticateToken, async (req, res) => {
    const { status, pauseCode } = req.body;
    
    if (!status) {
        return res.status(400).json({ message: 'Statut requis' });
    }
    
    try {
        // Récupérer l'ID de l'utilisateur à partir du token
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Mettre à jour le statut de l'agent dans vicidial_live_agents
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        const [result] = await db.query(`
            UPDATE vicidial_live_agents 
            SET status = ?, last_update_time = ?, last_state_change = ?
            WHERE user = ?
        `, [status, now, now, userId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Agent non trouvé ou non connecté' });
        }
        
        // Si l'agent est en pause et qu'un code de pause est fourni, l'enregistrer
        if (status === 'PAUSED' && pauseCode) {
            await db.query(`
                INSERT INTO vicidial_agent_log 
                (user, event_time, campaign_id, pause_code, pause_type) 
                VALUES (?, NOW(), ?, ?, 'AGENT')
            `, [userId, campaignId, pauseCode]);
        }
        
        // Informer Asterisk du changement de statut
        try {
            await asteriskService.setAgentStatus(userId, status, campaignId);
            console.log(`Agent ${userId} mis en état ${status} dans Asterisk`);
        } catch (asteriskError) {
            console.error('Erreur lors de la communication avec Asterisk:', asteriskError);
            // Continuer même en cas d'erreur avec Asterisk
        }
        
        res.json({
            success: true,
            message: 'Statut de l\'agent mis à jour avec succès',
            status: status
        });
        
    } catch (err) {
        console.error('Erreur lors de la mise à jour du statut de l\'agent:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Route pour mettre l'agent en pause
router.post('/pause', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        const pauseCode = req.body.pauseCode || 'BREAK'; // Code de pause par défaut
        
        // Mettre à jour le statut de l'agent dans vicidial_live_agents
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        const [result] = await db.query(`
            UPDATE vicidial_live_agents 
            SET status = 'PAUSED', last_update_time = ?, last_state_change = ?
            WHERE user = ?
        `, [now, now, userId]);
        
        if (result.affectedRows === 0) {
            // L'agent n'existe pas dans la table, l'ajouter
            await db.query(`
                INSERT INTO vicidial_live_agents 
                (user, campaign_id, status, last_update_time, last_state_change, random_id) 
                VALUES (?, ?, 'PAUSED', ?, ?, FLOOR(RAND() * 1000000))
            `, [userId, campaignId, now, now]);
        }
        
        // Enregistrer la pause dans vicidial_agent_log avec timestamp unix
        const pauseTimestamp = Math.floor(Date.now() / 1000); // Timestamp actuel en secondes
        await db.query(`
            INSERT INTO vicidial_agent_log 
            (user, event_time, campaign_id, pause_epoch, pause_sec) 
            VALUES (?, NOW(), ?, ?, 0)
        `, [userId, campaignId, pauseTimestamp]);
        
        // Informer Asterisk que l'agent est en pause
        try {
            await asteriskService.setAgentStatus(userId, 'PAUSED', campaignId);
            console.log(`Agent ${userId} mis en état PAUSED dans Asterisk`);
        } catch (asteriskError) {
            console.error('Erreur lors de la communication avec Asterisk:', asteriskError);
            // Continuer même en cas d'erreur avec Asterisk
        }
        
        res.json({
            success: true,
            message: 'Agent mis en pause',
            status: 'PAUSED'
        });
        
    } catch (err) {
        console.error('Erreur lors de la mise en pause de l\'agent:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Route pour reprendre l'activité de l'agent
router.post('/resume', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Mettre à jour le statut de l'agent dans vicidial_live_agents
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        const [result] = await db.query(`
            UPDATE vicidial_live_agents 
            SET status = 'READY', last_update_time = ?, last_state_change = ?
            WHERE user = ?
        `, [now, now, userId]);


        
        if (result.affectedRows === 0) {
            // L'agent n'existe pas dans la table, l'ajouter
            await db.query(`
                INSERT INTO vicidial_live_agents 
                (user, campaign_id, status, last_update_time, last_state_change, random_id) 
                VALUES (?, ?, 'READY', ?, ?, FLOOR(RAND() * 1000000))
            `, [userId, campaignId, now, now]);
        }
        
        // Calculer la durée de pause si l'agent était en pause
        const currentTimestamp = Math.floor(Date.now() / 1000); // Timestamp actuel en secondes
        
        // Mettre à jour le dernier enregistrement de pause de l'agent
        await db.query(`
            UPDATE vicidial_agent_log 
            SET pause_sec = ? - pause_epoch 
            WHERE user = ? 
            AND pause_epoch > 0 
            AND pause_sec = 0 
            ORDER BY event_time DESC 
            LIMIT 1
        `, [currentTimestamp, userId]);
        
        // Informer Asterisk que l'agent est prêt
        try {
            await asteriskService.setAgentStatus(userId, 'READY', campaignId);
            console.log(`Agent ${userId} mis en état READY dans Asterisk`);
        } catch (asteriskError) {
            console.error('Erreur lors de la communication avec Asterisk:', asteriskError);
            // Continuer même en cas d'erreur avec Asterisk
        }
        
        res.json({
            success: true,
            message: 'Agent prêt',
            status: 'READY'
        });
        
    } catch (err) {
        console.error('Erreur lors de la reprise de l\'agent:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Route pour indiquer que l'agent est prêt à recevoir des appels
router.post('/ready', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Mettre à jour le statut de l'agent dans vicidial_live_agents
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        const [result] = await db.query(`
            UPDATE vicidial_live_agents 
            SET status = 'READY', last_update_time = ?, last_state_change = ?
            WHERE user = ?
        `, [now, now, userId]);
        
        if (result.affectedRows === 0) {
            // L'agent n'existe pas dans la table, l'ajouter
            await db.query(`
                INSERT INTO vicidial_live_agents 
                (user, campaign_id, status, last_update_time, last_state_change, random_id) 
                VALUES (?, ?, 'READY', ?, ?, FLOOR(RAND() * 1000000))
            `, [userId, campaignId, now, now]);
        }
        
        // Informer Asterisk que l'agent est prêt
        try {
            await asteriskService.setAgentStatus(userId, 'READY', campaignId);
            console.log(`Agent ${userId} mis en état READY dans Asterisk`);
        } catch (asteriskError) {
            console.error('Erreur lors de la communication avec Asterisk:', asteriskError);
            // Continuer même en cas d'erreur avec Asterisk
        }
        
        res.json({
            success: true,
            message: 'Agent prêt à recevoir des appels',
            status: 'READY'
        });
        
    } catch (err) {
        console.error('Erreur lors de la mise à jour du statut de l\'agent:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Route pour indiquer que l'agent n'est pas prêt à recevoir des appels
router.post('/not-ready', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Récupérer la campagne de l'agent
        const [agentInfo] = await db.query(`
            SELECT campaign_id 
            FROM vicidial_live_agents 
            WHERE user = ?
        `, [userId]);
        
        // Utiliser la valeur existante de campaignId si elle est disponible, sinon utiliser la valeur par défaut
        const agentCampaignId = agentInfo.length > 0 ? agentInfo[0].campaign_id : campaignId;
        
        // Mettre à jour l'état de l'agent dans la base de données
        await db.query(`
            UPDATE vicidial_live_agents 
            SET status = 'PAUSED' 
            WHERE user = ?
        `, [userId]);
        
        // Informer Asterisk que l'agent est en pause
        try {
            await asteriskService.setAgentStatus(userId, 'PAUSED', agentCampaignId);
            console.log(`Agent ${userId} mis en état PAUSED dans Asterisk`);
        } catch (asteriskError) {
            console.error('Erreur lors de la communication avec Asterisk:', asteriskError);
            // Continuer même en cas d'erreur avec Asterisk
        }
        
        res.json({ success: true, message: 'Agent mis en pause', status: 'PAUSED' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// Route pour vérifier les permissions d'appel manuel
router.get('/check-manual-dial-permissions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Vérifier d'abord si l'utilisateur a un niveau d'accès élevé
        const [userInfo] = await db.query(`
            SELECT user_level 
            FROM vicidial_users 
            WHERE user = ?
        `, [userId]);
        
        // Si l'utilisateur est admin (niveau 8 ou plus), autoriser les appels manuels
        if (userInfo.length > 0 && userInfo[0].user_level >= 8) {
            return res.json({
                success: true,
                canManualDial: true
            });
        }
        
        // Sinon, vérifier les permissions de la campagne
        // Vérifier si la colonne existe avant de l'utiliser
        const [columns] = await db.query(`
            SHOW COLUMNS FROM vicidial_campaigns LIKE 'manual_dial%'
        `);
        
        let canManualDial = true; // Par défaut, autoriser les appels manuels
        
        // Si une colonne de permission d'appel manuel existe
        if (columns.length > 0) {
            const columnName = columns[0].Field;
            const [permissions] = await db.query(`
                SELECT ${columnName} 
                FROM vicidial_campaigns 
                WHERE campaign_id = ?
            `, [campaignId]);
            
            // Vérifier la valeur selon le nom de la colonne trouvée
            if (permissions.length > 0) {
                const permValue = permissions[0][columnName];
                canManualDial = (permValue === 'Y' || permValue === '1' || permValue === 1);
            }
        }
        
        res.json({
            success: true,
            canManualDial: canManualDial
        });
        
    } catch (err) {
        console.error('Erreur lors de la vérification des permissions d\'appel manuel:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Route alternative pour vérifier les permissions d'appel manuel (pour compatibilité avec le frontend)
router.get('/manual-dial-permissions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Vérifier d'abord si l'utilisateur a un niveau d'accès élevé
        const [userInfo] = await db.query(`
            SELECT user_level 
            FROM vicidial_users 
            WHERE user = ?
        `, [userId]);
        
        // Si l'utilisateur est admin (niveau 8 ou plus), autoriser les appels manuels
        if (userInfo.length > 0 && userInfo[0].user_level >= 8) {
            return res.json({
                success: true,
                canManualDial: true
            });
        }
        
        // Sinon, vérifier les permissions de la campagne
        // Vérifier si la colonne existe avant de l'utiliser
        const [columns] = await db.query(`
            SHOW COLUMNS FROM vicidial_campaigns LIKE 'manual_dial%'
        `);
        
        let canManualDial = true; // Par défaut, autoriser les appels manuels
        
        // Si une colonne de permission d'appel manuel existe
        if (columns.length > 0) {
            const columnName = columns[0].Field;
            const [permissions] = await db.query(`
                SELECT ${columnName} 
                FROM vicidial_campaigns 
                WHERE campaign_id = ?
            `, [campaignId]);
            
            // Vérifier la valeur selon le nom de la colonne trouvée
            if (permissions.length > 0) {
                const permValue = permissions[0][columnName];
                canManualDial = (permValue === 'Y' || permValue === '1' || permValue === 1);
            }
        }
        
        res.json({
            success: true,
            canManualDial: canManualDial
        });
        
    } catch (err) {
        console.error('Erreur lors de la vérification des permissions d\'appel manuel:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Route pour vérifier les appels entrants
router.get('/check-calls', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user;
        
        // Vérifier s'il y a des appels disponibles pour cet agent
        // Stratégie 1: Chercher les appels spécifiquement assignés à cet agent
        let [incomingCalls] = await db.query(`
            SELECT auto_call_id, uniqueid, phone_number, lead_id, agent_only, status, call_time
            FROM vicidial_auto_calls 
            WHERE agent_only = ? AND status IN ('SENT', 'RINGING', 'LIVE')
            ORDER BY call_time DESC
            LIMIT 1
        `, [userId]);
        
        // Si aucun appel n'est trouvé avec l'ID de l'agent, chercher des appels non assignés
        if (incomingCalls.length === 0) {
            [incomingCalls] = await db.query(`
                SELECT auto_call_id, uniqueid, phone_number, lead_id, agent_only, status, call_time
                FROM vicidial_auto_calls 
                WHERE (agent_only IS NULL OR agent_only = '') AND status IN ('SENT', 'RINGING')
                ORDER BY call_time DESC
                LIMIT 1
            `);
            
            // Si un appel non assigné est trouvé, l'assigner à cet agent
            if (incomingCalls.length > 0) {
                const call = incomingCalls[0];
                await db.query(`
                    UPDATE vicidial_auto_calls
                    SET agent_only = ?, status = 'LIVE'
                    WHERE auto_call_id = ?
                `, [userId, call.auto_call_id]);
                
                // Mettre à jour le statut dans notre objet local
                call.status = 'LIVE';
                call.agent_only = userId;
            }
        }
        
        console.log('Appels disponibles pour agent', userId, ':', incomingCalls);
        
        if (incomingCalls.length > 0) {
            // Si un appel est trouvé, récupérer les informations du contact si disponible
            const call = incomingCalls[0];
            let customerInfo = null;
            
            if (call.lead_id) {
                const [leads] = await db.query(`
                    SELECT first_name, last_name, address1, address2, city, state, postal_code, email 
                    FROM vicidial_list 
                    WHERE lead_id = ?
                `, [call.lead_id]);
                
                if (leads.length > 0) {
                    customerInfo = leads[0];
                }
            }
            
            res.json({
                success: true,
                hasCall: true,
                callInfo: {
                    callId: call.uniqueid || call.auto_call_id.toString(),
                    phoneNumber: call.phone_number,
                    customerInfo: customerInfo
                }
            });
        } else {
            res.json({
                success: true,
                hasCall: false
            });
        }
        
    } catch (err) {
        console.error('Erreur lors de la vérification des appels entrants:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Route pour récupérer les numéros à appeler pour une campagne
router.get('/campaign-numbers', authenticateToken, async (req, res) => {
    try {
        const campaignId = req.user.campaign_id;
        const limit = parseInt(req.query.limit) || 10; // Nombre de numéros à récupérer
        
        // Vérifier si la campagne existe
        const [campaign] = await db.query(`
            SELECT campaign_id 
            FROM vicidial_campaigns 
            WHERE campaign_id = ? 
        `, [campaignId]);
        
        if (campaign.length === 0) {
            return res.json({
                success: false,
                message: 'Campagne non trouvée',
                numbers: []
            });
        }
        
        // Récupérer les listes associées à la campagne depuis vicidial_lists
        const [campaignLists] = await db.query(`
            SELECT list_id 
            FROM vicidial_lists 
            WHERE campaign_id = ? 
        `, [campaignId]);
        
        // Si aucune liste n'est trouvée, renvoyer un message
        if (campaignLists.length === 0) {
            return res.json({
                success: false,
                message: 'Aucune liste trouvée pour cette campagne',
                numbers: []
            });
        }
        
        // Extraire les IDs des listes
        const listIds = campaignLists.map(list => list.list_id);
        
        // Récupérer les numéros à appeler dans ces listes
        // Priorité aux numéros jamais appelés ou dont le statut est à rappeler
        const [numbers] = await db.query(`
            SELECT 
                lead_id,
                list_id,
                phone_number,
                first_name,
                last_name,
                status,
                called_count
            FROM 
                vicidial_list
            WHERE 
                list_id IN (?) AND
                (status = 'NEW' OR status = 'CBHOLD' OR status = '')
            ORDER BY 
                called_count ASC,
                last_local_call_time ASC
            LIMIT ?
        `, [listIds, limit]);
        
        res.json({
            success: true,
            campaign_id: campaignId,
            numbers: numbers.map(num => ({
                lead_id: num.lead_id,
                list_id: num.list_id,
                phone_number: num.phone_number,
                first_name: num.first_name || '',
                last_name: num.last_name || '',
                status: num.status,
                called_count: num.called_count
            }))
        });
        
    } catch (err) {
        console.error('Erreur lors de la récupération des numéros de la campagne:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Route pour enregistrer un appel dans les logs
router.post('/log-call', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        const { phoneNumber, leadId, callId, status, callNotes } = req.body;
        
        console.log(`Tentative d'enregistrement d'un appel pour l'agent ${userId}:`);
        console.log(`Numéro: ${phoneNumber}, Status: ${status || 'DIALED'}`);
        
        if (!phoneNumber) {
            console.error('Erreur: Numéro de téléphone manquant');
            return res.status(400).json({
                success: false,
                message: 'Numéro de téléphone requis'
            });
        }
        
        // Vérifier si la table vicidial_log existe
        const [tableCheck] = await db.query(`
            SHOW TABLES LIKE 'vicidial_log'
        `);
        
        if (tableCheck.length === 0) {
            console.error('La table vicidial_log n\'existe pas');
            return res.status(500).json({
                success: false,
                message: 'Table de logs non disponible',
                error: 'Table vicidial_log non trouvée'
            });
        }
        
        // Vérifier la structure de la table
        const [columns] = await db.query(`
            DESCRIBE vicidial_log
        `);
        
        console.log(`Structure de la table vicidial_log: ${columns.length} colonnes trouvées`);
        
        // Créer une liste des noms de colonnes disponibles
        const columnNames = columns.map(col => col.Field);
        console.log(`Colonnes disponibles: ${columnNames.join(', ')}`);
        
        // Générer un ID unique si non fourni
        const uniqueId = callId || `${Date.now()}-${userId}`;
        
        // Construire la requête d'insertion en fonction des colonnes disponibles
        const insertColumns = [];
        const insertValues = [];
        const queryParams = [];
        
        // Mapper les champs avec les colonnes disponibles
        const fieldMap = {
            uniqueid: uniqueId,
            lead_id: leadId || 0,
            list_id: 0, // list_id par défaut
            campaign_id: campaignId,
            call_date: 'NOW()',
            start_epoch: 'UNIX_TIMESTAMP()',
            end_epoch: 'UNIX_TIMESTAMP()',
            length_in_sec: 0,
            status: status || 'DIALED',
            phone_code: '',
            phone_number: phoneNumber,
            user: userId,
            comments: callNotes || '',
            processed: 'N',
            user_group: '',
            alt_dial: 'MAIN',
            called_count: 1
        };
        
        // Construire les parties de la requête en fonction des colonnes disponibles
        Object.entries(fieldMap).forEach(([column, value]) => {
            if (columnNames.includes(column)) {
                insertColumns.push(column);
                
                // Gérer les fonctions SQL spéciales
                if (value === 'NOW()' || value === 'UNIX_TIMESTAMP()') {
                    insertValues.push(value);
                } else {
                    insertValues.push('?');
                    queryParams.push(value);
                }
            }
        });
        
        // Construire la requête SQL complète
        const insertQuery = `
            INSERT INTO vicidial_log 
            (${insertColumns.join(', ')}) 
            VALUES (${insertValues.join(', ')})
        `;
        
        console.log(`Requête d'insertion: ${insertQuery}`);
        console.log(`Paramètres: ${JSON.stringify(queryParams)}`);
        
        // Exécuter la requête d'insertion
        const [result] = await db.query(insertQuery, queryParams);
        
        console.log(`Résultat de l'insertion: ${JSON.stringify(result)}`);
        
        res.json({
            success: true,
            message: 'Appel enregistré avec succès',
            callId: uniqueId,
            insertId: result.insertId
        });
        
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement de l\'appel:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Route pour récupérer l'historique des appels d'un agent
router.get('/call-history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const dateStart = req.query.dateStart || '';
        const dateEnd = req.query.dateEnd || '';
        
        console.log(`Début de récupération des logs d'appels pour l'agent: ${userId}`);
        
        // Vérifier si la table vicidial_log existe
        try {
            const [tableCheck] = await db.query(`
                SHOW TABLES LIKE 'vicidial_log'
            `);
            
            if (tableCheck.length === 0) {
                console.error('La table vicidial_log n\'existe pas');
                return res.status(500).json({
                    success: false,
                    message: 'Table de logs non disponible',
                    error: 'Table vicidial_log non trouvée'
                });
            }
            
            // Vérifier la structure de la table
            const [columns] = await db.query(`
                SHOW COLUMNS FROM vicidial_log
            `);
            
            console.log(`Structure de la table vicidial_log: ${columns.length} colonnes trouvées`);
            
            // Vérifier les colonnes essentielles
            const requiredColumns = ['uniqueid', 'user', 'call_date', 'phone_number'];
            const missingColumns = [];
            
            requiredColumns.forEach(col => {
                if (!columns.some(c => c.Field === col)) {
                    missingColumns.push(col);
                }
            });
            
            if (missingColumns.length > 0) {
                console.error(`Colonnes manquantes dans vicidial_log: ${missingColumns.join(', ')}`);
                return res.status(500).json({
                    success: false,
                    message: 'Structure de table incompatible',
                    error: `Colonnes manquantes: ${missingColumns.join(', ')}`
                });
            }
        } catch (err) {
            console.error('Erreur lors de la vérification de la table:', err);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification de la table',
                error: err.message
            });
        }
        
        // Construire la condition de date
        let dateCondition = '';
        let dateParams = [];
        
        if (dateStart && dateEnd) {
            dateCondition = 'AND call_date BETWEEN ? AND ?';
            dateParams = [dateStart, dateEnd];
        } else if (dateStart) {
            dateCondition = 'AND call_date >= ?';
            dateParams = [dateStart];
        } else if (dateEnd) {
            dateCondition = 'AND call_date <= ?';
            dateParams = [dateEnd];
        }
        
        const query = `
            SELECT 
                uniqueid as call_id,
                lead_id,
                list_id,
                campaign_id,
                call_date,
                length_in_sec as duration,
                status,
                phone_number,
                user,
                comments as notes,
                called_count
            FROM 
                vicidial_log 
            WHERE 
                user = ? 
                ${dateCondition}
            ORDER BY 
                call_date DESC
            LIMIT ? OFFSET ?
        `;
        
        console.log(`Exécution de la requête: ${query}`);
        console.log(`Paramètres: userId=${userId}, limit=${limit}, offset=${offset}`);
        
        // Récupérer les appels
        const [calls] = await db.query(query, [userId, ...dateParams, limit, offset]);
        
        console.log(`${calls.length} logs d'appels récupérés`);
        
        // Récupérer le nombre total d'appels pour la pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM vicidial_log 
            WHERE user = ? ${dateCondition}
        `;
        
        const [countResult] = await db.query(countQuery, [userId, ...dateParams]);
        
        const total = countResult[0].total || 0;
        console.log(`Total des logs d'appels: ${total}`);
        
        // Si aucun résultat, vérifier s'il y a des logs pour d'autres utilisateurs
        if (calls.length === 0) {
            const [anyLogs] = await db.query(`
                SELECT COUNT(*) as count FROM vicidial_log LIMIT 1
            `);
            
            console.log(`Nombre total de logs dans la table: ${anyLogs[0].count}`);
        }
        
        res.json({
            success: true,
            total: total,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(total / limit),
            limit: limit,
            calls: calls.map(call => ({
                ...call,
                call_date: call.call_date,
                duration_formatted: formatDuration(call.duration)
            }))
        });
        
    } catch (err) {
        console.error('Erreur lors de la récupération de l\'historique des appels:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Fonction utilitaire pour formater la durée
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Route pour initier un appel manuel
router.post('/manual-call', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user;
        const { phoneNumber, contactName, leadId } = req.body;
        
        // Vérifier que le numéro est valide
        if (!phoneNumber) {
            return res.status(400).json({ success: false, message: 'Numéro de téléphone requis' });
        }
        
        // Récupérer l'extension de l'agent
        const [agentInfo] = await db.query(`
            SELECT extension, conf_exten, campaign_id 
            FROM vicidial_live_agents 
            WHERE user = ?
        `, [userId]);
        
        if (agentInfo.length === 0) {
            return res.status(404).json({ success: false, message: 'Agent non trouvé' });
        }
        
        const agentExtension = agentInfo[0].extension;
        const campaignId = req.body.campaignId || agentInfo[0].campaign_id || 'DEFAULT';
        
        // Générer un ID d'appel unique
        const callId = Date.now().toString();
        
        // Enregistrer l'appel dans l'historique
        // Utiliser une valeur par défaut de 0 pour lead_id au lieu de NULL
        await db.query(`
            INSERT INTO vicidial_log 
            (uniqueid, lead_id, list_id, campaign_id, call_date, start_epoch, user, phone_number, status, phone_code, alt_dial, comments) 
            VALUES (?, ?, ?, ?, NOW(), UNIX_TIMESTAMP(), ?, ?, 'INCALL', '', '', ?)
        `, [callId, leadId || 0, 0, campaignId, userId, phoneNumber, contactName || 'Appel manuel']);
        
        // Initier l'appel via Asterisk
        try {
            await asteriskService.initiateCall(agentExtension, phoneNumber, userId, leadId || '');
            console.log(`Appel initié via Asterisk pour l'agent ${userId} vers ${phoneNumber}`);
        } catch (asteriskError) {
            console.error('Erreur lors de l\'initiation de l\'appel via Asterisk:', asteriskError);
            // Continuer même en cas d'erreur avec Asterisk (mode simulation)
            console.log('Utilisation du mode simulation pour l\'appel');
        }
        
        // Envoyer la réponse
        res.json({
            success: true,
            callId: callId,
            leadId: leadId || 0,
            message: 'Appel manuel initié avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de l\'initiation de l\'appel manuel:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'initiation de l\'appel' });
    }
});

// Route pour sauvegarder les données d'un prospect
router.post('/save-prospect', authenticateToken, async (req, res) => {
  try {
    const prospectData = req.body;
    
    // Vérifier si le prospect existe
    const checkQuery = 'SELECT lead_id FROM vicidial_list WHERE lead_id = ?';
    const [existingProspect] = await db.query(checkQuery, [prospectData.lead_id]);
    
    let result;
    
    if (existingProspect.length > 0) {
      // Mettre à jour le prospect existant
      const updateFields = [];
      const updateValues = [];
      
      // Construire la requête dynamiquement en fonction des champs fournis
      Object.entries(prospectData).forEach(([key, value]) => {
        if (key !== 'lead_id' && value !== undefined) { // Ignorer lead_id et les valeurs undefined
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      });
      
      // Ajouter lead_id à la fin pour la clause WHERE
      updateValues.push(prospectData.lead_id);
      
      const updateQuery = `UPDATE vicidial_list SET ${updateFields.join(', ')} WHERE lead_id = ?`;
      result = await db.query(updateQuery, updateValues);
      
      console.log(`Prospect mis à jour: ${prospectData.lead_id}`);
    } else {
      // Créer un nouveau prospect
      const fields = Object.keys(prospectData).filter(key => prospectData[key] !== undefined);
      const placeholders = fields.map(() => '?').join(', ');
      const values = fields.map(field => prospectData[field]);
      
      const insertQuery = `INSERT INTO vicidial_list (${fields.join(', ')}) VALUES (${placeholders})`;
      result = await db.query(insertQuery, values);
      
      // Si lead_id n'était pas fourni, récupérer l'ID généré
      if (!prospectData.lead_id) {
        prospectData.lead_id = result.insertId;
      }
      
      console.log(`Nouveau prospect créé: ${prospectData.lead_id}`);
    }
    
    // Récupérer les données complètes du prospect après la mise à jour
    const [updatedProspect] = await db.query(
      'SELECT * FROM vicidial_list WHERE lead_id = ?', 
      [prospectData.lead_id]
    );
    
    res.json({
      success: true,
      message: 'Données du prospect sauvegardées avec succès',
      prospect: updatedProspect[0] || prospectData
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données du prospect:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde des données du prospect',
      error: error.message
    });
  }
});

// Route pour récupérer les données d'un prospect
router.get('/prospect-data', authenticateToken, async (req, res) => {
    try {
        const { phone, lead_id } = req.query;
        
        if (!phone && !lead_id) {
            return res.status(400).json({ 
                message: 'Numéro de téléphone ou ID de lead requis' 
            });
        }
        
        let query = `
            SELECT * 
            FROM vicidial_list 
            WHERE 1=1
        `;
        
        const params = [];
        
        if (phone) {
            query += ` AND phone_number = ?`;
            params.push(phone);
        }
        
        if (lead_id) {
            query += ` AND lead_id = ?`;
            params.push(lead_id);
        }
        
        query += ` LIMIT 1`;
        
        const [prospects] = await db.query(query, params);
        
        if (prospects.length === 0) {
            // Si aucun prospect n'est trouvé, renvoyer un objet vide
            return res.json({ 
                prospect: null,
                message: 'Aucun prospect trouvé avec ces critères'
            });
        }
        
        // Formater les dates pour l'affichage côté client
        const prospect = {
            ...prospects[0],
            entry_date: prospects[0].entry_date ? new Date(prospects[0].entry_date).toISOString().slice(0, 16) : null,
            date_of_birth: prospects[0].date_of_birth ? new Date(prospects[0].date_of_birth).toISOString().slice(0, 10) : null,
            last_local_call_time: prospects[0].last_local_call_time ? new Date(prospects[0].last_local_call_time).toISOString().slice(0, 16) : null
        };
        
        res.json({ prospect });
        
    } catch (err) {
        console.error('Erreur lors de la récupération des données du prospect:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Route pour démarrer le composeur prédictif
router.post('/start-predictive', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user;
        const { campaignId, level } = req.body;
        
        // Vérifier que l'ID de campagne est fourni
        if (!campaignId) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de campagne requis' 
            });
        }
        
        // Vérifier que l'agent est autorisé à démarrer le composeur pour cette campagne
        const [agentInfo] = await db.query(`
            SELECT campaign_id 
            FROM vicidial_live_agents 
            WHERE user = ?
        `, [userId]);
        
        if (agentInfo.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Agent non trouvé' 
            });
        }
        
        // Démarrer le composeur prédictif via Asterisk
        try {
            const result = await asteriskService.startPredictiveDialer(campaignId, level || 'AUTO');
            console.log(`Composeur prédictif démarré pour la campagne ${campaignId} par l'agent ${userId}`);
            
            res.json({
                success: true,
                message: 'Composeur prédictif démarré avec succès',
                campaignId,
                level: level || 'AUTO'
            });
        } catch (asteriskError) {
            console.error('Erreur lors du démarrage du composeur prédictif via Asterisk:', asteriskError);
            res.status(500).json({ 
                success: false,
                message: 'Erreur lors du démarrage du composeur prédictif',
                error: asteriskError.message 
            });
        }
    } catch (error) {
        console.error('Erreur lors du démarrage du composeur prédictif:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
});

// Route pour arrêter le composeur prédictif
router.post('/stop-predictive', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user;
        const { campaignId } = req.body;
        
        // Vérifier que l'ID de campagne est fourni
        if (!campaignId) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de campagne requis' 
            });
        }
        
        // Vérifier que l'agent est autorisé à arrêter le composeur pour cette campagne
        const [agentInfo] = await db.query(`
            SELECT campaign_id 
            FROM vicidial_live_agents 
            WHERE user = ?
        `, [userId]);
        
        if (agentInfo.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Agent non trouvé' 
            });
        }
        
        // Arrêter le composeur prédictif via Asterisk
        try {
            const result = await asteriskService.stopPredictiveDialer(campaignId);
            console.log(`Composeur prédictif arrêté pour la campagne ${campaignId} par l'agent ${userId}`);
            
            res.json({
                success: true,
                message: 'Composeur prédictif arrêté avec succès',
                campaignId
            });
        } catch (asteriskError) {
            console.error('Erreur lors de l\'arrêt du composeur prédictif via Asterisk:', asteriskError);
            res.status(500).json({ 
                success: false,
                message: 'Erreur lors de l\'arrêt du composeur prédictif',
                error: asteriskError.message 
            });
        }
    } catch (error) {
        console.error('Erreur lors de l\'arrêt du composeur prédictif:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
});

// Route pour récupérer le prochain numéro à appeler en mode prédictif
router.get('/next-predictive-call', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user;
        const { campaignId } = req.query;
        
        // Vérifier que l'ID de campagne est fourni
        if (!campaignId) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de campagne requis' 
            });
        }
        
        // Récupérer le prochain numéro à appeler pour cette campagne
        const [nextNumbers] = await db.query(`
            SELECT lead_id, phone_number, first_name, last_name, status 
            FROM vicidial_list 
            WHERE list_id IN (SELECT list_id FROM vicidial_lists WHERE campaign_id = ?)
            AND status IN ('NEW', 'CALLBACK')
            ORDER BY priority DESC, last_local_call_time ASC
            LIMIT 1
        `, [campaignId]);
        
        if (nextNumbers.length === 0) {
            return res.json({ 
                success: false,
                message: 'Aucun numéro disponible pour cette campagne',
                hasMore: false
            });
        }
        
        const nextNumber = nextNumbers[0];
        
        // Vérifier s'il reste d'autres numéros à appeler
        const [countResult] = await db.query(`
            SELECT COUNT(*) as remaining 
            FROM vicidial_list 
            WHERE list_id IN (SELECT list_id FROM vicidial_lists WHERE campaign_id = ?)
            AND status IN ('NEW', 'CALLBACK')
        `, [campaignId]);
        
        const hasMore = countResult[0].remaining > 1;
        
        res.json({
            success: true,
            nextNumber,
            hasMore
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du prochain numéro à appeler:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
});

module.exports = router;
