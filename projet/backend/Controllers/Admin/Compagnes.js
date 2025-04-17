const connection = require('../../config/bd'); // MySQL connection

/**
 * Check if a campaign exists by name
 * @param {string} campaign_name - The campaign name to check
 * @returns {Promise<Array>} - Array of matching campaigns
 */
const checkCampaignExists = async (campaign_name) => {
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM vicidial_campaigns WHERE campaign_name = ?',
            [campaign_name]
        );
        return rows;
    } catch (err) {
        throw new Error('Erreur lors de la vérification de la compagnie');
    }
};

/**
 * Format response for error handling
 * @param {Error} err - The error object
 * @param {string} message - Custom error message
 * @returns {Object} - Formatted error response
 */
const formatErrorResponse = (err, message) => {
    console.error(`${message}:`, err);
    return {
        success: false,
        message: message,
        error: err.message
    };
};


exports.ajouter = async (req, res) => {
    try {
        const {
            campaign_id,
            campaign_name,
            campaign_description,
            active,
            park_ext,
            park_file_name,
            web_form_address,
            allow_closers,
            hopper_level,
            auto_dial_level,
            next_agent_call,
            local_call_time,
            voicemail_ext,
            campaign_script,
            get_call_launch
        } = req.body;

        // Validate required fields
        if (!campaign_id || !campaign_name || !active) {
            return res.status(400).json({ 
                success: false,
                message: 'Les champs requis sont manquants' 
            });
        }

        // Check if campaign already exists
        const rows = await checkCampaignExists(campaign_name);
        if (rows.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Cette compagnie existe déjà' 
            });
        }

        // Current date for timestamp
        const SQLdate = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // SQL query with all fields
        const sql = `
            INSERT INTO vicidial_campaigns (
                campaign_id, campaign_name, campaign_description, active,
                dial_status_a, lead_order, park_ext, park_file_name, web_form_address,
                allow_closers, hopper_level, auto_dial_level, next_agent_call, local_call_time,
                voicemail_ext, campaign_script, get_call_launch, campaign_changedate,
                campaign_stats_refresh, list_order_mix, web_form_address_two, start_call_url, dispo_call_url
            ) VALUES (?, ?, ?, ?, 'NEW', 'DOWN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y', 'DISABLED', '', '', '')
        `;

        // Execute insertion
        const [result] = await connection.execute(sql, [
            campaign_id, campaign_name, campaign_description, active,
            park_ext, park_file_name, web_form_address, allow_closers,
            hopper_level, auto_dial_level, next_agent_call, local_call_time,
            voicemail_ext, campaign_script, get_call_launch, SQLdate
        ]);

        res.json({ 
            success: true,
            message: 'Compagnie ajoutée avec succès', 
            id: result.insertId 
        });

    } catch (error) {
        res.status(500).json(formatErrorResponse(error, 'Erreur serveur'));
    }
};


exports.recuperer = async (req, res) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM vicidial_campaigns');
        res.json(rows);
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la récupération des compagnies'));
    }
};


exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await connection.execute(
            'SELECT * FROM vicidial_campaigns WHERE campaign_id = ?', 
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Compagnie non trouvée' 
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la récupération des compagnies'));
    }
};


exports.getCampaignAgents = async (req, res) => {
    try {
        const { campaign_id } = req.params;
        const [rows] = await connection.execute(
            'SELECT * FROM vicidial_campaign_agents WHERE campaign_id = ?',
            [campaign_id]
        );
        
        res.json({
            success: true,
            data: rows,
            message: rows.length === 0 ? 'Aucun agent trouvé pour cette compagnie' : null
        });
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la récupération des agents pour la compagnie'));
    }
};


exports.getCampaignLists = async (req, res) => {
    try {
        const { campaign_id } = req.params;
        
        const [rows] = await connection.execute(`
            SELECT vls.list_id, list_name, local_call_time, list_description, 
                   COUNT(*) AS tally, active, list_lastcalldate, campaign_id
            FROM vicidial_lists vls
            JOIN vicidial_list vl ON vls.list_id = vl.list_id
            WHERE campaign_id = ?
            GROUP BY list_id
        `, [campaign_id]);

        res.json({
            success: true,
            data: rows,
            message: rows.length === 0 ? 'Aucune liste trouvée pour cette compagnie' : null
        });
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la récupération des listes'));
    }
};

