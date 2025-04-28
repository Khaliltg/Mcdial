<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isAuthenticated } from '$lib/utils/fetchWithAuth';
  import PredictiveDialer from '$lib/components/agent-interface/dialer/PredictiveDialer.svelte';
  import CallControls from '$lib/components/agent-interface/call-controls/CallControls.svelte';
  import ProspectForm from '$lib/components/agent-interface/prospect-form/ProspectForm.svelte';
  
  // Variables pour gérer l'état de l'interface
  let loading = true;
  let authenticated = false;
  let fullName = '';
  let campaignName = '';
  let callActive = false;
  let callEnded = false;
  
  // Informations sur l'appel en cours
  let currentCall = {
    phoneNumber: '',
    callId: '',
    contactName: ''
  };
  
  // URL de base de l'API
  const API_BASE_URL = 'http://localhost:8000';
  
  // Fonction pour démarrer un appel
  function startCall(phoneNumber: string, callId: string, contactName: string) {
    callActive = true;
    callEnded = false;
    currentCall = { phoneNumber, callId, contactName };
    console.log('Appel démarré:', currentCall);
  }
  
  // Fonction pour terminer un appel
  function endCall() {
    callActive = false;
    callEnded = true;
    console.log('Appel terminé');
  }
  
  // Fonction pour gérer l'initialisation d'un appel depuis le composant PredictiveDialer
  function handleCallInitiated(event: CustomEvent<{phoneNumber: string, callId: string, contactName: string, leadId?: string}>) {
    const { phoneNumber, callId, contactName } = event.detail;
    startCall(phoneNumber, callId, contactName);
  }
  
  // Fonction de déconnexion
  function logout() {
    console.log('Déconnexion en cours...');
    localStorage.removeItem('agent_token');
    localStorage.removeItem('agent_phone_login');
    localStorage.removeItem('agent_campaign_id');
    localStorage.removeItem('agent_full_name');
    localStorage.removeItem('phone_session_token');
    localStorage.removeItem('user_session_token');
    
    // Supprimer les cookies
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user_level=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'auth_success=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'remember_agent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    goto('/login');
  }
  
  onMount(() => {
    console.log('Page d\'accueil chargée - Vérification de l\'authentification');
    
    // Vérifier si l'utilisateur est connecté
    authenticated = isAuthenticated();
    console.log('Statut d\'authentification:', authenticated);
    
    // Récupérer les informations de l'utilisateur
    fullName = localStorage.getItem('agent_full_name') || 'Agent';
    const campaignId = localStorage.getItem('agent_campaign_id') || '';
    campaignName = `Campagne ${campaignId}`;
    
    if (!authenticated) {
      console.log('Non authentifié, redirection vers la page de connexion');
      goto('/login');
    } else {
      console.log('Authentifié, affichage de l\'interface agent');
    }
    
    loading = false;
  });
</script>

{#if loading}
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
{:else if authenticated}
  <div class="min-h-screen flex flex-col bg-gray-100">
    <!-- En-tête -->
    <header class="bg-white shadow-sm p-4">
      <div class="container mx-auto flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <div class="bg-blue-600 text-white p-2 rounded-md">
            <span class="font-bold text-xl">M</span>
          </div>
          <h1 class="text-xl font-semibold text-gray-800">McDial Agent</h1>
          <span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{campaignName}</span>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-gray-600">Bienvenue, {fullName}</span>
          <button 
            class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            on:click={logout}
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
    
    <!-- Contenu principal -->
    <main class="flex-grow container mx-auto p-4 grid grid-cols-12 gap-4">
      <!-- Colonne gauche - Composant de numérotation prédictive -->
      <div class="col-span-12 md:col-span-3 bg-white p-4 rounded-lg shadow-sm">
        <PredictiveDialer 
          on:callInitiated={handleCallInitiated}
          callActive={callActive}
          callEnded={callEnded}
          apiBaseUrl={API_BASE_URL}
        />
      </div>
      
      <!-- Colonne centrale - Contrôles d'appel -->
      <div class="col-span-12 md:col-span-6 bg-white p-4 rounded-lg shadow-sm">
        {#if callActive}
          <CallControls 
            phoneNumber={currentCall.phoneNumber} 
            customerName={currentCall.contactName} 
            callActive={callActive}
            callDuration={0}
            on:hangup={endCall}
          />
          
          <!-- Formulaire prospect lorsqu'un appel est actif -->
          <div class="mt-4">
            <ProspectForm 
              currentProspect={{lead_id: '0', first_name: currentCall.contactName, phone_number: currentCall.phoneNumber}}
              callActive={callActive}
              apiBaseUrl={API_BASE_URL}
            />
          </div>
        {:else}
          <div class="flex flex-col items-center justify-center h-64">
            <div class="text-center p-8">
              <div class="text-gray-400 text-6xl mb-4">
                <i class="fas fa-phone-alt"></i>
              </div>
              <h2 class="text-xl font-semibold text-gray-700 mb-2">Aucun appel actif</h2>
              <p class="text-gray-500">Utilisez le composant de numérotation à gauche pour initier un appel</p>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Colonne droite - Informations complémentaires -->
      <div class="col-span-12 md:col-span-3 bg-white p-4 rounded-lg shadow-sm">
        <h2 class="text-lg font-semibold mb-4">Statistiques</h2>
        <div class="space-y-4">
          <div class="p-3 bg-blue-50 rounded-md">
            <p class="text-sm font-medium text-blue-800">Appels aujourd'hui</p>
            <p class="text-2xl font-bold text-blue-600">0</p>
          </div>
          <div class="p-3 bg-green-50 rounded-md">
            <p class="text-sm font-medium text-green-800">Appels réussis</p>
            <p class="text-2xl font-bold text-green-600">0</p>
          </div>
          <div class="p-3 bg-yellow-50 rounded-md">
            <p class="text-sm font-medium text-yellow-800">Temps moyen</p>
            <p class="text-2xl font-bold text-yellow-600">0:00</p>
          </div>
        </div>
      </div>
    </main>
    
    <!-- Pied de page -->
    <footer class="bg-white p-4 shadow-inner mt-auto">
      <div class="container mx-auto text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} McDial - Tous droits réservés
      </div>
    </footer>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <p class="text-gray-500">Redirection vers la page de connexion...</p>
  </div>
{/if}
