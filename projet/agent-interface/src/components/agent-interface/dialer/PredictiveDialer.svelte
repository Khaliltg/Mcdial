<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { agentState, updateAgentStatus, startCall, endCall, resetCall, type AgentState, type AgentStatus } from '../../../stores/agent';
  import { api } from '../../../utils/fetchWithAuth';
  import ProspectForm from '../prospect/ProspectForm.svelte';
  
  // Import configuration
  import { CHECK_CALLS_INTERVAL, API_BASE_URL } from '../../../utils/config';
  
  // Props for communication with parent components
  export let callEnded = false;
  // We don't directly use callActive, but we'll keep it for future use
  // and to maintain the component API
  
  // State variables
  let waitingForCall = false;
  let checkCallsInterval: number | undefined;
  let predictiveMode = false;
  let manualDialNumber = '';
  let manualDialLeadId = '';
  let manualDialName = '';
  let errorMessage = '';
  let successMessage = '';
  let prospectData: any = null;
  
  // Campaign numbers for simulation (in real app, these would come from the API)
  interface CampaignNumber {
    phone_number: string;
    first_name: string;
    last_name: string;
    lead_id: string;
    called: boolean;
  }
  
  let campaignNumbers: CampaignNumber[] = [];
  
  // Function to check for incoming calls
  async function checkForIncomingCalls() {
    if ($agentState.callActive) {
      console.log('Call active, not checking for incoming calls');
      return;
    }
    
    try {
      console.log('Checking for incoming calls...');
      
      // Use direct fetch with proper API base URL
      const response = await fetch(`${API_BASE_URL}/agent/calls/check-calls`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agent_token') || localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error checking for calls: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Check calls response:', data);
      
      // If there's an incoming call, update the agent state
      if (data.incomingCalls) {
        const call = data.incomingCalls;
        console.log('Incoming call detected:', call);
        
        // Get prospect data if we have a lead ID
        if (call.lead_id) {
          await getProspectData(call.lead_id);
        }
        
        startCall({
          leadId: call.lead_id,
          phoneNumber: call.phone_number || '',
          callId: call.call_id
        });
        
        successMessage = `Incoming call from ${call.phone_number}`;
      } else if (data.outgoingCalls) {
        const call = data.outgoingCalls;
        console.log('Outgoing call detected:', call);
        
        // Only update if we're not already in a call
        if (!$agentState.callActive) {
          // Get prospect data if we have a lead ID
          if (call.lead_id) {
            await getProspectData(call.lead_id);
          }
          
          startCall({
            leadId: call.lead_id,
            phoneNumber: call.phone_number || '',
            callId: call.call_id
          });
          
          successMessage = `Outgoing call to ${call.phone_number}`;
        }
      }
      
      errorMessage = '';
    } catch (error) {
      console.error('Error checking for calls:', error);
      errorMessage = 'Error checking for calls';
    }
  }
  
  // Function to get prospect data
  async function getProspectData(leadId: string | null, phoneNumber?: string) {
    try {
      console.log('Getting prospect data with:', { leadId, phoneNumber });
      
      // Build query string for params
      let queryParams = new URLSearchParams();
      if (leadId) queryParams.append('leadId', leadId);
      if (phoneNumber) queryParams.append('phoneNumber', phoneNumber);
      
      // If no parameters, return null
      if (queryParams.toString() === '') {
        console.log('No parameters provided for prospect data fetch');
        return null;
      }
      
      console.log('API request params:', queryParams.toString());
      
      // Use direct fetch with proper API base URL
      const response = await fetch(`${API_BASE_URL}/agent/prospect-data?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agent_token') || localStorage.getItem('token')}`
        }
      });
      
      console.log('API response status:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`Error fetching prospect data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Prospect data received:', data);
      
      // Update contact name in agent state if available
      if (data.first_name || data.last_name) {
        const contactName = [data.first_name, data.last_name]
          .filter(Boolean)
          .join(' ');
        
        if (contactName) {
          console.log('Updating contact name in agent state:', contactName);
          // Update the agent state with the contact name
          // Don't use startCall which expects a different parameter shape
          $agentState = {
            ...$agentState,
            contactName
          };
        }
      }
      
      // Update local prospect data
      console.log('Setting prospectData variable:', data);
      prospectData = data;
      console.log('prospectData after assignment:', prospectData);
      
      return data;
    } catch (error) {
      console.error('Error fetching prospect data:', error);
      return null;
    }
  }
  
  // Function to initiate a manual call
  async function callFromList(phoneNumber?: string, contactName?: string, leadId?: string | null) {
    console.log(`Call from list with status: ${$agentState.status}`);
    
    // Check if we have at least a phone number or a lead ID
    if ((!phoneNumber || phoneNumber.trim() === '') && (!leadId || leadId.trim() === '')) {
      errorMessage = 'Phone number or Lead ID is required';
      return;
    }
    
    // Get agent ID from store
    const agentId = $agentState.extension || $agentState.phoneLogin;
    if (!agentId) {
      errorMessage = 'Agent ID not available';
      return;
    }
    
    // Ne pas changer le statut si l'agent est déjà en INCALL (mode prédictif)
    // sinon mettre en DIALING
    if ($agentState.status !== 'INCALL') {
      await updateAgentStatusWithBackend('DIALING');
    }
    
    console.log(`Statut actuel avant l'appel: ${$agentState.status}`);
    
    const payload = {
      agentId,
      campaignId: $agentState.campaignId || 'DEFAULT',
      phoneNumber,
      contactName,
      leadId
    };
    
    console.log('Initiation d\'appel avec:', payload);
    
    try {
      // Use direct fetch with proper API base URL
      const response = await fetch(`${API_BASE_URL}/agent/calls/manual-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('agent_token') || localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Error initiating call: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Call initiated:', data);
      
      // Update agent state with call information
      startCall({
        leadId: leadId || null,
        phoneNumber: phoneNumber || data.phoneNumber || '', // Use the phone number from response if not provided
        contactName,
        callId: data.callId
      });
      
      successMessage = `Call initiated to ${phoneNumber || data.phoneNumber}`;
      errorMessage = '';
      
      // Always try to get prospect data when a call is initiated
      // First try with leadId if available
      if (leadId) {
        console.log('Fetching prospect data using leadId:', leadId);
        const prospectResult = await getProspectData(leadId);
        if (prospectResult) {
          console.log('Successfully fetched prospect data using leadId');
        } else if (phoneNumber) {
          // If leadId doesn't work, try with phoneNumber
          console.log('Fetching prospect data using phoneNumber as fallback:', phoneNumber);
          await getProspectData(null, phoneNumber);
        }
      } else if (phoneNumber) {
        // If no leadId, try with phoneNumber
        console.log('Fetching prospect data using phoneNumber:', phoneNumber);
        await getProspectData(null, phoneNumber);
      }
      
      return data;
    } catch (error) {
      console.error('Error initiating call:', error);
      errorMessage = 'Error initiating call';
      setTimeout(() => { errorMessage = ''; }, 3000);
      await updateAgentStatusWithBackend('WAITING');
      return null;
    }
  }
  
  // Function to handle manual dialing
  async function handleManualDial() {
    if ($agentState.callActive) {
      errorMessage = 'Cannot dial while on a call';
      return;
    }
    
    if (!manualDialNumber && !manualDialLeadId) {
      errorMessage = 'Phone number or Lead ID is required';
      return;
    }
    
    await callFromList(manualDialNumber, manualDialName, manualDialLeadId);
    
    // Clear form after dialing
    manualDialNumber = '';
    manualDialLeadId = '';
    manualDialName = '';
  }
  
  // Function to handle ending a call
  async function handleEndCall() {
    try {
      console.log('Ending call with ID:', $agentState.callId);
      
      if (!$agentState.callId) {
        console.error('No active call ID found');
        errorMessage = 'No active call to end';
        setTimeout(() => { errorMessage = ''; }, 3000);
        return;
      }
      
      const response = await api.post('/agent/calls/end-call', {
        callId: $agentState.callId,
        agentId: $agentState.extension || $agentState.phoneLogin
      });
      
      if (!response.ok) {
        throw new Error(`Failed to end call: ${response.status} ${response.statusText}`);
      }
      
      // Update the UI
      endCall();
      successMessage = 'Appel terminé avec succès';
      setTimeout(() => { successMessage = ''; }, 3000);
      
      // Reset the state after a short delay
      setTimeout(() => {
        resetCall();
        prospectData = null;
      }, 2000);
    } catch (error) {
      console.error('Error ending call:', error);
      errorMessage = 'Error ending call';
      setTimeout(() => { errorMessage = ''; }, 3000);
      
      // If the call is stuck, provide an option to force reset the local state
      if (confirm('Impossible de terminer l\'appel normalement. Voulez-vous forcer la réinitialisation de l\'interface?')) {
        endCall();
        setTimeout(() => {
          resetCall();
          prospectData = null;
        }, 1000);
      }
    }
  }
  
  // Function to save prospect data
  async function saveProspectData(data: Record<string, any>) {
    try {
      // In a real implementation, we would send this data to the backend
      console.log('Saving prospect data:', data);
      successMessage = 'Prospect data saved';
      
      // Update local prospect data
      prospectData = data;
    } catch (error) {
      console.error('Error saving prospect data:', error);
      errorMessage = 'Error saving prospect data';
    }
  }
  
  // Function to toggle predictive dialing mode
  function togglePredictiveMode() {
    predictiveMode = !predictiveMode;
    
    if (predictiveMode) {
      successMessage = 'Predictive dialing mode activated';
      startPredictive();
    } else {
      successMessage = 'Predictive dialing mode deactivated';
      stopPredictive();
    }
  }
  
  // Function to update agent status on both frontend and backend
  async function updateAgentStatusWithBackend(status: AgentStatus, pauseCode?: string) {
    console.log(`Updating agent status to ${status}${pauseCode ? ` with pause code ${pauseCode}` : ''}`);
    
    // Update local state first for immediate UI feedback
    updateAgentStatus(status);
    
    // Prepare payload
    const payload: any = { status };
    if (pauseCode) payload.pauseCode = pauseCode;
    
    // Use direct fetch with proper API base URL
    try {
      const response = await fetch(`${API_BASE_URL}/agent/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('agent_token') || localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        console.error('Failed to update status on backend:', response.status, response.statusText);
        errorMessage = 'Failed to update agent status';
        setTimeout(() => { errorMessage = ''; }, 3000);
        return false;
      }
      
      console.log(`Successfully updated agent status to ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating agent status:', error);
      errorMessage = 'Error updating agent status';
      setTimeout(() => { errorMessage = ''; }, 3000);
      return false;
    }
  }
  
  // Function to start predictive dialing
  async function startPredictive() {
    waitingForCall = true;
    
    // Changer directement le statut en INCALL sans passer par READY
    await updateAgentStatusWithBackend('INCALL');
    
    // Démarrer l'appel immédiatement sans délai
    simulatePredictiveCall();
    
    successMessage = 'Appel en cours de lancement...';
    setTimeout(() => { successMessage = ''; }, 3000);
  }
  
  // Function to stop predictive dialing
  async function stopPredictive() {
    waitingForCall = false;
    await updateAgentStatusWithBackend('PAUSED', 'OTHER');
    
    successMessage = 'Predictive dialing mode deactivated';
    setTimeout(() => { successMessage = ''; }, 3000);
  }
  
  // Simulate a predictive call (for demo purposes)
  function simulatePredictiveCall() {
    console.log('Tentative de simulation d\'un appel prédictif...');
    console.log('status:', $agentState.status);
    console.log('waitingForCall:', waitingForCall);
    console.log('campaignNumbers:', campaignNumbers);
    
    // Appeler immédiatement quel que soit le statut de l'agent
    // L'agent est déjà en statut INCALL à ce stade
    if (campaignNumbers.length > 0) {
      console.log('Lancement immédiat de l\'appel prédictif...');
      callNextNumber();
    } else {
      console.log('Impossible de lancer un appel: pas de numéros disponibles');
      errorMessage = 'Aucun numéro disponible pour l\'appel prédictif';
      setTimeout(() => { errorMessage = ''; }, 3000);
      
      // Réinitialiser le statut de l'agent si aucun appel ne peut être lancé
      updateAgentStatusWithBackend('READY');
    }
  }
  
  // Call the next number in the campaign list
  async function callNextNumber() {
    // Filter available numbers
    const availableNumbers = campaignNumbers.filter(n => !n.called);
    console.log(`${availableNumbers.length} numéros disponibles sur ${campaignNumbers.length} total`);
    
    if (availableNumbers.length > 0) {
      // Get the next number
      const nextNumber = availableNumbers[0];
      console.log('Prochain numéro à appeler:', nextNumber);
      
      // Mark as called
      const index = campaignNumbers.findIndex(n => n.phone_number === nextNumber.phone_number);
      if (index !== -1) {
        campaignNumbers[index].called = true;
      }
      
      console.log(`Initiation d'un appel vers ${nextNumber.phone_number} ( ${nextNumber.first_name} ${nextNumber.last_name} )`);
      
      // Générer un ID temporaire pour l'appel
      const tempCallId = `pred_${Date.now()}`;
      
      // Mettre à jour l'interface avant même que l'appel ne soit lancé
      // pour une réponse immédiate
      startCall({
        leadId: nextNumber.lead_id,
        phoneNumber: nextNumber.phone_number,
        callId: tempCallId,
        contactName: `${nextNumber.first_name} ${nextNumber.last_name}`
      });
      
      // Récupérer les données du prospect immédiatement
      await getProspectData(nextNumber.lead_id, nextNumber.phone_number);
      
      try {
        // Créer directement la requête API pour l'appel au lieu d'utiliser callFromList
        // pour éviter les conflits de statut
        const payload = {
          agentId: $agentState.extension || $agentState.phoneLogin,
          campaignId: $agentState.campaignId || 'DEFAULT',
          phoneNumber: nextNumber.phone_number,
          contactName: `${nextNumber.first_name} ${nextNumber.last_name}`,
          leadId: nextNumber.lead_id
        };
        
        console.log('Envoi direct de la requête d\'appel:', payload);
        
        const response = await fetch(`${API_BASE_URL}/agent/calls/manual-call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('agent_token') || localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error(`Erreur lors de l'initiation de l'appel: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Appel initié avec succès:', data);
        
        // Mettre à jour l'ID d'appel avec celui retourné par l'API
        if (data.callId) {
          startCall({
            leadId: nextNumber.lead_id,
            phoneNumber: nextNumber.phone_number,
            callId: data.callId,
            contactName: `${nextNumber.first_name} ${nextNumber.last_name}`
          });
        }
        
        successMessage = `Appel lancé vers ${nextNumber.phone_number}`;
      } catch (error) {
        console.error('Erreur lors du lancement de l\'appel:', error);
        errorMessage = 'Erreur lors du lancement de l\'appel';
        setTimeout(() => { errorMessage = ''; }, 3000);
      }
    } else {
      console.log('Aucun numéro disponible à appeler');
      successMessage = 'Aucun numéro disponible';
      stopPredictive();
    }
  }
  
  // Load campaign numbers (simulation)
  function loadCampaignNumbers() {
    console.log('Utilisation de numéros de campagne simulés');
    
    // Simulate campaign numbers
    campaignNumbers = [
      { phone_number: '0123456789', first_name: 'Jean', last_name: 'Dupont', lead_id: '101', called: false },
      { phone_number: '0234567890', first_name: 'Marie', last_name: 'Martin', lead_id: '102', called: false },
      { phone_number: '0345678901', first_name: 'Pierre', last_name: 'Durand', lead_id: '103', called: false },
      { phone_number: '0456789012', first_name: 'Sophie', last_name: 'Lefebvre', lead_id: '104', called: false }
    ];
    
    console.log(`${campaignNumbers.length} numéros simulés disponibles pour la campagne`);
  }
  
  // Start checking for calls on component mount
  onMount(() => {
    // Load campaign numbers for simulation
    loadCampaignNumbers();
    
    // Start checking for calls
    checkCallsInterval = setInterval(checkForIncomingCalls, CHECK_CALLS_INTERVAL) as unknown as number;
    
    return () => {
      if (checkCallsInterval) clearInterval(checkCallsInterval);
    };
  });
  
  // Clean up on component destroy
  onDestroy(() => {
    if (checkCallsInterval) clearInterval(checkCallsInterval);
  });
  
  // Watch for changes in call state to pause/resume checking
  $: if ($agentState.callActive) {
    console.log('Vérification des appels entrants suspendue pendant l\'appel');
    if (checkCallsInterval) {
      clearInterval(checkCallsInterval);
      checkCallsInterval = undefined;
    }
  } else if (!checkCallsInterval) {
    console.log('Reprise de la vérification des appels entrants');
    checkCallsInterval = setInterval(checkForIncomingCalls, CHECK_CALLS_INTERVAL) as unknown as number;
  }
  
  // Watch for changes in callEnded prop
  $: if (callEnded) {
    handleEndCall();
  }
  
  // Type definition for prospect data
  interface ProspectData {
    lead_id?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    email?: string;
    comments?: string;
    [key: string]: any;
  }
</script>

<div class="container-fluid">
  <div class="card mb-4 shadow">
    <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
      <h2 class="h5 mb-0 d-flex align-items-center">
        <i class="bi bi-telephone-fill me-2"></i>
        Predictive Dialer
      </h2>
      <div class="d-flex align-items-center">
        <span class="me-2 small">Status:</span>
        <span class="badge {$agentState.callActive ? 'bg-success' : 'bg-warning'}">
          {$agentState.callActive ? 'In Call' : $agentState.status}
        </span>
      </div>
    </div>
    
    <div class="card-body">
      {#if errorMessage}
        <div class="alert alert-danger d-flex align-items-center mb-3" role="alert">
          <i class="bi bi-exclamation-circle-fill me-2"></i>
          <div>{errorMessage}</div>
        </div>
      {/if}
      
      {#if successMessage}
        <div class="alert alert-success d-flex align-items-center mb-3" role="alert">
          <i class="bi bi-check-circle-fill me-2"></i>
          <div>{successMessage}</div>
        </div>
      {/if}
      
      <div class="d-flex justify-content-between mb-3 gap-3">
        <button 
          class="btn flex-grow-1 d-flex align-items-center justify-content-center {predictiveMode ? 'btn-danger' : 'btn-primary'}" 
          on:click={togglePredictiveMode}
        >
          <i class="bi {predictiveMode ? 'bi-x-lg' : 'bi-play-circle'} me-2"></i>
          {predictiveMode ? 'Stop Predictive' : 'Start Predictive'}
        </button>
        
        <button 
          class="btn btn-secondary flex-grow-1 d-flex align-items-center justify-content-center" 
          disabled={$agentState.callActive} 
          on:click={checkForIncomingCalls}
        >
          <i class="bi bi-arrow-repeat me-2"></i>
          Check Calls
        </button>
      </div>
  
      {#if $agentState.callActive}
        <div class="card mb-3 border-primary">
          <div class="card-body">
            <div class="d-flex align-items-start">
              <div class="bg-primary rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                <i class="bi bi-telephone-fill text-white fs-4"></i>
              </div>
              <div class="flex-grow-1">
                <h5 class="d-flex align-items-center">
                  <span class="me-2">Active Call</span>
                  <span class="badge bg-success rounded-pill">Active</span>
                </h5>
                
                <div class="row mt-2 g-2">
                  <div class="col-md-6 d-flex align-items-center">
                    <i class="bi bi-telephone me-2 text-primary"></i>
                    <span class="fw-medium">{$agentState.phoneNumber || 'N/A'}</span>
                  </div>
                  
                  {#if $agentState.contactName}
                    <div class="col-md-6 d-flex align-items-center">
                      <i class="bi bi-person me-2 text-primary"></i>
                      <span class="fw-medium">{$agentState.contactName}</span>
                    </div>
                  {/if}
                  
                  {#if $agentState.leadId}
                    <div class="col-md-6 d-flex align-items-center">
                      <i class="bi bi-hash me-2 text-primary"></i>
                      <span class="fw-medium">Lead ID: {$agentState.leadId}</span>
                    </div>
                  {/if}
                  
                  <div class="col-md-6 d-flex align-items-center">
                    <i class="bi bi-clock me-2 text-primary"></i>
                    <span class="fw-medium">Duration: {Math.floor($agentState.callDuration / 60)}:{($agentState.callDuration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
              
              <button 
                class="btn btn-danger d-flex align-items-center" 
                on:click={handleEndCall}
              >
                <i class="bi bi-x-lg me-1"></i>
                End Call
              </button>
            </div>
          </div>
        </div>
      {:else}
        <!-- Manual dial section removed as requested -->
        <div class="alert alert-info">
          <div class="d-flex align-items-center">
            <i class="bi bi-info-circle-fill me-2"></i>
            <div>
              <p class="mb-0">Waiting for predictive dialer to assign a call.</p>
            </div>
          </div>
        </div>
  {/if}
  
  {#if predictiveMode}
    <div class="alert alert-warning">
      <div class="d-flex align-items-center">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <div>
          <p class="mb-1">Predictive dialing mode is active. The system will automatically dial the next available number.</p>
          {#if waitingForCall}
            <p class="fw-bold mb-0">Waiting for next call...</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  </div><!-- end of card-body -->
  </div><!-- end of card -->
  
  <div class="card mb-4">
    <div class="card-header bg-light">
      <h5 class="mb-0 d-flex align-items-center">
        <i class="bi bi-person-lines-fill me-2 text-primary"></i>
        Informations du prospect
      </h5>
    </div>
    <div class="card-body">
      {#if $agentState.callActive}
        <!-- Always show the form when a call is active, even if prospectData is null -->
        <ProspectForm prospectData={prospectData || {}} onSave={saveProspectData} />
      {:else if prospectData}
        <!-- Show the form if we have prospect data but no active call -->
        <ProspectForm prospectData={prospectData} onSave={saveProspectData} />
      {:else}
        <div class="text-center py-4 text-secondary">
          <i class="bi bi-person-circle fs-1 mb-3"></i>
          <h5 class="mb-2">Aucun prospect actif</h5>
          <p class="mb-2 small">Les informations du prospect s'afficheront ici pendant un appel.</p>
          <p class="text-muted small">Utilisez le composant de numérotation pour initier un appel.</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* All styling is now handled by Bootstrap */
</style>
