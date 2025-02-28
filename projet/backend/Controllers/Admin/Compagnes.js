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
