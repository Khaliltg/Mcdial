import { writable, derived, get } from "svelte/store"
import { AGENT_STATUSES, type AgentStatusType } from "./constants"
import { agentState } from "./agent"

// Interface pour le statut de l'agent
export interface AgentStatusState {
  status: AgentStatusType
  pauseCode?: string
  pauseReason?: string
  statusSince: Date
  callActive: boolean
}

// État initial
const initialState: AgentStatusState = {
  status: AGENT_STATUSES.OFFLINE as AgentStatusType,
  statusSince: new Date(),
  callActive: false,
}

// Créer le store
export const agentStatus = writable<AgentStatusState>(initialState)

// Store dérivé pour calculer la durée du statut actuel
export const statusDuration = derived(agentStatus, ($status) => {
  const now = new Date()
  const since = $status.statusSince
  return Math.floor((now.getTime() - since.getTime()) / 1000)
})

// Fonction pour mettre à jour le statut
export function updateStatus(status: string, pauseCode?: string, pauseReason?: string): void {
  agentStatus.update((currentStatus) => {
    // Ne mettre à jour que si le statut a réellement changé
    if (
      status === currentStatus.status &&
      pauseCode === currentStatus.pauseCode &&
      pauseReason === currentStatus.pauseReason
    ) {
      return currentStatus
    }

    console.log(`[agentStatus] Mise à jour du statut: ${currentStatus.status} -> ${status}`)
    
    // Notifier les composants abonnés du changement de statut
    setTimeout(() => {
      notifyStatusChange(status as AgentStatusType);
    }, 0);

    return {
      ...currentStatus,
      status: status as AgentStatusType,
      pauseCode,
      pauseReason,
      statusSince: new Date(),
    }
  })
}

// Fonction pour mettre à jour l'état d'appel
export function updateCallActive(callActive: boolean): void {
  agentStatus.update((currentStatus) => ({
    ...currentStatus,
    callActive,
  }))
}

// Fonction pour réinitialiser le statut
export function resetStatus(): void {
  agentStatus.set(initialState)
}

// Fonction pour mettre l'agent en pause
export function setAgentPaused(pauseCode: string, pauseReason: string): void {
  updateStatus(AGENT_STATUSES.PAUSED as AgentStatusType, pauseCode, pauseReason)
}

// Fonction pour mettre l'agent en statut prêt
export function setAgentReady(): void {
  updateStatus(AGENT_STATUSES.READY as AgentStatusType)
}

// Fonction pour mettre l'agent en statut déconnecté
export function setAgentLogout(): void {
  updateStatus(AGENT_STATUSES.LOGOUT as AgentStatusType)
}

// Fonction pour mettre à jour le statut d'appel
export function setCallActive(isActive: boolean): void {
  agentStatus.update((currentStatus) => {
    if (currentStatus.callActive === isActive) {
      return currentStatus // Aucun changement nécessaire
    }

    console.log(`[agentStatus] Mise à jour du statut d'appel: ${currentStatus.callActive} -> ${isActive}`)

    // Si un appel devient actif, mettre le statut à INCALL
    // Si un appel se termine, remettre le statut à READY
    const newStatus = isActive ? AGENT_STATUSES.INCALL : AGENT_STATUSES.READY

    return {
      ...currentStatus,
      status: newStatus as AgentStatusType,
      statusSince: new Date(),
      callActive: isActive,
    }
  })
}

// Fonction pour synchroniser le store agentStatus avec agentState
export function syncAgentStatusWithState(): void {
  const currentState = get(agentState)

  agentStatus.update((current) => ({
    ...current,
    status: currentState.status as AgentStatusType,
    pauseCode: currentState.pauseCode,
    pauseReason: currentState.pauseReason,
    callActive: currentState.callActive,
    statusSince: new Date(),
  }))

  console.log("[agentStatus] Synchronisé avec agentState:", currentState.status)
}

// Fonction pour synchroniser le store agentState avec agentStatus
export function syncStateWithAgentStatus(): void {
  const currentStatus = get(agentStatus)

  agentState.update((current) => ({
    ...current,
    status: currentStatus.status,
    pauseCode: currentStatus.pauseCode,
    pauseReason: currentStatus.pauseReason,
    callActive: currentStatus.callActive,
  }))

  console.log("[agentStatus] agentState synchronisé avec agentStatus:", currentStatus.status)
}

// Variable pour stocker les callbacks de notification
type StatusChangeCallback = (status: AgentStatusType) => void;
const statusChangeCallbacks: StatusChangeCallback[] = [];

// Fonction pour s'abonner aux notifications de changement de statut
export function subscribeToStatusChange(callback: StatusChangeCallback): () => void {
  statusChangeCallbacks.push(callback);
  
  // Retourner une fonction pour se désabonner
  return () => {
    const index = statusChangeCallbacks.indexOf(callback);
    if (index !== -1) {
      statusChangeCallbacks.splice(index, 1);
    }
  };
}

// Fonction pour notifier tous les composants d'un changement de statut
export function notifyStatusChange(status: AgentStatusType): void {
  console.log(`[agentStatus] Notification de changement de statut: ${status}`);
  
  // Appeler tous les callbacks enregistrés
  statusChangeCallbacks.forEach(callback => {
    try {
      callback(status);
    } catch (error) {
      console.error("Erreur lors de la notification d'un changement de statut:", error);
    }
  });
}
