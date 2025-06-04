<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { agentState, AGENT_STATUSES } from '../stores/agent';
  import { logout, api } from '../utils/fetchWithAuth';
  import SipStatus from './SipStatus.svelte';
  import { sipConnectionState } from '../services/SipService';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import StatusButtons from './StatusButtons.svelte';
  import { agentStatus, setAgentPaused } from '../stores/agentStatus';
  import { get } from 'svelte/store';
  import dialerStore from '../stores/dialerStore';
  
  // Variables d'état UI
  let currentDateTime = new Date();
  let dateTimeInterval: number;
  let showLogoutDialog = false;
  let showPauseModal = false;
  let pauseReason = '';
  let selectedPauseCode = 'BREAK';
  let pauseCodes = [
    { pause_code: 'BREAK', pause_code_name: 'Pause standard' },
    { pause_code: 'LUNCH', pause_code_name: 'Pause déjeuner' },
    { pause_code: 'MEETING', pause_code_name: 'Réunion' }
  ];
  let loadingPauseCodes = false;
  let pauseCodeError = '';
  
  // Constante pour le serveur SIP (normalement définie dans SipService.ts)
  const SIP_SERVER = '213.32.34.38';
  
  // Fonction pour mettre à jour l'horloge
  function updateDateTime() {
    currentDateTime = new Date();
  }
  
  // Fonction pour ouvrir la boîte de dialogue de déconnexion
  function openLogoutDialog() {
    showLogoutDialog = true;
  }
  
  // Fonction pour ouvrir le modal de pause
  function openPauseModal() {
    // Réinitialiser les valeurs
    pauseReason = '';
    selectedPauseCode = 'BREAK';
    
    // Charger les codes de pause
    loadPauseCodes();
    
    // Afficher le modal
    showPauseModal = true;
    
    // Arrêter le mode prédictif si actif
    const stopPredictiveMode = get(dialerStore).stopPredictiveMode;
    if (stopPredictiveMode) {
      console.log('Arrêt du mode prédictif depuis la StatusBar - ouverture du modal');
      stopPredictiveMode();
    }
  }
  
  // Fonction pour récupérer les codes de pause disponibles
  async function loadPauseCodes() {
    loadingPauseCodes = true;
    pauseCodeError = '';
    
    try {
      const response = await api.get('/agent/pause-codes');
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          pauseCodes = data;
        }
      } else {
        pauseCodeError = 'Erreur lors du chargement des codes de pause';
      }
    } catch (err) {
      console.error('Erreur lors du chargement des codes de pause:', err);
      pauseCodeError = 'Erreur de connexion';
    } finally {
      loadingPauseCodes = false;
    }
  }
  
  // Fonction pour mettre l'agent en pause
  async function handlePauseAgent() {
    try {
      console.log('Tentative de mise en pause de l\'agent');
      
      // Utiliser le code de pause sélectionné par l'utilisateur
      const pauseCode = selectedPauseCode;
      const reason = pauseReason || 'Pause agent';
      
      // Arrêter le mode prédictif si actif
      const stopPredictiveMode = get(dialerStore).stopPredictiveMode;
      if (stopPredictiveMode) {
        console.log('Arrêt du mode prédictif depuis la StatusBar - confirmation de pause');
        stopPredictiveMode();
      }
      
      // Mettre à jour le statut dans le store
      setAgentPaused(pauseCode, reason);
      
      // Fermer le modal
      showPauseModal = false;
      
      // Envoyer le statut au serveur
      const response = await api.post('/agent/status', {
        status: AGENT_STATUSES.PAUSED,
        pauseCode: pauseCode,
        pauseReason: reason
      });
      
      if (!response.ok) {
        console.error('Erreur lors de la mise à jour du statut côté serveur:', response.status);
      }
    } catch (err) {
      console.error('Erreur lors de la mise en pause:', err);
    }
  }
  
  // Fonction pour gérer la confirmation de déconnexion
  async function confirmLogout() {
    try {
      console.log('Déconnexion en cours...');
      
      // Appel API pour déconnecter l'agent
      // La fonction logout() gère maintenant la redirection
      await logout();
      
      // Note: La redirection est maintenant gérée par la fonction logout()
      // donc cette ligne ne sera jamais exécutée
      console.log('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Nous gérerons l'erreur dans l'interface plutôt qu'avec une alerte
    }
  }
  
  // Configurer les minuteries au montage du composant
  onMount(() => {
    // Mettre à jour l'horloge
    dateTimeInterval = window.setInterval(updateDateTime, 1000);
    updateDateTime();
  });

  // Nettoyer les minuteries à la destruction du composant
  onDestroy(() => {
    if (dateTimeInterval) clearInterval(dateTimeInterval);
  });
</script>

<div class="status-bar">
  <div class="status-bar-content">
    <!-- Section gauche: Horloge et date -->
    <div class="datetime">
      <div class="time">{currentDateTime.toLocaleTimeString('fr-FR')}</div>
      <div class="date">{currentDateTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
    
    <!-- Section centrale: Campagne uniquement -->
    <div class="status-campaign">
        <!-- Informations de campagne -->
        <div class="campaign-info">
          <div class="info-item">
            <div class="info-label">Campagne</div>
            <div class="info-value">{$agentState.campaignName || 'Non sélectionnée'}</div>
          </div>
          
          <!-- Extension téléphonique -->
          <div class="info-item">
            <div class="info-label">Extension</div>
            <div class="info-value">{$agentState.extension || 'Non définie'}</div>
          </div>
          
          <!-- Serveur SIP -->
          <div class="info-item">
            <div class="info-label">Serveur</div>
            <div class="info-value">{SIP_SERVER}</div>
          </div>
          
          <!-- État de la connexion SIP -->
          <div class="info-item sip-status-wrapper">
            <SipStatus />
          </div>
        </div>
    </div>
    
    <!-- Section droite: Boutons de statut et déconnexion -->
    <div class="stats-notifications">
      <!-- Boutons de statut -->
      <div class="status-buttons-container">
        <StatusButtons onPauseClick={openPauseModal} />
      </div>
      
      <!-- Bouton de déconnexion -->
      <button class="logout-button" on:click={openLogoutDialog}>
        <i class="bi bi-box-arrow-right"></i>
        <span>Déconnexion</span>
      </button>
      
      <!-- Boîte de dialogue de confirmation de déconnexion -->
      <ConfirmDialog
        bind:isOpen={showLogoutDialog}
        title="Confirmation de déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmButtonText="Déconnexion"
        on:confirm={confirmLogout}
      />
      
      <!-- Modal de pause intégré dans la barre de statut -->
    </div>
  </div>
</div>

<!-- Modal de pause -->
{#if showPauseModal}
<div class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);" tabindex="-1" aria-modal="true" role="dialog">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Mettre en pause</h5>
        <button type="button" class="btn-close" aria-label="Close" on:click={() => showPauseModal = false}></button>
      </div>
      <div class="modal-body">
        <!-- Sélection du code de pause -->
        <div class="mb-3">
          <label for="pauseCode" class="form-label">Code de pause</label>
          {#if loadingPauseCodes}
            <div class="d-flex align-items-center mb-2">
              <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span class="visually-hidden">Chargement...</span>
              </div>
              <span class="text-muted">Chargement des codes de pause...</span>
            </div>
          {/if}
          
          {#if pauseCodeError}
            <div class="alert alert-warning py-2">{pauseCodeError}</div>
          {/if}
          
          <select class="form-select" id="pauseCode" bind:value={selectedPauseCode}>
            {#each pauseCodes as code}
              <option value={code.pause_code}>{code.pause_code_name}</option>
            {/each}
          </select>
          
          <div class="d-flex justify-content-end mt-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" on:click={loadPauseCodes} disabled={loadingPauseCodes}>
              <i class="bi bi-arrow-clockwise me-1"></i> Actualiser
            </button>
          </div>
        </div>
        
        <!-- Raison de la pause -->
        <div class="mb-3">
          <label for="pauseReason" class="form-label">Raison de la pause</label>
          <input type="text" class="form-control" id="pauseReason" bind:value={pauseReason} placeholder="Saisir la raison de la pause...">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" on:click={() => showPauseModal = false}>Annuler</button>
        <button type="button" class="btn btn-primary" on:click={handlePauseAgent}>
          <i class="bi bi-pause-circle me-1"></i> Confirmer la pause
        </button>
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .status-bar {
    background-color: #1e293b;
    color: #f8fafc;
    padding: 0.5rem 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
    width: 100%;
    box-sizing: border-box;
  }
  
  .status-bar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1600px;
    margin: 0 auto;
  }
  
  /* Section gauche: Horloge et date */
  .datetime {
    display: flex;
    flex-direction: column;
    min-width: 200px;
  }
  
  .time {
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .date {
    font-size: 0.8rem;
    color: #cbd5e1;
  }
  
  /* Section centrale: Campagne */
  .status-campaign {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-grow: 1;
    max-width: 600px;
  }
  
  /* Informations de campagne */
  .campaign-info {
    display: flex;
    width: 100%;
    justify-content: space-between;
    background-color: rgba(255, 255, 255, 0.05);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
  }
  
  .info-label {
    font-size: 0.7rem;
    color: #94a3b8;
    text-transform: uppercase;
  }
  
  .info-value {
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  /* Styles pour les informations de téléphonie */
  .info-item {
    margin: 0 0.5rem;
  }
  
  /* État de la connexion SIP */
  .sip-status-wrapper {
    margin-left: auto;
  }
  
  /* Section droite: Boutons de statut et déconnexion */
  .stats-notifications {
    display: flex;
    align-items: center;
    min-width: 300px;
    justify-content: flex-end;
    gap: 1rem;
  }
  
  /* Container pour les boutons de statut */
  .status-buttons-container {
    display: flex;
    align-items: center;
  }
  
  /* Bouton de déconnexion */
  .logout-button {
    display: flex;
    align-items: center;
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .logout-button:hover {
    background-color: rgba(239, 68, 68, 0.2);
  }
  
  .logout-button i {
    margin-right: 0.5rem;
  }
  
  /* Responsive design */
  @media (max-width: 1200px) {
    .status-bar-content {
      flex-wrap: wrap;
    }
    
    .datetime, .stats-notifications {
      width: 50%;
      margin-bottom: 0.5rem;
    }
    
    .status-campaign {
      width: 100%;
      order: 3;
    }
  }
  
  @media (max-width: 768px) {
    .datetime, .stats-notifications {
      width: 100%;
      margin-bottom: 0.5rem;
    }
    
    .stats-notifications {
      order: 2;
    }
    
    .status-campaign {
      order: 3;
    }
  }
</style>
