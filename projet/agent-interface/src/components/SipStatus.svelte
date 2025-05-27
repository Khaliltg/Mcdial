<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { sipConnectionState } from '../services/SipService';
  import { SipService } from '../services/SipService';
  import { checkSipConnection } from '../stores/agent';
  import { getApiUrl } from '../utils/config';
  import { api } from '../utils/fetchWithAuth';
  
  // État local
  let connected = false;
  let extension = '';
  let reconnecting = false;
  let lastError: string | null = null;
  let statusCheckInterval: number;
  let lastCheckTime = new Date();
  let sipUris: { sipUri: string; calltoUri: string; telUri: string } | null = null;
  let showUriOptions = false;
  
  // S'abonner aux changements d'état de la connexion SIP
  const unsubscribe = sipConnectionState.subscribe(state => {
    connected = state.connected && state.registered;
    extension = state.extension;
    reconnecting = state.reconnecting;
    lastError = state.lastError;
    
    // Mettre à jour le temps de la dernière vérification
    lastCheckTime = new Date();
    
    console.log('SipStatus - État mis à jour:', state);
  });
  
  // Écouter l'événement personnalisé pour les mises à jour d'état
  function handleStatusChange(event: CustomEvent) {
    console.log('SipStatus - Événement de changement d\'\u00e9tat reçu:', event.detail);
  }
  
  // Fonction pour vérifier manuellement l'état de la connexion
  function checkConnection() {
    const status = checkSipConnection();
    console.log('SipStatus - Vérification de l\'\u00e9tat de la connexion SIP:', status);
    
    // Forcer un rafraîchissement de l'état
    SipService.refreshConnectionState();
  }
  
  // Fonction pour tenter une reconnexion manuelle
  function reconnect() {
    if (connected || reconnecting) return;
    
    reconnecting = true;
    
    // Simuler une tentative de reconnexion
    setTimeout(() => {
      checkConnection();
    }, 1500);
  }
  
  // Fonction pour générer et récupérer les liens SIP URI
  async function generateSipUris() {
    try {
      const response = await fetch(`${getApiUrl()}/agent/sip/generate-uri`);
      
      if (response.ok) {
        const data = await response.json();
        sipUris = {
          sipUri: data.sipUri,
          calltoUri: data.calltoUri,
          telUri: data.telUri
        };
        showUriOptions = true;
        console.log('Liens SIP générés:', sipUris);
      } else {
        console.error('Erreur lors de la génération des liens SIP:', response.status);
      }
    } catch (error) {
      console.error('Erreur lors de la génération des liens SIP:', error);
    }
  }
  
  // Fonction pour lancer l'application de softphone externe
  function launchSoftphone(uriType: 'sip' | 'callto' | 'tel') {
    if (!sipUris) return;
    
    let uri = '';
    switch (uriType) {
      case 'sip':
        uri = sipUris.sipUri;
        break;
      case 'callto':
        uri = sipUris.calltoUri;
        break;
      case 'tel':
        uri = sipUris.telUri;
        break;
    }
    
    if (uri) {
      console.log(`Lancement du softphone avec l'URI: ${uri}`);
      window.location.href = uri;
      showUriOptions = false;
    }
  }
  
  // Fonction pour fermer le menu des options URI
  function closeUriOptions() {
    showUriOptions = false;
  }
  
  // Initialiser la vérification périodique de l'état
  onMount(() => {
    // Vérifier l'état toutes les 30 secondes
    statusCheckInterval = window.setInterval(checkConnection, 30000);
    
    // Écouter l'événement personnalisé de changement d'état
    window.addEventListener('sip-status-changed', handleStatusChange as EventListener);
    
    // Vérification initiale après un court délai pour laisser le temps aux autres composants de s'initialiser
    setTimeout(checkConnection, 1000);
  });
  
  // Nettoyer les abonnements et intervalles
  onDestroy(() => {
    unsubscribe();
    clearInterval(statusCheckInterval);
    window.removeEventListener('sip-status-changed', handleStatusChange as EventListener);
  });
</script>

<div class="sip-status-container">
  <div class="sip-status-indicator {connected ? 'connected' : reconnecting ? 'reconnecting' : 'disconnected'}">
    <span class="status-dot"></span>
    <span class="status-text">
      {#if connected}
        Softphone connecté ({extension})
      {:else if reconnecting}
        Reconnexion en cours...
      {:else}
        Softphone déconnecté
      {/if}
    </span>
    
    <div class="sip-actions">
      {#if connected}
        <button class="sip-action-button" on:click={generateSipUris} title="Lancer le softphone externe">
          <i class="bi bi-telephone-outbound"></i>
        </button>
      {/if}
      
      {#if !connected && !reconnecting}
        <button class="reconnect-button" on:click={reconnect} title="Tenter une reconnexion">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      {/if}
    </div>
  </div>
  
  {#if showUriOptions}
    <div class="uri-options">
      <div class="uri-options-header">
        <span>Choisir une application</span>
        <button class="close-button" on:click={closeUriOptions}>
          <i class="bi bi-x"></i>
        </button>
      </div>
      <div class="uri-options-content">
        <button class="uri-option" on:click={() => launchSoftphone('sip')}>
          <i class="bi bi-headset"></i>
          <span>Softphone SIP</span>
        </button>
        <button class="uri-option" on:click={() => launchSoftphone('callto')}>
          <i class="bi bi-telephone"></i>
          <span>Application d'appel</span>
        </button>
        <button class="uri-option" on:click={() => launchSoftphone('tel')}>
          <i class="bi bi-phone"></i>
          <span>Téléphone</span>
        </button>
      </div>
    </div>
  {/if}
  
  {#if lastError && !connected && !reconnecting}
    <div class="error-message">
      <small>Erreur: {lastError}</small>
    </div>
  {/if}
</div>

<style>
  .sip-status-container {
    display: flex;
    flex-direction: column;
    padding: 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    margin-bottom: 8px;
  }
  
  .sip-status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 4px;
    font-weight: 500;
    position: relative;
  }
  
  .connected {
    background-color: rgba(16, 185, 129, 0.1);
    color: rgb(16, 185, 129);
  }
  
  .disconnected {
    background-color: rgba(239, 68, 68, 0.1);
    color: rgb(239, 68, 68);
  }
  
  .reconnecting {
    background-color: rgba(245, 158, 11, 0.1);
    color: rgb(245, 158, 11);
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  
  .connected .status-dot {
    background-color: rgb(16, 185, 129);
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
  }
  
  .disconnected .status-dot {
    background-color: rgb(239, 68, 68);
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
  }
  
  .reconnecting .status-dot {
    background-color: rgb(245, 158, 11);
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
    animation: pulse 1.5s infinite;
  }
  
  .error-message {
    margin-top: 4px;
    color: rgb(239, 68, 68);
    font-size: 0.75rem;
  }
  
  .sip-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  
  .reconnect-button,
  .sip-action-button {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    transition: all 0.2s ease;
  }
  
  .reconnect-button:hover,
  .sip-action-button:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .uri-options {
    position: absolute;
    top: calc(100% + 5px);
    right: 0;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 220px;
    z-index: 100;
    overflow: hidden;
  }
  
  .uri-options-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: #f5f5f5;
    border-bottom: 1px solid #eee;
  }
  
  .uri-options-header span {
    font-weight: 600;
    font-size: 0.9rem;
    color: #333;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .uri-options-content {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .uri-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: none;
    background: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    text-align: left;
    color: #333;
  }
  
  .uri-option:hover {
    background-color: #f0f0f0;
  }
  
  .uri-option i {
    font-size: 1.1rem;
    color: #4f46e5;
  }
  
  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
