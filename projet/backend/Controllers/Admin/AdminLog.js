const connection = require('../../config/bd');

// Fetch recent admin log activity for the currently logged-in user
exports.getRecentAdminLog = async (req, res) => {
    try {
        const username = req.user?.user;
        if (!username) {
            return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
        }
        // Limit to the 20 most recent events for this user
        const [rows] = await connection.execute(
            `SELECT admin_log_id, event_date, user, ip_address, event_section, event_type, record_id, event_code, event_notes, user_group
             FROM vicidial_admin_log
             WHERE user = ?
             ORDER BY event_date DESC
             LIMIT 20`,
            [username]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des activités récentes', error: err.message });
    }
};
