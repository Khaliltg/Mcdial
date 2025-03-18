const db = require('../../config/bd');

exports.addProspect = async (req, res) => {
    const { name, phone, listId, phone_code } = req.body;
    console.log(req.body);

    // Vérification des champs requis
    if (!name || !phone || !listId || !phone_code) {
        console.log("Prob here - champs manquants");
        return res.status(400).json({ error: "Tous les champs requis ne sont pas fournis." });
    }

    try {
        console.log("Ajout du prospect :", name, phone, listId, phone_code );

        const query = `
            INSERT INTO vicidial_list (user, phone_number, list_id, phone_code)
            VALUES (?, ?, ?, ?)
        `;

        // Exécution de la requête avec les 4 valeurs correctement passées
        const [result] = await db.query(query, [name, phone, listId, phone_code]);

        res.json({ id: result.insertId, name, phone, listId, phone_code });
    } catch (err) {
        console.error("Erreur lors de l'ajout du prospect :", err);
        return res.status(500).json({ error: err.message });
    }
};
 
exports.getProspectWithUser = async (req, res) => {
    const { user } = req.body;

    if (!user) {
        return res.status(400).json({ error: "L'utilisateur est requis." });
    }

    try {
        const query = `
            SELECT * FROM vicidial_list WHERE user = ?
        `;

        const [prospects] = await db.query(query, [user]);

        if (prospects.length === 0) {
            return res.status(404).json({ message: "Aucun prospect trouvé pour cet utilisateur." });
        }

        res.json(prospects);
    } catch (err) {
        console.error("Erreur lors de la récupération des prospects :", err);
        return res.status(500).json({ error: err.message });
    }
};

