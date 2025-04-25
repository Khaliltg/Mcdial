/**
 * Service pour gérer les connexions WebRTC avec Asterisk
 */
import JsSIP from 'jssip';
import { writable, get } from 'svelte/store';

// Types pour JsSIP
type RTCSession = any; // JsSIP.RTCSession n'est pas correctement exporté, on utilise any
export type SipStatus = 'disconnected' | 'connecting' | 'connected' | 'registered' | 'error';
type CallStatus = 'idle' | 'ringing' | 'inprogress' | 'hold' | 'ended';

// Stores pour gérer l'état de la connexion et des appels
export const sipStatus = writable<SipStatus>('disconnected');
export const callStatus = writable<CallStatus>('idle');
export const currentSession = writable<RTCSession | null>(null);
export const audioStreams = writable<{ local: MediaStream | null, remote: MediaStream | null }>({ local: null, remote: null });

// Mode simulation pour le développement
export const simulationMode = writable<boolean>(false);

// Configuration SIP
// Utilisation du serveur de démonstration JsSIP pour les tests
// Note: Les appels réels sont gérés par l'API Twilio dans le backend
const WS_SERVER = 'wss://tryit.jssip.net:8089/ws';
const SIP_DOMAIN = 'tryit.jssip.net';
const SIP_URI_PREFIX = 'sip:';
const SIP_URI_SUFFIX = '@' + SIP_DOMAIN;

// Générer un ID aléatoire pour éviter les conflits sur le serveur de démo
const RANDOM_ID = Math.floor(Math.random() * 10000000);
let ua: JsSIP.UA | null = null;
let localAudio: HTMLAudioElement | null = null;
let remoteAudio: HTMLAudioElement | null = null;

// Interface pour la configuration SIP
interface SipConfig {
  serverUrl: string;
  extension: string;
  password: string;
  domain: string;
  displayName: string;
}

/**
 * Initialise les éléments audio pour la communication WebRTC
 */
function initAudioElements() {
  // Créer l'élément audio local s'il n'existe pas
  if (!localAudio) {
    localAudio = new Audio();
    localAudio.autoplay = true;
    localAudio.muted = true; // Mute local audio to prevent echo
    document.body.appendChild(localAudio);
  }
  
  // Créer l'élément audio distant s'il n'existe pas
  if (!remoteAudio) {
    remoteAudio = new Audio();
    remoteAudio.autoplay = true;
    document.body.appendChild(remoteAudio);
  }
}

/**
 * Initialise la connexion SIP avec Asterisk
 * @param username - Nom d'utilisateur pour la connexion SIP
 * @param password - Mot de passe pour la connexion SIP
 */
