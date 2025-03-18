const db = require('../../config/bd');

exports.createList = async (req, res) => {
    const { list_id, list_name, list_description, campaign_id, active } = req.body;

    if (!list_id || !list_name || !campaign_id || active === undefined) {
        return res.status(400).json({ error: "Tous les champs requis ne sont pas fournis." });
    }

    try {
        const query = `
            INSERT INTO vicidial_lists (list_id, list_name, list_description, campaign_id, active)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [list_id, list_name, list_description, campaign_id, active]);

        res.json({ id: list_id, list_name, list_description, campaign_id, active });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.getLists = async (req, res) => {
    try {
        const [results] = await db.query('SELECT list_id, list_name, campaign_id, active FROM vicidial_lists');
        res.json(results);
    } catch (err) {
        console.error("Erreur lors de la récupération des listes : ", err);
        res.status(500).json({ error: "Erreur lors de la récupération des listes" });
    }
};

exports.getCampaigns = async (req, res) => {
    try {
        const [results] = await db.query('SELECT campaign_id, campaign_name FROM vicidial_campaigns');
        res.json(results);
    } catch (err) {
        console.error("Erreur lors de la récupération des campagnes :", err);
        res.status(500).json({ error: "Erreur lors de la récupération des campagnes" });
    }
};

exports.getListDetails = async (req, res) => {
    const { id } = req.params;

    try {
        console.log(`Récupération des détails de la liste avec ID: ${id}`);
        const [results] = await db.query('SELECT * FROM vicidial_lists WHERE list_id = ?', [id]);

        if (!results.length) {
            return res.status(404).json({ message: 'Liste non trouvée.' });
        }

        const listDetails = results[0];
        console.log("Détails de la liste récupérés :", listDetails);

        res.json(listDetails);
    } catch (err) {
        console.error("Erreur lors de la récupération des détails de la liste :", err);
        res.status(500).json({ error: "Une erreur s'est produite lors de la récupération des détails de la liste." });
    }
};

exports.getDeletedLists = async (req, res) => {
    try {
        console.log("Récupération des listes supprimées...");
        const [results] = await db.query('SELECT * FROM corbeille');
        console.log("Listes supprimées récupérées :", results);
        res.json(results);
    } catch (err) {
        console.error("Erreur lors de la récupération des listes supprimées :", err);
        res.status(500).json({ error: "Erreur lors de la récupération des listes supprimées" });
    }
};

exports.deleteList = async (req, res) => {
    const { id } = req.params;
    const listDetails = req.body;

    try {
        const insertQuery = `
            INSERT INTO corbeille (list_id, list_name, list_description, campaign_id, active)
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.query(insertQuery, [
            listDetails.list_id,
            listDetails.list_name,
            listDetails.list_description,
            listDetails.campaign_id,
            listDetails.active
        ]);

        const [result] = await db.query('DELETE FROM vicidial_lists WHERE list_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Liste non trouvée ou déjà supprimée.' });
        }

        res.status(200).json({ message: 'Liste supprimée avec succès.' });
    } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        res.status(500).json({ error: "Une erreur s'est produite." });
    }
};

exports.restoreList = async (req, res) => {
    const { id } = req.params;

    try {
        const [deletedList] = await db.query('SELECT * FROM corbeille WHERE list_id = ?', [id]);

        if (!deletedList.length) {
            return res.status(404).json({ message: 'Liste non trouvée dans la corbeille.' });
        }

        const { list_id, list_name, list_description, campaign_id, active } = deletedList[0];

        const insertQuery = `
            INSERT INTO vicidial_lists (list_id, list_name, list_description, campaign_id, active)
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.query(insertQuery, [list_id, list_name, list_description, campaign_id, active]);

        await db.query('DELETE FROM corbeille WHERE list_id = ?', [id]);

        res.json({ message: 'Liste restaurée avec succès.' });
    } catch (err) {
        console.error("Erreur lors de la restauration :", err);
        res.status(500).json({ error: "Une erreur s'est produite lors de la restauration de la liste." });
    }
};

exports.updateList = async (req, res) => {
    const { list_id, list_name, list_description, campaign_id, active } = req.body;

    if (!list_id || !list_name || !campaign_id || active === undefined) {
        return res.status(400).json({ error: "Tous les champs requis ne sont pas fournis." });
    }

    try {
        const query = `
            UPDATE vicidial_lists
            SET list_name = ?, list_description = ?, campaign_id = ?, active = ?
            WHERE list_id = ?
        `;
        const [result] = await db.query(query, [list_name, list_description, campaign_id, active, list_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Liste non trouvée ou non modifiée.' });
        }

        res.json({ list_id, list_name, list_description, campaign_id, active });
    } catch (err) {
        console.error("Erreur lors de la mise à jour de la liste :", err);
        res.status(500).json({ error: "Une erreur s'est produite lors de la mise à jour de la liste." });
    }
};
exports.getListFiles = async (req, res) => {
    const { id } = req.params;

    try {
        console.log(`Récupération des fichiers de la liste avec ID: ${id}`);
        const [results] = await db.query(`
            SELECT
                lead_id,
                entry_date,
                modify_date,
                status,
                user,
                vendor_lead_code,
                source_id,
                list_id,
                gmt_offset_now,
                called_since_last_reset,
                phone_code,
                phone_number,
                title,
                first_name,
                middle_initial,
                last_name,
                address1,
                address2,
                address3,
                city,
                state,
                province,
                postal_code,
                country_code,
                gender,
                date_of_birth,
                alt_phone,
                email,
                security_phrase,
                comments,
                called_count,
                last_local_call_time,
                rank,
                owner,
                entry_list_id
            FROM vicidial_list
            WHERE list_id = ?
        `, [id]);

        if (!results.length) {
            return res.status(404).json({ message: 'Aucun fichier trouvé pour cette liste.' });
        }

        console.log("Fichiers récupérés :", results); // Log pour le débogage
        res.json(results);
    } catch (err) {
        console.error("Erreur lors de la récupération des fichiers de la liste :", err);
        res.status(500).json({ error: "Une erreur s'est produite lors de la récupération des fichiers de la liste." });
    }
};

