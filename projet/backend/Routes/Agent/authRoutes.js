const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../config/bd');
const { authenticateToken } = require('../../middleware/auth');

// Route pour l'authentification téléphonique (étape 1)
router.post('/phone-login', async (req, res) => {
    const { phoneLogin, phonePassword } = req.body;
    
    if (!phoneLogin || !phonePassword) {
        return res.status(400).json({ message: 'Identifiant et mot de passe téléphonique requis' });
    }
    
    try {
        // Vérifier les identifiants téléphoniques dans la table phones
        // Utilisation de la même structure que Vicidial
        const [rows] = await db.query('SELECT * FROM phones WHERE login = ? AND active = "Y"', [phoneLogin]);
        
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Identifiants téléphoniques invalides' });
        }
        
        const phone = rows[0];
        
        // Comparer le mot de passe (en texte brut comme dans Vicidial)
        const valid = phonePassword === phone.pass;
        
        if (!valid) {
            return res.status(401).json({ message: 'Identifiants téléphoniques invalides' });
        }
        
        // Récupérer les informations importantes du téléphone
        const extension = phone.extension;
        const dialplan_number = phone.dialplan_number;
        const voicemail_id = phone.voicemail_id;
        const phone_ip = phone.phone_ip;
        
        // Créer un token de session temporaire pour l'étape téléphonique
        const phoneSessionToken = jwt.sign({
            phone_id: phone.id,
            phone_login: phone.login,
            extension: extension,
            dialplan_number: dialplan_number,
            voicemail_id: voicemail_id,
            phone_ip: phone_ip,
            step: 'phone'
        }, process.env.JWT_SECRET, { expiresIn: '15m' }); // Courte durée pour la sécurité
        
        // Retourner le token de session téléphonique
        res.json({
            success: true,
            phoneSessionToken,
            extension: extension,
            message: 'Authentification téléphonique réussie'
        });
        
    } catch (err) {
        console.error('Erreur lors de l\'authentification téléphonique:', err);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

// Route pour l'authentification utilisateur (étape 2)
router.post('/user-login', async (req, res) => {
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
        
        // Vérifier les identifiants utilisateur dans la table vicidial_users comme dans Vicidial
        const [rows] = await db.query('SELECT * FROM vicidial_users WHERE user = ? AND user_level > 0', [userLogin]);
        
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Identifiants utilisateur invalides' });
        }
        
        const user = rows[0];
        
        // Comparer le mot de passe (en texte brut comme dans Vicidial)
        const valid = userPassword === user.pass;
        
        if (!valid) {
            return res.status(401).json({ message: 'Identifiants utilisateur invalides' });
        }
        
        // Vérifier que l'utilisateur est un agent (user_level approprié)
        // Dans Vicidial, les agents ont généralement un user_level de 1
        if (user.user_level > 4) { // Agents ont un user_level <= 4
            return res.status(403).json({ message: 'Accès non autorisé pour ce type d\'utilisateur' });
        }
        
        // Récupérer les campagnes disponibles pour cet utilisateur
        // Dans Vicidial, les campagnes sont filtrées par active='Y'
        const [campaigns] = await db.query(`
            SELECT campaign_id as id, campaign_name as name, active, dial_method,
                   dial_timeout, lead_filter_id, hopper_level, auto_dial_level
            FROM vicidial_campaigns 
            WHERE active = 'Y'
            ORDER BY campaign_name
        `);
        
        // Créer un token de session utilisateur avec toutes les informations nécessaires
        const userSessionToken = jwt.sign({
            phone_id: decoded.phone_id,
            phone_login: decoded.phone_login,
            extension: decoded.extension,
            dialplan_number: decoded.dialplan_number,
            voicemail_id: decoded.voicemail_id,
            phone_ip: decoded.phone_ip,
            user_id: user.user_id,
            user: user.user,
            full_name: user.full_name,
            user_level: user.user_level,
            step: 'user'
        }, process.env.JWT_SECRET, { expiresIn: '15m' }); // Courte durée pour la sécurité
        
        // Retourner le token de session utilisateur et les campagnes
        res.json({
            success: true,
            userSessionToken,
            campaigns,
            user_level: user.user_level,
            full_name: user.full_name,
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
});

// Route pour la sélection de campagne (étape 3)
router.post('/select-campaign', async (req, res) => {
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
        
        // Vérifier que la campagne existe et est active (comme dans Vicidial)
        const [campaigns] = await db.query(`
            SELECT campaign_id, campaign_name, active, dial_method, dial_timeout,
                   lead_filter_id, hopper_level, auto_dial_level
            FROM vicidial_campaigns 
            WHERE campaign_id = ? AND active = 'Y'
        `, [campaignId]);
        
        if (campaigns.length === 0) {
            return res.status(404).json({ message: 'Campagne non trouvée ou inactive' });
        }
        
        // Enregistrer l'agent dans la campagne sélectionnée
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        // Vérifier si l'agent existe déjà dans la table vicidial_live_agents
        const [existingAgents] = await db.query(`
            SELECT live_agent_id 
            FROM vicidial_live_agents 
            WHERE user = ?
        `, [decoded.user]);
        
        if (existingAgents.length > 0) {
            // Mettre à jour l'agent existant
            await db.query(`
                UPDATE vicidial_live_agents 
                SET campaign_id = ?, conf_exten = ?, extension = ?, status = 'READY',
                    last_update_time = ?, last_state_change = ?
                WHERE user = ?
            `, [campaignId, decoded.extension, decoded.extension, now, now, decoded.user]);
        } else {
            // Insérer un nouvel agent (comme dans Vicidial)
            await db.query(`
                INSERT INTO vicidial_live_agents 
                (user, server_ip, conf_exten, extension, status, campaign_id, last_update_time, last_state_change)
                VALUES (?, ?, ?, ?, 'READY', ?, ?, ?)
            `, [decoded.user, 'localhost', decoded.extension, decoded.extension, campaignId, now, now]);
        }
        
        // Créer le token JWT final pour l'authentification complète avec toutes les informations nécessaires
        const finalToken = jwt.sign({
            user_id: decoded.user_id,
            user: decoded.user,
            full_name: decoded.full_name,
            user_level: decoded.user_level,
            phone_id: decoded.phone_id,
            phone_login: decoded.phone_login,
            extension: decoded.extension,
            dialplan_number: decoded.dialplan_number,
            voicemail_id: decoded.voicemail_id,
            phone_ip: decoded.phone_ip,
            campaign_id: campaignId,
            campaign_name: campaigns[0].campaign_name,
            dial_method: campaigns[0].dial_method,
            auto_dial_level: campaigns[0].auto_dial_level
        }, process.env.JWT_SECRET, { expiresIn: '8h' });
        
        // Définir le cookie JWT comme dans Vicidial
        res.cookie('jwt', finalToken, {
            httpOnly: true,
            maxAge: 8 * 60 * 60 * 1000, // 8 heures
            sameSite: 'lax',  // 'lax' est plus sûr pour le développement local
            secure: process.env.NODE_ENV === 'production', // Activer secure uniquement en production
            path: '/',
            domain: 'localhost' // À adapter en production
        });
        
        // Ajouter un cookie non-httpOnly pour le user_level (comme dans Vicidial)
        res.cookie('user_level', decoded.user_level.toString(), {
            httpOnly: false,
            maxAge: 8 * 60 * 60 * 1000,
            sameSite: 'lax',  // 'lax' est plus sûr pour le développement local
            secure: process.env.NODE_ENV === 'production', // Activer secure uniquement en production
            path: '/',
            domain: 'localhost'
        });
        
        // Retourner le token final et les informations nécessaires
        res.json({
            success: true,
            token: finalToken,
            user: decoded.user,
            full_name: decoded.full_name,
            extension: decoded.extension,
            phone_login: decoded.phone_login,
            campaign: {
                id: campaignId,
                name: campaigns[0].campaign_name,
                dial_method: campaigns[0].dial_method,
                auto_dial_level: campaigns[0].auto_dial_level
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
});

// Route pour vérifier la validité du token
router.post('/verify-token', authenticateToken, (req, res) => {
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
});

module.exports = router;
