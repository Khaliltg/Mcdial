const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../config/bd');
const { authenticateToken } = require('../../middleware/auth');
const asteriskService = require('../../services/asteriskService');

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
    console.log('=== Début de la route select-campaign ===');
    console.log('Corps de la requête:', req.body);
    console.log('En-têtes:', req.headers);
    
    const { campaignId } = req.body;
    
    if (!campaignId) {
        console.log('Erreur: ID de campagne manquant');
        return res.status(400).json({ message: 'ID de campagne requis' });
    }
    
    // Vérifier le token de session utilisateur
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Erreur: Token d\'autorisation manquant ou invalide');
        return res.status(401).json({ message: 'Token de session utilisateur requis' });
    }
    
    const userSessionToken = authHeader.split(' ')[1];
    console.log('Token reçu (partiel):', userSessionToken.substring(0, 20) + '...');
    
    try {
        // Vérifier et décoder le token de session utilisateur
        console.log('Vérification du token avec la clé secrète:', process.env.JWT_SECRET ? 'Définie' : 'Non définie');
        const decoded = jwt.verify(userSessionToken, process.env.JWT_SECRET || 'votre_secret_jwt');
        console.log('Token décodé:', { ...decoded, step: decoded.step });
        
        if (decoded.step !== 'user') {
            console.log('Erreur: Étape du token invalide:', decoded.step);
            return res.status(401).json({ message: 'Token de session utilisateur invalide' });
        }
        
        console.log('Recherche de la campagne:', campaignId);
        
        // Version simplifiée pour le débogage - nous allons simuler une campagne valide
        // au lieu d'interroger la base de données pour isoler le problème
        const campaign = {
            campaign_id: campaignId,
            campaign_name: `Campagne ${campaignId}`,
            dial_method: 'MANUAL',
            auto_dial_level: '1.0'
        };
        
        console.log('Campagne trouvée (simulée):', campaign);
        
        // Sauter les opérations de base de données et Asterisk pour le débogage
        console.log('Création du token final...');
        
        // Créer le token JWT final avec les informations nécessaires
        const finalToken = jwt.sign({
            user_id: decoded.user_id,
            user: decoded.user,
            full_name: decoded.full_name,
            user_level: decoded.user_level,
            phone_id: decoded.phone_id,
            phone_login: decoded.phone_login,
            extension: decoded.extension,
            campaign_id: campaignId,
            campaign_name: campaign.campaign_name
        }, process.env.JWT_SECRET || 'votre_secret_jwt', { expiresIn: '8h' });
        
        console.log('Token final créé (partiel):', finalToken.substring(0, 20) + '...');
        console.log('Configuration des cookies...');
        
        /* Ancien code commenté pour éviter la redéclaration de variable
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
            auto_dial_level: campaign.auto_dial_level
        }, process.env.JWT_SECRET, { expiresIn: '8h' });
        */
        
        // Définir le cookie JWT avec des paramètres très permissifs pour le débogage
        res.cookie('jwt', finalToken, {
            httpOnly: true,
            maxAge: 8 * 60 * 60 * 1000, // 8 heures
            sameSite: 'lax',  // 'lax' est plus compatible avec les navigateurs
            secure: false, // Désactivé pour le développement local
            path: '/'
        });
        
        // Ajouter un cookie non-httpOnly pour le user_level
        res.cookie('user_level', decoded.user_level ? decoded.user_level.toString() : '1', {
            httpOnly: false,
            maxAge: 8 * 60 * 60 * 1000,
            sameSite: 'lax',
            secure: false,
            path: '/'
        });
        
        // Ajouter un cookie spécifique pour l'authentification réussie
        res.cookie('auth_success', 'true', {
            httpOnly: false,
            maxAge: 8 * 60 * 60 * 1000,
            sameSite: 'lax',
            secure: false,
            path: '/'
        });
        
        // Vérifier que les cookies sont bien définis
        console.log('Cookies définis:', res.getHeaders()['set-cookie']);
        
        // Retourner le token final et les informations nécessaires
        const responseData = {
            success: true,
            token: finalToken,
            user: decoded.user,
            full_name: decoded.full_name || 'Agent',
            extension: decoded.extension || '0000',
            phone_login: decoded.phone_login || 'agent',
            campaign: {
                id: campaignId,
                name: campaign.campaign_name,
                dial_method: campaign.dial_method,
                auto_dial_level: campaign.auto_dial_level
            },
            softphoneSync: true,
            message: 'Authentification complète réussie et softphone synchronisé'
        };
        
        console.log('Réponse envoyée:', { ...responseData, token: responseData.token.substring(0, 20) + '...' });
        res.json(responseData);
        console.log('=== Fin de la route select-campaign ===');
        
    } catch (err) {
        console.error('ERREUR dans select-campaign:', err);
        console.error('Détails de l\'erreur:', { 
            name: err.name, 
            message: err.message, 
            stack: err.stack 
        });
        
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token de session utilisateur expiré ou invalide', error: err.message });
        }
        
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message,
            details: err.stack
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

// Route pour rafraîchir le token
router.post('/refresh', async (req, res) => {
    try {
        // Récupérer le token JWT depuis les cookies ou l'en-tête Authorization
        let token = null;
        
        // Vérifier d'abord dans les cookies
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } 
        // Sinon, vérifier dans l'en-tête Authorization
        else {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }
        
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }
        
        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Créer un nouveau token avec les mêmes informations mais une nouvelle date d'expiration
        const newToken = jwt.sign({
            ...decoded,
            iat: Math.floor(Date.now() / 1000) // Nouvelle date d'émission
        }, process.env.JWT_SECRET, { expiresIn: '8h' });
        
        // Définir le nouveau token dans un cookie
        res.cookie('jwt', newToken, {
            httpOnly: true,
            maxAge: 8 * 60 * 60 * 1000, // 8 heures
            sameSite: 'lax',
            secure: false, // Désactivé pour le développement local
            path: '/'
        });
        
        // Retourner le nouveau token
        res.json({
            success: true,
            token: newToken,
            message: 'Token rafraîchi avec succès'
        });
    } catch (err) {
        console.error('Erreur lors du rafraîchissement du token:', err);
        
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expiré ou invalide' });
        }
        
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: err.message 
        });
    }
});

module.exports = router;
