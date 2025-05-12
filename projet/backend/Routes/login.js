const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/bd');

// Route principale de connexion
router.post('/', async (req, res) => {
    const { user, pass, role } = req.body;
    if (!user || !pass) {
        return res.status(400).json({ message: 'Identifiant et mot de passe requis' });
    }
    
    try {
        // Requête pour trouver l'utilisateur dans la base de données
        // Ajout d'un timeout plus long pour éviter les erreurs ECONNRESET
        const [rows] = await Promise.race([
            db.query('SELECT * FROM vicidial_users WHERE user = ?', [user]),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout de la requête')), 10000)
            )
        ]);
        
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        
        const foundUser = rows[0];
        
        // Vérification du mot de passe (texte brut)
        const valid = pass === foundUser.pass;
        if (!valid) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        
        // Vérification du rôle en fonction du niveau d'utilisateur
        // Niveau 1 = Agent, Niveau 9 = Administrateur
        if (role === 'agent' && foundUser.user_level != 1) {
            return res.status(403).json({ message: 'Vous n\'avez pas les droits d\'agent' });
        }
        
        if (role === 'admin' && foundUser.user_level != 9) {
            return res.status(403).json({ message: 'Vous n\'avez pas les droits d\'administrateur' });
        }
        
        // Création du JWT avec les informations de l'utilisateur
        const token = jwt.sign({
            id: foundUser.user_id,
            user: foundUser.user,
            user_level: foundUser.user_level,
            role: foundUser.user_level == 9 ? 'admin' : 'agent',
            full_name: foundUser.full_name || foundUser.user
        }, process.env.JWT_SECRET);
        
        // Configuration du cookie HTTP-only pour l'authentification
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 28800 * 1000, // 8 heures
            sameSite: 'none', // Requis pour le cross-origin
            secure: false, // Doit être false pour localhost en HTTP
            path: '/', // S'assurer que le cookie est envoyé à tous les chemins
            domain: 'localhost' // Domaine explicite pour localhost
        });
        
        // Cookie pour le niveau d'utilisateur (non httpOnly pour que le frontend puisse le lire)
        res.cookie('user_level', foundUser.user_level.toString(), {
            httpOnly: false,
            maxAge: 28800 * 1000,
            sameSite: 'none',
            secure: false,
            path: '/',
            domain: 'localhost'
        });

        // Envoyer les informations utilisateur au frontend (sans le mot de passe)
        // Inclure le token dans la réponse pour permettre au frontend de le stocker
        return res.status(200).json({
            success: true,
            token: token, // Inclure le token dans la réponse
            user: {
                id: foundUser.user_id,
                username: foundUser.user,
                name: foundUser.full_name || foundUser.user,
                role: foundUser.user_level == 9 ? 'admin' : 'agent',
                user_level: foundUser.user_level
            }
        });
    } catch (error) {
        console.error('Erreur de connexion:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
    }
});

// Route de déconnexion
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        path: '/',
        domain: 'localhost',
        sameSite: 'none',
        secure: false
    });
    
    // Supprimer également le cookie de niveau d'utilisateur
    res.clearCookie('user_level', {
        httpOnly: false,
        path: '/',
        domain: 'localhost',
        sameSite: 'none',
        secure: false
    });
    
    return res.status(200).json({ success: true, message: 'Déconnexion réussie' });
});

module.exports = router;

