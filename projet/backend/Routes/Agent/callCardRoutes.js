const express = require('express');
const router = express.Router();
const db = require('../../config/bd');
const { authenticateToken } = require('../../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Constantes pour les statuts de carte (compatibles avec Vicidial)
const CARD_STATUS = {
  GENERATE: 'GENERATE',
  PRINT: 'PRINT',
  SHIP: 'SHIP',
  HOLD: 'HOLD',
  ACTIVE: 'ACTIVE',
  USED: 'USED',
  EXPIRED: 'EXPIRED'
};

/**
 * @route   GET /api/callcard/search
 * @desc    Rechercher une carte d'appel par PIN
 * @access  Private (agents seulement)
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { pin } = req.query;

    if (!pin) {
      return res.status(400).json({ message: 'Le code PIN est requis' });
    }

    // Recherche dans la table callcard_accounts de Vicidial
    const [callcards] = await db.query(
      `SELECT 
        card_id as id, 
        pin, 
        balance_minutes as balance, 
        status,
        inbound_group_id
      FROM callcard_accounts 
      WHERE pin = ?`,
      [pin]
    );
    
    // Si des cartes sont trouvées, récupérer les détails supplémentaires
    if (callcards && callcards.length > 0) {
      for (let i = 0; i < callcards.length; i++) {
        const [details] = await db.query(
          `SELECT 
            note_name as customer_name,
            note_did as customer_phone,
            DATE_FORMAT(used_time, '%Y-%m-%d %H:%i:%s') as last_used,
            DATE_FORMAT(create_time, '%Y-%m-%d %H:%i:%s') as created_date,
            note_comments,
            note_language
          FROM callcard_accounts_details 
          WHERE card_id = ?`,
          [callcards[i].id]
        );
        
        if (details && details.length > 0) {
          callcards[i] = { ...callcards[i], ...details[0] };
        }
      }
    }

    // Si des cartes sont trouvées, récupérer l'historique des appels pour chaque carte
    if (callcards && callcards.length > 0) {
      for (let i = 0; i < callcards.length; i++) {
        const [callHistory] = await db.query(
          `SELECT 
            uniqueid as call_id,
            phone_number,
            inbound_did,
            balance_minutes_start,
            DATE_FORMAT(call_time, '%Y-%m-%d %H:%i:%s') as call_time,
            agent_talk_sec as talk_time,
            agent as agent_id
          FROM callcard_log 
          WHERE card_id = ? 
          ORDER BY call_time DESC 
          LIMIT 10`,
          [callcards[i].id]
        );
        callcards[i].call_history = callHistory || [];
      }
    }

    return res.json({ callcards });
  } catch (err) {
    console.error('Erreur lors de la recherche de carte d\'appel:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/callcard/create
 * @desc    Créer une nouvelle carte d'appel
 * @access  Private (agents seulement)
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { 
      pin, 
      balance, 
      customer_name, 
      customer_phone, 
      inbound_group_id 
    } = req.body;

    // Validation
    if (!pin) {
      return res.status(400).json({ message: 'Le code PIN est requis' });
    }

    if (balance <= 0) {
      return res.status(400).json({ message: 'Le solde doit être supérieur à zéro' });
    }

    // Vérifier si le PIN existe déjà
    const [existingCards] = await db.query(
      'SELECT card_id FROM callcard_accounts WHERE pin = ?',
      [pin]
    );

    if (existingCards.length > 0) {
      return res.status(400).json({ message: 'Ce code PIN existe déjà' });
    }

    // Générer un ID unique pour la carte (format compatible avec Vicidial)
    const cardId = `MC${Date.now().toString().substring(3, 10)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // Insérer la nouvelle carte dans callcard_accounts
    await db.query(
      `INSERT INTO callcard_accounts 
        (card_id, pin, balance_minutes, status, inbound_group_id) 
      VALUES 
        (?, ?, ?, ?, ?)`,
      [
        cardId,
        pin,
        balance,
        CARD_STATUS.ACTIVE,
        inbound_group_id || 'default'
      ]
    );

    // Créer un enregistrement détaillé pour cette carte dans callcard_accounts_details
    await db.query(
      `INSERT INTO callcard_accounts_details 
        (card_id, status, balance_minutes, initial_minutes, note_name, note_did, note_comments, create_user, create_time, note_language) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'French')`,
      [cardId, CARD_STATUS.ACTIVE, balance, balance, customer_name || null, customer_phone || null, 'Créé via McDial', req.user.id]
    );

    return res.status(201).json({ 
      message: 'Carte d\'appel créée avec succès',
      cardId
    });
  } catch (err) {
    console.error('Erreur lors de la création de carte d\'appel:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/callcard/update
 * @desc    Mettre à jour le solde d'une carte d'appel
 * @access  Private (agents seulement)
 */
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const { id, balance, status, inbound_group_id, customer_name, customer_phone, expiration_date } = req.body;

    // Validation
    if (!id) {
      return res.status(400).json({ message: 'L\'ID de la carte est requis' });
    }

    if (balance !== undefined && balance < 0) {
      return res.status(400).json({ message: 'Le solde ne peut pas être négatif' });
    }

    // Vérifier si la carte existe dans callcard_accounts
    const [existingCards] = await db.query(
      'SELECT card_id, balance_minutes as balance FROM callcard_accounts WHERE card_id = ?',
      [id]
    );

    if (existingCards.length === 0) {
      return res.status(404).json({ message: 'Carte d\'appel non trouvée' });
    }

    const oldBalance = existingCards[0].balance;

    // Construire la requête de mise à jour dynamiquement pour callcard_accounts
    let updateQuery = 'UPDATE callcard_accounts SET updated_by = ?';
    const queryParams = [req.user.id];

    if (balance !== undefined) {
      updateQuery += ', balance_minutes = ?';
      queryParams.push(balance);
    }

    if (status) {
      updateQuery += ', status = ?';
      queryParams.push(status);
    }

    if (inbound_group_id) {
      updateQuery += ', inbound_group_id = ?';
      queryParams.push(inbound_group_id);
    }

    if (customer_name) {
      updateQuery += ', customer_name = ?';
      queryParams.push(customer_name);
    }

    if (customer_phone) {
      updateQuery += ', customer_phone = ?';
      queryParams.push(customer_phone);
    }

    if (expiration_date) {
      updateQuery += ', expiration_date = ?';
      queryParams.push(expiration_date);
    }

    updateQuery += ' WHERE card_id = ?';
    queryParams.push(id);

    // Exécuter la mise à jour dans callcard_accounts
    await db.query(updateQuery, queryParams);
    
    // Mettre à jour les détails si nécessaire
    if (customer_name || customer_phone) {
      let detailsQuery = 'UPDATE callcard_accounts_details SET ';
      const detailsParams = [];
      
      if (customer_name) {
        detailsQuery += 'note_name = ?';
        detailsParams.push(customer_name);
      }
      
      if (customer_phone) {
        if (customer_name) detailsQuery += ', ';
        detailsQuery += 'note_did = ?';
        detailsParams.push(customer_phone);
      }
      
      detailsQuery += ' WHERE card_id = ?';
      detailsParams.push(id);
      
      await db.query(detailsQuery, detailsParams);
    }

    return res.json({ 
      message: 'Carte d\'appel mise à jour avec succès'
    });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la carte d\'appel:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   POST /api/callcard/log-call
 * @desc    Enregistrer un appel effectué avec une carte d'appel
 * @access  Private (agents seulement)
 */
router.post('/log-call', authenticateToken, async (req, res) => {
  try {
    const { card_id, phone_number, inbound_did, talk_time } = req.body;

    // Validation
    if (!card_id) {
      return res.status(400).json({ message: 'L\'ID de la carte est requis' });
    }

    if (!phone_number) {
      return res.status(400).json({ message: 'Le numéro de téléphone est requis' });
    }

    // Vérifier si la carte existe et est active dans callcard_accounts
    const [cards] = await db.query(
      'SELECT card_id, balance_minutes as balance, status FROM callcard_accounts WHERE card_id = ? AND status IN (?, ?)',
      [card_id, CARD_STATUS.ACTIVE, CARD_STATUS.USED]
    );

    if (cards.length === 0) {
      return res.status(404).json({ message: 'Carte d\'appel non trouvée ou inactive' });
    }

    const card = cards[0];
    const balanceBeforeCall = card.balance;
    
    // Calculer le temps d'appel en minutes (arrondi à la minute supérieure)
    const talkTimeMinutes = Math.ceil(talk_time / 60);
    
    // Vérifier si le solde est suffisant
    if (balanceBeforeCall < talkTimeMinutes) {
      return res.status(400).json({ message: 'Solde insuffisant pour cet appel' });
    }
    
    // Calculer le nouveau solde
    const newBalance = balanceBeforeCall - talkTimeMinutes;
    
    // Mettre à jour le statut de la carte si c'est le premier appel
    const newStatus = card.status === CARD_STATUS.ACTIVE ? CARD_STATUS.USED : card.status;
    
    // Mettre à jour la carte dans callcard_accounts
    await db.query(
      `UPDATE callcard_accounts 
      SET balance_minutes = ?, 
          status = ?,
          updated_by = ?
      WHERE card_id = ?`,
      [newBalance, newStatus, req.user.id, card_id]
    );
    
    // Mettre à jour les détails de la carte dans callcard_accounts_details
    await db.query(
      `UPDATE callcard_accounts_details 
      SET used_time = NOW(),
          used_user = ?,
          balance_minutes = ?
      WHERE card_id = ?`,
      [req.user.id, newBalance, card_id]
    );
    
    // Enregistrer l'appel dans le journal callcard_log
    const uniqueId = `MC${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const callTime = new Date();
    const endTime = new Date(callTime.getTime() + (talk_time * 1000));
    
    const [result] = await db.query(
      `INSERT INTO callcard_log 
        (uniqueid, card_id, phone_number, inbound_did, balance_minutes_start, call_time, end_time, agent_id) 
      VALUES 
        (?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [uniqueId, card_id, phone_number, inbound_did || null, balanceBeforeCall, endTime, req.user.id]
    );

    return res.status(201).json({ 
      message: 'Appel enregistré avec succès',
      call_id: result.insertId,
      new_balance: newBalance
    });
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement de l\'appel:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @route   GET /api/callcard/stats
 * @desc    Obtenir des statistiques sur les cartes d'appel
 * @access  Private (agents seulement)
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Statistiques globales depuis callcard_accounts
    const [totalStats] = await db.query(
      `SELECT 
        COUNT(*) as total_cards,
        SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as active_cards,
        SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as used_cards,
        SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as hold_cards,
        SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as expired_cards,
        SUM(balance_minutes) as total_minutes_remaining
      FROM callcard_accounts`,
      [CARD_STATUS.ACTIVE, CARD_STATUS.USED, CARD_STATUS.HOLD, CARD_STATUS.EXPIRED]
    );

    // Statistiques des appels récents depuis callcard_log
    const [callStats] = await db.query(
      `SELECT 
        COUNT(*) as total_calls,
        SUM(TIMESTAMPDIFF(SECOND, call_time, end_time)) as total_talk_time,
        AVG(TIMESTAMPDIFF(SECOND, call_time, end_time)) as avg_talk_time,
        MAX(TIMESTAMPDIFF(SECOND, call_time, end_time)) as max_talk_time
      FROM callcard_log 
      WHERE call_time > DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    // Statistiques par jour (7 derniers jours)
    const [dailyStats] = await db.query(
      `SELECT 
        DATE(call_time) as call_date,
        COUNT(*) as call_count,
        SUM(TIMESTAMPDIFF(SECOND, call_time, end_time)) as total_talk_time
      FROM callcard_log 
      WHERE call_time > DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(call_time)
      ORDER BY call_date DESC`
    );

    return res.json({ 
      card_stats: totalStats[0],
      call_stats: callStats[0],
      daily_stats: dailyStats
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des statistiques:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
