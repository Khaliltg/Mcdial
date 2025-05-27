const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middleware/auth");
const asteriskService = require("../../services/asteriskService");

// Route pour vérifier l'état d'enregistrement SIP d'une extension
router.get("/status/:extension", authenticateToken, async (req, res) => {
  try {
    let extension = req.params.extension;
    
    if (!extension) {
      return res.status(400).json({
        success: false,
        message: "Extension requise"
      });
    }
    
    // Supprimer le préfixe SIP/ si présent
    if (extension.startsWith('SIP/')) {
      extension = extension.substring(4);
      console.log(`Préfixe SIP/ détecté et supprimé. Extension utilisée: ${extension}`);
    }
    
    // Vérifier l'état d'enregistrement SIP
    const status = await asteriskService.checkSipRegistration(extension);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error("Erreur lors de la vérification de l'état SIP:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification de l'état SIP",
      error: error.message
    });
  }
});

// Route pour vérifier toutes les extensions SIP
router.get("/all-extensions", authenticateToken, async (req, res) => {
  try {
    // Vérifier toutes les extensions SIP
    const extensions = await asteriskService.checkAllSipExtensions();
    
    res.json({
      success: true,
      count: extensions.length,
      data: extensions
    });
  } catch (error) {
    console.error("Erreur lors de la vérification des extensions SIP:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification des extensions SIP",
      error: error.message
    });
  }
});

// Route pour forcer la synchronisation avec Asterisk
router.post("/sync", authenticateToken, async (req, res) => {
  try {
    let { extension } = req.body;
    
    if (!extension) {
      return res.status(400).json({
        success: false,
        message: "Extension requise"
      });
    }
    
    // Supprimer le préfixe SIP/ si présent
    if (extension.startsWith('SIP/')) {
      extension = extension.substring(4);
      console.log(`Préfixe SIP/ détecté et supprimé. Extension utilisée: ${extension}`);
    }
    
    // Vérifier l'état d'enregistrement SIP
    const status = await asteriskService.checkSipRegistration(extension);
    
    // Si l'extension est enregistrée, vérifier les canaux actifs
    if (status.registered) {
      // Vérifier les canaux actifs pour cette extension
      const channels = await asteriskService.getActiveChannels(extension);
      
      res.json({
        success: true,
        message: "Synchronisation réussie",
        data: {
          status,
          channels
        }
      });
    } else {
      res.json({
        success: false,
        message: "Extension non enregistrée",
        data: {
          status
        }
      });
    }
  } catch (error) {
    console.error("Erreur lors de la synchronisation avec Asterisk:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la synchronisation avec Asterisk",
      error: error.message
    });
  }
});

module.exports = router;
