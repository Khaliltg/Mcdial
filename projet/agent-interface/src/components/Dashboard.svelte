<script lang="ts">
  import { onMount } from 'svelte';
  import { agentState } from '../stores/agent';
  import { api, clearAuthData } from '../utils/fetchWithAuth';
  import StatusBar from './StatusBar.svelte';
  import CallControls from './CallControls.svelte';
  import PredictiveDialer from './agent-interface/dialer/PredictiveDialer.svelte';
  
  // State for communication between components
  let callActive = false;
  let callEnded = false;
  
  let isLoading = true;
  let error = '';
  
  // Function to fetch agent info
  async function fetchAgentInfo() {
    try {
      const response = await api.get('/agent/calls/info');
      
      if (!response.ok) {
        throw new Error('Failed to fetch agent info');
      }
      
      const data = await response.json();
      
      // Update agent state with fetched info
      agentState.update(state => ({
        ...state,
        user: data.user,
        fullName: data.full_name,
        userLevel: data.user_level,
        extension: data.extension,
        phoneLogin: data.phone_login,
        campaignId: data.campaign_id,
        campaignName: data.campaign_name,
        status: data.status || 'READY'
      }));
      
      return data;
    } catch (error) {
      console.error('Error fetching agent info:', error);
      throw error;
    }
  }
  
  onMount(async () => {
    // Check if user is logged in
    const token = localStorage.getItem('agent_token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    
    // Set a timeout to prevent getting stuck on loading screen
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        error = 'Loading timed out. Please try logging in again.';
        isLoading = false;
        
        // Clear all authentication data
        clearAuthData();
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    }, 10000); // 10 second timeout
    
    try {
      // Fetch agent info
      await fetchAgentInfo();
      isLoading = false;
      clearTimeout(loadingTimeout);
    } catch (err) {
      console.error('Error fetching agent info:', err);
      error = 'Failed to load agent information. Please try logging in again.';
      isLoading = false;
      clearTimeout(loadingTimeout);
      
      // Clear all authentication data
      clearAuthData();
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  });
  
  // Function to handle logout
  function handleLogout() {
    clearAuthData();
    window.location.href = '/';
  }
  
  // Function to handle call end from CallControls
  function handleCallEnd() {
    callEnded = true;
    
    // Reset after a short delay
    setTimeout(() => {
      callEnded = false;
    }, 500);
  }
  
  // Watch for changes in agent state
  $: callActive = $agentState.callActive;
</script>

<div class="min-h-screen bg-gray-100 flex flex-col">
  {#if isLoading}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p class="mt-4 text-gray-700">Loading agent interface...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex-1 flex items-center justify-center">
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
        <p>{error}</p>
      </div>
    </div>
  {:else}
    <header class="bg-dark text-white">
      <StatusBar />
    </header>
    
    <main class="flex-1 container mx-auto px-4 py-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2">
          <PredictiveDialer callEnded={callEnded} />
        </div>
        
        <div class="md:col-span-1">
          <CallControls on:endCall={handleCallEnd} />
          
          <!-- Agent Information Card -->
          <div class="bg-white p-4 rounded-lg shadow-md mb-4">
            <h2 class="text-xl font-bold mb-4">Agent Information</h2>
            
            <div class="space-y-2">
              <div>
                <span class="font-bold">User:</span> {$agentState.user}
              </div>
              <div>
                <span class="font-bold">Name:</span> {$agentState.fullName}
              </div>
              <div>
                <span class="font-bold">Extension:</span> {$agentState.extension}
              </div>
              <div>
                <span class="font-bold">Campaign:</span> {$agentState.campaignName || $agentState.campaignId}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <footer class="bg-dark text-white py-4">
      <div class="container mx-auto px-4 text-center">
        <p>&copy; 2025 MCDial - Predictive Dialer Interface</p>
      </div>
    </footer>
  {/if}
</div>
