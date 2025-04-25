// Route pour enregistrer la fin d'un appel
const express = require('express');
const router = express.Router();
const db = require('../../config/bd');
const { authenticateToken } = require('../../middleware/auth');
const asteriskService = require('../../services/asteriskService');

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { callId, duration } = req.body;
        const userId = req.user.user;
        
        console.log(`Fin d'appel enregistrée pour l'agent ${userId}, appel ${callId}, durée ${duration}s`);
        
        // Mettre à jour l'enregistrement de l'appel dans vicidial_log
        await db.query(`
            UPDATE vicidial_log
            SET length_in_sec = ?, status = 'DONE'
            WHERE uniqueid = ? AND user = ?
        `, [duration, callId, userId]);
        
        // Terminer l'appel via Asterisk
        try {
            await asteriskService.endCall(callId);
            console.log(`Appel ${callId} terminé via Asterisk`);
        } catch (asteriskError) {
            console.error('Erreur lors de la terminaison de l\'appel via Asterisk:', asteriskError);
            // Continuer même en cas d'erreur avec Asterisk (mode simulation)
            console.log('Utilisation du mode simulation pour la fin d\'appel');
        }
        
        res.json({
            success: true,
            message: 'Fin d\'appel enregistrée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la fin d\'appel:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement de la fin d\'appel',
            error: error.message
        });
    }
});

module.exports = router;