export function initSIP(username: string, password: string = 'welcome') {
  console.log('Initialisation SIP avec username:', username);
  
  // Pour le serveur de démo, utiliser un nom d'utilisateur aléatoire
  // afin d'éviter les conflits avec d'autres testeurs
  const demoUsername = `agent${RANDOM_ID}`;
  
  // Créer l'URI SIP
  const sipUri = SIP_URI_PREFIX + demoUsername + SIP_URI_SUFFIX;
  console.log('URI SIP pour le serveur de démo:', sipUri);
  
  // Initialiser les éléments audio
  initAudioElements();
  
  // Mettre à jour le statut
  sipStatus.set('connecting');
  
  // Configuration de JsSIP pour le serveur de démo
  const socket = new JsSIP.WebSocketInterface(WS_SERVER);
  const configuration = {
    sockets: [socket],
    uri: sipUri,
    // Le serveur de démo n'utilise pas de mot de passe
    password: 'nopassword',
    register: true,
    register_expires: 300,
    session_timers: false,
    // Ajouter des options de débogage
    trace_sip: true
  };
  
  try {
    // Créer l'agent utilisateur SIP
    ua = new JsSIP.UA(configuration);
    
    // Gérer les événements SIP
    ua.on('connecting', () => {
      console.log('Connexion au serveur WebSocket en cours...');
      sipStatus.set('connecting');
    });
    
    ua.on('connected', () => {
      console.log('Connecté au serveur WebSocket de démonstration');
      sipStatus.set('connected');
    });
    
    ua.on('disconnected', () => {
      console.log('Déconnecté du serveur WebSocket');
      sipStatus.set('disconnected');
      
      // Activer le mode simulation immédiatement pour éviter les erreurs
      console.log('Activation du mode simulation suite à une déconnexion WebSocket');
      simulationMode.set(true);
      
      // Tentative de reconnexion en arrière-plan
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 3;
      
      const reconnectInterval = setInterval(() => {
        reconnectAttempts++;
        
        if (reconnectAttempts <= maxReconnectAttempts) {
          console.log(`Tentative de reconnexion ${reconnectAttempts}/${maxReconnectAttempts}...`);
          try {
            if (ua) ua.start();
          } catch (error) {
            console.log('Erreur lors de la tentative de reconnexion:', error);
          }
        } else {
          console.log('Nombre maximal de tentatives atteint');
          clearInterval(reconnectInterval);
        }
      }, 5000); // Augmenter l'intervalle pour éviter trop de tentatives rapides
    });
    
    ua.on('registered', () => {
      console.log('Enregistré auprès du serveur SIP de démonstration');
      sipStatus.set('registered');
    });
    
    ua.on('unregistered', () => {
      console.log('Non enregistré auprès du serveur SIP');
      sipStatus.set('connected');
    });
    
    ua.on('registrationFailed', (e: any) => {
      console.error('Échec de l\'enregistrement SIP:', e);
      sipStatus.set('error');
      
      // Afficher plus de détails sur l'erreur
      console.log('Détails de l\'erreur d\'enregistrement:', e.cause);
    });
    
    // Gestion des appels entrants
    ua.on('newRTCSession', (data: { session: RTCSession }) => {
      const session = data.session;
      
      // Stocker la session actuelle
      currentSession.set(session);
      
      if (session.direction === 'incoming') {
        // Appel entrant
        console.log('Appel entrant de:', session.remote_identity?.uri?.user);
        callStatus.set('ringing');
        
        // Configurer les gestionnaires d'événements pour la session
        setupSessionHandlers(session);
      }
    });
    
    // Démarrer la connexion
    ua.start();
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation SIP:', error);
    sipStatus.set('disconnected');
    console.log('Activation du mode simulation suite à une erreur d\'initialisation');
    simulationMode.set(true);
    return false;
  }
}

/**
 * Configure les gestionnaires d'événements pour une session RTC
 * @param session - Session RTC
 */
function setupSessionHandlers(session: RTCSession) {
  // Événement de confirmation d'appel (appel accepté)
  session.on('confirmed', () => {
    console.log('Appel confirmé');
    callStatus.set('inprogress');
  });
  
  // Événement de fin d'appel
  session.on('ended', () => {
    console.log('Appel terminé');
    callStatus.set('ended');
    setTimeout(() => callStatus.set('idle'), 1000);
    currentSession.set(null);
  });
  
  // Événement d'échec d'appel
  session.on('failed', (data: any) => {
    console.error('Échec de l\'appel:', data);
    callStatus.set('ended');
    setTimeout(() => callStatus.set('idle'), 1000);
    currentSession.set(null);
  });
  
  // Événement de mise en attente
  session.on('hold', () => {
    console.log('Appel mis en attente');
    callStatus.set('hold');
  });
  
  // Événement de reprise d'appel
  session.on('unhold', () => {
    console.log('Appel repris');
    callStatus.set('inprogress');
  });
  
  // Événement de flux média (audio/vidéo)
  session.on('addstream', (data: { stream: MediaStream }) => {
    console.log('Flux média ajouté:', data);
    
    if (remoteAudio) {
      remoteAudio.srcObject = data.stream;
    }
    
    audioStreams.update(streams => ({
      ...streams,
      remote: data.stream
    }));
  });
}

/**
 * Répond à un appel entrant
 */
export function answerCall() {
  const session = get(currentSession);
  
  if (!session) {
    console.error('Aucun appel à répondre');
    return false;
  }
  
  try {
    // Options pour répondre à l'appel
    const options = {
      mediaConstraints: { audio: true, video: false }
    };
    
    // Répondre à l'appel
    session.answer(options);
    callStatus.set('inprogress');
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la réponse à l\'appel:', error);
    return false;
  }
}

