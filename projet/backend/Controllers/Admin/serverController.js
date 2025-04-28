const db = require('../../config/bd'); // ajuster le chemin si nécessaire

exports.getAllServers = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM servers');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des serveurs' });
  }
};

exports.updateServer = async (req, res) => {
    const { id } = req.params;
    console.log(req.body.active_agent_login_server)
    const {
      server_description,
      server_ip,
      active,
      active_agent_login_server,
      asterisk_version,
      max_vicidial_trunks,
      local_gmt
    } = req.body;
  
    try {
      await db.query(
        `UPDATE servers SET 
          server_description = ?, 
          server_ip = ?, 
          active = ?, 
          active_agent_login_server = ?, 
          asterisk_version = ?, 
          max_vicidial_trunks = ?, 
          local_gmt = ?
        WHERE server_id = ?`,
        [
          server_description ,
          server_ip ,
          active ,
          active_agent_login_server ,
          asterisk_version ,
          max_vicidial_trunks ,
          local_gmt ,
          id
        ]
      );
      res.status(200).json({ message: 'Serveur mis à jour avec succès.' });
      console.log("done");
      
    } catch (error) {
      console.error('Erreur updateServer :', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour du serveur.' });
    }
  };
  
exports.addServer = async (req, res) => {
    const {
      server_description, server_ip,
      active, active_agent_login_server, asterisk_version,
      max_vicidial_trunks, local_gmt
    } = req.body;
  
    try {
      // Générer un ID de serveur unique
      // D'abord, trouver le dernier ID numérique
      const [lastServers] = await db.execute('SELECT server_id FROM servers ORDER BY server_id DESC LIMIT 1');
      
      let newServerId = 'S1001'; // ID par défaut si aucun serveur n'existe
      
      if (lastServers.length > 0) {
        const lastId = lastServers[0].server_id;
        // Si l'ID suit le format 'S' suivi d'un nombre
        if (lastId.startsWith('S') && !isNaN(lastId.substring(1))) {
          const lastNum = parseInt(lastId.substring(1));
          newServerId = `S${lastNum + 1}`;
        } else {
          // Générer un timestamp unique
          newServerId = `S${Date.now().toString().substring(7)}`;
        }
      }
      
      // Insérer avec l'ID généré
      const [result] = await db.execute(
        `INSERT INTO servers 
        (server_id, server_description, server_ip, active, active_agent_login_server, asterisk_version, max_vicidial_trunks, local_gmt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newServerId,
          server_description, 
          server_ip,
          active ? 'Y' : 'N', // Convertir le booléen en 'Y'/'N' si nécessaire
          active_agent_login_server, 
          asterisk_version,
          max_vicidial_trunks, 
          local_gmt
        ]
      );
      
      // Récupérer le serveur nouvellement créé pour le renvoyer au frontend
      const [newServer] = await db.execute('SELECT * FROM servers WHERE server_id = ?', [newServerId]);
  
      res.status(201).json(newServer[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur lors de l’ajout du serveur' });
    }
  };
  
