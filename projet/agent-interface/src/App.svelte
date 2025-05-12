<script lang="ts">
  import { onMount } from 'svelte';
  import Login from './components/Login.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import { agentState } from './stores/agent';
  import { API_BASE_URL } from './utils/config';

  // Simple routing logic
  let currentPage = 'login';
  let isAuthenticated = false;
  let isInitialized = false;

  // Fonction simplifiée pour vérifier si l'utilisateur est authentifié
  async function checkAuthentication() {
    console.log('Vérification de l\'authentification...');
    
    // Vérifier le token dans localStorage
    const token = localStorage.getItem('agent_token') || localStorage.getItem('token');
    
    // Si aucun token, l'utilisateur n'est pas authentifié
    if (!token) {
      console.log('Aucun token trouvé');
      isAuthenticated = false;
      return false;
    }
    
    try {
      // Vérifier si le token est valide en appelant une API du backend
      const response = await fetch(`${API_BASE_URL}/agent/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Le token est valide, considérer l'utilisateur comme authentifié
        isAuthenticated = true;
        
        // Récupérer les informations de l'agent
        const agentInfo = await response.json();
        
        // Mettre à jour le store avec les informations récupérées
        agentState.update(state => ({
          ...state,
          user: agentInfo.user || localStorage.getItem('username') || '',
          fullName: agentInfo.full_name || localStorage.getItem('full_name') || '',
          phoneLogin: agentInfo.phone_login || localStorage.getItem('phone_login') || '',
          campaignId: agentInfo.campaign_id || localStorage.getItem('campaign_id') || '',
          campaignName: agentInfo.campaign_name || localStorage.getItem('campaign_name') || '',
          extension: agentInfo.extension || localStorage.getItem('extension') || '',
          status: agentInfo.status || 'READY',
          callsToday: 0,
          callsAnswered: 0,
          callsAbandoned: 0
        }));
        
        return true;
      } else {
        console.log('Token invalide ou expiré');
        isAuthenticated = false;
        // Supprimer le token invalide
        localStorage.removeItem('agent_token');
        localStorage.removeItem('token');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      // En cas d'erreur réseau, considérer l'utilisateur comme authentifié si le token existe
      // pour éviter de déconnecter l'utilisateur en cas de problème temporaire
      isAuthenticated = true;
      return true;
    }
  }
  
  // Handle page initialization only once
  onMount(async () => {
    if (isInitialized) return;
    
    console.log('Initialisation de l\'application...');
    
    // Vérifier l'authentification sans redirection automatique
    await checkAuthentication();
    
    // Déterminer la page à afficher en fonction de l'authentification
    if (isAuthenticated) {
      console.log('Utilisateur authentifié, affichage du tableau de bord');
      currentPage = 'dashboard';
    } else {
      console.log('Utilisateur non authentifié, affichage de la page de connexion');
      currentPage = 'login';
    }
    
    // Marquer l'initialisation comme terminée
    isInitialized = true;
  });
</script>

<div class="app-container">
  {#if currentPage === 'dashboard'}
    <Dashboard />
  {:else}
    <Login />
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f3f4f6;
  }
  
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
</style>