/**
 * Initie un appel sortant
 * @param number - Numéro à appeler
 * @param extraHeaders - En-têtes supplémentaires pour l'appel
 */
export function makeCall(number: string, extraHeaders: Record<string, string> = {}) {
  if (!ua) {
    console.error('Agent SIP non initialisé');
    return false;
  }
  
  try {
    // Convertir les en-têtes en format SIP
    const headers = Object.entries(extraHeaders).map(([key, value]) => `${key}: ${value}`);
    
    // Options pour l'appel
    const options = {
      mediaConstraints: { audio: true, video: false },
      extraHeaders: headers
    };
    
    // Initier l'appel
    const session = ua.call(number, options);
    currentSession.set(session);
    callStatus.set('ringing');
    
    // Configurer les gestionnaires d'événements pour la session
    setupSessionHandlers(session);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initiation de l\'appel:', error);
    return false;
  }
}

/**
 * Termine l'appel en cours
 */
export function hangupCall() {
  const session = get(currentSession);
  
  if (!session) {
    console.log('Aucun appel WebRTC actif à terminer, continuant avec le processus de fin d\'appel');
    return true; // Retourner true pour ne pas bloquer le processus de fin d'appel
  }
  
  try {
    // Terminer l'appel
    session.terminate();
    callStatus.set('ended');
    setTimeout(() => callStatus.set('idle'), 1000);
    currentSession.set(null);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la terminaison de l\'appel:', error);
    return false;
  }
}

/**
 * Met l'appel en cours en attente ou le reprend
 * @param {boolean} hold - true pour mettre en attente, false pour reprendre
 */
export function toggleHold(hold: boolean): boolean {
  const session = get(currentSession);
  
  if (!session) {
    console.log('Aucun appel WebRTC actif à mettre en attente, continuant avec le processus');
    return true; // Retourner true pour ne pas bloquer l'interface
  }
  
  try {
    if (hold) {
      session.hold();
      callStatus.set('hold');
    } else {
      session.unhold();
      callStatus.set('inprogress');
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise en attente de l\'appel:', error);
    return true; // Retourner true pour ne pas bloquer l'interface
  }
}

/**
 * Active ou désactive le micro
 * @param {boolean} mute - true pour couper le micro, false pour l'activer
 */
export function toggleMute(mute: boolean): boolean {
  const session = get(currentSession);
  
  if (!session) {
    console.log('Aucun appel WebRTC actif à mettre en sourdine, continuant avec le processus');
    return true; // Retourner true pour ne pas bloquer l'interface
  }
  
  try {
    if (mute) {
      session.mute();
    } else {
      session.unmute();
    }
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise en sourdine:', error);
    return true; // Retourner true pour ne pas bloquer l'interface
  }
}

/**
 * Envoie des tonalités DTMF
 * @param {string} tones - Tonalités à envoyer (0-9, *, #)
 */
export function sendDTMF(tones: string) {
  const session = get(currentSession);
  
  if (!session) {
    console.error('Aucun appel pour envoyer des tonalités DTMF');
    return false;
  }
  
  try {
    session.sendDTMF(tones);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de tonalités DTMF:', error);
    return false;
  }
}

/**
 * Termine la connexion SIP
 */
export function terminateSIP() {
  if (!ua) {
    console.error('Agent SIP non initialisé');
    return false;
  }
  
  try {
    // Terminer l'appel en cours s'il y en a un
    const session = get(currentSession);
    if (session) {
      session.terminate();
    }
    
    // Arrêter l'agent SIP
    ua.stop();
    ua = null;
    
    // Nettoyer les éléments audio
    if (localAudio) {
      document.body.removeChild(localAudio);
      localAudio = null;
    }
    
    if (remoteAudio) {
      document.body.removeChild(remoteAudio);
      remoteAudio = null;
    }
    
    // Réinitialiser les stores
    sipStatus.set('disconnected');
    callStatus.set('idle');
    currentSession.set(null);
    audioStreams.set({ local: null, remote: null });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la terminaison SIP:', error);
    return false;
  }
}
