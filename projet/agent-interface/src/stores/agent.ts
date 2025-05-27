import { writable, derived, get } from "svelte/store"
import { api } from "../utils/fetchWithAuth"
import { agentStatus, updateStatus } from "./agentStatus"
import { AsteriskService } from "../services/AsteriskService"
import { SipService, sipConnectionState } from "../services/SipService"

// Définition des statuts possibles pour un agent
export const AGENT_STATUSES = {
  READY: "READY",
  INCALL: "INCALL",
  PAUSED: "PAUSED",
  LOGOUT: "LOGOUT",
  OFFLINE: "OFFLINE",
  DIALING: "DIALING",
  WAITING: "WAITING",
}

// Type pour les statuts d'agent
export type AgentStatus = "READY" | "INCALL" | "PAUSED" | "LOGOUT" | "OFFLINE" | "DIALING" | "WAITING"

// Interface pour le type AgentState
export interface AgentState {
  user: string
  fullName: string
  phoneLogin: string
  extension: string
  campaignId: string
  campaignName: string
  status: string
  statusSince: Date
  pauseCode?: string
  pauseReason?: string
  callActive: boolean
  callId: string | null
  leadId: string | null
  phoneNumber: string | null
  contactName?: string | null
  callStartTime?: Date | null
  callData?: {
    callId?: string
    phoneNumber: string
    contactName?: string
    startTime: Date
    direction: "inbound" | "outbound"
    leadId?: string
  }
  isAuthenticated: boolean
  callsToday?: number
  callsAnswered?: number
  avgTalkTime?: number
}

// État initial de l'agent
const initialState: AgentState = {
  user: "",
  fullName: "",
  phoneLogin: "",
  extension: "",
  campaignId: "",
  campaignName: "",
  status: AGENT_STATUSES.OFFLINE,
  statusSince: new Date(),
  callActive: false,
  callId: null,
  leadId: null,
  phoneNumber: null,
  contactName: null,
  callStartTime: null,
  isAuthenticated: false,
  callsToday: 0,
  callsAnswered: 0,
  avgTalkTime: 0,
}

// Création du store writable
export const agentState = writable<AgentState>(initialState)

// Store dérivé pour calculer la durée du statut actuel
export const statusDuration = derived(agentState, ($agentState) => {
  const now = new Date()
  const since = $agentState.statusSince
  return Math.floor((now.getTime() - since.getTime()) / 1000)
})

// Store dérivé pour vérifier si l'agent est en appel
export const isInCall = derived(agentState, ($agentState) => $agentState.status === AGENT_STATUSES.INCALL)

// Store dérivé pour vérifier si l'agent est en pause
export const isPaused = derived(agentState, ($agentState) => $agentState.status === AGENT_STATUSES.PAUSED)

// Store dérivé pour vérifier si l'agent est prêt
export const isReady = derived(agentState, ($agentState) => $agentState.status === AGENT_STATUSES.READY)

// Store dérivé pour calculer la durée de l'appel actuel
export const callDuration = derived(agentState, ($agentState) => {
  if (!$agentState.callData?.startTime) return 0
  const now = new Date()
  const since = $agentState.callData.startTime
  return Math.floor((now.getTime() - since.getTime()) / 1000)
})

// Fonction pour mettre à jour le statut de l'agent
export function updateAgentStatus(status: string, pauseCode?: string, pauseReason?: string): void {
  // Utiliser update au lieu de set pour éviter de déclencher une cascade de mises à jour
  agentState.update((currentState) => {
    // Ne mettre à jour que si le statut a réellement changé
    if (
      status === currentState.status &&
      pauseCode === currentState.pauseCode &&
      pauseReason === currentState.pauseReason
    ) {
      return currentState // Aucun changement nécessaire
    }

    // Log pour débogage
    console.log("Statut agent mis à jour:", status)

    return {
      ...currentState,
      status,
      statusSince: new Date(),
      pauseCode: pauseCode || currentState.pauseCode,
      pauseReason: pauseReason || currentState.pauseReason,
    }
  })

  // Assurer la synchronisation avec l'autre store
  ensureStoresSync()
}

