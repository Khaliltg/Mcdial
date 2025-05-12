const { fetchRealtimeData } = require('../../services/realtimeService');

exports.getRealtimeReport = async (req, res) => {
  try {
    const data = await fetchRealtimeData();
    res.json(data);
  } catch (err) {
    console.error('Erreur dans getRealtimeReport:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
