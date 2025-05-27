const db = require('../../config/bd');

exports.getTimeclockReport = async (req, res) => {
  
  try {
      console.log("test");

    const { startDate, endDate, userGroup, user, order } = req.query;

    let query = `
      SELECT 
        vtl.user,
        vu.full_name,
        SUM(vtl.login_sec) AS total_seconds
      FROM vicidial_timeclock_log vtl
      JOIN vicidial_users vu ON vu.user = vtl.user
      WHERE vtl.event_date BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    if (user && user !== '') {
      query += ' AND vtl.user = ?';
      params.push(user);
    }

    if (userGroup && userGroup !== '-ALL-') {
      query += ' AND vu.user_group = ?';
      params.push(userGroup);
    }

    query += ' GROUP BY vtl.user';

    if (order === 'hours_down') {
      query += ' ORDER BY total_seconds DESC';
    } else {
      query += ' ORDER BY total_seconds ASC';
    }

    const [rows] = await db.query(query, params);

    res.json({ data: rows });
    console.log({ data: rows });
    
  } catch (error) {
    console.error('Erreur lors de la génération du rapport timeclock:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