// Fonction pour synchroniser l'état de l'agent avec le serveur et Asterisk
export async function syncAgentStatus(): Promise<void> {
  try {
    console.log("Synchronisation du statut avec le serveur et Asterisk...")

    // Utiliser l'API pour faire la requête à /agent/info qui contient le statut
    const response = await api.get("/agent/info")

    if (response.ok) {
      const data = await response.json()
      console.log("Informations agent récupérées du serveur:", data)

      if (data && data.status) {
        // Utiliser update au lieu de set pour éviter de déclencher une cascade de mises à jour
        agentState.update((currentState) => {
          // Ne mettre à jour que si le statut a réellement changé
          if (data.status === currentState.status) {
            return currentState // Aucun changement nécessaire
          }

          return {
            ...currentState,
            status: data.status,
            // Mettre à jour d'autres informations de l'agent si disponibles
            user: data.user || currentState.user,
            fullName: data.full_name || currentState.fullName,
            phoneLogin: data.phone_login || currentState.phoneLogin,
            extension: data.extension || currentState.extension,
            campaignId: data.campaign_id || currentState.campaignId,
            campaignName: data.campaign_name || currentState.campaignName,
            // Mettre à jour statusSince uniquement si le statut a changé
            ...(data.status !== currentState.status ? { statusSince: new Date() } : {}),
          }
        })

        console.log("Store mis à jour avec le statut:", data.status)
      }
    } else {
      console.warn("Impossible de récupérer les informations agent du serveur:", response.status)
    }
  } catch (error) {
    console.error("Erreur lors de la synchronisation du statut:", error)
  }
}

// Fonction pour démarrer un appel
export function startCall(callData: {
  callId?: string
  leadId?: string
  phoneNumber: string
  contactName?: string
  direction?: "inbound" | "outbound"
}): void {
  // Utiliser update au lieu de set pour éviter de déclencher une cascade de mises à jour
  agentState.update((currentState) => {
    // Vérifier si un appel est déjà actif avec les mêmes données
    if (
      currentState.callActive &&
      currentState.callId === callData.callId &&
      currentState.phoneNumber === callData.phoneNumber
    ) {
      return currentState // Aucun changement nécessaire
    }

    // Log pour débogage
    console.log("Appel démarré, statut:", AGENT_STATUSES.INCALL)

    return {
      ...currentState,
      callActive: true,
      callId: callData.callId || null,
      leadId: callData.leadId || null,
      phoneNumber: callData.phoneNumber || null,
      contactName: callData.contactName || null,
      status: AGENT_STATUSES.INCALL,
      statusSince: new Date(),
      callData: {
        ...callData,
        startTime: new Date(),
        direction: callData.direction || "outbound",
      },
    }
  })
}

// Fonction pour terminer un appel
export function endCall(): void {
  // Utiliser update au lieu de set pour éviter de déclencher une cascade de mises à jour
  agentState.update((currentState) => {
    // Vérifier si un appel est actif
    if (!currentState.callActive) {
      return currentState // Aucun changement nécessaire
    }

    // Log pour débogage
    console.log("Appel terminé, statut:", AGENT_STATUSES.READY)

    return {
      ...currentState,
      callActive: false,
      status: AGENT_STATUSES.READY,
      statusSince: new Date(),
      callData: undefined,
    }
  })
}

// Fonction pour mettre l'agent en pause
export function pauseAgent(pauseCode: string, pauseReason: string): void {
  // Utiliser update au lieu de set pour éviter de déclencher une cascade de mises à jour
  agentState.update((currentState) => {
    // Ne mettre à jour que si le statut a réellement changé
    if (
      currentState.status === AGENT_STATUSES.PAUSED &&
      currentState.pauseCode === pauseCode &&
      currentState.pauseReason === pauseReason
    ) {
      return currentState // Aucun changement nécessaire
    }

    // Log pour débogage
    console.log("Agent mis en pause avec code:", pauseCode)

    return {
      ...currentState,
      status: AGENT_STATUSES.PAUSED,
      statusSince: new Date(),
      pauseCode,
      pauseReason,
    }
  })
}

// Fonction pour remettre l'agent en état prêt
export function resumeAgent(): void {
  // Utiliser update au lieu de set pour éviter de déclencher une cascade de mises à jour
  agentState.update((currentState) => {
    // Ne mettre à jour que si le statut a réellement changé
    if (currentState.status === AGENT_STATUSES.READY) {
      return currentState // Aucun changement nécessaire
    }

    // Log pour débogage
    console.log("Agent remis en statut prêt")

    return {
      ...currentState,
      status: AGENT_STATUSES.READY,
      statusSince: new Date(),
      pauseCode: undefined,
      pauseReason: undefined,
    }
  })
}

