/**
 * Routes pour la gestion des connexions SIP et du softphone
 */
const express = require('express');
const router = express.Router();
const { apiLimiter } = require('../../middleware/rateLimiter');
const { authenticateToken, validateUserId } = require('../../middleware/auth');
const config = require('../../config/config');

// Route pour générer un lien SIP URI
router.get('/generate-uri', [apiLimiter, authenticateToken, validateUserId], async (req, res) => {
    try {
        const { extension } = req.user;
        
        if (!extension) {
            return res.status(400).json({ 
                success: false, 
                message: "Extension SIP non disponible pour cet utilisateur" 
            });
        }
        
        // Configurer le domaine SIP (utiliser la configuration ou une valeur par défaut)
        const sipDomain = config.asterisk?.host || '213.32.34.38';
        
        // Générer le lien SIP URI
        const sipUri = `sip:${extension}@${sipDomain}`;
        
        // Générer également un lien callto: pour les applications qui le supportent
        const calltoUri = `callto:${extension}@${sipDomain}`;
        
        // Générer un lien tel: pour les applications mobiles
        const telUri = `tel:${extension}`;
        
        console.log(`Génération de liens SIP pour l'extension ${extension}:`);
        console.log(`- SIP URI: ${sipUri}`);
        console.log(`- Callto URI: ${calltoUri}`);
        console.log(`- Tel URI: ${telUri}`);
        
        res.json({
            success: true,
            extension,
            sipUri,
            calltoUri,
            telUri,
            server: sipDomain,
            port: config.asterisk?.port || 5060
        });
    } catch (error) {
        console.error('Erreur lors de la génération du lien SIP URI:', error);
        res.status(500).json({ 
            success: false, 
            message: "Erreur lors de la génération du lien SIP URI" 
        });
    }
});

// Route pour vérifier l'état d'enregistrement SIP
router.get('/registration-status/:extension', [apiLimiter, authenticateToken], async (req, res) => {
    try {
        const { extension } = req.params;
        
        if (!extension) {
            return res.status(400).json({ 
                success: false, 
                message: "Extension SIP requise" 
            });
        }
        
        // Dans un environnement réel, vous vérifieriez l'état d'enregistrement via Asterisk AMI
        // Pour l'instant, nous simulons une réponse positive
        
        res.json({
            success: true,
            extension,
            registered: true,
            server: config.asterisk?.host || '213.32.34.38',
            lastRegistration: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'enregistrement SIP:', error);
        res.status(500).json({ 
            success: false, 
            message: "Erreur lors de la vérification de l'enregistrement SIP" 
        });
    }
});

module.exports = router;
