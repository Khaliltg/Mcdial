/**
 * Constantes pour le service Asterisk
 */

// États de connexion
const CONNECTION_STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
}

// États des agents
const AGENT_STATES = {
  READY: "READY",
  PAUSED: "PAUSED",
  INCALL: "INCALL",
  WRAPUP: "WRAPUP",
  LOGOUT: "LOGOUT",
}

// États des appels
const CALL_STATES = {
  RINGING: "RINGING",
  UP: "UP",
  DOWN: "DOWN",
  BUSY: "BUSY",
  CONGESTION: "CONGESTION",
  NOANSWER: "NOANSWER",
}

// Événements AMI
const AMI_EVENTS = {
  NEWCHANNEL: "Newchannel",
  HANGUP: "Hangup",
  BRIDGE: "Bridge",
  NEWSTATE: "Newstate",
  PEER_ENTRY: "PeerEntry",
  REGISTRY: "Registry",
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",
  MANAGEREVENT: "managerevent",
}

// Codes d'erreur
const ERROR_CODES = {
  CONNECTION_FAILED: "CONNECTION_FAILED",
  AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",
  TIMEOUT: "TIMEOUT",
  INVALID_EXTENSION: "INVALID_EXTENSION",
  CALL_FAILED: "CALL_FAILED",
  AGENT_NOT_READY: "AGENT_NOT_READY",
  NETWORK_ERROR: "NETWORK_ERROR",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  RESOURCE_UNAVAILABLE: "RESOURCE_UNAVAILABLE",
}

// Actions AMI
const AMI_ACTIONS = {
  PING: "Ping",
  ORIGINATE: "Originate",
  HANGUP: "Hangup",
  STATUS: "Status",
  SIPSHOWPEER: "SIPshowpeer",
  SIPSHOWREGISTRY: "SIPshowregistry",
  SIPPEERS: "SIPpeers",
  CORESHOWCHANNELS: "CoreShowChannels",
  QUEUEPAUSE: "QueuePause",
  COMMAND: "Command",
  MEETME: "MeetMe",
}

// Contextes Asterisk
const ASTERISK_CONTEXTS = {
  FROM_INTERNAL: "from-internal",
  FROM_EXTERNAL: "from-external",
  OUTBOUND: "outbound",
  INBOUND: "inbound",
}

// Timeouts (en millisecondes)
const TIMEOUTS = {
  CONNECTION: 10000, // 10 secondes
  COMMAND: 30000, // 30 secondes
  CALL_ORIGINATE: 30000, // 30 secondes
  KEEPALIVE: 60000, // 1 minute
  RECONNECT: 5000, // 5 secondes
}

// Préfixes CallerID Vicidial
const CALLERID_PREFIXES = {
  MANUAL: "M", // Appel manuel
  SYNC: "S", // Appel de synchronisation
  AUTO: "A", // Appel automatique
  TRANSFER: "T", // Transfert
}

module.exports = {
  CONNECTION_STATES,
  AGENT_STATES,
  CALL_STATES,
  AMI_EVENTS,
  AMI_ACTIONS,
  ERROR_CODES,
  ASTERISK_CONTEXTS,
  TIMEOUTS,
  CALLERID_PREFIXES,
}
