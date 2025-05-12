const express = require('express');
const router = express.Router();
const db = require('../../config/bd'); // Utiliser la connexion existante
const dotenv = require('dotenv');
const { authenticateToken } = require('../../middleware/auth');

// Charger les variables d'environnement
dotenv.config();

// Route pour récupérer les informations de l'agent
router.get('/info', async (req, res) => {
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
            status: 'READY' // Statut par défaut
        };

        // Vérifier le statut actuel de l'agent dans la base de données
        const query = `
            SELECT status 
            FROM vicidial_live_agents 
            WHERE user = ? 
            AND campaign_id = ? 
            LIMIT 1
        `;

        const [results] = await db.query(query, [req.user.user, req.user.campaign_id]);
        
        if (results.length > 0) {
            agentInfo.status = results[0].status;
        }

        res.json(agentInfo);
    } catch (err) {
        console.error('Erreur lors de la récupération du statut de l\'agent:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour mettre à jour le statut de l'agent
router.post('/status', async (req, res) => {
    try {
        console.log('Reçu une requête de mise à jour de statut:', req.body);
        const { status, pauseCode } = req.body;
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Validation des données
        if (!status) {
            console.error('Statut manquant dans la requête');
            return res.status(400).json({ message: 'Statut requis' });
        }
        
        // Vérifier si le statut est valide
        const validStatuses = ['READY', 'PAUSED', 'DIALING', 'INCALL', 'WAITING', 'OFFLINE'];
        if (!validStatuses.includes(status)) {
            console.error('Statut invalide:', status);
            return res.status(400).json({ message: 'Statut invalide' });
        }

        console.log(`Mise à jour du statut pour l'agent ${userId} (campagne ${campaignId}): ${status}`);
        if (pauseCode) {
            console.log(`Code de pause: ${pauseCode}`);
        }

        // Vérifier si l'agent existe dans vicidial_live_agents
        const checkQuery = `
            SELECT user 
            FROM vicidial_live_agents 
            WHERE user = ? 
            AND campaign_id = ? 
            LIMIT 1
        `;

        const [results] = await db.query(checkQuery, [userId, campaignId]);
        console.log('Résultat de la vérification:', results.length > 0 ? 'Agent trouvé' : 'Agent non trouvé');

        if (results.length === 0) {
            // L'agent n'est pas dans la table, l'ajouter
            const insertQuery = `
                INSERT INTO vicidial_live_agents 
                (user, campaign_id, status, last_update_time, random_id) 
                VALUES (?, ?, ?, NOW(), FLOOR(RAND() * 1000000))
            `;

            const [insertResult] = await db.query(insertQuery, [userId, campaignId, status]);
            console.log('Agent ajouté à vicidial_live_agents, ID:', insertResult.insertId);

            // Si l'agent est en pause, enregistrer le code de pause
            if (status === 'PAUSED' && pauseCode) {
                await recordPauseCode(userId, pauseCode, campaignId);
                console.log('Code de pause enregistré pour le nouvel agent');
            }

            res.json({ 
                message: 'Statut mis à jour (nouvel agent)', 
                status,
                agent_id: userId,
                campaign_id: campaignId
            });
        } else {
            // L'agent existe, mettre à jour son statut
            const updateQuery = `
                UPDATE vicidial_live_agents 
                SET status = ?, last_update_time = NOW() 
                WHERE user = ? 
                AND campaign_id = ?
            `;

            const [updateResult] = await db.query(updateQuery, [status, userId, campaignId]);
            console.log('Statut de l\'agent mis à jour, lignes affectées:', updateResult.affectedRows);

            // Si l'agent est en pause, enregistrer le code de pause
            if (status === 'PAUSED' && pauseCode) {
                await recordPauseCode(userId, pauseCode, campaignId);
                console.log('Code de pause enregistré');
            }

            res.json({ 
                message: 'Statut mis à jour', 
                status,
                agent_id: userId,
                campaign_id: campaignId,
                updated: updateResult.affectedRows > 0
            });
        }
    } catch (err) {
        console.error('Erreur lors de la mise à jour du statut:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Fonction pour enregistrer le code de pause
async function recordPauseCode(userId, pauseCode, campaignId) {
    try {
        const query = `
            INSERT INTO vicidial_pause_data 
            (user, campaign_id, pause_code, entry_date) 
            VALUES (?, ?, ?, NOW())
        `;

        await db.query(query, [userId, campaignId, pauseCode]);
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement du code de pause:', err);
    }
}

// Route pour récupérer les codes de pause
router.get('/pause-codes', async (req, res) => {
    try {
        const campaignId = req.user.campaign_id;
        const query = `
            SELECT pause_code, pause_description 
            FROM vicidial_campaigns 
            WHERE campaign_id = ?
        `;

        const [results] = await db.query(query, [campaignId]);
        
        if (results.length > 0) {
            const pauseCodes = results[0].pause_code.split(',');
            const pauseDescriptions = results[0].pause_description.split(',');
            
            const pauseOptions = pauseCodes.map((code, index) => ({
                code: code.trim(),
                description: pauseDescriptions[index]?.trim() || `Pause ${index + 1}`
            }));

            res.json({ pauseOptions });
        } else {
            res.status(404).json({ message: 'Campagne non trouvée' });
        }
    } catch (err) {
        console.error('Erreur lors de la récupération des codes de pause:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour vérifier les appels entrants et sortants
router.get('/check-calls', async (req, res) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;

        // Vérifier les appels entrants
        const incomingQuery = `
            SELECT uniqueid, lead_id, phone_number, status, call_date as start_time, end_epoch as end_time
            FROM vicidial_log
            WHERE user = ?
            AND campaign_id = ?
            AND status IN ('RINGING', 'CONNECTED')
            ORDER BY call_date DESC
            LIMIT 1
        `;

        const [incomingCalls] = await db.query(incomingQuery, [userId, campaignId]);

        // Vérifier les appels sortants
        const outgoingQuery = `
            SELECT uniqueid, lead_id, phone_number, status, call_date as start_time, end_epoch as end_time
            FROM vicidial_log
            WHERE user = ?
            AND campaign_id = ?
            AND status IN ('DIALING', 'CONNECTED')
            ORDER BY call_date DESC
            LIMIT 1
        `;

        const [outgoingCalls] = await db.query(outgoingQuery, [userId, campaignId]);

        res.json({
            incomingCalls: incomingCalls[0] || null,
            outgoingCalls: outgoingCalls[0] || null
        });
    } catch (err) {
        console.error('Erreur lors de la vérification des appels:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour initier un appel manuel
router.post('/manual-call', async (req, res) => {
    try {
        const { phoneNumber, leadId, contactName, agentId } = req.body;
        const userId = req.user.user;
        const campaignId = req.user.campaign_id || req.body.campaignId;
        const extension = req.user.extension;

        // Vérifier si le numéro de téléphone est fourni
        if (!phoneNumber && !leadId) {
            return res.status(400).json({
                message: 'Numéro de téléphone ou ID de prospect manquant'
            });
        }

        // Si leadId est fourni mais pas de numéro, récupérer le numéro depuis vicidial_list
        if (leadId && !phoneNumber) {
            const query = `
                SELECT phone_number 
                FROM vicidial_list 
                WHERE lead_id = ? 
                LIMIT 1
            `;

            const [results] = await db.query(query, [leadId]);
            
            if (results.length > 0) {
                req.body.phoneNumber = results[0].phone_number;
            } else {
                return res.status(404).json({
                    message: 'Prospect non trouvé'
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
        `;

        const [results] = await db.query(checkCallQuery, [userId, campaignId]);
        
        if (results.length > 0 && results[0].status === 'INCALL') {
            return res.status(400).json({
                message: 'L\'agent est déjà en appel'
            });
        }

        // Mettre à jour le statut de l'agent
        const updateStatusQuery = `
            INSERT INTO vicidial_live_agents 
            (user, campaign_id, status, last_update_time, random_id) 
            VALUES (?, ?, 'INCALL', NOW(), FLOOR(RAND() * 1000000))
            ON DUPLICATE KEY UPDATE 
            status = 'INCALL', 
            last_update_time = NOW()
        `;

        await db.query(updateStatusQuery, [userId, campaignId]);

        // Mettre à jour le statut de l'agent pour indiquer qu'il est en appel
        // Nous utilisons déjà updateStatusQuery pour cela, donc pas besoin d'une autre insertion

        // Insérer l'appel dans vicidial_log
        const insertLogQuery = `
            INSERT INTO vicidial_log 
            (uniqueid, user, campaign_id, phone_number, lead_id, status, call_date, end_epoch, length_in_sec) 
            VALUES (?, ?, ?, ?, ?, 'INCALL', NOW(), NULL, 0)
        `;

        const uniqueid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await db.query(insertLogQuery, [uniqueid, userId, campaignId, phoneNumber, leadId || null]);

        // Insérer l'appel dans vicidial_closer_log
        const insertCloserQuery = `
            INSERT INTO vicidial_closer_log 
            (uniqueid, user, campaign_id, phone_number, lead_id, status, call_date, end_epoch, length_in_sec) 
            VALUES (?, ?, ?, ?, ?, 'INCALL', NOW(), NULL, 0)
        `;

        await db.query(insertCloserQuery, [uniqueid, userId, campaignId, phoneNumber, leadId || null]);

        res.json({
            message: 'Appel initié avec succès',
            callId: uniqueid,
            phoneNumber,
            leadId
        });
    } catch (err) {
        console.error('Erreur lors de l\'initiation de l\'appel:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour mettre à jour le statut de l'agent
router.post('/status', async (req, res) => {
    try {
        const { status, pauseCode } = req.body;
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Vérifier que le statut est valide
        const validStatuses = ['READY', 'PAUSED', 'DIALING', 'INCALL', 'WAITING', 'OFFLINE'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }
        
        // Mettre à jour le statut de l'agent dans vicidial_live_agents
        const updateQuery = `
            INSERT INTO vicidial_live_agents 
            (user, campaign_id, status, last_update_time, random_id) 
            VALUES (?, ?, ?, NOW(), FLOOR(RAND() * 1000000))
            ON DUPLICATE KEY UPDATE 
            status = ?, 
            last_update_time = NOW()
        `;
        
        await db.query(updateQuery, [userId, campaignId, status, status]);
        
        // Si l'agent est en pause, enregistrer le code de pause
        if (status === 'PAUSED' && pauseCode) {
            const pauseLogQuery = `
                INSERT INTO vicidial_agent_log 
                (user, event_time, campaign_id, pause_code) 
                VALUES (?, NOW(), ?, ?)
            `;
            
            await db.query(pauseLogQuery, [userId, campaignId, pauseCode]);
        }
        
        res.json({ 
            message: 'Statut mis à jour avec succès',
            status
        });
    } catch (err) {
        console.error('Erreur lors de la mise à jour du statut:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour terminer un appel - endpoint original
router.post('/end-call', async (req, res) => {
    try {
        const { callId, agentId } = req.body;
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        if (!callId) {
            return res.status(400).json({ message: 'ID d\'appel manquant' });
        }
        
        // Mettre à jour le statut de l'appel dans vicidial_log
        const updateCallQuery = `
            UPDATE vicidial_log
            SET status = 'DONE', end_epoch = UNIX_TIMESTAMP()
            WHERE uniqueid = ? AND user = ?
        `;
        
        await db.query(updateCallQuery, [callId, userId]);
        
        // Mettre à jour le statut de l'agent
        const updateAgentQuery = `
            UPDATE vicidial_live_agents
            SET status = 'READY', last_update_time = NOW()
            WHERE user = ? AND campaign_id = ?
        `;
        
        await db.query(updateAgentQuery, [userId, campaignId]);
        
        // Mettre également à jour vicidial_closer_log si l'enregistrement existe
        const updateCloserLogQuery = `
            UPDATE vicidial_closer_log
            SET status = 'DONE', end_epoch = UNIX_TIMESTAMP(), length_in_sec = UNIX_TIMESTAMP() - UNIX_TIMESTAMP(call_date)
            WHERE uniqueid = ? AND user = ?
        `;
        
        await db.query(updateCloserLogQuery, [callId, userId]);
        
        res.json({ 
            message: 'Appel terminé avec succès',
            callId
        });
    } catch (err) {
        console.error('Erreur lors de la fin de l\'appel:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour terminer un appel - nouvel endpoint avec préfixe 'calls' pour correspondre au frontend
router.post('/calls/end-call', async (req, res) => {
    try {
        const { callId, agentId } = req.body;
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        console.log('Ending call with ID:', callId, 'for user:', userId);
        
        if (!callId) {
            return res.status(400).json({ message: 'ID d\'appel manquant' });
        }
        
        // Mettre à jour le statut de l'appel dans vicidial_log
        const updateCallQuery = `
            UPDATE vicidial_log
            SET status = 'DONE', end_epoch = UNIX_TIMESTAMP()
            WHERE uniqueid = ? AND user = ?
        `;
        
        const [callResult] = await db.query(updateCallQuery, [callId, userId]);
        console.log('Updated vicidial_log rows:', callResult.affectedRows);
        
        // Mettre à jour le statut de l'agent
        const updateAgentQuery = `
            UPDATE vicidial_live_agents
            SET status = 'READY', last_update_time = NOW()
            WHERE user = ? AND campaign_id = ?
        `;
        
        const [agentResult] = await db.query(updateAgentQuery, [userId, campaignId]);
        console.log('Updated vicidial_live_agents rows:', agentResult.affectedRows);
        
        // Mettre également à jour vicidial_closer_log si l'enregistrement existe
        const updateCloserLogQuery = `
            UPDATE vicidial_closer_log
            SET status = 'DONE', end_epoch = UNIX_TIMESTAMP(), length_in_sec = UNIX_TIMESTAMP() - UNIX_TIMESTAMP(call_date)
            WHERE uniqueid = ? AND user = ?
        `;
        
        const [closerResult] = await db.query(updateCloserLogQuery, [callId, userId]);
        console.log('Updated vicidial_closer_log rows:', closerResult.affectedRows);
        
        res.json({ 
            message: 'Appel terminé avec succès',
            callId
        });
    } catch (err) {
        console.error('Erreur lors de la fin de l\'appel:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour les actions d'appel (mute, hold, record)
router.post('/call-action', async (req, res) => {
    try {
        const { action, callId } = req.body;
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Validation des données
        if (!action || !callId) {
            return res.status(400).json({ message: 'Action et ID d\'appel requis' });
        }
        
        // Vérifier si l'action est valide
        const validActions = ['mute', 'unmute', 'hold', 'unhold', 'record', 'stop_record'];
        if (!validActions.includes(action)) {
            return res.status(400).json({ message: 'Action invalide' });
        }
        
        // Vérifier si l'appel existe et appartient à l'agent
        const checkCallQuery = `
            SELECT uniqueid 
            FROM vicidial_log 
            WHERE uniqueid = ? AND user = ? 
            UNION 
            SELECT uniqueid 
            FROM vicidial_closer_log 
            WHERE uniqueid = ? AND user = ? 
            LIMIT 1
        `;
        
        const [callResults] = await db.query(checkCallQuery, [callId, userId, callId, userId]);
        
        if (callResults.length === 0) {
            return res.status(404).json({ message: 'Appel non trouvé ou non autorisé' });
        }
        
        // Enregistrer l'action dans la base de données
        const insertActionQuery = `
            INSERT INTO vicidial_agent_call_actions 
            (uniqueid, user, campaign_id, action, action_date) 
            VALUES (?, ?, ?, ?, NOW())
        `;
        
        // Créer la table si elle n'existe pas
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS vicidial_agent_call_actions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                uniqueid VARCHAR(50) NOT NULL,
                user VARCHAR(20) NOT NULL,
                campaign_id VARCHAR(20) NOT NULL,
                action VARCHAR(20) NOT NULL,
                action_date DATETIME NOT NULL,
                INDEX (uniqueid),
                INDEX (user)
            )
        `;
        
        await db.query(createTableQuery);
        await db.query(insertActionQuery, [callId, userId, campaignId, action]);
        
        res.json({ 
            message: 'Action appliquée avec succès',
            action,
            callId
        });
    } catch (err) {
        console.error('Erreur lors de l\'application de l\'action:', err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;