exports.getStatusCountsByList = async (req, res) => {
    try {
        const { list_ids } = req.params;
        
        if (!list_ids) {
            return res.status(400).json({ 
                success: false,
                message: 'Le paramètre list_ids est requis' 
            });
        }

        const idArray = list_ids.split(',');
        if (idArray.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Aucun ID de liste valide fourni' 
            });
        }

        // Query to get status counts
        const [rows] = await connection.execute(`
            SELECT status, COUNT(*) as count
            FROM vicidial_list
            WHERE list_id IN (?)
            GROUP BY status
            ORDER BY count DESC
        `, [idArray]);

        // Convert rows to object with status as key and count as value
        const statusCounts = rows.reduce((acc, { status, count }) => {
            acc[status] = count;
            return acc;
        }, {});

        res.json({
            success: true,
            data: statusCounts
        });
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la récupération des statistiques'));
    }
};


exports.getStatusCountsByCampaign = async (req, res) => {
    try {
        const { campaign_id } = req.params;

        const query = `
            SELECT 
                status,          
                status_name,      
                selectable,        
                campaign_id,      
                human_answered,   
                category,          
                sale,             
                dnc,              
                customer_contact, 
                not_interested,   
                unworkable,       
                scheduled_callback,
                completed,        
                min_sec,          
                max_sec,          
                answering_machine 
            FROM vicidial_campaign_statuses 
            WHERE campaign_id = ?
            ORDER BY status ASC
        `;

        const [results] = await connection.execute(query, [campaign_id]);

        // Transform results to convert Y/N to boolean values
        const transformedResults = results.length ? results.map(status => ({
            status: status.status,
            status_name: status.status_name || null,
            selectable: status.selectable === 'Y',
            campaign_id: status.campaign_id || null,
            human_answered: status.human_answered === 'Y',
            category: status.category || 'UNDEFINED',
            sale: status.sale === 'Y',
            dnc: status.dnc === 'Y',
            customer_contact: status.customer_contact === 'Y',
            not_interested: status.not_interested === 'Y',
            unworkable: status.unworkable === 'Y',
            scheduled_callback: status.scheduled_callback === 'Y',
            completed: status.completed === 'Y',
            min_sec: parseInt(status.min_sec) || 0,
            max_sec: parseInt(status.max_sec) || 0,
            answering_machine: status.answering_machine === 'Y'
        })) : [];

        res.json({
            success: true,
            data: transformedResults,
            message: results.length ? null : 'Aucun statut trouvé pour cette campagne'
        });

    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la récupération des statuts'));
    }
};


exports.updateStatus = async (req, res) => {
    try {
        const { campaign_id, status } = req.params;
        
        if (!campaign_id || !status) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne et statut requis'
            });
        }

        // Prepare update data with defaults
        const updateData = {
            status_name: req.body.status_name || '',
            selectable: req.body.selectable || false,
            human_answered: req.body.human_answered || false,
            sale: req.body.sale || false,
            dnc: req.body.dnc || false,
            customer_contact: req.body.customer_contact || false,
            not_interested: req.body.not_interested || false,
            unworkable: req.body.unworkable || false,
            scheduled_callback: req.body.scheduled_callback || false,
            completed: req.body.completed || false,
            answering_machine: req.body.answering_machine || false,
            min_sec: req.body.min_sec || 0,
            max_sec: req.body.max_sec || 0
        };

        const query = `
            UPDATE vicidial_campaign_statuses
            SET 
                status_name = ?,
                selectable = ?,
                human_answered = ?,
                sale = ?,
                dnc = ?,
                customer_contact = ?,
                not_interested = ?,
                unworkable = ?,
                scheduled_callback = ?,
                completed = ?,
                answering_machine = ?,
                min_sec = ?,
                max_sec = ?
            WHERE campaign_id = ? AND status = ?
        `;

        // Convert boolean values to 'Y'/'N' and ensure numeric values are valid
        const values = [
            updateData.status_name || '',
            updateData.selectable === true ? 'Y' : 'N',
            updateData.human_answered === true ? 'Y' : 'N',
            updateData.sale === true ? 'Y' : 'N',
            updateData.dnc === true ? 'Y' : 'N',
            updateData.customer_contact === true ? 'Y' : 'N',
            updateData.not_interested === true ? 'Y' : 'N',
            updateData.unworkable === true ? 'Y' : 'N',
            updateData.scheduled_callback === true ? 'Y' : 'N',
            updateData.completed === true ? 'Y' : 'N',
            updateData.answering_machine === true ? 'Y' : 'N',
            Math.max(0, parseInt(updateData.min_sec) || 0),
            Math.max(0, parseInt(updateData.max_sec) || 0),
            campaign_id,
            status
        ];

        // Ensure max_sec is not less than min_sec
        if (values[13] < values[12]) {
            values[13] = values[12];
        }

        const [result] = await connection.execute(query, values);

        res.json({
            success: true,
            message: 'Statut mis à jour avec succès',
            affectedRows: result.affectedRows
        });

    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la mise à jour du statut'));
    }
};

