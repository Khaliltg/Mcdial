const db = require('../../config/bd');

// GET /api/admin/carriers
exports.getCarriers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vicidial_server_carriers');
    res.json(rows);
  } catch (err) {
    console.error('Erreur getCarriers :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /api/admin/carriers/:id
exports.updateCarrier = async (req, res) => {
    const { id } = req.params;
    const {
      carrier_name,
      server_ip,
      protocol,
      registration_string,
      active,
      user_group
    } = req.body;
  
    try {
      await db.query(
        `UPDATE vicidial_server_carriers
         SET carrier_name = ?, server_ip = ?, protocol = ?, registration_string = ?, active = ?, user_group = ?
         WHERE carrier_id = ?`,
        [
          carrier_name ?? null,
          server_ip ?? null,
          protocol ?? null,
          registration_string ?? null,
          active ? 'Y' : 'N',
          user_group ?? null,
          id
        ]
      );
      res.status(200).json({ message: 'Carrier mis à jour.' });
    } catch (err) {
      console.error('Erreur updateCarrier :', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };
  
// POST /api/admin/carriers
exports.addCarrier = async (req, res) => {
  try {
    const {
      carrier_id,
      carrier_name,
      server_ip,
      protocol,
      registration_string,
      active,
      user_group
    } = req.body;

    if (!carrier_id) {
      return res.status(400).json({ message: "carrier_id est requis." });
    }

    await db.query(
      `INSERT INTO vicidial_server_carriers 
        (carrier_id, carrier_name, server_ip, protocol, registration_string, active, user_group)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        carrier_id,
        carrier_name ?? null,
        server_ip ?? null,
        protocol ?? null,
        registration_string ?? null,
        active ? 'Y' : 'N',
        user_group ?? null
      ]
    );

    res.status(201).json({
      carrier_id,
      carrier_name,
      server_ip,
      protocol,
      registration_string,
      active: active ? 'Y' : 'N',
      user_group
    });
  } catch (err) {
    console.error('Erreur ajout carrier :', err);
    res.status(500).json({ message: err.sqlMessage || "Erreur serveur lors de l'ajout du carrier." });
  }
};

