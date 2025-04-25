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
      server_id, server_description, server_ip,
      active, agent, asterisk_version,
      max_vicidial_trunks, local_gmt
    } = req.body;
  
    try {
      const [result] = await db.execute(
        `INSERT INTO servers 
        (server_id, server_description, server_ip, active, agent, asterisk_version, max_vicidial_trunks, local_gmt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          server_id, server_description, server_ip,
          active, agent, asterisk_version,
          max_vicidial_trunks, local_gmt
        ]
      );
  
      res.status(201).json({ message: 'Serveur ajouté avec succès', server_id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur lors de l’ajout du serveur' });
    }
  };
  