/**
 * Create a new status for a campaign
 */
exports.createStatus = async (req, res) => {
    try {
        const { campaign_id } = req.params;
        const { status, status_name, selectable, human_answered, sale, dnc, 
                customer_contact, not_interested, unworkable, scheduled_callback, 
                completed, answering_machine, min_sec, max_sec } = req.body;
        
        if (!campaign_id || !status) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne et statut requis'
            });
        }

        // Check if status already exists
        const [existingStatus] = await connection.execute(
            'SELECT * FROM vicidial_campaign_statuses WHERE campaign_id = ? AND status = ?',
            [campaign_id, status]
        );

        if (existingStatus.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ce statut existe déjà pour cette campagne'
            });
        }

        // Convert boolean values to 'Y'/'N' and ensure numeric values are valid
        const values = [
            campaign_id,
            status,
            status_name || '',
            selectable === true ? 'Y' : 'N',
            human_answered === true ? 'Y' : 'N',
            sale === true ? 'Y' : 'N',
            dnc === true ? 'Y' : 'N',
            customer_contact === true ? 'Y' : 'N',
            not_interested === true ? 'Y' : 'N',
            unworkable === true ? 'Y' : 'N',
            scheduled_callback === true ? 'Y' : 'N',
            completed === true ? 'Y' : 'N',
            answering_machine === true ? 'Y' : 'N',
            Math.max(0, parseInt(min_sec) || 0),
            Math.max(0, parseInt(max_sec) || 0)
        ];

        // Ensure max_sec is not less than min_sec
        if (values[14] < values[13]) {
            values[14] = values[13];
        }

        const query = `
            INSERT INTO vicidial_campaign_statuses (
                campaign_id, status, status_name, selectable, human_answered,
                sale, dnc, customer_contact, not_interested, unworkable,
                scheduled_callback, completed, answering_machine, min_sec, max_sec
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await connection.execute(query, values);

        res.json({
            success: true,
            message: 'Statut créé avec succès',
            insertId: result.insertId
        });

    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la création du statut'));
    }
};


exports.deleteStatus = async (req, res) => {
    try {
        const { campaign_id, status } = req.params;

        if (!campaign_id || !status) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne et statut requis'
            });
        }

        const query = `
            DELETE FROM vicidial_campaign_statuses 
            WHERE campaign_id = ? AND status = ?
        `;

        const [result] = await connection.execute(query, [campaign_id, status]);

        res.json({
            success: true,
            message: 'Statut supprimé avec succès',
            affectedRows: result.affectedRows
        });

    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la suppression du statut'));
    }
};


exports.getPauseCodes = async (req, res) => {
    try {
        const { campaign_id } = req.params;
        
        if (!campaign_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne requis'
            });
        }
        
        const [rows] = await connection.execute(
            'SELECT * FROM vicidial_pause_codes WHERE campaign_id = ?', 
            [campaign_id]
        );
        
        res.json({
            success: true,
            data: rows,
            message: rows.length === 0 ? 'Aucun code de pause trouvé pour cette campagne' : null
        });
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la récupération des codes de pause'));
    }
};


exports.createPauseCode = async (req, res) => {
    try {
        const { campaign_id } = req.params;
        const { 
            pause_code, 
            pause_code_name, 
            billable = 'NO', 
            time_limit = 65000, 
            require_mgr_approval = false 
        } = req.body;

        // Validate required fields
        if (!campaign_id || !pause_code || !pause_code_name) {
            return res.status(400).json({ 
                success: false,
                message: 'ID de campagne, code de pause et nom du code de pause sont requis' 
            });
        }

        // Check if pause code already exists for this campaign
        const [existingCodes] = await connection.execute(
            'SELECT * FROM vicidial_pause_codes WHERE campaign_id = ? AND pause_code = ?',
            [campaign_id, pause_code]
        );

        if (existingCodes.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ce code de pause existe déjà pour cette campagne'
            });
        }

        // Convert boolean to 'Y'/'N'
        const mgr_approval = require_mgr_approval === true ? 'Y' : 'N';
        
        // Validate time_limit
        const validTimeLimit = Math.max(0, parseInt(time_limit) || 65000);

        // Insert new pause code
        const query = `
            INSERT INTO vicidial_pause_codes (
                campaign_id, 
                pause_code, 
                pause_code_name, 
                billable, 
                time_limit, 
                require_mgr_approval
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await connection.execute(query, [
            campaign_id,
            pause_code,
            pause_code_name,
            billable,
            validTimeLimit,
            mgr_approval
        ]);

        res.status(201).json({
            success: true,
            message: 'Code de pause créé avec succès',
            id: result.insertId
        });

    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la création du code de pause'));
    }
};


