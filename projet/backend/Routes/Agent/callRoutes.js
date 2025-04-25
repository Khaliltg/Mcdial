const express = require('express');
const router = express.Router();
const db = require('../../config/bd'); // Utiliser la connexion existante
const dotenv = require('dotenv');
const { authenticateToken } = require('../../middleware/auth');

// Charger les variables d'environnement
dotenv.config();

// Middleware pour toutes les routes d'appels
router.use(authenticateToken);

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
        const { status, pauseCode } = req.body;
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;

        // Vérifier si l'agent existe dans vicidial_live_agents
        const checkQuery = `
            SELECT user_id 
            FROM vicidial_live_agents 
            WHERE user = ? 
            AND campaign_id = ? 
            LIMIT 1
        `;

        const [results] = await db.query(checkQuery, [userId, campaignId]);

        if (results.length === 0) {
            // L'agent n'est pas dans la table, l'ajouter
            const insertQuery = `
                INSERT INTO vicidial_live_agents 
                (user, campaign_id, status, last_update_time, random_id) 
                VALUES (?, ?, ?, NOW(), FLOOR(RAND() * 1000000))
            `;

            await db.query(insertQuery, [userId, campaignId, status]);

            // Si l'agent est en pause, enregistrer le code de pause
            if (status === 'PAUSED' && pauseCode) {
                await recordPauseCode(userId, pauseCode, campaignId);
            }

            res.json({ message: 'Statut mis à jour', status });
        } else {
            // L'agent existe, mettre à jour son statut
            const updateQuery = `
                UPDATE vicidial_live_agents 
                SET status = ?, last_update_time = NOW() 
                WHERE user = ? 
                AND campaign_id = ?
            `;

            await db.query(updateQuery, [status, userId, campaignId]);

            // Si l'agent est en pause, enregistrer le code de pause
            if (status === 'PAUSED' && pauseCode) {
                await recordPauseCode(userId, pauseCode, campaignId);
            }

            res.json({ message: 'Statut mis à jour', status });
        }
    } catch (err) {
        console.error('Erreur lors de la mise à jour du statut de l\'agent:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Fonction pour enregistrer le code de pause
async function recordPauseCode(userId, pauseCode, campaignId) {
    try {
        const pauseQuery = `
            INSERT INTO vicidial_agent_log 
            (user, event_time, campaign_id, pause_code, pause_type) 
            VALUES (?, NOW(), ?, ?, 'AGENT')
        `;

        await db.query(pauseQuery, [userId, campaignId, pauseCode]);
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement du code de pause:', err);
    }
}

// Route pour récupérer les codes de pause
router.get('/pause-codes', async (req, res) => {
    try {
        const campaignId = req.user.campaign_id;

        // Récupérer les codes de pause pour la campagne
        const query = `
            SELECT pause_code, pause_code_name 
            FROM vicidial_pause_codes 
            WHERE campaign_id IN ('', ?) 
            ORDER BY pause_code_name
        `;

        const [results] = await db.query(query, [campaignId]);

        const pauseCodes = results.map(code => ({
            value: code.pause_code,
            label: code.pause_code_name
        }));

        res.json({ pauseCodes });
    } catch (err) {
        console.error('Erreur lors de la récupération des codes de pause:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Fonction pour gérer la composition d'un numéro
async function handleDial(req, res) {
    try {
        const { phoneNumber, mode, contactId, extension, campaign } = req.body;
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;

        // Générer un ID d'appel unique
        const callId = `${userId}-${Date.now()}`;
        
        // Déterminer l'ID du contact
        let leadId = contactId || 0;
        
        // Si aucun contact n'est spécifié, vérifier si le numéro existe déjà
        if (!leadId && phoneNumber) {
            const [existingContact] = await db.query(`
                SELECT lead_id 
                FROM vicidial_list 
                WHERE phone_number = ? 
                LIMIT 1
            `, [phoneNumber]);
            
            if (existingContact.length > 0) {
                leadId = existingContact[0].lead_id;
            } else {
                // Créer un nouveau contact
                const [newContact] = await db.query(`
                    INSERT INTO vicidial_list 
                    (phone_number, status, list_id, called_since_last_reset, entry_date) 
                    VALUES (?, 'NEW', 999, 'N', NOW())
                `, [phoneNumber]);
                
                leadId = newContact.insertId;
            }
        }
        
        // Enregistrer l'appel dans le journal (si la table existe)
        try {
            const logQuery = `
                INSERT INTO vicidial_call_log 
                (uniqueid, lead_id, call_date, user, phone_number, campaign_id, extension) 
                VALUES (?, ?, NOW(), ?, ?, ?, ?)
            `;
            
            await db.query(logQuery, [callId, leadId, userId, phoneNumber, campaignId, extension]);
        } catch (dbErr) {
            // Si la table n'existe pas, on continue sans erreur
            console.log('Note: Table vicidial_call_log non disponible, simulation d\'appel uniquement');
            // On pourrait créer la table ici si nécessaire
        }

        // Répondre avec l'ID d'appel
        res.json({ 
            message: 'Appel initié', 
            callId: callId,
            status: 'INCALL'
        });
    } catch (err) {
        console.error('Erreur lors de l\'initiation de l\'appel:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

// Route pour composer un numéro manuellement
router.post('/dial', async (req, res) => {
    // Utiliser la fonction handleDial pour gérer la composition
    handleDial(req, res);
});

// Route pour composer un numéro manuellement (nouvelle route pour le frontend agent)
router.post('/call/dial-manual', async (req, res) => {
    // Utiliser la même fonction pour gérer la composition
    handleDial(req, res);
});

// Route pour rechercher un contact par numéro de téléphone
router.get('/lookup-contact', async (req, res) => {
    try {
        const { phone } = req.query;

        if (!phone) {
            return res.status(400).json({ message: 'Numéro de téléphone requis' });
        }

        // Rechercher le contact dans la base de données
        const query = `
            SELECT lead_id as id, first_name, last_name, phone_number, alt_phone, address1, address2, 
                   city, state, postal_code, email, vendor_lead_code as company
            FROM vicidial_list 
            WHERE phone_number = ? OR alt_phone = ? 
            LIMIT 1
        `;

        const [results] = await db.query(query, [phone, phone]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Contact non trouvé' });
        }

        res.json({ contact: results[0] });
    } catch (err) {
        console.error('Erreur lors de la recherche du contact:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Fonction pour gérer le raccrochage d'un appel
async function handleHangup(req, res) {
    try {
        const { callId } = req.body;
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;

        // Mettre à jour le statut de l'appel dans la base de données
        try {
            const updateCallQuery = `
                UPDATE vicidial_auto_calls 
                SET status = 'HUNGUP' 
                WHERE callerid = ?
            `;

            await db.query(updateCallQuery, [callId]);
        } catch (dbErr) {
            console.log('Note: Impossible de mettre à jour vicidial_auto_calls, simulation uniquement');
        }

        // Mettre à jour le statut de l'agent
        try {
            const updateAgentQuery = `
                UPDATE vicidial_live_agents 
                SET status = 'PAUSED', last_update_time = NOW(), lead_id = 0 
                WHERE user = ? 
                AND campaign_id = ?
            `;

            await db.query(updateAgentQuery, [userId, campaignId]);
        } catch (dbErr) {
            console.log('Note: Impossible de mettre à jour vicidial_live_agents, simulation uniquement');
        }

        // Répondre avec le nouveau statut
        res.json({ 
            message: 'Appel terminé', 
            status: 'PAUSED'
        });
    } catch (err) {
        console.error('Erreur lors du raccrochage de l\'appel:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

// Route pour raccrocher un appel
router.post('/hangup', async (req, res) => {
    handleHangup(req, res);
});

// Route pour raccrocher un appel (nouvelle route pour le frontend agent)
router.post('/call/hangup', async (req, res) => {
    handleHangup(req, res);
});

// Route pour mettre à jour le statut d'un appel (attente, muet, etc.)
router.post('/call-status', async (req, res) => {
    try {
        const { callId, status } = req.body;
        const userId = req.user.user;

        // Mettre à jour le statut de l'appel dans la base de données
        const updateCallQuery = `
            UPDATE vicidial_auto_calls 
            SET status = ? 
            WHERE uniqueid = ? 
            OR (user = ? AND status IN ('SENT', 'ACTIVE', 'HOLD', 'MUTED'))
        `;

        let callStatus = 'ACTIVE';
        if (status === 'hold') callStatus = 'HOLD';
        if (status === 'muted') callStatus = 'MUTED';

        await db.query(updateCallQuery, [callStatus, callId, userId]);

        res.json({ 
            message: 'Statut de l\'appel mis à jour', 
            status: callStatus
        });
    } catch (err) {
        console.error('Erreur lors de la mise à jour du statut de l\'appel:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour envoyer des tonalités DTMF
router.post('/send-dtmf', async (req, res) => {
    try {
        const { callId, digit } = req.body;
        const userId = req.user.user;

        // Dans un système réel, cela enverrait des commandes à Asterisk
        // Pour cette démonstration, nous allons simplement enregistrer l'action

        const logQuery = `
            INSERT INTO vicidial_dtmf_log 
            (uniqueid, user, dtmf_digit, dtmf_time) 
            VALUES (?, ?, ?, NOW())
        `;

        await db.query(logQuery, [callId, userId, digit]);

        res.json({ 
            message: 'DTMF envoyé', 
            digit: digit
        });
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement DTMF:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour transférer un appel
router.post('/transfer', async (req, res) => {
    try {
        const { callId, transferType, destination } = req.body;
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;

        // Dans un système réel, cela enverrait des commandes à Asterisk
        // Pour cette démonstration, nous allons simplement enregistrer l'action

        const logQuery = `
            INSERT INTO vicidial_transfer_log 
            (uniqueid, user, campaign_id, transfer_time, transfer_type, destination) 
            VALUES (?, ?, ?, NOW(), ?, ?)
        `;

        await db.query(logQuery, [callId, userId, campaignId, transferType, destination]);

        // Si c'est un transfert aveugle, mettre à jour le statut de l'agent
        if (transferType === 'blind') {
            const updateAgentQuery = `
                UPDATE vicidial_live_agents 
                SET status = 'PAUSED', last_update_time = NOW() 
                WHERE user = ? 
                AND campaign_id = ?
            `;

            await db.query(updateAgentQuery, [userId, campaignId]);
        }

        res.json({ 
            message: 'Transfert initié', 
            transferType: transferType,
            destination: destination
        });
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement du transfert:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour récupérer les codes de disposition
router.get('/disposition-codes', async (req, res) => {
    try {
        const { campaignId } = req.query;
        const userCampaignId = req.user.campaign_id;

        // Utiliser le campaignId fourni ou celui de l'utilisateur
        const campaign = campaignId || userCampaignId;

        // Récupérer les codes de disposition pour la campagne
        const query = `
            SELECT status, status_name 
            FROM vicidial_campaign_statuses 
            WHERE campaign_id IN ('', ?) 
            UNION 
            SELECT status, status_name 
            FROM vicidial_statuses 
            ORDER BY status_name
        `;

        const [results] = await db.query(query, [campaign]);

        const dispositionCodes = results.map(code => ({
            value: code.status,
            label: code.status_name
        }));

        res.json({ dispositionCodes });
    } catch (err) {
        console.error('Erreur lors de la récupération des codes de disposition:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour soumettre une disposition d'appel
router.post('/disposition', async (req, res) => {
    try {
        const { callId, disposition, notes, callback, campaignId } = req.body;
        const userId = req.user.user;
        const userCampaignId = req.user.campaign_id;

        // Utiliser le campaignId fourni ou celui de l'utilisateur
        const campaign = campaignId || userCampaignId;

        // Récupérer le lead_id associé à l'appel
        const getLeadQuery = `
            SELECT lead_id 
            FROM vicidial_call_log 
            WHERE uniqueid = ? 
            LIMIT 1
        `;

        const [results] = await db.query(getLeadQuery, [callId]);
        const leadId = results.length > 0 ? results[0].lead_id : 0;

        // Mettre à jour le statut du lead
        const updateLeadQuery = `
            UPDATE vicidial_list 
            SET status = ?, user = ?, last_local_call_time = NOW() 
            WHERE lead_id = ?
        `;

        await db.query(updateLeadQuery, [disposition, userId, leadId]);

        // Enregistrer les notes si fournies
        if (notes) {
            const notesQuery = `
                INSERT INTO vicidial_call_notes 
                (lead_id, call_date, user, vicidial_id, call_notes) 
                VALUES (?, NOW(), ?, ?, ?)
            `;

            await db.query(notesQuery, [leadId, userId, callId, notes]);
        }

        // Gérer le rappel si nécessaire
        if (callback) {
            const callbackQuery = `
                INSERT INTO vicidial_callbacks 
                (lead_id, campaign_id, user, callback_time, status, entry_time, comments, recipient) 
                VALUES (?, ?, ?, FROM_UNIXTIME(?), 'ACTIVE', NOW(), ?, ?)
            `;

            const recipient = callback.type === 'useronly' ? 'USERONLY' : 'ANYONE';

            await db.query(callbackQuery, [leadId, campaign, userId, callback.timestamp, notes || 'Rappel programmé', recipient]);
        }

        // Mettre à jour le statut de l'agent
        const updateAgentQuery = `
            UPDATE vicidial_live_agents 
            SET status = 'READY', last_update_time = NOW() 
            WHERE user = ? 
            AND campaign_id = ?
        `;

        await db.query(updateAgentQuery, [userId, campaign]);

        res.json({ 
            message: 'Disposition soumise avec succès', 
            disposition: disposition,
            status: 'READY'
        });
    } catch (err) {
        console.error('Erreur lors de la soumission de la disposition:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour récupérer l'historique des appels
router.get('/call-history', async (req, res) => {
    try {
        // Vérifier que l'utilisateur est authentifié et que les informations nécessaires sont présentes
        if (!req.user || !req.user.user) {
            return res.status(401).json({ message: 'Utilisateur non authentifié ou informations manquantes' });
        }
        
        const userId = req.user.user;
        const campaignId = req.user.campaign_id || '';
        
        console.log(`Récupération de l'historique des appels pour l'utilisateur: ${userId}, campagne: ${campaignId}`);
        
        // Requête combinée pour récupérer à la fois les appels sortants et entrants
        // Basée sur le code de vdc_db_query.php de Vicidial
        const query = `
            (SELECT 
                vlog.uniqueid as callId,
                vl.phone_number as phoneNumber,
                IFNULL(CONCAT(IFNULL(vl.first_name, ''), ' ', IFNULL(vl.last_name, '')), 'Inconnu') as customerName,
                'OUT' as callType,
                vlog.length_in_sec as duration,
                vlog.status as disposition,
                vlog.call_date as timestamp,
                vc.callback_time as callbackTime,
                vc.recipient as callbackType,
                vl.lead_id as lead_id,
                vl.list_id as list_id,
                vl.comments as comments
            FROM 
                vicidial_log vlog
            LEFT JOIN 
                vicidial_list vl ON vlog.lead_id = vl.lead_id
            LEFT JOIN 
                vicidial_callbacks vc ON vlog.lead_id = vc.lead_id AND vc.status NOT IN ('INACTIVE', 'DEAD')
            WHERE 
                vlog.user = ?
                AND DATE(vlog.call_date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
            UNION
            (SELECT 
                vcl.closecallid as callId,
                vcl.phone_number as phoneNumber,
                IFNULL(CONCAT(IFNULL(vl.first_name, ''), ' ', IFNULL(vl.last_name, '')), 'Inconnu') as customerName,
                'IN' as callType,
                vcl.length_in_sec as duration,
                vcl.status as disposition,
                vcl.call_date as timestamp,
                vc.callback_time as callbackTime,
                vc.recipient as callbackType,
                vl.lead_id as lead_id,
                vl.list_id as list_id,
                vl.comments as comments
            FROM 
                vicidial_closer_log vcl
            LEFT JOIN 
                vicidial_list vl ON vcl.lead_id = vl.lead_id
            LEFT JOIN 
                vicidial_callbacks vc ON vcl.lead_id = vc.lead_id AND vc.status NOT IN ('INACTIVE', 'DEAD')
            WHERE 
                vcl.user = ?
                AND DATE(vcl.call_date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
            ORDER BY 
                timestamp DESC
            LIMIT 100
        `;

        console.log('Exécution de la requête SQL...');
        // Nous avons besoin de passer userId deux fois car il est utilisé dans les deux parties de la requête UNION
        const [results] = await db.query(query, [userId, userId]);
        console.log(`Nombre de résultats trouvés: ${results.length}`);

        // Formater les résultats avec gestion des erreurs
        const calls = results.map(call => {
            try {
                const result = {
                    callId: call.callId || '',
                    phoneNumber: call.phoneNumber || '',
                    customerName: call.customerName || 'Inconnu',
                    callType: call.callType === 'IN' ? 'inbound' : 'outbound',
                    duration: parseInt(call.duration) || 0,
                    disposition: call.disposition || '',
                    timestamp: call.timestamp || new Date().toISOString()
                };

                // Ajouter les informations de rappel si disponibles
                if (call.callbackTime) {
                    try {
                        const callbackDate = new Date(call.callbackTime);
                        result.callback = {
                            date: callbackDate.toISOString().split('T')[0],
                            time: callbackDate.toTimeString().split(' ')[0].substring(0, 5),
                            type: call.callbackType === 'USERONLY' ? 'useronly' : 'anyone'
                        };
                    } catch (dateErr) {
                        console.error('Erreur lors du formatage de la date de rappel:', dateErr);
                    }
                }

                return result;
            } catch (itemErr) {
                console.error('Erreur lors du formatage d\'un appel:', itemErr);
                return {
                    callId: '',
                    phoneNumber: '',
                    customerName: 'Erreur',
                    callType: 'outbound',
                    duration: 0,
                    disposition: '',
                    timestamp: new Date().toISOString()
                };
            }
        });

        res.json({ calls });
    } catch (err) {
        console.error('Erreur lors de la récupération de l\'historique des appels:', err);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'historique des appels' });
    }
});

// Route pour vérifier les appels entrants
router.get('/check-calls', async (req, res) => {
    try {
        const userId = req.user.user;
        const extension = req.user.extension;
        const campaignId = req.user.campaign_id;

        // Vérifier si l'agent a un appel entrant en attente
        const query = `
            SELECT 
                vac.callerid as callId,
                vac.phone_number as phoneNumber,
                CONCAT(vl.first_name, ' ', vl.last_name) as customerName,
                vl.lead_id as contactId
            FROM 
                vicidial_auto_calls vac
            LEFT JOIN 
                vicidial_list vl ON vac.lead_id = vl.lead_id
            WHERE 
                vac.status = 'READY'
                AND vac.campaign_id = ?
                AND vac.agent_only = ?
            LIMIT 1
        `;

        const [results] = await db.query(query, [campaignId, userId]);

        if (results.length === 0) {
            return res.json({ incomingCall: null });
        }

        // Mettre à jour le statut de l'appel
        const updateCallQuery = `
            UPDATE vicidial_auto_calls 
            SET status = 'SENT', user = ? 
            WHERE callerid = ?
        `;

        await db.query(updateCallQuery, [userId, results[0].callId]);

        // Mettre à jour le statut de l'agent
        const updateAgentQuery = `
            UPDATE vicidial_live_agents 
            SET status = 'INCALL', last_update_time = NOW(), lead_id = ? 
            WHERE user = ? 
            AND campaign_id = ?
        `;

        await db.query(updateAgentQuery, [results[0].contactId, userId, campaignId]);

        // Enregistrer l'appel dans le log des appels
        const logQuery = `
            INSERT INTO vicidial_call_log 
            (uniqueid, lead_id, call_date, user, phone_number, campaign_id, extension, call_type) 
            VALUES (?, ?, NOW(), ?, ?, ?, ?, 'IN')
        `;

        await db.query(logQuery, [
            results[0].callId, 
            results[0].contactId, 
            userId, 
            results[0].phoneNumber, 
            campaignId, 
            extension
        ]);

        // Récupérer les informations de contact complètes si disponibles
        if (results[0].contactId) {
            const contactQuery = `
                SELECT 
                    lead_id as id,
                    first_name,
                    last_name,
                    phone_number,
                    alt_phone,
                    address1,
                    address2,
                    city,
                    state,
                    postal_code,
                    email,
                    vendor_lead_code as company
                FROM 
                    vicidial_list
                WHERE 
                    lead_id = ?
            `;

            const [contactResults] = await db.query(contactQuery, [results[0].contactId]);

            if (contactResults.length > 0) {
                results[0].contact = contactResults[0];
            }
        }

        res.json({ incomingCall: results[0] });
    } catch (err) {
        console.error('Erreur lors de la vérification des appels entrants:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour soumettre une disposition d'appel
router.post('/call/disposition', async (req, res) => {
    try {
        const { callId, dispositionCode, notes } = req.body;
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Dans un système réel, enregistrer la disposition dans la base de données
        try {
            const query = `
                UPDATE vicidial_log
                SET status = ?, user_group = ?
                WHERE uniqueid = ? AND user = ?
            `;
            
            await db.query(query, [dispositionCode, notes || '', callId, userId]);
        } catch (dbErr) {
            console.log('Note: Impossible de mettre à jour vicidial_log, simulation uniquement');
            // On pourrait créer la table ici si nécessaire
        }
        
        res.json({
            success: true,
            message: 'Disposition enregistrée avec succès'
        });
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement de la disposition:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour indiquer que l'agent est prêt à recevoir des appels prédictifs
router.post('/agent/ready', async (req, res) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Mettre à jour le statut de l'agent dans vicidial_live_agents
        const updateQuery = `
            UPDATE vicidial_live_agents 
            SET status = 'READY', last_update_time = NOW() 
            WHERE user = ? 
            AND campaign_id = ?
        `;
        
        await db.query(updateQuery, [userId, campaignId]);
        
        // Enregistrer l'événement dans le journal de l'agent
        const logQuery = `
            INSERT INTO vicidial_agent_log 
            (user, event_time, campaign_id, status, comments) 
            VALUES (?, NOW(), ?, 'READY', 'Agent prêt pour appels prédictifs')
        `;
        
        await db.query(logQuery, [userId, campaignId]);
        
        res.json({
            success: true,
            message: 'Agent marqué comme prêt à recevoir des appels'
        });
    } catch (err) {
        console.error('Erreur lors de la mise à jour du statut de l\'agent:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour indiquer que l'agent n'est pas prêt à recevoir des appels
router.post('/agent/not-ready', async (req, res) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        const { pauseCode } = req.body;
        
        // Mettre à jour le statut de l'agent dans vicidial_live_agents
        const updateQuery = `
            UPDATE vicidial_live_agents 
            SET status = 'PAUSED', last_update_time = NOW() 
            WHERE user = ? 
            AND campaign_id = ?
        `;
        
        await db.query(updateQuery, [userId, campaignId]);
        
        // Enregistrer l'événement dans le journal de l'agent
        const logQuery = `
            INSERT INTO vicidial_agent_log 
            (user, event_time, campaign_id, status, pause_code, comments) 
            VALUES (?, NOW(), ?, 'PAUSED', ?, 'Agent en pause')
        `;
        
        await db.query(logQuery, [userId, campaignId, pauseCode || 'BREAK']);
        
        res.json({
            success: true,
            message: 'Agent marqué comme non disponible'
        });
    } catch (err) {
        console.error('Erreur lors de la mise à jour du statut de l\'agent:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour vérifier s'il y a des appels entrants pour l'agent
router.get('/agent/check-calls', async (req, res) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        const extension = req.user.extension;
        
        // Vérifier s'il y a des appels prêts pour cet agent dans la campagne
        const query = `
            SELECT 
                vac.callerid as callId,
                vac.phone_number as phoneNumber,
                CONCAT(vl.first_name, ' ', vl.last_name) as customerName,
                vl.lead_id as contactId
            FROM 
                vicidial_auto_calls vac
            LEFT JOIN 
                vicidial_list vl ON vac.lead_id = vl.lead_id
            WHERE 
                vac.status = 'READY'
                AND vac.campaign_id = ?
            LIMIT 1
        `;
        
        const [results] = await db.query(query, [campaignId]);
        
        if (results.length === 0) {
            return res.json({ hasCall: false });
        }
        
        // Mettre à jour le statut de l'appel
        const updateCallQuery = `
            UPDATE vicidial_auto_calls 
            SET status = 'SENT', user = ? 
            WHERE callerid = ?
        `;
        
        await db.query(updateCallQuery, [userId, results[0].callId]);
        
        // Mettre à jour le statut de l'agent
        const updateAgentQuery = `
            UPDATE vicidial_live_agents 
            SET status = 'INCALL', last_update_time = NOW(), lead_id = ? 
            WHERE user = ? 
            AND campaign_id = ?
        `;
        
        await db.query(updateAgentQuery, [results[0].contactId, userId, campaignId]);
        
        // Récupérer les informations de contact complètes si disponibles
        let customerInfo = null;
        if (results[0].contactId) {
            const contactQuery = `
                SELECT 
                    lead_id as id,
                    first_name as firstName,
                    last_name as lastName,
                    phone_number as phone,
                    alt_phone as altPhone,
                    address1 as address,
                    city,
                    state,
                    postal_code as postalCode,
                    email,
                    vendor_lead_code as company,
                    comments as notes
                FROM 
                    vicidial_list
                WHERE 
                    lead_id = ?
            `;
            
            const [contactResults] = await db.query(contactQuery, [results[0].contactId]);
            
            if (contactResults.length > 0) {
                customerInfo = contactResults[0];
            }
        }
        
        // Enregistrer l'appel dans le log des appels
        const logQuery = `
            INSERT INTO vicidial_call_log 
            (uniqueid, lead_id, call_date, user, phone_number, campaign_id, extension, call_type) 
            VALUES (?, ?, NOW(), ?, ?, ?, ?, 'AUTO')
        `;
        
        await db.query(logQuery, [
            results[0].callId, 
            results[0].contactId || 0, 
            userId, 
            results[0].phoneNumber, 
            campaignId, 
            extension
        ]);
        
        res.json({
            hasCall: true,
            callId: results[0].callId,
            phoneNumber: results[0].phoneNumber,
            customerName: results[0].customerName || 'Inconnu',
            contactId: results[0].contactId,
            customerInfo: customerInfo
        });
    } catch (err) {
        console.error('Erreur lors de la vérification des appels entrants:', err);
        res.status(500).json({ message: 'Erreur serveur', hasCall: false });
    }
});

// Route pour vérifier si l'agent est autorisé à effectuer des appels manuels
router.get('/agent/manual-dial-permissions', async (req, res) => {
    try {
        const userId = req.user.user;
        const campaignId = req.user.campaign_id;
        
        // Vérifier les permissions de l'agent dans la campagne
        const query = `
            SELECT 
                vu.user_level,
                vc.manual_dial_permission
            FROM 
                vicidial_users vu
            JOIN 
                vicidial_campaigns vc ON vc.campaign_id = ?
            WHERE 
                vu.user = ?
            LIMIT 1
        `;
        
        const [results] = await db.query(query, [campaignId, userId]);
        
        let canManualDial = false;
        
        if (results.length > 0) {
            // Autoriser les appels manuels si l'agent est de niveau 8 ou plus (admin)
            // ou si la campagne autorise les appels manuels pour tous les agents
            canManualDial = (results[0].user_level >= 8) || (results[0].manual_dial_permission === 'Y');
        }
        
        res.json({
            canManualDial: canManualDial
        });
    } catch (err) {
        console.error('Erreur lors de la vérification des permissions d\'appel manuel:', err);
        res.status(500).json({ message: 'Erreur serveur', canManualDial: false });
    }
});

module.exports = router;
