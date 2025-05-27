<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { agentState, pauseAgent, resumeAgent, endCall, startCall, updateAgentStatus } from '../stores/agent';
  import type { AgentStatusType } from '../stores/constants';
  import { agentStatus, setAgentPaused, setAgentReady, setAgentLogout, updateStatus, setCallActive, syncStateWithAgentStatus } from '../stores/agentStatus';
  import CallControls from './CallControls.svelte';
  import PredictiveDialer from './agent-interface/dialer/PredictiveDialer.svelte';
  import { api } from '../utils/fetchWithAuth';
  import { CHECK_CALLS_INTERVAL, STATUS_REFRESH_INTERVAL, AGENT_STATUSES } from '../utils/config';
  import { canMakeApiCall, recordApiCall } from '../utils/apiThrottle';
  import { get } from 'svelte/store';
  import { sipSyncService } from '../services/SipSyncService';
  import { sipConnectionState } from '../services/SipService';

  // Définition du type pour les codes de pause
  interface PauseCode {
    pause_code: string;
    pause_code_name: string;
    campaign_id?: string;
  }
  
  // Variables locales
  let isLoading = true;
  let error = '';
  let callCheckInterval: number;
  
  // Référence au composant PredictiveDialer
  let predictiveDialerComponent: PredictiveDialer;
  
  $: currentStatus = $agentStatus.status;
  $: isCallActive = $agentStatus.callActive;
  
  // Log pour déboguer les changements d'état
  $: console.log('Dashboard - État actuel du store agentStatus:', $agentStatus);
  
  // Pas de synchronisation - le Dashboard fait des appels directs aux API

  // Fonction pour charger les informations de l'agent
  async function loadAgentInfo() {
    try {
      const response = await api.get('/agent/info');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Informations agent chargées:', data);
        
        // Mettre à jour le statut de l'agent avec la fonction dédiée
        if (data.status) {
          console.log('Statut reçu du serveur:', data.status, 'Code de pause:', data.pauseCode, 'Raison de pause:', data.pauseReason);
          
          // Forcer la mise à jour du statut dans le store agentStatus
          if (data.status === 'PAUSED') {
            console.log('Mise à jour du statut PAUSED avec le code de pause:', data.pauseCode);
            setAgentPaused(data.pauseCode || 'LOGIN', data.pauseReason || 'Agent en pause après connexion');
          } else {
            // Utiliser updateAgentStatus pour mettre à jour le statut
            updateAgentStatus(data.status, data.pauseCode, data.pauseReason);
          }
          
          // Synchroniser les deux stores
          setTimeout(() => {
            syncStateWithAgentStatus();
            console.log('Statut après synchronisation:', get(agentStatus).status, 'Code de pause:', get(agentStatus).pauseCode);
          }, 100);
        }
        
        // Mettre à jour les autres informations de l'agent
        agentState.update(state => ({
          ...state,
          user: data.user || state.user,
          fullName: data.full_name || state.fullName,
          phoneLogin: data.phone_login || state.phoneLogin,
          campaignId: data.campaign_id || state.campaignId,
          campaignName: data.campaign_name || state.campaignName,
          extension: data.extension || state.extension,
        }));
      } else {
        console.error('Erreur lors du chargement des informations de l\'agent:', response.status);
        error = 'Impossible de charger les informations de l\'agent';
      }
    } catch (err) {
      console.error('Erreur lors du chargement des informations de l\'agent:', err);
      error = 'Erreur de connexion au serveur';
    } finally {
      isLoading = false;
    }
  }

  // Fonction pour vérifier les appels actifs
  async function checkCalls() {
    try {
      const response = await api.get('/agent/calls/check-calls');
      
      if (response.ok) {
        const data = await response.json();
        
        // Si un appel entrant ou sortant est actif, mettre à jour l'état
        const activeCall = data.incomingCalls || data.outgoingCalls;
        const currentState = get(agentState);
        
        if (activeCall && !currentState.callActive) {
          console.log('Appel actif détecté, mise à jour du statut');
          
          // Utiliser la fonction dédiée startCall pour mettre à jour l'état
          // Cela garantit que tous les composants sont notifiés du changement
          startCall({
            callId: activeCall.uniqueid,
            leadId: activeCall.lead_id,
            phoneNumber: activeCall.phone_number,
            contactName: activeCall.contact_name || 'Inconnu',
            direction: activeCall.direction || 'outbound'
          });
        }
      }
    } catch (err) {
      console.error('Erreur lors de la vérification des appels:', err);
    }
  }

  // Fonction pour rafraîchir le statut de l'agent
  // Fonction pour rafraîchir le statut avec limitation de débit
  async function refreshStatus() {
    // Vérifier si on peut faire un appel API
    if (!canMakeApiCall()) {
      console.log('Rafraîchissement du statut ignoré - Trop fréquent');
      return;
    }
    
    try {
      console.log('Appel API: /agent/info');
      const response = await api.get('/agent/info');
      
      if (response.ok) {
        const data = await response.json();
        const currentStatus = get(agentStatus);
        
        // Mettre à jour l'état de l'agent avec les données du serveur
        if (data.status) {
          // Vérifier si le statut a changé
          if (data.status !== currentStatus.status) {
            console.log(`Mise à jour du statut: ${currentStatus.status} -> ${data.status}`);
            
            // Mettre à jour uniquement le store agentStatus
            // Le store agentState sera mis à jour par syncAgentStatus si nécessaire
            updateStatus(data.status, data.pauseCode, data.pauseReason);
          }
          
          console.log(`Statut après synchronisation: ${data.status}`);
        }
      }
    } catch (err) {
      console.error('Erreur lors du rafraîchissement du statut:', err);
    }
  }
  
  // Les fonctions liées au statut de l'agent ont été déplacées vers StatusBar.svelte
  
  // Variables pour les contrôles d'appel
  let isMuted = false;
  let isOnHold = false;
  let isRecording = false;

  // Gérer la mise en sourdine
  async function handleMute() {
    try {
      const response = await api.post('/agent/calls/mute', { mute: !isMuted });
      if (response.ok) {
        isMuted = !isMuted;
      }
    } catch (err) {
      console.error('Erreur lors de la mise en sourdine:', err);
    }
  }

  // Gérer la mise en attente
  async function handleHold() {
    try {
      const response = await api.post('/agent/calls/hold', { hold: !isOnHold });
      if (response.ok) {
        isOnHold = !isOnHold;
      }
    } catch (err) {
      console.error('Erreur lors de la mise en attente:', err);
    }
  }

  // Gérer l'enregistrement
  async function handleRecording() {
    try {
      const response = await api.post('/agent/calls/record', { record: !isRecording });
      if (response.ok) {
        isRecording = !isRecording;
      }
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
    }
  }

  // Gérer la fin d'un appel
  async function handleCallEnded() {
    console.log('Appel terminé, réinitialisation de l\'interface');
    
    try {
      const response = await api.post('/agent/calls/hangup', {});
      
      // Réinitialiser les états des contrôles
      isMuted = false;
      isOnHold = false;
      isRecording = false;
      
      // Attendre un court délai avant de réinitialiser l'état
      setTimeout(() => {
        endCall();
      }, 1000);
    } catch (err) {
      console.error('Erreur lors de la fin de l\'appel:', err);
    }
  }

  // Variable pour éviter les appels API trop fréquents
  // Nous utilisons maintenant l'utilitaire apiThrottle pour la limitation des appels API
  // Les variables lastApiCallTime et MIN_API_CALL_INTERVAL sont définies dans apiThrottle.ts
  
  // Nous n'utilisons plus de synchronisation forcée par intervalle
  // Le statut est maintenant géré de manière réactive via le store Svelte
  
  // Version modifiée de checkCalls avec limitation de débit
  async function throttledCheckCalls() {
    if (!canMakeApiCall()) return;
    
    await checkCalls();
  }
  
  onMount(async () => {
    // Charger les informations de l'agent au démarrage
    await loadAgentInfo();
    
    // Configurer l'intervalle de vérification des appels
    callCheckInterval = window.setInterval(throttledCheckCalls, CHECK_CALLS_INTERVAL);
    
    // Vérifier les appels immédiatement
    throttledCheckCalls();
    
    // Démarrer le service de synchronisation SIP
    sipSyncService.start();
    
    console.log('Intervalle de vérification des appels configuré');
    console.log('Service de synchronisation SIP démarré');
  });

  onDestroy(() => {
    // Nettoyer l'intervalle de vérification des appels lors de la destruction du composant
    if (callCheckInterval) clearInterval(callCheckInterval);
    
    // Arrêter le service de synchronisation SIP
    sipSyncService.stop();
    console.log('Service de synchronisation SIP arrêté');
  });
</script>

<div class="dashboard-container">
  <!-- Contenu principal -->
  <div class="container py-4">
    {#if isLoading}
      <div class="d-flex justify-content-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
      </div>
    {:else if error}
      <div class="alert alert-danger" role="alert">
        {error}
        <button class="btn btn-outline-danger ms-3" on:click={loadAgentInfo}>Réessayer</button>
      </div>
    {:else}
      <div class="row justify-content-center">
        <!-- PredictiveDialer prenant toute la largeur -->
        <div class="col-12">
          <PredictiveDialer bind:this={predictiveDialerComponent} />
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .dashboard-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f8f9fa;
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    }
  }
  
  /* Styles pour l'animation de pulsation */
</style>

<!-- Le modal de pause a été déplacé vers la StatusBar -->
