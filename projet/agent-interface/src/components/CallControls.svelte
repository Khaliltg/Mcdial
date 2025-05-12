<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { agentState, updateAgentStatus, endCall } from '../stores/agent';
  import { API_BASE_URL } from '../utils/config';
  import { fade } from 'svelte/transition';

  // Create event dispatcher
  const dispatch = createEventDispatcher();

  // Local state
  let isLoading = false;
  let isMuted = false;
  let isOnHold = false;
  let isRecording = false;
  let showPauseReasonModal = false;
  let pauseReason = '';
  let errorMessage = '';
  let successMessage = '';
  
  // Individual loading states for each button
  let loadingStates = {
    pause: false,
    resume: false,
    endCall: false,
    mute: false,
    hold: false,
    record: false
  };

  // Function to show pause reason modal
  function handlePause() {
    // Reset the form when opening the modal
    pauseReason = '';
    errorMessage = '';
    showPauseReasonModal = true;
  }

  // Function to cancel pause modal
  function cancelPause() {
    showPauseReasonModal = false;
    pauseReason = '';
    errorMessage = '';
  }

  // Direct API call function to avoid issues with api utility
  function callApi(url, method, body) {
    // Set a safety timeout to reset loading state in case the API call hangs
    const safetyTimeout = setTimeout(() => {
      console.log('SAFETY TIMEOUT: Forcing reset of loading state');
      isLoading = false;
    }, 5000); // 5 seconds timeout
    
    return fetch(`${API_BASE_URL}${url}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('agent_token') || localStorage.getItem('token')}`
      },
      body: JSON.stringify(body)
    })
    .finally(() => {
      // Clear the safety timeout if the API call completes normally
      clearTimeout(safetyTimeout);
    });
  }

  // Function to submit pause with reason
  function submitPause() {
    // Prevent multiple submissions
    if (loadingStates.pause) return;

    // Make sure we have a pause reason
    if (!pauseReason) {
      errorMessage = 'Veuillez sélectionner une raison de pause';
      setTimeout(() => { errorMessage = ''; }, 3000);
      return;
    }

    console.log('Submitting pause with reason:', pauseReason);

    // Set specific loading state for pause button
    loadingStates.pause = true;
    isLoading = true;

    // Set a safety timeout to reset loading state in case the API call hangs
    const safetyTimeout = setTimeout(() => {
      console.log('SAFETY TIMEOUT: Forcing reset of pause loading state');
      loadingStates.pause = false;
      isLoading = false;
    }, 5000); // 5 seconds timeout

    // Close the modal immediately to prevent multiple submissions
    showPauseReasonModal = false;

    // Use our callApi function
    callApi('/agent/status', 'POST', {
      status: 'PAUSED',
      pauseCode: pauseReason
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      console.log('Pause success:', data);

      // Update local state after successful API call
      updateAgentStatus('PAUSED');

      // Reset the form
      pauseReason = '';
      errorMessage = '';

      // Show success message
      successMessage = 'Statut mis à jour: En pause';
      setTimeout(() => { successMessage = ''; }, 3000);
    })
    .catch(error => {
      console.error('Pause error:', error);
      errorMessage = 'Échec de la mise à jour du statut';
      setTimeout(() => { errorMessage = ''; }, 3000);

      // If the modal was closed but the API call failed, reopen it
      if (!showPauseReasonModal) {
        showPauseReasonModal = true;
      }
    })
    .finally(() => {
      console.log('FORCE RESETTING LOADING STATE');
      loadingStates.pause = false;
      isLoading = false;
      clearTimeout(safetyTimeout);
    });
  }

  // Function to resume from pause
  function handleResume() {
    // Prevent action if not in PAUSED state or already loading
    if ($agentState.status !== 'PAUSED' || loadingStates.resume) {
      return;
    }

    console.log('Resuming from pause, setting status to READY');

    // Set loading state
    loadingStates.resume = true;
    isLoading = true;

    // Set a safety timeout to reset loading state in case the API call hangs
    const safetyTimeout = setTimeout(() => {
      console.log('SAFETY TIMEOUT: Forcing reset of resume loading state');
      loadingStates.resume = false;
      isLoading = false;
    }, 5000); // 5 seconds timeout

    // Use our callApi function
    callApi('/agent/status', 'POST', { status: 'READY' })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      console.log('Resume success:', data);

      // Update local state after successful API call
      updateAgentStatus('READY');

      // Show success message
      successMessage = 'Statut mis à jour: Prêt';
      setTimeout(() => { successMessage = ''; }, 3000);
    })
    .catch(error => {
      console.error('Resume error:', error);
      errorMessage = 'Échec de la mise à jour du statut';
      setTimeout(() => { errorMessage = ''; }, 3000);
    })
    .finally(() => {
      console.log('FORCE RESETTING LOADING STATE');
      loadingStates.resume = false;
      isLoading = false;
      clearTimeout(safetyTimeout);
    });
  }

  // Function to handle ending a call
  function handleEndCall() {
    if (!$agentState.callActive || isLoading) {
      return;
    }

    console.log('Ending call with ID:', $agentState.callId);

    // Set loading state
    isLoading = true;
    loadingStates.endCall = true;

    // Set a safety timeout to reset loading state in case the API call hangs
    const safetyTimeout = setTimeout(() => {
      console.log('SAFETY TIMEOUT: Forcing reset of end call loading state');
      loadingStates.endCall = false;
      isLoading = false;
    }, 5000); // 5 seconds timeout

    // Essayer d'abord avec le nouvel endpoint
    fetch(`${API_BASE_URL}/agent/calls/end-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('agent_token') || localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        callId: $agentState.callId,
        agentId: $agentState.user || $agentState.extension || $agentState.phoneLogin
      })
    })
    .then(response => {
      if (!response.ok) {
        console.log(`Nouvel endpoint a échoué avec le statut: ${response.status}, essai avec l'ancien endpoint`);
        // Si le nouvel endpoint échoue, essayer l'ancien
        return fetch(`${API_BASE_URL}/agent/end-call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('agent_token') || localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            callId: $agentState.callId,
            agentId: $agentState.user || $agentState.extension || $agentState.phoneLogin
          })
        });
      }
      return response;
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Les deux endpoints ont échoué avec le statut: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('End call success:', data);

      // Update local state after successful API call
      endCall();

      // Notify parent component that call has ended
      dispatch('callEnded');

      // Reset call control states
      isMuted = false;
      isOnHold = false;
      isRecording = false;

      // Show success message
      successMessage = 'Appel terminé avec succès';
      setTimeout(() => { successMessage = ''; }, 3000);
    })
    .catch(error => {
      console.error('End call error:', error);
      errorMessage = 'Échec de la fin d\'appel';
      setTimeout(() => { errorMessage = ''; }, 3000);
    })
    .finally(() => {
      console.log('FORCE RESETTING LOADING STATE FOR END CALL');
      loadingStates.endCall = false;
      isLoading = false;
      clearTimeout(safetyTimeout);
    });
  }

  // Toggle mute function
  function toggleMute() {
    if (!$agentState.callActive || isLoading) return;

    isLoading = true;
    loadingStates.mute = true;
    const action = isMuted ? 'unmute' : 'mute';

    // Set a safety timeout to reset loading state in case the API call hangs
    const safetyTimeout = setTimeout(() => {
      console.log(`SAFETY TIMEOUT: Forcing reset of ${action} loading state`);
      loadingStates.mute = false;
      isLoading = false;
    }, 5000); // 5 seconds timeout

    callApi('/agent/call-action', 'POST', {
      action,
      callId: $agentState.callId,
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`${action} success:`, data);
      isMuted = !isMuted;
      successMessage = isMuted ? 'Micro coupé' : 'Micro activé';
      setTimeout(() => { successMessage = ''; }, 3000);
    })
    .catch(error => {
      console.error(`Error toggling ${action}:`, error);
      errorMessage = `Échec de l'action ${action}`;
      setTimeout(() => { errorMessage = ''; }, 3000);
    })
    .finally(() => {
      loadingStates.mute = false;
      isLoading = false;
      clearTimeout(safetyTimeout);
    });
  }

  // Toggle hold function
  function toggleHold() {
    if (!$agentState.callActive || isLoading) return;

    isLoading = true;
    loadingStates.hold = true;
    const action = isOnHold ? 'unhold' : 'hold';

    // Set a safety timeout to reset loading state in case the API call hangs
    const safetyTimeout = setTimeout(() => {
      console.log(`SAFETY TIMEOUT: Forcing reset of ${action} loading state`);
      loadingStates.hold = false;
      isLoading = false;
    }, 5000); // 5 seconds timeout

    callApi('/agent/call-action', 'POST', {
      action,
      callId: $agentState.callId,
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`${action} success:`, data);
      isOnHold = !isOnHold;
      successMessage = isOnHold ? 'Appel mis en attente' : 'Appel repris';
      setTimeout(() => { successMessage = ''; }, 3000);
    })
    .catch(error => {
      console.error(`Error toggling ${action}:`, error);
      errorMessage = `Échec de l'action ${action}`;
      setTimeout(() => { errorMessage = ''; }, 3000);
    })
    .finally(() => {
      loadingStates.hold = false;
      isLoading = false;
      clearTimeout(safetyTimeout);
    });
  }

  // Toggle recording function
  function toggleRecording() {
    if (!$agentState.callActive || isLoading) return;

    isLoading = true;
    loadingStates.record = true;
    const action = isRecording ? 'stop_record' : 'record';

    // Set a safety timeout to reset loading state in case the API call hangs
    const safetyTimeout = setTimeout(() => {
      console.log(`SAFETY TIMEOUT: Forcing reset of ${action} loading state`);
      loadingStates.record = false;
      isLoading = false;
    }, 5000); // 5 seconds timeout

    callApi('/agent/call-action', 'POST', {
      action,
      callId: $agentState.callId,
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`${action} success:`, data);
      isRecording = !isRecording;
      successMessage = isRecording ? 'Enregistrement démarré' : 'Enregistrement arrêté';
      setTimeout(() => { successMessage = ''; }, 3000);
    })
    .catch(error => {
      console.error(`Error toggling ${action}:`, error);
      errorMessage = `Échec de l'action ${action}`;
      setTimeout(() => { errorMessage = ''; }, 3000);
    })
    .finally(() => {
      loadingStates.record = false;
      isLoading = false;
      clearTimeout(safetyTimeout);
    });
  }
