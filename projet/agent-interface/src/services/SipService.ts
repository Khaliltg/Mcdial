import { writable, get } from 'svelte/store';
import { AGENT_STATUSES } from '../utils/config';
import { agentState, updateAgentStatus } from '../stores/agent';
import { api } from '../utils/fetchWithAuth';
import { ASTERISK_CONFIG } from '../utils/config';
import AsteriskManager from 'asterisk-manager';

// Interface pour l'état de la connexion
interface SipConnectionState {
  connected: boolean;
  registered: boolean;
  extension: string;
  lastError: string | null;
  reconnecting: boolean;
}

// Store pour l'état de la connexion SIP
export const sipConnectionState = writable<SipConnectionState>({
  connected: false,
  registered: false,
  extension: '',
  lastError: null,
  reconnecting: false
});

// Initialiser le store avec les valeurs du localStorage s'il y en a
const savedState = localStorage.getItem('sip_connection_state');
if (savedState) {
  try {
    const parsedState = JSON.parse(savedState) as SipConnectionState;
    sipConnectionState.set(parsedState);
    console.log('État de connexion SIP restauré depuis localStorage:', parsedState);
  } catch (error) {
    console.error('Erreur lors de la restauration de l\'état SIP:', error);
  }
}

// S'abonner aux changements d'état pour les sauvegarder dans localStorage
sipConnectionState.subscribe(state => {
  localStorage.setItem('sip_connection_state', JSON.stringify(state));
});

// Interface pour les options de connexion
interface SipConnectionOptions {
  extension: string;
  password: string;
  agentId: string;
  campaignId: string;
}

// Interface pour la réponse d'enregistrement SIP
interface SipRegistrationResponse {
  success: boolean;
  registered: boolean;
  message: string;
  host?: string;
  port?: string;
  userAgent?: string;
  status?: string;
}

// Interface pour les réponses API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Interface pour les événements AMI
interface AmiEvent {
  event: string;
  [key: string]: any;
}

/**
 * Service pour gérer la connexion SIP avec Asterisk
 */
export class SipService {
  private static connection: any = null;
  private static session: any = null;
  private static reconnectTimer: any = null;
  private static connectionOptions: SipConnectionOptions | null = null;
  private static amiConnection: AsteriskManager | null = null;
  private static amiEvents: Map<string, Array<(event: AmiEvent) => void>> = new Map();