// Fonction pour déconnecter l'agent
export async function logoutAgent(): Promise<void> {
  try {
    const currentState = get(agentState);
    
    // Déconnecter l'agent d'Asterisk et du softphone
    if (currentState.user) {
      await AsteriskService.disconnectAgent(currentState.user);
    }
    
    // Créer un nouvel objet d'état pour forcer la réactivité
    const newState = {
      ...currentState,
      status: AGENT_STATUSES.LOGOUT,
      statusSince: new Date(),
      isAuthenticated: false,
    }

    // Mettre à jour le store avec le nouvel objet d'état
    agentState.set(newState)

    // Log pour débogage
    console.log("Agent déconnecté, statut:", AGENT_STATUSES.LOGOUT)
  } catch (error) {
    console.error("Erreur lors de la déconnexion de l'agent:", error);
  }
}

// Fonction pour mettre à jour les informations de l'agent
export function updateAgentInfo(agentInfo: Partial<AgentState>): void {
  // Créer un nouvel objet d'état pour forcer la réactivité
  const newState = {
    ...get(agentState),
    ...agentInfo,
    isAuthenticated: true,
  }

  // Mettre à jour le store avec le nouvel objet d'état
  agentState.set(newState)

  // Log pour débogage
  console.log("Informations agent mises à jour")
}

// Fonction pour connecter l'agent à Asterisk et au softphone
export async function connectAgentToAsterisk(password: string): Promise<{success: boolean, message?: string}> {
  try {
    const currentState = get(agentState);
    
    if (!currentState.user || !currentState.extension || !currentState.campaignId) {
      console.error('Informations manquantes pour la connexion Asterisk:', {
        user: currentState.user,
        extension: currentState.extension,
        campaignId: currentState.campaignId
      });
      return {
        success: false,
        message: "Informations d'agent incomplètes pour la connexion Asterisk"
      };
    }
    
    console.log(`[${new Date().toISOString()}] Démarrage de la connexion de l'agent ${currentState.user} à Asterisk...`);
    
    // Démarrer la synchronisation en arrière-plan avec un délai plus long
    setTimeout(async () => {
      try {
        console.log(`[${new Date().toISOString()}] Tentative de connexion à Asterisk...`);
        console.log('Détails de connexion:', {
          extension: currentState.extension,
          campaignId: currentState.campaignId
        });
        
        // Synchroniser l'agent avec Asterisk et le softphone
        const result = await Promise.race([
          AsteriskService.synchronizeAgent(
            currentState.user,
            currentState.extension,
            password,
            currentState.campaignId
          ),
          // Timeout après 30 secondes
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Délai de connexion dépassé (30s)')), 30000)
          )
        ]) as any;
        
        console.log('[Asterisk] Résultat de la synchronisation:', result);
        
        if (result && result.success) {
          console.log('[Asterisk] Connexion réussie');
          updateAgentStatus(AGENT_STATUSES.READY);
          
          // Vérifier l'état de la connexion SIP
          const sipCheck = await SipService.checkSipRegistration(currentState.extension);
          console.log('[SIP] État de la connexion:', sipCheck);
          
          if (!sipCheck.registered) {
            console.warn('[SIP] Attention: Extension non enregistrée après connexion');
          }
          
          return { success: true };
        } else {
          const errorMsg = result?.error?.message || 'Raison inconnue';
          console.error('[Asterisk] Échec de la connexion:', errorMsg);
          return { success: false, message: errorMsg };
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('[Asterisk] Erreur lors de la connexion:', errorMsg);
        return { success: false, message: errorMsg };
      }
    }, 2000); // Démarrer après 2 secondes
    
    // Retourner immédiatement un succès pour permettre la redirection
    return {
      success: true,
      message: "Connexion en cours..."
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error("Erreur lors de l'initialisation de la connexion à Asterisk:", errorMsg);
    return {
      success: false,
      message: errorMsg
    };
  }
}

// Fonction pour vérifier l'état de la connexion SIP
export function checkSipConnection(): {connected: boolean, extension: string} {
  const sipState = get(sipConnectionState);
  return {
    connected: sipState.connected && sipState.registered,
    extension: sipState.extension
  };
}

// Fonction pour réinitialiser les données d'appel
export function resetCall(): void {
  // Créer un nouvel objet d'état pour forcer la réactivité
  const newState = {
    ...get(agentState),
    callActive: false,
    callData: undefined,
    status: AGENT_STATUSES.READY,
    statusSince: new Date(),
  }

  // Mettre à jour le store avec le nouvel objet d'état
  agentState.set(newState)

  // Log pour débogage
  console.log("Données d'appel réinitialisées, statut:", AGENT_STATUSES.READY)
}

// Cette fonction ne force plus la synchronisation entre les stores
// pour permettre des changements de statut immédiats
export function ensureStoresSync(): void {
  // Ne rien faire - les stores sont mis à jour directement par les composants
  // Laisser cette fonction vide pour ne pas casser les appels existants
  console.log('Synchronisation des stores désactivée - changement de statut direct')
}
