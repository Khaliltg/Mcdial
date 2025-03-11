const db = require('../../config/bd')


exports.createList = async (req, res) => {
    const { list_id, list_name, list_description, campaign_id, active } = req.body;

    if (!list_id || !list_name || !campaign_id || !active) {
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

// Récupérer toutes les listes// Récupérer toutes les listes
// Récupérer toutes les listes
exports.getLists = async (req, res) => {
    try {
        const [results, fields] = await db.query('SELECT * FROM vicidial_lists');  // Using .query() with promises
        res.json(results);
    } catch (err) {
        console.error("Erreur lors de la récupération des listes : ", err);
        res.status(500).json({ error: "Erreur lors de la récupération des listes" });
    }
};


// Récupérer tous les prospects
exports.getProspects = async (req, res) => {
    try {
        const [results, fields] = await db.query('SELECT * FROM prospects');
        res.json(results);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Ajouter un prospect
exports.createProspect = async (req, res) => {
    const { name, phone, listId } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO prospects (name, phone, listId) VALUES (?, ?, ?)', 
            [name, phone, listId]
        );
        res.json({ id: result.insertId, name, phone, listId });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
// get list by id 



exports.getListById = async (req, res) => {
    const { id } = req.params;
    console.log('Received list_id:', id); // Log the received list_id

    try {
        // Query to get the list details
        const [listResult] = await db.query('SELECT * FROM vicidial_lists WHERE list_id = ?', [id]);

        if (!listResult.length) {
            return res.status(404).json({ message: 'List not found.' });
        }

        const listDetails = listResult[0];

        // Queries to gather additional data
        const gmtOffsetQuery = `
            SELECT gmt_offset_now, called_since_last_reset, COUNT(*) as count 
            FROM vicidial_list 
            WHERE list_id = ? 
            GROUP BY gmt_offset_now, called_since_last_reset 
            ORDER BY gmt_offset_now, called_since_last_reset`;

        const statusQuery = `
            SELECT status, called_since_last_reset, COUNT(*) as count 
            FROM vicidial_list 
            WHERE list_id = ? 
            GROUP BY status, called_since_last_reset 
            ORDER BY status, called_since_last_reset`;

        const ownerQuery = `
            SELECT owner, called_since_last_reset, COUNT(*) as count 
            FROM vicidial_list 
            WHERE list_id = ? 
            GROUP BY owner, called_since_last_reset 
            ORDER BY owner, called_since_last_reset`;

        const fieldsCountQuery = 'SELECT COUNT(*) as count FROM vicidial_lists_fields WHERE list_id = ?';

        // Execute all queries in parallel
        const [gmtOffsetResult, statusResult, ownerResult, fieldsCountResult] = await Promise.all([
            db.query(gmtOffsetQuery, [id]),
            db.query(statusQuery, [id]),
            db.query(ownerQuery, [id]),
            db.query(fieldsCountQuery, [id])
        ]).catch(err => {
            console.error('Error executing one of the queries:', err);
            return [[], [], [], [{ count: 0 }]]; // Return empty arrays and a default count
        });

        // Extract the actual data rows from each result
        const gmtOffsets = gmtOffsetResult[0] || []; // Get the first element for actual data
        const statuses = statusResult[0] || [];
        const owners = ownerResult[0] || [];

        console.log('GMT Offset Result:', gmtOffsets); // Log the results for debugging

        // Prepare the response
        const response = {
            listDetails,
            gmtOffsets,
            statuses,
            owners,
            fieldsCount: fieldsCountResult[0].count // Access the count directly
        };

        res.json(response);
    } catch (err) {
        console.error('Error retrieving list by ID:', err);
        res.status(500).json({ message: 'An error occurred, please try again later.' });
    }
};


exports.updateList = async (req, res) => {
    const { id } = req.params;
    const fields = req.body;

    if (Object.keys(fields).length === 0) {
        return res.status(400).json({ error: "Aucun champ fourni pour la mise à jour." });
    }

    try {
        // Construire dynamiquement la requête
        const updates = Object.keys(fields).map((key) => `${key} = ?`).join(", ");

        const values = Object.values(fields);
        values.push(id); // Ajouter l'ID à la fin pour la clause WHERE

        const query = `UPDATE vicidial_lists SET ${updates} WHERE list_id = ?`;

        await db.query(query, values);

        res.json({ message: "Liste mise à jour avec succès." });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};


exports.softDeleteList = async (req, res) => {
    const { id } = req.params;
    try {
        // Marquer l'élément comme supprimé en mettant à jour la colonne deleted_at
        await db.query('UPDATE vicidial_lists SET deleted_at = NOW() WHERE list_id = ?', [id]);
        res.status(200).json({ message: 'Liste supprimée avec succès (soft delete)' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression', error });
    }
};

exports.getDeletedLists = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM corbeille ');
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors de la récupération des listes supprimées :", err);
        res.status(500).json({ error: "Une erreur s'est produite." });
    }
};
exports.restoreList = async (req, res) => {
    const { id } = req.params;

    try {
        // Récupérer les détails de la liste depuis la corbeille
        const [deletedList] = await db.query('SELECT * FROM corbeille WHERE list_id = ?', [id]);

        if (!deletedList.length) {
            return res.status(404).json({ message: 'Liste non trouvée dans la corbeille.' });
        }

        const { list_id, list_name, list_description, campaign_id, active } = deletedList[0];

        // Insérer la liste dans vicidial_lists
        const insertQuery = `
            INSERT INTO vicidial_lists (list_id, list_name, list_description, campaign_id, active)
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.query(insertQuery, [list_id, list_name, list_description, campaign_id, active]);

        // Supprimer la liste de la corbeille
        await db.query('DELETE FROM corbeille WHERE list_id = ?', [id]);

        res.json({ message: 'Liste restaurée avec succès.' });
    } catch (err) {
        console.error("Erreur lors de la restauration :", err);
        res.status(500).json({ error: "Une erreur s'est produite." });
    }
};

exports.deleteList = async (req, res) => {
    const { id } = req.params;
    const listDetails = req.body; // Récupérer les détails de la liste depuis le corps de la requête

    try {
        // Insérer les détails de la liste dans la table corbeille
        await db.query('INSERT INTO corbeille SET ?', listDetails);

        // Supprimer la liste de vicidial_lists
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
exports.getListDetails = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query('SELECT status, timezone, owner, rank, call_account FROM vicidial_list WHERE list_id = ?', [id]);

        if (!result.length) {
            return res.status(404).json({ message: 'Liste non trouvée.' });
        }

        res.json(result[0]); // Renvoie les détails de la liste
    } catch (err) {
        console.error('Erreur lors de la récupération des détails de la liste :', err);
        res.status(500).json({ message: 'Une erreur s\'est produite, veuillez réessayer plus tard.' });
    }
};
