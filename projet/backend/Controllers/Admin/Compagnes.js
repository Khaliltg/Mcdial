const connection = require('../../config/bd'); // Connexion MySQL classique

// Vérifier si la compagnie existe déjà
const check = async (campaign_name) => {
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

// Ajouter une nouvelle compagnie
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

        // Vérifier si les champs requis sont présents
        if (!campaign_id || !campaign_name || !active) {
            return res.status(400).json({ message: 'Les champs requis sont manquants' });
        }

        // Vérifier si la compagnie existe déjà
        const rows = await check(campaign_name);
        if (rows.length > 0) {
            return res.status(400).json({ message: 'Cette compagnie existe déjà' });
        }

        // Date actuelle
        const SQLdate = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Requête SQL avec tous les champs
        const sql = `
            INSERT INTO vicidial_campaigns (
                campaign_id, campaign_name, campaign_description, active,
                dial_status_a, lead_order, park_ext, park_file_name, web_form_address,
                allow_closers, hopper_level, auto_dial_level, next_agent_call, local_call_time,
                voicemail_ext, campaign_script, get_call_launch, campaign_changedate,
                campaign_stats_refresh, list_order_mix, web_form_address_two, start_call_url, dispo_call_url
            ) VALUES (?, ?, ?, ?, 'NEW', 'DOWN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y', 'DISABLED', '', '', '')
        `;

        // Exécuter l'insertion
        const [result] = await connection.execute(sql, [
            campaign_id, campaign_name, campaign_description, active,
            park_ext, park_file_name, web_form_address, allow_closers,
            hopper_level, auto_dial_level, next_agent_call, local_call_time,
            voicemail_ext, campaign_script, get_call_launch, SQLdate
        ]);

        res.json({ message: 'Compagnie ajoutée avec succès', id: result.insertId });

    } catch (error) {
        console.error('Erreur serveur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer les compagnies
exports.recuperer = async (req, res) => {
    try {
        const [rows] = await connection.execute('SELECT * FROM vicidial_campaigns');
        res.json(rows);
    } catch (err) {
        console.error('Erreur SQL:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des compagnies' });
    }
};

// Afficher les compagnies avec l'id
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await connection.execute('SELECT * FROM vicidial_campaigns WHERE campaign_id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Compagnie non trouvée' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Erreur SQL:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des compagnies' });
    }
};

// Récupérer les agents de la campagne
exports.getCampaignAgents = async (req, res) => {
    try {
        const { campaign_id } = req.params;
        const [rows] = await connection.execute(
            'SELECT * FROM vicidial_campaign_agents WHERE campaign_id = ?',
            [campaign_id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Aucun agent trouvé pour cette compagnie' });
        }
        res.json(rows);
    } catch (err) {
        console.error('Erreur SQL:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des agents pour la compagnie' });
    }
};

// Nouvelle fonction pour récupérer les listes de campagne
exports.getCampaignLists = async (req, res) => {
    const { campaign_id } = req.params; // Extract campaign_id from request parameters

    try {
        const [rows] = await connection.execute(`
            SELECT vls.list_id, list_name, local_call_time, list_description, COUNT(*) AS tally, active, list_lastcalldate, campaign_id
            FROM vicidial_lists vls
            JOIN vicidial_list vl ON vls.list_id = vl.list_id
            WHERE campaign_id = ?
            GROUP BY list_id
        `, [campaign_id]); // Use parameterized query to prevent SQL injection

        res.json(rows);
    } catch (err) {
        console.error('SQL Error:', err);
        res.status(500).json({ message: 'Error retrieving campaign lists' });
    }
};

// Function to get status counts from vicidial_list based on list_ids
exports.getStatusCountsByList = async (req, res) => {
    try {
        const { list_ids } = req.params;
        console.log("Received list_ids:", list_ids);
        
        if (!list_ids) {
            return res.status(400).json({ message: 'list_ids parameter is required' });
        }

        const idArray = list_ids.split(',');
        if (idArray.length === 0) {
            return res.status(400).json({ message: 'No valid list IDs provided' });
        }

        // Query to get status counts
        const [rows] = await connection.execute(`
            SELECT status, COUNT(*) as count
            FROM vicidial_list
            WHERE list_id IN (?)
            GROUP BY status
            ORDER BY count DESC
        `, [idArray]);

        // Convert the rows to an object with status as key and count as value
        const statusCounts = rows.reduce((acc, { status, count }) => {
            acc[status] = count;
            return acc;
        }, {});

        res.json(statusCounts);
    } catch (err) {
        console.error('Erreur SQL:', err);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
    }
};

// get campagnes statues 
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
        console.error('Erreur lors de la récupération des statuts:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statuts',
            error: err.message
        });
    }
};

// Mettre à jour un statut
exports.updateStatus = async (req, res) => {
    try {
        const { campaign_id, status } = req.params;
        if (!campaign_id || !status) {
            return res.status(400).json({
                success: false,
                message: 'ID de campagne et statut requis'
            });
        }

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

        // Convert all boolean values to 'Y'/'N' and ensure numeric values are valid
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

        // Additional validation
        if (values[13] < values[12]) { // max_sec < min_sec
            values[13] = values[12]; // set max_sec equal to min_sec
        }

        await connection.execute(query, values);

        res.json({
            success: true,
            message: 'Statut mis à jour avec succès'
        });

    } catch (err) {
        console.error('Erreur lors de la mise à jour du statut:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut',
            error: err.message
        });
    }
};

// Supprimer un statut
exports.deleteStatus = async (req, res) => {
    try {
        const { campaign_id, status } = req.params;

        const query = `
            DELETE FROM vicidial_campaign_statuses 
            WHERE campaign_id = ? AND status = ?
        `;

        await connection.execute(query, [campaign_id, status]);

        res.json({
            success: true,
            message: 'Statut supprimé avec succès'
        });

    } catch (err) {
        console.error('Erreur lors de la suppression du statut:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du statut',
            error: err.message
        });
    }
};