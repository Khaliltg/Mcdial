// backend/Routes/Admin/agentTimeRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../../config/bd');

router.post('/submit', async (req, res) => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required' });
  }

  try {
    // 1) Récupérer la liste des agents
    const [agents] = await db.query(`
      SELECT user 
      FROM vicidial_users
      WHERE user_level >= 1
    `);

    const agentData = [];

    for (const { user } of agents) {
      // 2) Statistiques d'appels
      const [[callStats]] = await db.query(`
        SELECT
          COUNT(*)            AS calls,
          COALESCE(SUM(talk_sec),0)   AS talkTime,
          COALESCE(SUM(wait_sec),0)   AS waitTime,
          COALESCE(SUM(dispo_sec),0)  AS dispoTime,
          COALESCE(SUM(pause_sec),0)  AS pauseTime,
          COALESCE(SUM(dead_sec),0)   AS deadTime
        FROM vicidial_agent_log
        WHERE user = ?
          AND event_time BETWEEN ? AND ?
      `, [user, startDate, endDate]);

      // 3) Durée de connexion (LOGIN→LOGOUT)
      let loginTime = '00:00:00';
      try {
        // Nécessite MySQL 8+ pour LEAD()
        const [[timeStats]] = await db.query(`
          SELECT
            SEC_TO_TIME(
              SUM(
                TIMESTAMPDIFF(
                  SECOND,
                  event_date,
                  next_event_date
                )
              )
            ) AS loginTime
          FROM (
            SELECT
              event_date,
              LEAD(event_date) OVER (
                PARTITION BY user
                ORDER BY event_date
              ) AS next_event_date,
              status
            FROM vicidial_timeclock_log
            WHERE user = ?
              AND event_date BETWEEN ? AND ?
          ) AS t
          WHERE status = 'LOGIN'
        `, [user, startDate, endDate]);

        if (timeStats.loginTime) {
          loginTime = timeStats.loginTime;
        }
      } catch (err) {
        console.warn(`Timeclock calculation failed for user=${user}, defaulting to 00:00:00`, err);
        // on garde loginTime='00:00:00'
      }

      // 4) Empiler les données de l'agent
      agentData.push({
        username:  user,
        calls:     callStats.calls      || 0,
        waitTime:  callStats.waitTime  || 0,
        talkTime:  callStats.talkTime  || 0,
        dispoTime: callStats.dispoTime || 0,
        pauseTime: callStats.pauseTime || 0,
        deadTime:  callStats.deadTime  || 0,
        loginTime
      });
    }

    // 5) On renvoie tout dans reportData
    return res.json({ reportData: agentData });

  } catch (error) {
    console.error('Error in /api/agent-time/submit:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
