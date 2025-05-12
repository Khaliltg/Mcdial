// backend/Controllers/Admin/timeclockController.js

const db = require('../..'); // adapter le chemin selon ton projet

exports.getTimeclockReport = async (req, res) => {
  const { startDate, endDate, userGroup, user, order } = req.query;

  let conditions = `t.event = 'LOGOUT' AND t.event_date BETWEEN ? AND ?`;
  const params = [startDate, endDate];

  if (userGroup) {
    conditions += ' AND u.user_group = ?';
    params.push(userGroup);
  }
  if (user) {
    conditions += ' AND u.user = ?';
    params.push(user);
  }

  let orderClause = 'ORDER BY u.user ASC';
  if (order === 'name') {
    orderClause = 'ORDER BY u.full_name ASC';
  } else if (order === 'group') {
    orderClause = 'ORDER BY u.user_group ASC';
  } else if (order === 'hours_down') {
    orderClause = 'ORDER BY total_hours DESC';
  }

  const sql = `
    SELECT 
      u.user AS user, 
      u.full_name AS full_name, 
      u.user_group AS user_group,
      ROUND(SUM(t.login_sec) / 3600, 2) AS total_hours
    FROM vicidial_users AS u
    JOIN vicidial_timeclock_log AS t ON u.user = t.user
    WHERE ${conditions}
    GROUP BY u.user, u.full_name, u.user_group
    ${orderClause}
  `;

  try {
    db.query(sql, params, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Erreur SQL.' });
      }
      res.json({ success: true, data: results });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
