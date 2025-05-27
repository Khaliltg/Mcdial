const connection = require('../../config/bd');

const getRealtimeStats = async (req, res) => {
  try {
    // Total appels en cours
    const [[calls]] = await connection.query(`
      SELECT COUNT(*) AS total_calls
      FROM vicidial_live_agents
      WHERE status IN ('INCALL', 'QUEUE')
    `);

    // Campagnes actives
    const [[campaignsCount]] = await connection.query(`
      SELECT COUNT(*) AS active_campaigns
      FROM vicidial_campaigns
      WHERE active = 'Y'
    `);

    // Appels complétés
    const [[completed]] = await connection.query(`
      SELECT COUNT(*) AS completed_calls
      FROM vicidial_log
    `);

    // Appels avec succès
    const [[success]] = await connection.query(`
      SELECT COUNT(*) AS successful_calls
      FROM vicidial_log
      WHERE status IN ('SALE', 'SUCCESS')
    `);

    const successRate = completed.completed_calls > 0
      ? Math.round((success.successful_calls / completed.completed_calls) * 100)
      : 0;

    res.json({
      totalCalls: calls.total_calls,
      activeCampaigns: campaignsCount.active_campaigns,
      completedCalls: completed.completed_calls,
      successRate,
    });
  } catch (error) {
    console.error('Erreur dans getRealtimeStats :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getRealtimeStats,
};