exports.updatePauseCode = async (req, res) => {
    try {
        const { campaign_id, pause_code } = req.params;
        const { 
            pause_code_name, 
            billable, 
            time_limit, 
            require_mgr_approval 
        } = req.body;

        // Validate required parameters
        if (!campaign_id || !pause_code) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne et code de pause sont requis'
            });
        }

        // Check if pause code exists
        const [existingCodes] = await connection.execute(
            'SELECT * FROM vicidial_pause_codes WHERE campaign_id = ? AND pause_code = ?',
            [campaign_id, pause_code]
        );

        if (existingCodes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Code de pause non trouvé'
            });
        }

        // Get existing data to use as defaults if not provided
        const existingData = existingCodes[0];
        
        // Prepare update data
        const updateData = {
            pause_code_name: pause_code_name || existingData.pause_code_name,
            billable: billable || existingData.billable,
            time_limit: time_limit !== undefined ? 
                Math.max(0, parseInt(time_limit) || 65000) : 
                existingData.time_limit,
            require_mgr_approval: require_mgr_approval !== undefined ? 
                (require_mgr_approval === true ? 'Y' : 'N') : 
                existingData.require_mgr_approval
        };

        // Update pause code
        const query = `
            UPDATE vicidial_pause_codes
            SET 
                pause_code_name = ?,
                billable = ?,
                time_limit = ?,
                require_mgr_approval = ?
            WHERE campaign_id = ? AND pause_code = ?
        `;

        const [result] = await connection.execute(query, [
            updateData.pause_code_name,
            updateData.billable,
            updateData.time_limit,
            updateData.require_mgr_approval,
            campaign_id,
            pause_code
        ]);

        res.json({
            success: true,
            message: 'Code de pause mis à jour avec succès',
            affectedRows: result.affectedRows
        });

    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la mise à jour du code de pause'));
    }
};


exports.deletePauseCode = async (req, res) => {
    try {
        const { campaign_id, pause_code } = req.params;

        // Validate required parameters
        if (!campaign_id || !pause_code) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne et code de pause sont requis'
            });
        }

        // Check if pause code exists
        const [existingCodes] = await connection.execute(
            'SELECT * FROM vicidial_pause_codes WHERE campaign_id = ? AND pause_code = ?',
            [campaign_id, pause_code]
        );

        if (existingCodes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Code de pause non trouvé'
            });
        }

        // Delete pause code
        const query = `
            DELETE FROM vicidial_pause_codes 
            WHERE campaign_id = ? AND pause_code = ?
        `;

        const [result] = await connection.execute(query, [campaign_id, pause_code]);

        res.json({
            success: true,
            message: 'Code de pause supprimé avec succès',
            affectedRows: result.affectedRows
        });

    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la suppression du code de pause'));
    }
};

