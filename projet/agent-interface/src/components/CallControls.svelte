<script lang="ts">
  import { onMount } from 'svelte';
  import { agentState, updateAgentStatus } from '../stores/agent';
  import { CallService } from '../services/CallService';
  import { formatTime } from '../utils/timeUtils';
  import { get } from 'svelte/store';
  
  // Variables pour le formulaire d'appel
  let phoneNumber = '';
  let contactName = '';
  let notes = '';
  
  // Variables d'état
  let isDialing = false;
  let errorMessage = '';
  let successMessage = '';
  
  // Fonction pour gérer l'initiation d'un appel
  async function handleCall() {
    if (!phoneNumber) {
      errorMessage = 'Veuillez saisir un numéro de téléphone';
      return;
    }
    
    try {
      isDialing = true;
      errorMessage = '';
      successMessage = '';
      
      // Utiliser le service d'appel pour initier l'appel
      const result = await CallService.initiateCall({
        phoneNumber,
        contactName
      });
      
      if (result.success) {
        successMessage = result.message || 'Appel en cours...';
      } else {
        errorMessage = result.message || 'Échec de l\'appel';
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'initiation de l\'appel:', error);
      errorMessage = error.message || 'Une erreur est survenue lors de l\'initiation de l\'appel';
    } finally {
      isDialing = false;
    }
  }
  
  // Fonction pour gérer la fin d'un appel
  async function handleEndCall() {
    try {
      errorMessage = '';
      successMessage = '';
      
      // Utiliser le service d'appel pour terminer l'appel
      const result = await CallService.endCall(get(agentState).callId || '');
      
      if (result.success) {
        successMessage = result.message || 'Appel terminé avec succès';
        
        // Réinitialiser les champs du formulaire
        phoneNumber = '';
        contactName = '';
        notes = '';
      } else {
        errorMessage = result.message || 'Échec de la fin de l\'appel';
      }
    } catch (error: any) {
      console.error('Erreur lors de la fin de l\'appel:', error);
      errorMessage = error.message || 'Une erreur est survenue lors de la fin de l\'appel';
    }
  }
  
  // Fonction pour mettre à jour le statut de l'agent
  async function changeAgentStatus(status: string) {
    try {
      const result = await CallService.updateStatus(status as any);
      
      if (!result) {
        errorMessage = 'Échec de la mise à jour du statut';
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      errorMessage = error.message || 'Une erreur est survenue lors de la mise à jour du statut';
    }
  }
  
  // Récupérer les statistiques de l'agent au chargement du composant
  onMount(async () => {
    await CallService.getAgentStats();
  });
</script>

<div class="call-controls">
  <!-- Messages d'erreur et de succès -->
  {#if errorMessage}
    <div class="alert alert-danger mb-4 fade show d-flex align-items-center" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      <div class="flex-grow-1">{errorMessage}</div>
      <button type="button" class="btn-close" aria-label="Close" on:click={() => errorMessage = ''}></button>
    </div>
  {/if}
  
  {#if successMessage}
    <div class="alert alert-success mb-4 fade show d-flex align-items-center" role="alert">
      <i class="bi bi-check-circle-fill me-2"></i>
      <div class="flex-grow-1">{successMessage}</div>
      <button type="button" class="btn-close" aria-label="Close" on:click={() => successMessage = ''}></button>
    </div>
  {/if}
  
  <!-- Contrôles de statut -->
  <div class="status-controls mb-4">
    <div class="status-buttons">
      <button 
        class="btn status-btn {$agentState.status === 'READY' ? 'active' : ''}" 
        on:click={() => changeAgentStatus('READY')}
        disabled={get(agentState).callActive}
      >
        <i class="bi bi-check-circle-fill"></i>
        <span>Prêt</span>
      </button>
      
      <button 
        class="btn status-btn {$agentState.status === 'PAUSED' ? 'active' : ''}" 
        on:click={() => changeAgentStatus('PAUSED')}
        disabled={get(agentState).callActive}
      >
        <i class="bi bi-pause-circle-fill"></i>
        <span>Pause</span>
      </button>
      
      <button 
        class="btn status-btn {$agentState.status === 'OFFLINE' ? 'active' : ''}" 
        on:click={() => changeAgentStatus('OFFLINE')}
        disabled={get(agentState).callActive}
      >
        <i class="bi bi-power"></i>
        <span>Hors ligne</span>
      </button>
    </div>
  </div>
  
  <!-- Formulaire d'appel -->
  {#if !get(agentState).callActive}
    <form on:submit|preventDefault={handleCall} class="call-form">
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <label for="phoneNumber" class="form-label">Numéro de téléphone</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-telephone"></i></span>
            <input 
              type="tel" 
              class="form-control" 
              id="phoneNumber" 
              placeholder="Entrez un numéro de téléphone" 
              bind:value={phoneNumber}
              disabled={isDialing || get(agentState).status === 'OFFLINE' || get(agentState).status === 'PAUSED'}
              required
            />
          </div>
        </div>
        
        <div class="col-md-6">
          <label for="contactName" class="form-label">Nom du contact</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-person"></i></span>
            <input 
              type="text" 
              class="form-control" 
              id="contactName" 
              placeholder="Entrez le nom du contact" 
              bind:value={contactName}
              disabled={isDialing || get(agentState).status === 'OFFLINE' || get(agentState).status === 'PAUSED'}
            />
          </div>
        </div>
      </div>
      
      <div class="mb-4">
        <label for="notes" class="form-label">Notes</label>
        <textarea 
          class="form-control" 
          id="notes" 
          rows="3" 
          placeholder="Entrez des notes pour cet appel"
          bind:value={notes}
          disabled={isDialing || get(agentState).status === 'OFFLINE' || get(agentState).status === 'PAUSED'}
        ></textarea>
      </div>
      
      <button 
        type="submit" 
        class="btn btn-primary btn-lg w-100 call-button" 
        disabled={isDialing || !phoneNumber || get(agentState).status === 'OFFLINE' || get(agentState).status === 'PAUSED'}
      >
        {#if isDialing}
          <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Appel en cours...
        {:else}
          <i class="bi bi-telephone-outbound-fill me-2"></i>
          Appeler
        {/if}
      </button>
    </form>
  {:else}
    <!-- Informations d'appel en cours -->
    <div class="active-call-info">
      <div class="call-header mb-4">
        <h4 class="mb-1">Appel en cours</h4>
        <div class="call-timer">{formatTime(get(agentState).callDuration)}</div>
      </div>
      
      <div class="call-details mb-4">
        <div class="row g-3">
          <div class="col-md-6">
            <div class="detail-item">
              <div class="detail-label">Numéro</div>
              <div class="detail-value">{get(agentState).phoneNumber || 'Non disponible'}</div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="detail-item">
              <div class="detail-label">Contact</div>
              <div class="detail-value">{get(agentState).contactName || 'Non disponible'}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mb-4">
        <label for="activeNotes" class="form-label">Notes d'appel</label>
        <textarea 
          class="form-control" 
          id="activeNotes" 
          rows="3" 
          placeholder="Entrez des notes pour cet appel"
          bind:value={notes}
        ></textarea>
      </div>
      
      <button 
        type="button" 
        class="btn btn-danger btn-lg w-100 end-call-button" 
        on:click={handleEndCall}
      >
        <i class="bi bi-telephone-x-fill me-2"></i>
        Terminer l'appel
      </button>
    </div>
  {/if}
</div>

<style>
  .call-controls {
    padding: 1rem;
  }
  
  .status-controls {
    background-color: #f8f9fa;
    border-radius: 10px;
    padding: 1rem;
  }
  
  .status-buttons {
    display: flex;
    gap: 1rem;
  }
  
  .status-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    border-radius: 8px;
    background-color: white;
    border: 1px solid #dee2e6;
    transition: all 0.2s ease;
  }
  
  .status-btn i {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  .status-btn.active {
    background-color: #e9ecef;
    border-color: #ced4da;
    font-weight: 600;
  }
  
  .status-btn:hover:not(:disabled) {
    background-color: #f1f3f5;
    transform: translateY(-2px);
  }
  
  .status-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .call-button {
    height: 60px;
    font-size: 1.2rem;
    border-radius: 10px;
    background: linear-gradient(45deg, #1a56db, #4f46e5);
    border: none;
    transition: all 0.3s ease;
  }
  
  .call-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(26, 86, 219, 0.4);
    background: linear-gradient(45deg, #164fc6, #4338ca);
  }
  
  .end-call-button {
    height: 60px;
    font-size: 1.2rem;
    border-radius: 10px;
    background: linear-gradient(45deg, #e11d48, #f43f5e);
    border: none;
    transition: all 0.3s ease;
  }
  
  .end-call-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(225, 29, 72, 0.4);
    background: linear-gradient(45deg, #be123c, #e11d48);
  }
  
  .active-call-info {
    background-color: #f8f9fa;
    border-radius: 10px;
    padding: 1.5rem;
  }
  
  .call-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .call-timer {
    font-size: 1.2rem;
    font-weight: 600;
    color: #1a56db;
    background-color: rgba(26, 86, 219, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 20px;
  }
  
  .detail-item {
    background-color: white;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .detail-label {
    font-size: 0.8rem;
    color: #6c757d;
    margin-bottom: 0.25rem;
  }
  
  .detail-value {
    font-size: 1.1rem;
    font-weight: 600;
  }
</style>
