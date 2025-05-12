const connection = require('../../config/bd');

// Utility function to format errors
const formatErrorResponse = (err, defaultMessage) => {
    console.error(err);
    return {
        success: false,
        message: defaultMessage,
        error: err.message || 'An unknown error occurred'
    };
};

exports.getUsersGroups = async (req, res) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM vicidial_user_groups');
        res.json(rows);
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Error retrieving user groups'));
    }
};

// Get details with id
exports.getUserGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await connection.execute('SELECT * FROM vicidial_user_groups WHERE user_group = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User group not found'
            });
        }

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Error retrieving user group'));
    }
};

// Create a new user group
exports.createUserGroup = async (req, res) => {
    const {
        user_group,
        group_name,
        allowed_campaigns,
        qc_allowed_campaigns,
        qc_allowed_inbound_groups,
        group_shifts,
        forced_timeclock_login,
        shift_enforcement,
        agent_status_viewable_groups,
        agent_status_view_time,
        agent_call_log_view,
        agent_xfer_consultative,
        agent_xfer_dial_override,
        agent_xfer_vm_transfer,
        agent_xfer_blind_transfer,
        agent_xfer_dial_with_customer,
        agent_xfer_park_customer_dial,
        agent_fullscreen,
        allowed_reports,
        webphone_url_override,
        webphone_systemkey_override,
        webphone_dialpad_override,
        admin_viewable_groups,
        admin_viewable_call_times,
        allowed_custom_reports,
        agent_allowed_chat_groups,
        agent_xfer_park_3way,
        admin_ip_list,
        agent_ip_list,
        api_ip_list,
        webphone_layout,
        allowed_queue_groups,
        reports_header_override,
        admin_home_url,
        script_id
    } = req.body;

    const modify_stamp = new Date();

    const sql = `
        INSERT INTO vicidial_user_groups (
            user_group, group_name, allowed_campaigns, qc_allowed_campaigns,
            qc_allowed_inbound_groups, group_shifts, forced_timeclock_login,
            shift_enforcement, agent_status_viewable_groups, agent_status_view_time,
            agent_call_log_view, agent_xfer_consultative, agent_xfer_dial_override,
            agent_xfer_vm_transfer, agent_xfer_blind_transfer, agent_xfer_dial_with_customer,
            agent_xfer_park_customer_dial, agent_fullscreen, allowed_reports,
            webphone_url_override, webphone_systemkey_override, webphone_dialpad_override,
            admin_viewable_groups, admin_viewable_call_times, allowed_custom_reports,
            agent_allowed_chat_groups, agent_xfer_park_3way, admin_ip_list,
            agent_ip_list, api_ip_list, webphone_layout, allowed_queue_groups,
            reports_header_override, admin_home_url, script_id, modify_stamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        user_group,
        group_name,
        allowed_campaigns || '',
        qc_allowed_campaigns || '',
        qc_allowed_inbound_groups || '',
        group_shifts || '',
        forced_timeclock_login || 'N',
        shift_enforcement || 'OFF',
        agent_status_viewable_groups || '',
        agent_status_view_time || 'N',
        agent_call_log_view || 'N',
        agent_xfer_consultative || 'Y',
        agent_xfer_dial_override || 'Y',
        agent_xfer_vm_transfer || 'Y',
        agent_xfer_blind_transfer || 'Y',
        agent_xfer_dial_with_customer || 'Y',
        agent_xfer_park_customer_dial || 'Y',
        agent_fullscreen || 'N',
        allowed_reports || 'ALL REPORTS',
        webphone_url_override || '',
        webphone_systemkey_override || '',
        webphone_dialpad_override || 'DISABLED',
        admin_viewable_groups || '',
        admin_viewable_call_times || '',
        allowed_custom_reports || '',
        agent_allowed_chat_groups || '',
        agent_xfer_park_3way || 'Y',
        admin_ip_list || '',
        agent_ip_list || '',
        api_ip_list || '',
        webphone_layout || '',
        allowed_queue_groups || '',
        reports_header_override || 'DISABLED',
        admin_home_url || '',
        script_id || '',
        modify_stamp
    ];

    try {
        // Correction: Utilisez connection.execute au lieu de pool.execute
        await connection.execute(sql, values);
        res.status(200).json({ success: true, message: "User group created successfully" });
    } catch (error) {
        console.error("Error creating user group:", error);
        res.status(500).json({ success: false, message: "Error creating user group", error: error.message });
    }
};


// Update an existing user group
exports.updateUserGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            group_name,
            allowed_campaigns,
            qc_allowed_campaigns,
            qc_allowed_inbound_groups,
            group_shifts,
            forced_timeclock_login,
            shift_enforcement,
            agent_status_viewable_groups,
            agent_status_view_time,
            agent_call_log_view,
            agent_xfer_consultative,
            agent_xfer_dial_override,
            agent_xfer_vm_transfer,
            agent_xfer_blind_transfer,
            agent_xfer_dial_with_customer,
            agent_xfer_park_customer_dial,
            agent_fullscreen,
            allowed_reports,
            webphone_url_override,
            webphone_systemkey_override,
            webphone_dialpad_override,
            admin_viewable_groups,
            admin_viewable_call_times,
            allowed_custom_reports,
            agent_allowed_chat_groups,
            agent_xfer_park_3way,
            admin_ip_list,
            agent_ip_list,
            api_ip_list,
            webphone_layout,
            allowed_queue_groups,
            reports_header_override,
            admin_home_url,
            script_id,
        } = req.body;

        // Check if the group exists
        const [existingGroups] = await connection.execute(
            'SELECT user_group FROM vicidial_user_groups WHERE user_group = ?',
            [id]
        );

        if (existingGroups.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User group not found'
            });
        }

        // Build the update query
        const query = `
            UPDATE vicidial_user_groups SET
                group_name = ?, allowed_campaigns = ?, qc_allowed_campaigns = ?,
                qc_allowed_inbound_groups = ?, group_shifts = ?, forced_timeclock_login = ?,
                shift_enforcement = ?, agent_status_viewable_groups = ?,
                agent_status_view_time = ?, agent_call_log_view = ?,
                agent_xfer_consultative = ?, agent_xfer_dial_override = ?,
                agent_xfer_vm_transfer = ?, agent_xfer_blind_transfer = ?,
                agent_xfer_dial_with_customer = ?, agent_xfer_park_customer_dial = ?,
                agent_fullscreen = ?, allowed_reports = ?, webphone_url_override = ?,
                webphone_systemkey_override = ?, webphone_dialpad_override = ?,
                admin_viewable_groups = ?, admin_viewable_call_times = ?,
                allowed_custom_reports = ?, agent_allowed_chat_groups = ?,
                agent_xfer_park_3way = ?, admin_ip_list = ?, agent_ip_list = ?,
                api_ip_list = ?, webphone_layout = ?, allowed_queue_groups = ?,
                reports_header_override = ?, admin_home_url = ?, script_id = ?
            WHERE user_group = ?
        `;

        await connection.execute(query, [
            group_name,
            allowed_campaigns || '',
            qc_allowed_campaigns || '',
            qc_allowed_inbound_groups || '',
            group_shifts || '',
            forced_timeclock_login || 'N',
            shift_enforcement || 'OFF',
            agent_status_viewable_groups || '',
            agent_status_view_time || 'N',
            agent_call_log_view || 'N',
            agent_xfer_consultative || 'Y',
            agent_xfer_dial_override || 'Y',
            agent_xfer_vm_transfer || 'Y',
            agent_xfer_blind_transfer || 'Y',
            agent_xfer_dial_with_customer || 'Y',
            agent_xfer_park_customer_dial || 'Y',
            agent_fullscreen || 'N',
            allowed_reports || 'ALL REPORTS',
            webphone_url_override || '',
            webphone_systemkey_override || '',
            webphone_dialpad_override || 'DISABLED',
            admin_viewable_groups || '',
            admin_viewable_call_times || '',
            allowed_custom_reports || '',
            agent_allowed_chat_groups || '',
            agent_xfer_park_3way || 'Y',
            admin_ip_list || '',
            agent_ip_list || '',
            api_ip_list || '',
            webphone_layout || '',
            allowed_queue_groups || '',
            reports_header_override || 'DISABLED',
            admin_home_url || '',
            script_id || '',
            id
        ]);

        res.json({
            success: true,
            message: 'User group updated successfully',
            user_group: id
        });
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Error updating user group'));
    }
};

// Delete a user group
exports.deleteUserGroup = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the group exists
        const [existingGroups] = await connection.execute(
            'SELECT user_group FROM vicidial_user_groups WHERE user_group = ?',
            [id]
        );

        if (existingGroups.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User group not found'
            });
        }

        // Check if there are users associated with this group
        const [associatedUsers] = await connection.execute(
            'SELECT user_id FROM vicidial_users WHERE user_group = ?',
            [id]
        );

        if (associatedUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete this group as users are associated',
                count: associatedUsers.length
            });
        }

        // Delete the group
        await connection.execute(
            'DELETE FROM vicidial_user_groups WHERE user_group = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'User group deleted successfully'
        });
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Error deleting user group'));
    }
};

// utilisateur avec le usergroupe 
exports.getUsersByUserGroup = async (req, res) => {
    try {
        const { user_group } = req.params;
        const [rows] = await connection.execute(
            'SELECT * FROM vicidial_users WHERE user_group = ?',
            [user_group]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Error getting users by user group'));
    }
};

// call times 
exports.getCallTimes = async (req, res) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM vicidial_call_times');
        res.json(rows);
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Error getting call times'));
    }
};

// NOUVELLES FONCTIONS POUR LA MODIFICATION EN MASSE DES GROUPES D'UTILISATEURS

/**
 * Obtenir le nombre d'utilisateurs qui seraient affectés par un changement de groupe
 */
exports.getAffectedUsersCount = async (req, res) => {
    try {
        const { oldGroup, stage } = req.query;
        
        let query = '';
        let params = [];
        
        if (stage === 'one_user_group_change' && oldGroup) {
            // Compter les utilisateurs d'un groupe spécifique
            query = 'SELECT COUNT(*) as count FROM vicidial_users WHERE user_group = ?';
            params = [oldGroup];
        } else if (stage === 'all_user_group_change') {
            // Compter tous les utilisateurs non-admin
            query = 'SELECT COUNT(*) as count FROM vicidial_users WHERE user_level < 9';
            params = [];
        } else {
            return res.status(400).json({
                success: false,
                message: 'Paramètres invalides'
            });
        }
        
        const [rows] = await connection.execute(query, params);
        
        res.json({
            success: true,
            count: rows[0].count
        });
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors du comptage des utilisateurs affectés'));
    }
};

/**
 * Modifier en masse les groupes d'utilisateurs
 */
exports.bulkChangeUserGroup = async (req, res) => {
    try {
        const { oldGroup, newGroup, stage } = req.body;
        
        // Vérifier si le nouveau groupe existe
        const [newGroupExists] = await connection.execute(
            'SELECT user_group FROM vicidial_user_groups WHERE user_group = ?',
            [newGroup]
        );

        if (newGroupExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Le nouveau groupe n\'existe pas'
            });
        }
        
        let affectedCount = 0;
        
        // Obtenir une connexion
        const conn = await connection.getConnection();
        
        try {
            // Commencer la transaction
            await conn.query('START TRANSACTION');
            
            if (stage === 'one_user_group_change' && oldGroup) {
                // Vérifier si l'ancien groupe existe
                const [oldGroupExists] = await conn.query(
                    'SELECT user_group FROM vicidial_user_groups WHERE user_group = ?',
                    [oldGroup]
                );
                
                if (oldGroupExists.length === 0) {
                    await conn.query('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        message: 'L\'ancien groupe n\'existe pas'
                    });
                }

                // Compter les utilisateurs affectés
                const [countResult] = await conn.query(
                    'SELECT COUNT(*) as count FROM vicidial_users WHERE user_group = ?',
                    [oldGroup]
                );
                affectedCount = countResult[0].count;

                // Mettre à jour les utilisateurs
                await conn.query(
                    'UPDATE vicidial_users SET user_group = ? WHERE user_group = ?',
                    [newGroup, oldGroup]
                );
            } else if (stage === 'all_user_group_change') {
                // Compter les utilisateurs non-admin
                const [countResult] = await conn.query(
                    'SELECT COUNT(*) as count FROM vicidial_users WHERE user_level < 9'
                );
                affectedCount = countResult[0].count;

                // Mettre à jour tous les utilisateurs non-admin
                await conn.query(
                    'UPDATE vicidial_users SET user_group = ? WHERE user_level < 9',
                    [newGroup]
                );
            }

            // Valider la transaction
            await conn.query('COMMIT');
            
            res.json({
                success: true,
                message: `Successfully changed user groups. Affected users: ${affectedCount}`,
                affectedUsers: affectedCount
            });
        } catch (err) {
            // Annuler la transaction en cas d'erreur
            await conn.query('ROLLBACK');
            throw err;
        } finally {
            // Libérer la connexion
            conn.release();
        }
    } catch (err) {
        console.error('Error in bulkChangeUserGroup:', err);
        res.status(500).json(formatErrorResponse(err, 'Error changing user groups'));
    }
};

// Cache pour stocker les résultats des requêtes
const statsCache = new Map();
const statusCache = new Map();

/**
 * Obtenir les statistiques horaires pour un groupe d'utilisateurs
 * Version ultra-rapide avec cache et requêtes optimisées
 */
exports.getHourlyStats = async (req, res) => {
    try {
        // Extraire les paramètres de la requête
        const { group, status, dateWithHour } = req.body;
        
        // Validation des paramètres
        if (!group || !status || !dateWithHour) {
            return res.status(400).json({
                success: false,
                message: 'Paramètres manquants: groupe, statut et date avec heure sont requis'
            });
        }
        
        // Générer une clé de cache unique pour cette requête
        const cacheKey = `${group}_${status}_${dateWithHour}`;
        
        // Vérifier si les résultats sont déjà en cache
        if (statsCache.has(cacheKey)) {
            console.log(`getHourlyStats - Résultats trouvés en cache pour ${cacheKey}`);
            return res.json(statsCache.get(cacheKey));
        }
        
        // Extraire la date sans l'heure pour les statistiques du jour
        const dateOnly = dateWithHour.split(' ')[0];
        
        // Requête SQL unique et optimisée qui récupère toutes les données en une seule fois
        const query = `
            SELECT 
                u.user, 
                u.full_name,
                COALESCE(hour_stats.hour_calls, 0) as hour_calls,
                COALESCE(day_stats.day_calls, 0) as day_calls,
                COALESCE(total_stats.total_calls, 0) as total_calls
            FROM 
                vicidial_users u
            LEFT JOIN (
                SELECT 
                    user, 
                    COUNT(*) as hour_calls 
                FROM 
                    vicidial_log 
                WHERE 
                    call_date >= '${dateWithHour}:00:00' AND 
                    call_date <= '${dateWithHour}:59:59' AND 
                    status = '${status}'
                GROUP BY 
                    user
            ) hour_stats ON u.user = hour_stats.user
            LEFT JOIN (
                SELECT 
                    user, 
                    COUNT(*) as day_calls 
                FROM 
                    vicidial_log 
                WHERE 
                    call_date >= '${dateOnly} 00:00:00' AND 
                    call_date <= '${dateOnly} 23:59:59' AND 
                    status = '${status}'
                GROUP BY 
                    user
            ) day_stats ON u.user = day_stats.user
            LEFT JOIN (
                SELECT 
                    user, 
                    COUNT(*) as total_calls 
                FROM 
                    vicidial_log 
                WHERE 
                    status = '${status}'
                GROUP BY 
                    user
            ) total_stats ON u.user = total_stats.user
            WHERE 
                u.user_group = '${group}'
            ORDER BY 
                u.full_name
        `;
        
        // Exécuter la requête optimisée
        const [results] = await connection.query(query);
        
        // Préparer les résultats
        const usersWithStats = [];
        let totalHourCalls = 0;
        let totalDayCalls = 0;
        let totalAllCalls = 0;
        
        // Traiter les résultats
        for (const row of results) {
            const hourCalls = parseInt(row.hour_calls) || 0;
            const dayCalls = parseInt(row.day_calls) || 0;
            const totalCalls = parseInt(row.total_calls) || 0;
            
            totalHourCalls += hourCalls;
            totalDayCalls += dayCalls;
            totalAllCalls += totalCalls;
            
            usersWithStats.push({
                user_id: row.user,
                full_name: row.full_name,
                hour_calls: hourCalls,
                day_calls: dayCalls,
                total_calls: totalCalls
            });
        }
        
        // Préparer la réponse
        const response = {
            success: true,
            users: usersWithStats,
            totals: {
                hourCalls: totalHourCalls,
                totalCalls: totalAllCalls,
                dayCalls: totalDayCalls
            }
        };
        
        // Stocker les résultats dans le cache (expire après 5 minutes)
        statsCache.set(cacheKey, response);
        setTimeout(() => statsCache.delete(cacheKey), 5 * 60 * 1000);
        
        // Envoyer la réponse
        return res.json(response);
    } catch (err) {
        console.error('Error in getHourlyStats:', err);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques horaires',
            error: err.message
        });
    }
};

/**
 * Récupérer la liste des statuts depuis la table vicidial_statuses
 */
exports.getStatusList = async (req, res) => {
    try {
        // Vérifier si les statuts sont en cache
        if (statusCache.has('all_statuses')) {
            return res.json({
                success: true,
                statuses: statusCache.get('all_statuses')
            });
        }
        
        // Récupérer les statuts depuis la base de données
        const query = `
            SELECT 
                status, 
                status_name, 
                selectable, 
                human_answered, 
                category, 
                sale 
            FROM 
                vicidial_statuses 
            ORDER BY 
                status
        `;
        
        const [results] = await connection.query(query);
        
        // Mettre en cache les résultats (expire après 1 heure)
        statusCache.set('all_statuses', results);
        setTimeout(() => statusCache.delete('all_statuses'), 60 * 60 * 1000);
        
        return res.json({
            success: true,
            statuses: results
        });
    } catch (err) {
        console.error('Error in getStatusList:', err);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statuts',
            error: err.message
        });
    }
};