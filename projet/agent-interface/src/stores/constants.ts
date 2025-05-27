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
export type AgentStatusType = "READY" | "INCALL" | "PAUSED" | "LOGOUT" | "OFFLINE" | "DIALING" | "WAITING"
