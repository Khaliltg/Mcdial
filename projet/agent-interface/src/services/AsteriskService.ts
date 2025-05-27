import { api } from "../utils/fetchWithAuth"
import { SipService } from "./SipService"
import { get } from "svelte/store"
import { agentState } from "../stores/agent"

/**
 * Service pour interagir avec Asterisk via l'API du backend
 */
export class AsteriskService {
  // Configuration Asterisk
  private static ASTERISK_HOST = "213.32.34.33"
  private static ASTERISK_PORT = 5038
  private static ASTERISK_USERNAME = "admin"
  private static ASTERISK_PASSWORD = "admin123"
  
  /**
   * Synchronise l'agent avec Asterisk et le softphone
   * @param agentId - ID de l'agent
   * @param extension - Extension SIP de l'agent
   * @param password - Mot de passe SIP de l'agent
   * @param campaignId - ID de la campagne
   * @returns Promesse résolue avec le résultat
   */
  static async synchronizeAgent(
    agentId: string,
    extension: string,
    password: string,
    campaignId: string
  ): Promise<{success: boolean; error?: any; sipConnected?: boolean; agentStatus?: any}> {
    console.log(`[${new Date().toISOString()}] [Asterisk] Début synchronisation agent ${agentId}`);
    
    try {
      // 1. Mettre à jour le statut de l'agent dans la base de données
      console.log(`[Asterisk] Mise à jour du statut de l'agent ${agentId}...`);
      const statusResponse = await this.setAgentStatus(agentId, "READY", campaignId);
      
      if (!statusResponse.success) {
        const errorMsg = statusResponse.error || "Échec de la mise à jour du statut de l'agent";
        console.error(`[Asterisk] ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
      console.log('[Asterisk] Statut agent mis à jour avec succès');
      
      // 2. Établir la connexion SIP
      console.log(`[SIP] Tentative de connexion pour l'extension ${extension}...`);
      const sipResponse = await SipService.connect({
        extension,
        password,
        agentId,
        campaignId
      });
      
      if (!sipResponse.success) {
        const errorMsg = `Échec de la connexion SIP: ${sipResponse.message || 'Raison inconnue'}`;
        console.error(`[SIP] ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
      console.log('[SIP] Connexion SIP établie avec succès');
      
      // 3. Vérifier l'état de l'agent dans Asterisk
      console.log('[Asterisk] Vérification du statut de l\'agent...');
      const agentStatusResponse = await this.checkAgentAsteriskStatus(agentId);
      
      if (!agentStatusResponse.success) {
        console.warn('[Asterisk] Impossible de vérifier le statut de l\'agent:', agentStatusResponse.error);
      }
      
      return {
        success: true,
        sipConnected: sipResponse.success,
        agentStatus: agentStatusResponse.success ? agentStatusResponse.data : null
      };
    } catch (error) {
      console.error("Erreur lors de la synchronisation de l'agent avec Asterisk:", error)
      return {
        success: false,
        error
      }
    }
  }
  
  /**
   * Vérifie le statut de l'agent dans Asterisk
   * @param agentId - ID de l'agent
   * @returns Promesse résolue avec le résultat
   */
  static async checkAgentAsteriskStatus(agentId: string): Promise<any> {
    try {
      // Récupérer l'état actuel de l'agent
      const currentState = get(agentState)
      
      const response = await api.get(`/agent/asterisk-status/${agentId}`)
      
      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          data
        }
      } else {
        const error = await response.json().catch(() => ({ message: "Erreur inconnue" }))
        return {
          success: false,
          error
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut Asterisk de l'agent:", error)
      return {
        success: false,
        error
      }
    }
  }
  
  /**
   * Déconnecte l'agent d'Asterisk et du softphone
   * @param agentId - ID de l'agent
   * @returns Promesse résolue avec le résultat
   */
  static async disconnectAgent(agentId: string): Promise<any> {
    try {
      console.log(`Déconnexion de l'agent ${agentId} d'Asterisk...`)
      
      // 1. Mettre à jour le statut de l'agent dans la base de données
      const statusResponse = await this.setAgentStatus(agentId, "LOGOUT", get(agentState).campaignId)
      
      // 2. Fermer la connexion SIP
      const sipResponse = await SipService.disconnect()
      
      return {
        success: true,
        statusUpdated: statusResponse.success,
        sipDisconnected: sipResponse.success
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion de l'agent d'Asterisk:", error)
      return {
        success: false,
        error
      }
    }
  }
  /**
   * Démarre le composeur prédictif pour une campagne
   * @param campaignId - ID de la campagne
   * @param level - Niveau de numérotation (optionnel)
   * @returns Promesse résolue avec le résultat
   */
  static async startPredictiveDialer(campaignId: string, level = "AUTO"): Promise<any> {
    try {
      const response = await api.post("/agent/predictive/start", {
        campaignId,
        level,
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          data,
        }
      } else {
        const error = await response.json().catch(() => ({ message: "Erreur inconnue" }))
        return {
          success: false,
          error,
        }
      }
    } catch (error) {
      console.error("Erreur lors du démarrage du composeur prédictif:", error)
      return {
        success: false,
        error,
      }
    }
  }

  /**
   * Arrête le composeur prédictif pour une campagne
   * @param campaignId - ID de la campagne
   * @returns Promesse résolue avec le résultat
   */
  static async stopPredictiveDialer(campaignId: string): Promise<any> {
    try {
      const response = await api.post("/agent/predictive/stop", {
        campaignId,
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          data,
        }
      } else {
        const error = await response.json().catch(() => ({ message: "Erreur inconnue" }))
        return {
          success: false,
          error,
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'arrêt du composeur prédictif:", error)
      return {
        success: false,
        error,
      }
    }
  }

  /**
   * Initie un appel via Asterisk
   * @param phoneNumber - Numéro de téléphone à appeler
   * @param agentExtension - Extension de l'agent
   * @param agentId - ID de l'agent
   * @param leadId - ID du prospect (optionnel)
   * @returns Promesse résolue avec le résultat
   */
  static async initiateCall(
    phoneNumber: string,
    agentExtension: string,
    agentId: string,
    leadId?: string,
  ): Promise<any> {
    try {
      const response = await api.post("/agent/call/initiate", {
        phoneNumber,
        agentExtension,
        agentId,
        leadId,
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          callId: data.callId,
          data,
        }
      } else {
        const error = await response.json().catch(() => ({ message: "Erreur inconnue" }))
        return {
          success: false,
          error,
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'initiation de l'appel:", error)
      return {
        success: false,
        error,
      }
    }
  }

  /**
   * Termine un appel en cours
   * @param callId - ID de l'appel à terminer
   * @returns Promesse résolue avec le résultat
   */
  static async endCall(callId: string): Promise<any> {
    try {
      const response = await api.post("/agent/call/end", {
        callId,
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          data,
        }
      } else {
        const error = await response.json().catch(() => ({ message: "Erreur inconnue" }))
        return {
          success: false,
          error,
        }
      }
    } catch (error) {
      console.error("Erreur lors de la fin de l'appel:", error)
      return {
        success: false,
        error,
      }
    }
  }

  /**
   * Récupère les détails d'un appel
   * @param callId - ID de l'appel
   * @returns Promesse résolue avec le résultat
   */
  static async getCallDetails(callId: string): Promise<any> {
    try {
      const response = await api.get(`/agent/call/details/${callId}`)

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          data,
        }
      } else {
        const error = await response.json().catch(() => ({ message: "Erreur inconnue" }))
        return {
          success: false,
          error,
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de l'appel:", error)
      return {
        success: false,
        error,
      }
    }
  }

  /**
   * Définit le statut d'un agent
   * @param agentId - ID de l'agent
   * @param status - Statut à définir
   * @param campaignId - ID de la campagne
   * @returns Promesse résolue avec le résultat
   */
  static async setAgentStatus(agentId: string, status: string, campaignId: string): Promise<any> {
    try {
      const response = await api.post("/agent/status", {
        agentId,
        status,
        campaignId,
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          data,
        }
      } else {
        const error = await response.json().catch(() => ({ message: "Erreur inconnue" }))
        return {
          success: false,
          error,
        }
      }
    } catch (error) {
      console.error("Erreur lors de la définition du statut de l'agent:", error)
      return {
        success: false,
        error,
      }
    }
  }
}