exports.copyCampaign = async (req, res) => {
    try {
        const { campaign_id } = req.params;
        const { new_campaign_id, new_campaign_name } = req.body;
        
        if (!campaign_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne source requis'
            });
        }

        if (!new_campaign_id || !new_campaign_name) {
            return res.status(400).json({
                success: false,
                message: 'Nouvel ID et nouveau nom de campagne requis'
            });
        }

        // Check if campaign with new ID already exists
        const [existingId] = await connection.execute(
            'SELECT campaign_id FROM vicidial_campaigns WHERE campaign_id = ?',
            [new_campaign_id]
        );

        if (existingId.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Une campagne avec cet ID existe déjà'
            });
        }

        // Check if campaign with new name already exists
        const existingCampaigns = await checkCampaignExists(new_campaign_name);
        if (existingCampaigns.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Une campagne avec ce nom existe déjà'
            });
        }

        // Get all fields from the source campaign
        const [sourceCampaign] = await connection.execute(
            'SELECT * FROM vicidial_campaigns WHERE campaign_id = ?',
            [campaign_id]
        );

        if (sourceCampaign.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Campagne source non trouvée'
            });
        }

        // Current date for timestamp
        const SQLdate = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Get all column names from the table
        const [columns] = await connection.execute('SHOW COLUMNS FROM vicidial_campaigns');
        const columnNames = columns.map(col => col.Field);
        
        // Build the SQL query dynamically
        let fields = columnNames.join(', ');
        let placeholders = columnNames.map(() => '?').join(', ');
        
        const sql = `INSERT INTO vicidial_campaigns (${fields}) VALUES (${placeholders})`;

        // Prepare values for insertion, replacing ID and name with new ones
        const values = columnNames.map(column => {
            if (column === 'campaign_id') return new_campaign_id;
            if (column === 'campaign_name') return new_campaign_name;
            if (column === 'campaign_changedate') return SQLdate;
            return sourceCampaign[0][column];
        });

        // Execute insertion
        const [result] = await connection.execute(sql, values);

        res.json({
            success: true,
            message: 'Campagne copiée avec succès',
            data: {
                original_id: campaign_id,
                new_id: new_campaign_id,
                new_name: new_campaign_name
            }
        });

    } catch (error) {
        res.status(500).json(formatErrorResponse(error, 'Erreur lors de la copie de la campagne'));
    }
};

// Récupérer les list mix pour une campagne
exports.getCampaignListMix = async (req, res) => {
    try {
        const { campaign_id } = req.params;
        
        if (!campaign_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne requis'
            });
        }
        
        const [rows] = await connection.execute(
            'SELECT * FROM vicidial_campaigns_list_mix WHERE campaign_id = ? ', 
            [campaign_id]
        );
        
        res.json({
            success: true,
            data: rows,
            message: rows.length === 0 ? 'Aucun list mix trouvé pour cette campagne' : null
        });
    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la récupération des list mix'));
    }
};

