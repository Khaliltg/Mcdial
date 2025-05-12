// services/realtimeService.js
const connection = require('../config/bd');

exports.fetchRealtimeData = async () => {
  const [agents] = await connection.query(`
    SELECT 
      vla.user,
      vu.full_name,
      vla.status,
      vla.campaign_id,
      vla.extension AS station,
      vla.calls_today,
      vla.last_state_change,
      TIMESTAMPDIFF(SECOND, vla.last_state_change, NOW()) AS seconds_in_status
    FROM vicidial_live_agents vla
    JOIN vicidial_users vu ON vu.user = vla.user
    WHERE vla.status IN ('READY', 'INCALL', 'PAUSED', 'WAITING')
  `);

  const [hopper] = await connection.query(`
    SELECT COUNT(*) AS leads_in_hopper FROM vicidial_hopper
  `);

  return {
    agents,
    hopper: hopper[0]
  };
};
