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
        const [results, fields] = await db.query('SELECT * FROM vicidial_list');  // Using .query() with promises
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