  /**
   * Initialise la connexion SIP
   * @param options Options de connexion
   */
  static async connect(options: SipConnectionOptions): Promise<{ success: boolean; message?: string }> {
    const startTime = Date.now();
    const logPrefix = `[SIP:${options.extension}]`;
    
    try {
      this.connectionOptions = options;
      
      console.log(`${logPrefix} Début de la connexion SIP`);
      console.log(`${logPrefix} Options:`, {
        extension: options.extension,
        agentId: options.agentId,
        campaignId: options.campaignId
      });
      
      // Mise à jour du store pour indiquer la tentative de connexion
      const initialState = {
        connected: false,
        registered: false,
        extension: options.extension,
        reconnecting: true,
        lastError: null
      };
      
      sipConnectionState.set(initialState);
      console.log(`${logPrefix} État initial configuré`);
      
      // Vérifier la connexion AMI
      if (!this.amiConnection) {
        console.log(`${logPrefix} Connexion à l'AMI...`);
        const amiResult = await this.connectToAMI(options);
        if (!amiResult.success) {
          throw new Error(`Échec AMI: ${amiResult.message}`);
        }
        console.log(`${logPrefix} Connexion AMI réussie`);
      } else {
        console.log(`${logPrefix} Connexion AMI existante réutilisée`);
      }

      // Vérifier si l'extension est déjà enregistrée
      console.log(`${logPrefix} Vérification de l'enregistrement SIP...`);
      const initialStatus = await this.checkSipRegistration(options.extension);
      
      if (initialStatus.success && initialStatus.registered) {
        console.log(`${logPrefix} Extension déjà enregistrée`);
        const newState = {
          connected: true,
          registered: true,
          extension: options.extension,
          reconnecting: false,
          lastError: null
        };
        
        sipConnectionState.set(newState);
        updateAgentStatus(AGENT_STATUSES.READY);
        window.dispatchEvent(new CustomEvent('sip-status-changed', { detail: newState }));
        
        console.log(`${logPrefix} Connexion SIP réussie (${Date.now() - startTime}ms)`);
        return { 
          success: true,
          message: 'Connexion SIP établie avec succès'
        };
      }

      // Si non enregistrée, tenter de forcer l'enregistrement
      console.log(`${logPrefix} Tentative d'enregistrement SIP...`);
      const response = await api.post(`/agent/sip/register`, {
        extension: options.extension,
        password: options.password
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        throw new Error(`Erreur lors de l'enregistrement: ${errorText}`);
      }

      const registerResult: ApiResponse<void> = await response.json();
      if (!registerResult.success) {
        throw new Error(`Échec de l'enregistrement: ${registerResult.message}`);
      }

      // Vérifier l'enregistrement avec plusieurs tentatives
      console.log(`${logPrefix} Vérification de l'enregistrement...`);
      const maxAttempts = 3;
      let attempt = 1;
      let finalStatus;

      while (attempt <= maxAttempts) {
        console.log(`${logPrefix} Tentative ${attempt}/${maxAttempts}...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Attente de 2 secondes
        
        finalStatus = await this.checkSipRegistration(options.extension);
        
        if (finalStatus.success && finalStatus.registered) {
          console.log(`${logPrefix} Enregistrement SIP confirmé après ${attempt} tentative(s)`);
          break;
        }
        
        attempt++;
      }

      if (finalStatus && finalStatus.registered) {
        const newState = {
          connected: true,
          registered: true,
          extension: options.extension,
          reconnecting: false,
          lastError: null
        };
        
        sipConnectionState.set(newState);
        updateAgentStatus(AGENT_STATUSES.READY);
        window.dispatchEvent(new CustomEvent('sip-status-changed', { detail: newState }));
        
        console.log(`${logPrefix} Connexion SIP établie avec succès (${Date.now() - startTime}ms)`);
        return { 
          success: true,
          message: 'Connexion SIP établie avec succès'
        };
      }

      throw new Error(`Échec de l'enregistrement après ${maxAttempts} tentatives`);
    } catch (error) {
      console.error('Erreur lors de la connexion SIP:', error);
      sipConnectionState.update(state => ({
        ...state,
        connected: false,
        registered: false,
        reconnecting: false,
        lastError: error instanceof Error ? error.message : 'Erreur lors de la connexion SIP'
      }));
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur lors de la connexion SIP' 
      };
    }
  }

  /**
   * Vérifie l'état d'enregistrement SIP
   * @param extension Extension SIP à vérifier
   */
  static async checkSipRegistration(extension: string): Promise<SipRegistrationResponse> {
    const logPrefix = `[SIP:${extension}]`;
    const startTime = Date.now();
    
    try {
      console.log(`${logPrefix} Vérification de l'enregistrement...`);
      
      // Extraire l'extension sans le préfixe SIP/ si présent
      let cleanExtension = extension;
      if (cleanExtension.startsWith('SIP/')) {
        cleanExtension = cleanExtension.substring(4);
        console.log(`${logPrefix} Préfixe SIP/ détecté et supprimé. Extension utilisée: ${cleanExtension}`);
      }
      
      const response = await api.get(`/agent/sip-status/status/${cleanExtension}`)
        .catch(error => {
          console.error(`${logPrefix} Erreur réseau:`, error);
          throw new Error(`Erreur réseau: ${error.message}`);
        });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        console.error(`${logPrefix} Erreur HTTP ${response.status}:`, errorText);
        throw new Error(`Erreur ${response.status} lors de la vérification SIP`);
      }
      
      let apiResponse: ApiResponse<SipRegistrationResponse>;
      try {
        apiResponse = await response.json();
      } catch (jsonError) {
        console.error(`${logPrefix} Erreur de parsing JSON:`, jsonError);
        throw new Error('Réponse invalide du serveur');
      }
      
      // Vérifier la réponse de l'API
      if (!apiResponse.success) {
        const errorMsg = apiResponse.message || 'Erreur inconnue du serveur';
        console.warn(`${logPrefix} Échec de la vérification:`, errorMsg);
        throw new Error(errorMsg);
      }

      // Extraire les données de la réponse
      const sipData = apiResponse.data || {};
      const result = {
        success: true,
        registered: !!sipData.registered,
        message: sipData.message || 'État d\'enregistrement SIP vérifié',
        host: sipData.host,
        port: sipData.port,
        userAgent: sipData.userAgent,
        status: sipData.status || 'inconnu'
      };
      
      console.log(`${logPrefix} Résultat de la vérification:`, {
        registered: result.registered,
        status: result.status,
        duration: `${Date.now() - startTime}ms`
      });
      
      return result;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`${logPrefix} Erreur lors de la vérification:`, errorMsg);
      
      return {
        success: false,
        registered: false,
        message: errorMsg,
        status: 'error'
      };
    }
  }

