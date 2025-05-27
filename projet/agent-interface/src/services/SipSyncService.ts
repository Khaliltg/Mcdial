import { get } from 'svelte/store';
import { agentState, resetCall } from '../stores/agent';
import { sipConnectionState } from './SipService';
import { api } from '../utils/fetchWithAuth';

/**
 * Service pour synchroniser l'état SIP entre l'application et Zoiper
 */
class SipSyncService {
  private syncInterval: number | null = null;
  private readonly SYNC_INTERVAL_MS = 5000; // 5 secondes
  
  /**
   * Démarre le service de synchronisation
   */
  public start(): void {
    if (this.syncInterval) {
      this.stop(); // Arrêter l'intervalle existant avant d'en créer un nouveau
    }
    
    // Effectuer une synchronisation immédiate
    this.syncWithAsterisk();
    
    // Configurer un intervalle pour les synchronisations régulières
    this.syncInterval = window.setInterval(() => {
      this.syncWithAsterisk();
    }, this.SYNC_INTERVAL_MS);
    
    console.log('Service de synchronisation SIP démarré');
  }
  
  /**
   * Arrête le service de synchronisation
   */
  public stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Service de synchronisation SIP arrêté');
    }
  }
  
  /**
   * Synchronise l'état SIP avec Asterisk
   */
  private async syncWithAsterisk(): Promise<void> {
    try {
      const currentState = get(agentState);
      
      // Vérifier si l'agent est connecté et a une extension
      if (!currentState.isAuthenticated || !currentState.extension) {
        console.log('Agent non connecté ou sans extension, synchronisation ignorée');
        return;
      }
      
      // Extraire l'extension sans le préfixe SIP/ si présent
      let extension = currentState.extension;
      if (extension.startsWith('SIP/')) {
        extension = extension.substring(4);
        console.log(`Préfixe SIP/ détecté et supprimé. Extension utilisée: ${extension}`);
      }
      
      // Récupérer l'état d'enregistrement SIP de l'extension
      const response = await api.get(`/agent/sip-status/status/${extension}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          const sipStatus = data.data;
          
          // Mettre à jour le store sipConnectionState
          sipConnectionState.update(state => ({
            ...state,
            connected: true,
            registered: sipStatus.registered,
            extension: currentState.extension,
            lastError: null,
            reconnecting: false
          }));
          
          console.log(`État SIP synchronisé: Extension ${currentState.extension} ${sipStatus.registered ? 'enregistrée' : 'non enregistrée'}`);
          
          // Si l'agent est en appel, vérifier les canaux actifs
          if (currentState.callActive && currentState.callId) {
            this.checkActiveChannels(currentState.extension);
          }
        }
      } else {
        console.error('Erreur lors de la synchronisation SIP:', response.status);
        
        // Mettre à jour le store sipConnectionState avec l'erreur
        sipConnectionState.update(state => ({
          ...state,
          lastError: `Erreur de synchronisation (${response.status})`,
          reconnecting: true
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation SIP:', error);
      
      // Mettre à jour le store sipConnectionState avec l'erreur
      sipConnectionState.update(state => ({
        ...state,
        lastError: error instanceof Error ? error.message : 'Erreur inconnue',
        reconnecting: true
      }));
    }
  }
  
  /**
   * Vérifie les canaux actifs pour une extension
   */
  private async checkActiveChannels(extension: string): Promise<void> {
    try {
      // Extraire l'extension sans le préfixe SIP/ si présent
      let cleanExtension = extension;
      if (cleanExtension.startsWith('SIP/')) {
        cleanExtension = cleanExtension.substring(4);
        console.log(`Préfixe SIP/ détecté et supprimé. Extension utilisée: ${cleanExtension}`);
      }
      
      // Utiliser la nouvelle API de synchronisation
      const currentState = get(agentState);
      const callId = currentState.callId;
      
      if (!callId) {
        // Pas d'appel actif selon l'application, rien à synchroniser
        return;
      }
      
      // Vérifier l'état réel de l'appel avec la nouvelle API
      const response = await api.post('/agent/sync/call-state', { 
        callId,
        extension: cleanExtension
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const hasActiveCall = data.hasActiveCall;
          console.log(`État de l'appel ${callId} vérifié: ${hasActiveCall ? 'Actif' : 'Inactif'}`);
          
          // Si l'application pense qu'il y a un appel actif mais qu'il n'y en a pas en réalité
          if (currentState.callActive && !hasActiveCall) {
            console.log('Désynchronisation détectée: L\'application pense qu\'il y a un appel actif mais il n\'y en a pas');
            
            // Vérifier depuis combien de temps l'appel est considéré comme actif
            const now = new Date();
            const callStartTime = currentState.callData?.startTime || new Date();
            const callDurationSeconds = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
            
            // Si l'appel est considéré comme actif depuis plus de 10 secondes, réinitialiser l'état
            if (callDurationSeconds > 10) {
              console.log(`Correction automatique: Réinitialisation de l'état d'appel après ${callDurationSeconds}s de désynchronisation`);
              
              // Utiliser la nouvelle API pour forcer la synchronisation
              try {
                const syncResponse = await api.post('/agent/sync/call-state', {
                  callId: currentState.callId,
                  forceSync: true
                });
                
                if (syncResponse.ok) {
                  console.log('Synchronisation forcée réussie, réinitialisation de l\'interface');
                  resetCall(); // Réinitialiser l'état de l'appel dans le store
                } else {
                  console.error('Erreur lors de la synchronisation forcée:', syncResponse.status);
                }
              } catch (error) {
                console.error('Erreur lors de la synchronisation forcée:', error);
                // Réinitialiser quand même l'état local en cas d'erreur
                resetCall();
              }
            } else {
              console.log(`Attente avant correction: L'appel est considéré comme actif depuis seulement ${callDurationSeconds}s`);
            }
          }
        }
      } else {
        console.error('Erreur lors de la vérification de l\'appel:', response.status);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des canaux actifs:', error);
    }
  }
  
  /**
   * Force une synchronisation immédiate
   */
  public async forceSync(): Promise<void> {
    await this.syncWithAsterisk();
  }
}

// Exporter une instance unique du service
export const sipSyncService = new SipSyncService();