// Ajouter un nouveau list mix
exports.addListMix = async (req, res) => {
    try {
        const { campaign_id } = req.params;
        const { 
            vcl_name,
            list_mix_container,
            mix_method = 'EVEN_MIX',
            status = 'ACTIVE',
            list_id // Nécessaire pour la vérification de la liste
        } = req.body;

        // Valider les champs requis
        if (!campaign_id || !vcl_name || !list_id) {
            return res.status(400).json({ 
                success: false,
                message: 'ID de campagne, nom du list mix et ID de liste sont requis' 
            });
        }

        // Vérifier si la liste existe
        const [existingLists] = await connection.execute(
            'SELECT list_id FROM vicidial_lists WHERE list_id = ?',
            [list_id]
        );

        if (existingLists.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La liste spécifiée n\'existe pas'
            });
        }

        // Vérifier si ce list mix existe déjà
        const [existingMix] = await connection.execute(
            'SELECT * FROM vicidial_campaigns_list_mix WHERE campaign_id = ? AND vcl_name = ?',
            [campaign_id, vcl_name]
        );

        if (existingMix.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Un list mix avec ce nom existe déjà pour cette campagne'
            });
        }

        // Générer un ID unique pour vcl_id (par exemple, combinaison de campaign_id et timestamp)
        const vcl_id = `${campaign_id}_${Date.now()}`;

        // Insérer le nouveau list mix
        const query = `
            INSERT INTO vicidial_campaigns_list_mix (
                vcl_id,
                vcl_name,
                campaign_id,
                list_mix_container,
                mix_method,
                status
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await connection.execute(query, [
            vcl_id,
            vcl_name,
            campaign_id,
            list_mix_container,
            mix_method,
            status
        ]);

        // Mettre à jour le paramètre list_order_mix de la campagne si ce n'est pas déjà fait
        const [campaignInfo] = await connection.execute(
            'SELECT list_order_mix FROM vicidial_campaigns WHERE campaign_id = ?',
            [campaign_id]
        );

        if (campaignInfo.length > 0 && campaignInfo[0].list_order_mix === 'DISABLED') {
            await connection.execute(
                'UPDATE vicidial_campaigns SET list_order_mix = "ENABLED" WHERE campaign_id = ?',
                [campaign_id]
            );
        }

        res.status(201).json({
            success: true,
            message: 'List mix ajouté avec succès',
            data: {
                vcl_id,
                vcl_name,
                campaign_id,
                list_mix_container,
                mix_method,
                status
            }
        });

    } catch (err) {
        console.error('Erreur lors de l\'ajout du list mix:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout du list mix',
            error: err.message
        });
    }
};

exports.getListMixes = async (req, res) => {
    try {
        const { campaign_id } = req.params;

        if (!campaign_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne requis'
            });
        }

        const [listMixes] = await connection.execute(
            'SELECT * FROM vicidial_campaigns_list_mix WHERE campaign_id = ? ORDER BY vcl_id',
            [campaign_id]
        );

        res.status(200).json({
            success: true,
            data: listMixes
        });

    } catch (err) {
        console.error('Erreur lors de la récupération des list mix:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des list mix',
            error: err.message
        });
    }
};

exports.updateListMix = async (req, res) => {
    try {
        const { campaign_id, list_id } = req.params;
        const requestBody = req.body;
        console.log(requestBody);

        // Valider les paramètres requis
        if (!campaign_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne est requis'
            });
        }

        // Vérifier si le list mix existe
        const [existingMix] = await connection.execute(
            'SELECT * FROM vicidial_campaigns_list_mix WHERE campaign_id = ?',
            [campaign_id]
        );

        if (existingMix.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'List mix non trouvé'
            });
        }

        // Construire la requête SQL dynamiquement
        let updateFields = [];
        let queryParams = [];
        
        // Vérifier chaque champ individuellement
        if ('mix_rank' in requestBody) {
            updateFields.push('mix_rank = ?');
            queryParams.push(requestBody.mix_rank);
        }
        
        if ('status' in requestBody) {
            updateFields.push('status = ?');
            queryParams.push(requestBody.status);
        }
        
        if ('mix_method' in requestBody) {
            updateFields.push('mix_method = ?');
            queryParams.push(requestBody.mix_method);
        }
        
        // Si aucun champ n'est à mettre à jour, retourner un succès sans faire de requête
        if (updateFields.length === 0) {
            return res.json({
                success: true,
                message: 'Aucun champ à mettre à jour',
                data: {
                    campaign_id,
                    list_id
                }
            });
        }
        
        // Construire la requête SQL
        const query = `
            UPDATE vicidial_campaigns_list_mix
            SET ${updateFields.join(', ')}
            WHERE campaign_id = ?
        `;
        
        // Ajouter le paramètre campaign_id pour la clause WHERE
        queryParams.push(campaign_id);
        
        console.log('Query:', query);
        console.log('Params:', queryParams);
        
        // Exécuter la requête
        const [result] = await connection.execute(query, queryParams);

        res.json({
            success: true,
            message: 'List mix mis à jour avec succès',
            affectedRows: result.affectedRows,
            data: {
                campaign_id,
                list_id,
                ...requestBody
            }
        });

    } catch (err) {
        console.error('Error details:', err);
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la mise à jour du list mix'));
    }
};
exports.deleteListMix = async (req, res) => {
    try {
        const { campaign_id,  list_id } = req.params;
        console.log(req.params);
        
        console.log(`Received parameters - Campaign ID: ${campaign_id}, VCL ID: ${list_id}`);
     const vcl_id=req.params.list_id
        if (!campaign_id || !vcl_id) {
            console.log('error champs');
            return res.status(400).json({
                success: false,
                message: 'ID de campagne et ID de list mix sont requis'
            });
        }

        // Vérifier si le list mix existe
        const [existingMix] = await connection.execute(
            'SELECT * FROM vicidial_campaigns_list_mix WHERE campaign_id = ? AND vcl_id = ?',
            [campaign_id, vcl_id]
        );

        if (existingMix.length === 0) {
            console.log('error list mix');
            return res.status(404).json({
                success: false,
                message: 'List mix non trouvé'
            });
        }

        // Supprimer le list mix
        const [result] = await connection.execute(
            'DELETE FROM vicidial_campaigns_list_mix WHERE campaign_id = ? AND vcl_id = ?',
            [campaign_id, vcl_id]
        );

        if (result.affectedRows === 0) {
            console.log('error suppression');
            return res.status(404).json({
                success: false,
                message: 'Aucune suppression effectuée'
            });
        }

        // Vérifier s'il reste des list mix pour cette campagne
        const [remainingMixes] = await connection.execute(
            'SELECT COUNT(*) as count FROM vicidial_campaigns_list_mix WHERE campaign_id = ?',
            [campaign_id]
        );

        // Si plus aucun list mix, désactiver l'option list_order_mix de la campagne
        if (remainingMixes[0].count === 0) {
            console.log('deleted');
            await connection.execute(
                'UPDATE vicidial_campaigns SET list_order_mix = "DISABLED" WHERE campaign_id = ?',
                [campaign_id]
            );
        }

        res.status(200).json({
            success: true,
            message: 'List mix supprimé avec succès'
        });

    } catch (err) {
        console.error('Erreur lors de la suppression du list mix:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du list mix',
            error: err.message
        });
    }
};

exports.reorderListMixes = async (req, res) => {
    try {
        const { campaign_id } = req.params;
        const { list_mix_order } = req.body;

        if (!campaign_id || !list_mix_order || !Array.isArray(list_mix_order)) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne et ordre des list mix (tableau) sont requis'
            });
        }

        // Vérifier que tous les list mix existent
        const [existingMixes] = await connection.execute(
            'SELECT vcl_id FROM vicidial_campaigns_list_mix WHERE campaign_id = ?',
            [campaign_id]
        );

        const existingIds = existingMixes.map(mix => mix.vcl_id);
        const allExist = list_mix_order.every(id => existingIds.includes(id));

        if (!allExist) {
            return res.status(400).json({
                success: false,
                message: 'Certains list mix dans l\'ordre spécifié n\'existent pas'
            });
        }

        // Utiliser une transaction pour garantir l'intégrité des données
        await connection.beginTransaction();

        try {
            // Mettre à jour l'ordre des list mix
            for (let i = 0; i < list_mix_order.length; i++) {
                await connection.execute(
                    'UPDATE vicidial_campaigns_list_mix SET mix_rank = ? WHERE campaign_id = ? AND vcl_id = ?',
                    [i + 1, campaign_id, list_mix_order[i]]
                );
            }

            await connection.commit();

            res.status(200).json({
                success: true,
                message: 'Ordre des list mix mis à jour avec succès'
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        }

    } catch (err) {
        console.error('Erreur lors de la réorganisation des list mix:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la réorganisation des list mix',
            error: err.message
        });
    }
};

exports.getCampaignLists = async (req, res) => {
    try {
        const { campaign_id } = req.params;

        if (!campaign_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne requis'
            });
        }

        // Récupérer toutes les listes associées à cette campagne
        const [lists] = await connection.execute(
            `SELECT l.list_id, l.list_name 
             FROM vicidial_lists l
             JOIN vicidial_campaigns c ON l.campaign_id = c.campaign_id
             WHERE c.campaign_id = ?`,
            [campaign_id]
        );

        res.status(200).json({
            success: true,
            data: lists
        });

    } catch (err) {
        console.error('Erreur lors de la récupération des listes de la campagne:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des listes de la campagne',
            error: err.message
        });
    }
};
// Mettre à jour un list mix existant
exports.updateListMix = async (req, res) => {
    try {
        const { campaign_id, list_id } = req.params;
        const requestBody = req.body;
        console.log(requestBody);

        // Valider les paramètres requis
        if (!campaign_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne est requis'
            });
        }

        // Vérifier si le list mix existe
        const [existingMix] = await connection.execute(
            'SELECT * FROM vicidial_campaigns_list_mix WHERE campaign_id = ?',
            [campaign_id]
        );

        if (existingMix.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'List mix non trouvé'
            });
        }

        // Construire la requête SQL dynamiquement
        let updateFields = [];
        let queryParams = [];
        
        // Vérifier chaque champ individuellement
        if ('mix_rank' in requestBody) {
            updateFields.push('mix_rank = ?');
            queryParams.push(requestBody.mix_rank);
        }
        
        if ('active' in requestBody) {
            updateFields.push('active = ?');
            queryParams.push(requestBody.active);
        }
        
        if ('mix_method' in requestBody) {
            updateFields.push('mix_method = ?');
            queryParams.push(requestBody.mix_method);
        }
        
        // Si aucun champ n'est à mettre à jour, retourner un succès sans faire de requête
        if (updateFields.length === 0) {
            return res.json({
                success: true,
                message: 'Aucun champ à mettre à jour',
                data: {
                    campaign_id,
                    list_id
                }
            });
        }
        
        // Construire la requête SQL
        const query = `
            UPDATE vicidial_campaigns_list_mix
            SET ${updateFields.join(', ')}
            WHERE campaign_id = ?
        `;
        
        // Ajouter le paramètre campaign_id pour la clause WHERE
        queryParams.push(campaign_id);
        
        console.log('Query:', query);
        console.log('Params:', queryParams);
        
        // Exécuter la requête
        const [result] = await connection.execute(query, queryParams);

        res.json({
            success: true,
            message: 'List mix mis à jour avec succès',
            affectedRows: result.affectedRows,
            data: {
                campaign_id,
                list_id,
                ...requestBody
            }
        });

    } catch (err) {
        console.error('Error details:', err);
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la mise à jour du list mix'));
    }
};


// Réorganiser les rangs des list mix
exports.reorderListMix = async (req, res) => {
    try {
        const { campaign_id } = req.params;
        const { list_mix_order } = req.body;

        if (!campaign_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne requis'
            });
        }

        if (!Array.isArray(list_mix_order) || list_mix_order.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Un tableau d\'IDs de liste est requis pour la réorganisation'
            });
        }

        // Vérifier que tous les list_id existent pour cette campagne
        const listIds = list_mix_order.map(id => id.toString());
        const placeholders = listIds.map(() => '?').join(',');
        
        const [existingMixes] = await connection.execute(
            `SELECT list_id FROM vicidial_campaigns_list_mix 
             WHERE campaign_id = ? AND list_id IN (${placeholders})`,
            [campaign_id, ...listIds]
        );

        if (existingMixes.length !== listIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Certains IDs de liste ne sont pas valides pour cette campagne'
            });
        }

        // Mettre à jour les rangs en fonction de l'ordre fourni
        const updatePromises = list_mix_order.map((list_id, index) => {
            return connection.execute(
                'UPDATE vicidial_campaigns_list_mix SET mix_rank = ? WHERE campaign_id = ? AND list_id = ?',
                [index + 1, campaign_id, list_id]
            );
        });

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: 'Ordre des list mix mis à jour avec succès',
            data: {
                campaign_id,
                new_order: list_mix_order.map((list_id, index) => ({
                    list_id,
                    mix_rank: index + 1
                }))
            }
        });

    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la réorganisation des list mix'));
    }
};

// Mettre à jour une campagne
exports.updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne requis'
            });
        }

        // Vérifier si la campagne existe
        const [existingCampaign] = await connection.execute(
            'SELECT * FROM vicidial_campaigns WHERE campaign_id = ?',
            [id]
        );

        if (existingCampaign.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Campagne non trouvée'
            });
        }

        // Mettre à jour la date de modification
        updateData.campaign_changedate = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Construire la requête de mise à jour dynamiquement
        const fields = Object.keys(updateData)
            .filter(key => key !== 'campaign_id') // Ne pas mettre à jour l'ID
            .map(key => `${key} = ?`);
        
        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucune donnée fournie pour la mise à jour'
            });
        }

        const query = `
            UPDATE vicidial_campaigns
            SET ${fields.join(', ')}
            WHERE campaign_id = ?
        `;

        // Préparer les valeurs pour la mise à jour
        const values = [
            ...Object.keys(updateData)
                .filter(key => key !== 'campaign_id')
                .map(key => updateData[key]),
            id
        ];

        const [result] = await connection.execute(query, values);

        res.json({
            success: true,
            message: 'Campagne mise à jour avec succès',
            affectedRows: result.affectedRows
        });

    } catch (err) {
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la mise à jour de la campagne'));
    }
};

//get pause code of campaign
exports.getCampaignPauseCodes = async (req, res) => {
    try {
        const { campaign_id } = req.params;
        if (!campaign_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne requis'
            });
        }
        const [rows] = await connection.execute(
            'SELECT pause_code,pause_code_name,billable,campaign_id FROM vicidial_pause_codes WHERE campaign_id = ?', 
            [campaign_id]
        );
        res.json({
            success: true,
            data: rows,
            message: rows.length === 0 ? 'Aucun code de pause trouvé pour cette campagne' : null
        });
    } catch (err) { 
        res.status(500).json(formatErrorResponse(err, 'Erreur lors de la récupération des codes de pause'));
    }
};  