const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../config/bd');

/**
 * Contrôleur pour gérer l'authentification des agents en trois étapes
 */

// Étape 1: Authentification téléphonique
exports.phoneLogin = async (req, res) => {
    const { phoneLogin, phonePassword } = req.body;
    
    if (!phoneLogin || !phonePassword) {
        return res.status(400).json({ message: 'Identifiant et mot de passe téléphonique requis' });
    }
    
    try {
        // Vérifier les identifiants téléphoniques dans la table phones
        const [rows] = await db.query('SELECT * FROM phones WHERE login = ?', [phoneLogin]);
        
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Identifiants téléphoniques invalides' });
        }
        
        const phone = rows[0];
        
        // Comparer le mot de passe (en texte brut pour l'instant, à améliorer avec bcrypt)
        const valid = phonePassword === phone.pass;
        
        if (!valid) {
            return res.status(401).json({ message: 'Identifiants téléphoniques invalides' });
        }
        
        // Créer un token de session temporaire pour l'étape téléphonique
        const phoneSessionToken = jwt.sign({
            phone_id: phone.id,
            phone_login: phone.login,
            step: 'phone'
        }, process.env.JWT_SECRET, { expiresIn: '15m' }); // Courte durée pour la sécurité
        
        // Retourner le token de session téléphonique
        res.json({
            success: true,
            phoneSessionToken,
            message: 'Authentification téléphonique réussie'
        });
        
    } catch (err) {
        console.error('Erreur lors de l\'authentification téléphonique:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
};

// Étape 2: Authentification utilisateur et récupération des campagnes
exports.userLogin = async (req, res) => {
    const { userLogin, userPassword } = req.body;
    
    if (!userLogin || !userPassword) {
        return res.status(400).json({ message: 'Identifiant et mot de passe utilisateur requis' });
    }
    
    // Vérifier le token de session téléphonique
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token de session téléphonique requis' });
    }
    
    const phoneSessionToken = authHeader.split(' ')[1];
    
    try {
        // Vérifier et décoder le token de session téléphonique
        const decoded = jwt.verify(phoneSessionToken, process.env.JWT_SECRET);
        
        if (decoded.step !== 'phone') {
            return res.status(401).json({ message: 'Token de session téléphonique invalide' });
        }
        
        // Vérifier les identifiants utilisateur dans la table vicidial_users
        const [rows] = await db.query('SELECT * FROM vicidial_users WHERE user = ?', [userLogin]);
        
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Identifiants utilisateur invalides' });
        }
        
        const user = rows[0];
        
        // Comparer le mot de passe (en texte brut pour l'instant, à améliorer avec bcrypt)
        const valid = userPassword === user.pass;
        
        if (!valid) {
            return res.status(401).json({ message: 'Identifiants utilisateur invalides' });
        }
        
        // Vérifier que l'utilisateur est un agent (user_level approprié)
        if (user.user_level > 4) { // Supposons que les agents ont un user_level <= 4
            return res.status(403).json({ message: 'Accès non autorisé pour ce type d\'utilisateur' });
        }
        
        // Récupérer les campagnes disponibles pour cet utilisateur
        const [campaigns] = await db.query(`
            SELECT campaign_id as id, campaign_name as name, active 
            FROM vicidial_campaigns 
            WHERE active = 'Y'
            ORDER BY campaign_name
        `);
        
        // Créer un token de session utilisateur
        const userSessionToken = jwt.sign({
            phone_id: decoded.phone_id,
            phone_login: decoded.phone_login,
            user_id: user.user_id,
            user: user.user,
            user_level: user.user_level,
            step: 'user'
        }, process.env.JWT_SECRET, { expiresIn: '15m' }); // Courte durée pour la sécurité
        
        // Retourner le token de session utilisateur et les campagnes
        res.json({
            success: true,
            userSessionToken,
            campaigns,
            message: 'Authentification utilisateur réussie'
        });
        
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token de session téléphonique expiré ou invalide' });
        }
        
        console.error('Erreur lors de l\'authentification utilisateur:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
};

// Étape 3: Sélection de campagne et finalisation de l'authentification
exports.selectCampaign = async (req, res) => {
    const { campaignId } = req.body;
    
    if (!campaignId) {
        return res.status(400).json({ message: 'ID de campagne requis' });
    }
    
    // Vérifier le token de session utilisateur
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token de session utilisateur requis' });
    }
    
    const userSessionToken = authHeader.split(' ')[1];
    
    try {
        // Vérifier et décoder le token de session utilisateur
        const decoded = jwt.verify(userSessionToken, process.env.JWT_SECRET);
        
        if (decoded.step !== 'user') {
            return res.status(401).json({ message: 'Token de session utilisateur invalide' });
        }
        
        // Vérifier que la campagne existe et est active
        const [campaigns] = await db.query(`
            SELECT campaign_id, campaign_name, active 
            FROM vicidial_campaigns 
            WHERE campaign_id = ? AND active = 'Y'
        `, [campaignId]);
        
        if (campaigns.length === 0) {
            return res.status(404).json({ message: 'Campagne non trouvée ou inactive' });
        }
        
        // Enregistrer l'agent dans la campagne sélectionnée
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        // Vérifier si l'agent existe déjà dans vicidial_live_agents
        const [existingAgents] = await db.query(`
            SELECT agent_id 
            FROM vicidial_live_agents 
            WHERE user = ?
        `, [decoded.user]);
        
        if (existingAgents.length > 0) {
            // Mettre à jour l'agent existant
            await db.query(`
                UPDATE vicidial_live_agents 
                SET campaign_id = ?, last_update_time = ?, last_state_change = ?
                WHERE user = ?
            `, [campaignId, now, now, decoded.user]);
        } else {
            // Insérer un nouvel agent
            await db.query(`
                INSERT INTO vicidial_live_agents 
                (user, campaign_id, last_update_time, last_state_change)
                VALUES (?, ?, ?, ?)
            `, [decoded.user, campaignId, now, now]);
        }
        
        // Créer le token JWT final pour l'authentification complète
        const finalToken = jwt.sign({
            user_id: decoded.user_id,
            user: decoded.user,
            user_level: decoded.user_level,
            phone_id: decoded.phone_id,
            phone_login: decoded.phone_login,
            campaign_id: campaignId,
            campaign_name: campaigns[0].campaign_name
        }, process.env.JWT_SECRET, { expiresIn: '8h' });
        
        // Définir le cookie JWT
        res.cookie('jwt', finalToken, {
            httpOnly: true,
            maxAge: 8 * 60 * 60 * 1000, // 8 heures
            sameSite: 'none',
            secure: false, // À mettre à true en production avec HTTPS
            path: '/',
            domain: 'localhost' // À adapter en production
        });
        
        // Retourner le token final
        res.json({
            success: true,
            token: finalToken,
            user: decoded.user,
            campaign: {
                id: campaignId,
                name: campaigns[0].campaign_name
            },
            message: 'Authentification complète réussie'
        });
        
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token de session utilisateur expiré ou invalide' });
        }
        
        console.error('Erreur lors de la sélection de campagne:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
};

// Vérification de la validité du token
exports.verifyToken = async (req, res) => {
    try {
        // Le middleware auth.js a déjà vérifié le token
        res.json({ 
            valid: true,
            user: req.user
        });
    } catch (err) {
        console.error('Erreur lors de la vérification du token:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
};
