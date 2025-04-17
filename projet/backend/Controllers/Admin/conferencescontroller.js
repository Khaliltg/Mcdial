const db = require('../../config/bd');

exports.getAllConferences = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM conferences');
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createConference = async (req, res) => {
  const { conf_exten, server_ip, extension } = req.body;
  console.log("Reçu du frontend :", req.body);
  if (!conf_exten || !server_ip || !extension ) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO conferences (conf_exten, server_ip, extension ) VALUES ( ?, ?, ?)',
      [conf_exten, server_ip, extension]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
	console.error("Erreur lors de l'insertion :", err); 
    res.status(500).json({ error: err.message });
  }
};

exports.updateConference = async (req, res) => {
  const { server_ip, extension, conf_exten } = req.body;
console.log(req.body);

  try {
    await db.query(
      'UPDATE conferences SET  server_ip = ?, extension = ? WHERE conf_exten = ?',
      [server_ip, extension, conf_exten]
    );
	console.log("updated");
	
    res.status(200).json({ message: 'Mise à jour réussie' });
  } catch (err) {
	console.log(err);
	
    res.status(500).json({ error: err.message });
  }
};


exports.getServerIPs = async (req, res) => {
	try {
	  const [rows] = await db.query('SELECT DISTINCT server_ip FROM conferences');
	  res.status(200).json(rows);
	} catch (err) {
	  res.status(500).json({ error: err.message });
	}
  };
  async function addConference() {
	message = '';
  
	const conference = newConference.conference.trim();
	const server_ip = useCustomIP ? customIP.trim() : newConference.server_ip.trim();
	const extension = newConference.extension.trim();
  
	if (!conference || !server_ip || !extension) {
	  message = 'Tous les champs sont requis!';
	  console.error('Champs manquants :', { conference, server_ip, extension });
	  return;
	}
  
	// Log des données avant l'envoi
	console.log('Données envoyées :', { conference, server_ip, extension });
  
	try {
	  const res = await fetch('http://localhost:8000/api/conferences', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ conference, server_ip, extension })
	  });
  
	  const data = await res.json();
  
	  if (!res.ok) {
		message = data.error || 'Erreur serveur';
		console.error('Erreur côté serveur :', data);
		return;
	  }
  
	  message = 'Conférence ajoutée avec succès!';
	  newConference = { conference: '', server_ip: '', extension: '' };
	  customIP = '';
	  useCustomIP = false;
	  await fetchConferences();
	  await fetchServerIPs();
	} catch (e) {
	  console.error('Erreur lors de l\'ajout de la conférence:', e);
	  message = 'Erreur réseau ou serveur.';
	}
  }
  