// Configuration de l'API
// Fonction pour obtenir l'URL de base de l'API en fonction de l'environnement
export function getApiUrl() {
  // En développement, utiliser localhost
  if (import.meta.env.DEV) {
    return "http://localhost:8000/api";
  }
  
  // En production, utiliser l'URL du serveur local
  return "http://localhost:8000/api";
}


// Configuration Asterisk
export const ASTERISK_CONFIG = {
  host: '213.32.34.33',
  port: 5038,
  username: 'root',
  password: 'Mc@2025',
  eventMask: 'on',
  timeout: 5000,
  reconnect: true,
  reconnectInterval: 5000,
  debug: true
};

// Intervalles de rafraîchissement (en millisecondes)
export const CHECK_CALLS_INTERVAL = 10000; // 10 secondes
export const STATUS_REFRESH_INTERVAL = 3000; // 3 secondes pour une meilleure synchronisation
export const STATS_REFRESH_INTERVAL = 60000; // 60 secondes

// Configuration de l'interface agent
export const AGENT_CONFIG = {
  // Délai de rafraîchissement des données en millisecondes
  refreshInterval: 5000,

  // Délai d'inactivité avant déconnexion automatique (en minutes)
  inactivityTimeout: 30,

  // Nombre maximal de tentatives de reconnexion
  maxReconnectAttempts: 5,

  // Délai entre les tentatives de reconnexion (en millisecondes)
  reconnectDelay: 5000,

  // Activer/désactiver les notifications sonores
  enableSoundNotifications: true,

  // Activer/désactiver les notifications de bureau
  enableDesktopNotifications: true,

  // Chemin vers les fichiers audio pour les notifications
  soundFiles: {
    incomingCall: "/sounds/incoming-call.mp3",
    callEnded: "/sounds/call-ended.mp3",
    notification: "/sounds/notification.mp3",
  },
};

// Configuration des statuts d'agent
export const AGENT_STATUSES = {
  READY: "READY",
  INCALL: "INCALL",
  PAUSED: "PAUSED",
  LOGOUT: "LOGOUT",
  OFFLINE: "OFFLINE",
};

// Configuration des codes de pause
export const PAUSE_CODES = [
  { code: "BREAK", label: "Pause café", color: "#4f46e5" },
  { code: "LUNCH", label: "Pause déjeuner", color: "#059669" },
  { code: "MEETING", label: "Réunion", color: "#0891b2" },
  { code: "TRAINING", label: "Formation", color: "#7c3aed" },
  { code: "ADMIN", label: "Tâches administratives", color: "#f59e0b" },
  { code: "OTHER", label: "Autre", color: "#6b7280" },
];

// Configuration des types d'appels
export const CALL_TYPES = {
  INBOUND: "inbound",
  OUTBOUND: "outbound",
  INTERNAL: "internal",
  TRANSFER: "transfer",
};

// Configuration des résultats d'appels
export const CALL_DISPOSITIONS = [
  { code: "ANSWERED", label: "Répondu", category: "success" },
  { code: "VOICEMAIL", label: "Messagerie vocale", category: "neutral" },
  { code: "BUSY", label: "Occupé", category: "neutral" },
  { code: "NO_ANSWER", label: "Pas de réponse", category: "neutral" },
  { code: "WRONG_NUMBER", label: "Mauvais numéro", category: "failure" },
  { code: "DO_NOT_CALL", label: "Ne pas rappeler", category: "failure" },
  { code: "CALLBACK", label: "Rappeler plus tard", category: "followup" },
  { code: "SALE", label: "Vente", category: "success" },
  { code: "NOT_INTERESTED", label: "Pas intéressé", category: "failure" },
  { code: "TECHNICAL_ISSUE", label: "Problème technique", category: "neutral" },
];