</script>

<div class="card mb-3">
  <div class="card-header bg-light">
    <h5 class="mb-0">Contrôles d'appel</h5>
  </div>
  
  <div class="card-body">
    {#if errorMessage}
      <div class="alert alert-danger" role="alert" transition:fade>
        {errorMessage}
      </div>
    {/if}
    
    {#if successMessage}
      <div class="alert alert-success" role="alert" transition:fade>
        {successMessage}
      </div>
    {/if}
    
    <!-- Status Controls -->
    <div class="mb-3">
      <h6 class="text-muted mb-2">Statut</h6>
      <div class="d-flex gap-2">
        {#if $agentState.status === 'PAUSED'}
          <button 
            class="btn btn-primary" 
            on:click={handleResume}
            disabled={$agentState.callActive || isLoading}
          >
            {#if isLoading}
              <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            {/if}
            <i class="bi bi-play-fill me-1"></i>
            Reprendre
          </button>
        {:else}
          <button 
            class="btn btn-warning" 
            on:click={handlePause}
            disabled={$agentState.callActive || isLoading}
          >
            {#if isLoading}
              <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            {/if}
            <i class="bi bi-pause-fill me-1"></i>
            Pause
          </button>
        {/if}
      </div>
    </div>
    
    <!-- Call Controls (only visible during active calls) -->
    {#if $agentState.callActive}
      <div>
        <h6 class="text-muted mb-2">Appel en cours</h6>
        <div class="d-flex flex-wrap gap-2">
          <button 
            class="btn {isMuted ? 'btn-danger' : 'btn-outline-secondary'}" 
            on:click={toggleMute}
            title="{isMuted ? 'Réactiver le micro' : 'Couper le micro'}"
          >
            <i class="bi {isMuted ? 'bi-mic-mute-fill' : 'bi-mic-fill'}"></i>
            <span class="ms-1 d-none d-md-inline">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          
          <button 
            class="btn {isOnHold ? 'btn-info' : 'btn-outline-secondary'}" 
            on:click={toggleHold}
            title="{isOnHold ? 'Reprendre l\'appel' : 'Mettre en attente'}"
          >
            <i class="bi {isOnHold ? 'bi-play-fill' : 'bi-pause-fill'}"></i>
            <span class="ms-1 d-none d-md-inline">{isOnHold ? 'Reprendre' : 'Attente'}</span>
          </button>
          
          <button 
            class="btn {isRecording ? 'btn-danger' : 'btn-outline-secondary'}" 
            on:click={toggleRecording}
            title="{isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement'}"
          >
            <i class="bi {isRecording ? 'bi-record-fill' : 'bi-record'}"></i>
            <span class="ms-1 d-none d-md-inline">{isRecording ? 'Stop' : 'Enregistrer'}</span>
          </button>
          
          <button 
            class="btn btn-danger ms-auto" 
            on:click={handleEndCall}
            disabled={isLoading}
          >
            {#if isLoading}
              <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            {/if}
            <i class="bi bi-telephone-x-fill me-1"></i>
            Raccrocher
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Pause Reason Modal -->
{#if showPauseReasonModal}
  <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Raison de la pause</h5>
          <button type="button" class="btn-close" on:click={cancelPause}></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="pauseReason" class="form-label">Sélectionnez une raison</label>
            <select 
              id="pauseReason" 
              class="form-select" 
              bind:value={pauseReason}
            >
              <option value="">Choisir une raison</option>
              <option value="BREAK">Pause</option>
              <option value="LUNCH">Déjeuner</option>
              <option value="MEETING">Réunion</option>
              <option value="TRAINING">Formation</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" on:click={cancelPause}>
            Annuler
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            on:click={submitPause}
            disabled={!pauseReason || isLoading}
          >
            {#if isLoading}
              <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            {/if}
            Valider
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
