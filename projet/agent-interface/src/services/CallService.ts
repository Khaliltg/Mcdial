import { getApiUrl } from "../utils/config"
import { fetchWithAuth } from "../utils/fetchWithAuth"
import { agentState, startCall, endCall, updateAgentStatus } from "../stores/agent"
import type { AgentStatus } from "../stores/agent"

// Interface pour les options d'appel
interface CallOptions {
  phoneNumber: string
  leadId?: string
  contactName?: string
  campaignId?: string
}

// Interface pour les résultats d'appel
interface CallResult {
  success: boolean
  callId?: string
  message?: string
  error?: any
}

// Classe pour gérer les appels
export class CallService {
  // Méthode pour initialiser un appel
  static async initiateCall(options: CallOptions): Promise<CallResult> {
    try {
      // Mettre à jour l'état de l'agent pour indiquer qu'il compose un numéro
      updateAgentStatus("DIALING")

      // Préparer les données pour l'appel API
      const callData = {
        phoneNumber: options.phoneNumber,
        leadId: options.leadId,
        contactName: options.contactName,
        campaignId: options.campaignId || localStorage.getItem("campaign_id"),
      }

      // Appel API pour initier l'appel
      const response = await fetchWithAuth(`${getApiUrl()}/agent/call/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(callData),
      })

      // Vérifier si l'appel a réussi
      if (response.ok) {
        const data = await response.json()

        // Si l'appel a réussi, mettre à jour l'état de l'agent
        if (data.success && data.callId) {
          // Démarrer l'appel dans le store
          startCall({
            leadId: options.leadId || undefined,
            phoneNumber: options.phoneNumber,
            contactName: options.contactName || undefined,
            callId: data.callId,
          })

          return {
            success: true,
            callId: data.callId,
            message: "Appel initié avec succès",
          }
        } else {
          // Si l'appel a échoué côté serveur
          updateAgentStatus("READY")
          return {
            success: false,
            message: data.message || "Échec de l'initiation de l'appel",
          }
        }
      } else {
        // Si la requête a échoué
        const errorData = await response.json().catch(() => ({}))
        updateAgentStatus("READY")
        return {
          success: false,
          message: errorData.message || `Erreur ${response.status}: ${response.statusText}`,
          error: errorData,
        }
      }
    } catch (error: any) {
      // En cas d'erreur, réinitialiser l'état de l'agent
      updateAgentStatus("READY")
      return {
        success: false,
        message: error.message || "Une erreur est survenue lors de l'initiation de l'appel",
        error,
      }
    }
  }

  // Méthode pour terminer un appel
  static async endCall(callId: string | null = null, disposition?: string): Promise<CallResult> {
    try {
      // Récupérer l'ID de l'appel depuis le store si non fourni
      let currentCallId: string | null = callId;
      
      // Si aucun callId n'est fourni, essayer de le récupérer depuis le store
      if (!currentCallId) {
        // Créer une promesse pour attendre la valeur du store
        const getCurrentCallId = (): Promise<string | null> => {
          return new Promise((resolve) => {
            const unsubscribe = agentState.subscribe(state => {
              resolve(state.callId);
              // Se désabonner immédiatement après avoir obtenu la valeur
              unsubscribe();
            });
          });
        };
        
        // Attendre la résolution de la promesse
        currentCallId = await getCurrentCallId();
      }

      if (!currentCallId) {
        return {
          success: false,
          message: "Aucun appel actif à terminer",
        };
      }

      // Préparer les données pour l'appel API
      const endCallData = {
        callId: currentCallId,
        disposition,
      }

      // Appel API pour terminer l'appel
      const response = await fetchWithAuth(`${getApiUrl()}/agent/call/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(endCallData),
      })

      // Vérifier si la requête a réussi
      if (response.ok) {
        const data = await response.json()

        // Mettre à jour l'état de l'agent
        endCall()

        return {
          success: true,
          message: "Appel terminé avec succès",
        }
      } else {
        // Si la requête a échoué
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          message: errorData.message || `Erreur ${response.status}: ${response.statusText}`,
          error: errorData,
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Une erreur est survenue lors de la fin de l'appel",
        error,
      }
    }
  }

  // Méthode pour mettre à jour le statut de l'agent
  static async updateStatus(status: AgentStatus): Promise<boolean> {
    try {
      // Appel API pour mettre à jour le statut
      const response = await fetchWithAuth(`${getApiUrl()}/agent/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      // Vérifier si la requête a réussi
      if (response.ok) {
        // Mettre à jour l'état de l'agent
        updateAgentStatus(status)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error)
      return false
    }
  }

  // Méthode pour récupérer les statistiques de l'agent
  static async getAgentStats(): Promise<void> {
    try {
      // Utiliser des données simulées puisque l'API n'existe pas encore
      console.log("Utilisation de données statistiques simulées")
      
      // Générer des statistiques simulées
      const mockStats = {
        callsToday: Math.floor(Math.random() * 20) + 5, // Entre 5 et 25 appels
        callsAnswered: Math.floor(Math.random() * 15) + 3, // Entre 3 et 18 appels répondus
        callsAbandoned: Math.floor(Math.random() * 5), // Entre 0 et 5 appels abandonnés
        avgTalkTime: Math.floor(Math.random() * 180) + 60, // Entre 60 et 240 secondes
        avgWaitTime: Math.floor(Math.random() * 20) + 5, // Entre 5 et 25 secondes
      }
      
      // Mettre à jour l'état de l'agent avec les statistiques simulées
      agentState.update((state) => ({
        ...state,
        callsToday: mockStats.callsToday,
        callsAnswered: mockStats.callsAnswered,
        callsAbandoned: mockStats.callsAbandoned,
        avgTalkTime: mockStats.avgTalkTime,
        avgWaitTime: mockStats.avgWaitTime,
      }))
    } catch (error) {
      console.error("Erreur lors de la génération des statistiques simulées:", error)
    }
  }
}