  /**
   * Déconnecte la session SIP
   */
  static async disconnect(): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.connection) {
        return { success: true };
      }

      // Mettre à jour l'état de connexion
      sipConnectionState.update(state => ({
        ...state,
        connected: false,
        registered: false,
        reconnecting: false,
        lastError: null
      }));

      // Déconnecter SIP
      if (this.connection) {
        await this.connection.disconnect();
        this.connection = null;
      }

      // Déconnecter AMI
      if (this.amiConnection) {
        await this.amiConnection.disconnect();
        this.amiConnection = null;
      }

      // Mettre à jour le statut de l'agent
      updateAgentStatus(AGENT_STATUSES.OFFLINE);

      // Forcer un événement DOM pour notifier les composants qui écoutent
      window.dispatchEvent(new CustomEvent('sip-status-changed', { detail: { connected: false } }));

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la déconnexion SIP:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur lors de la déconnexion SIP' 
      };
    }
  }

  /**
   * Force une mise à jour de l'état de connexion SIP
   */
  static async refreshConnectionState(): Promise<void> {
    try {
      const currentState = get(sipConnectionState);
      if (!currentState.extension) {
        return;
      }

      const status = await this.checkSipRegistration(currentState.extension);
      if (status.success) {
        sipConnectionState.update(state => ({
          ...state,
          registered: status.registered,
          lastError: status.message
        }));
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de l\'état de connexion:', error);
    }
  }

  /**
   * Tente de se connecter à l'AMI
   */
  private static async connectToAMI(options: SipConnectionOptions): Promise<{ success: boolean; message?: string }> {
    try {
      if (this.amiConnection) {
        await this.amiConnection.disconnect();
      }

      // Créer une nouvelle connexion AMI
      this.amiConnection = new AsteriskManager(
        ASTERISK_CONFIG.host,
        ASTERISK_CONFIG.port,
        ASTERISK_CONFIG.username,
        ASTERISK_CONFIG.password
      );

      // Configurer les gestionnaires d'événements
      this.setupAmiEventHandlers();

      // Connexion à AMI
      await this.amiConnection.connect();

      // Vérifier l'enregistrement SIP
      const status = await this.checkSipRegistration(options.extension);
      if (!status.success || !status.registered) {
        throw new Error('Impossible de vérifier l\'enregistrement SIP');
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la connexion AMI:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur lors de la connexion AMI' 
      };
    }
  }

  /**
   * Configure les gestionnaires d'événements AMI
   */
  private static setupAmiEventHandlers(): void {
    if (!this.amiConnection) {
      return;
    }

    // Gestionnaire pour les événements AMI
    this.amiConnection.on('event', (event: any) => {
      console.log('Événement AMI reçu:', event);
      
      // Notifier les callbacks inscrits
      const callbacks = this.amiEvents.get(event.event);
      if (callbacks && Array.isArray(callbacks) && callbacks.length > 0) {
        try {
          callbacks.forEach(callback => callback(event));
        } catch (error) {
          console.error('Erreur lors de l\'exécution des callbacks:', error);
        }
      }
    });

    // Gestionnaire pour les erreurs AMI
    this.amiConnection.on('error', (error: Error) => {
      console.error('Erreur AMI:', error);
      this.handleAmiError(error);
    });

    // Gestionnaire pour la déconnexion AMI
    this.amiConnection.on('disconnect', () => {
      console.log('Déconnexion AMI');
      this.handleAmiDisconnect();
    });
  }

  /**
   * Gère les erreurs AMI
   */
  private static handleAmiError(error: Error): void {
    sipConnectionState.update(state => ({
      ...state,
      connected: false,
      registered: false,
      reconnecting: false,
      lastError: error.message
    }));
    
    // Tenter de se reconnecter après une erreur
    if (this.connectionOptions) {
      this.reconnectWithDelay();
    }
  }

  /**
   * Gère la déconnexion AMI
   */
  private static handleAmiDisconnect(): void {
    sipConnectionState.update(state => ({
      ...state,
      connected: false,
      registered: false,
      reconnecting: false,
      lastError: 'Déconnexion AMI'
    }));
    
    // Tenter de se reconnecter après une déconnexion
    if (this.connectionOptions) {
      this.reconnectWithDelay();
    }
  }

  /**
   * Tente de se reconnecter après un délai
   */
  private static reconnectWithDelay(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Attendre 5 secondes avant de réessayer
    this.reconnectTimer = setTimeout(async () => {
      if (this.connectionOptions) {
        console.log('Tentative de reconnexion AMI...');
        await this.connectToAMI(this.connectionOptions);
      }
    }, 5000);
  }

  /**
   * Inscrire un gestionnaire d'événements AMI
   */
  static registerAmiEventHandler(eventType: string, callback: (event: AmiEvent) => void): void {
    const existingCallbacks = this.amiEvents.get(eventType) || [];
    const newCallbacks = [...existingCallbacks, callback];
    this.amiEvents.set(eventType, newCallbacks);
  }

  /**
   * Désinscrire un gestionnaire d'événements AMI
   */
  static unregisterAmiEventHandler(eventType: string, callback: (event: AmiEvent) => void): void {
    const callbacks = this.amiEvents.get(eventType);
    if (Array.isArray(callbacks)) {
      const newCallbacks = callbacks.filter(cb => cb !== callback);
      this.amiEvents.set(eventType, newCallbacks);
    }
  }

  /**
   * Récupère l'extension actuelle
   */
  static getCurrentExtension(): string {
    const state = get(sipConnectionState);
    return state.extension || '';
  }

  /**
   * Vérifie si le service est connecté
   */
  static isConnected(): boolean {
    const state = get(sipConnectionState);
    return state.connected;
  }

  /**
   * Vérifie si l'extension est enregistrée
   */
  static isRegistered(): boolean {
    const state = get(sipConnectionState);
    return state.registered;
  }

  /**
   * Récupère le dernier message d'erreur
   */
  static getLastError(): string | null {
    const state = get(sipConnectionState);
    return state.lastError;
  }

  /**
   * Vérifie si une tentative de reconnexion est en cours
   */
  static getReconnecting(): boolean {
    const state = get(sipConnectionState);
    return state.reconnecting;
  }

  /**
   * Récupère l'extension actuelle
   */
  static getExtension(): string {
    const state = get(sipConnectionState);
    return state.extension;
  }
}
