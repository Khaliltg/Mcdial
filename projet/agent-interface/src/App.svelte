<script lang="ts">
  import { onMount } from 'svelte';
  import Login from './components/Login.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import StatusBar from './components/StatusBar.svelte';
  import CallControls from './components/CallControls.svelte';
  import { agentState, updateAgentInfo } from './stores/agent';
  import { checkAuth } from './utils/fetchWithAuth';
  
  let loading = true;
  
  onMount(async () => {
    try {
      console.log('Vérification de l\'authentification au démarrage...');
      const authResult = await checkAuth();
      
      if (authResult.authenticated && authResult.user) {
        console.log('Utilisateur authentifié:', authResult.user);
        
        // Mettre à jour les informations de l'agent
        updateAgentInfo({
          user: authResult.user.user,
          fullName: authResult.user.full_name,
          phoneLogin: authResult.user.phone_login || "",
          extension: authResult.user.extension,
          campaignId: authResult.user.campaign_id || "",
          campaignName: authResult.user.campaign_name || "Aucune campagne",
          isAuthenticated: true, // Important: mettre à jour l'état d'authentification
          status: "READY",
          statusSince: new Date()
        });
        
        // Vérifier si nous sommes sur la page de login et rediriger si nécessaire
        if (window.location.pathname === '/login') {
          console.log('Redirection depuis la page de login vers la page d\'accueil...');
          window.location.href = '/';
          return; // Arrêter l'exécution pour éviter de définir loading = false avant la redirection
        }
      } else {
        console.log('Utilisateur non authentifié, affichage de la page de login');
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'authentification:", error);
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <div class="loading-container">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Chargement...</span>
    </div>
    <p class="mt-3">Chargement de l'interface agent...</p>
    <p class="text-muted small">Vérification de l'authentification...</p>
  </div>
{:else if $agentState.isAuthenticated}
  <div class="agent-interface">
    <StatusBar />
    <div class="container-fluid mt-3">
      <Dashboard />
    </div>
  </div>
{:else}
  <!-- Débogage: Afficher l'état actuel de l'agent -->
  <div class="debug-info d-none">
    <pre>{JSON.stringify($agentState, null, 2)}</pre>
  </div>
  
  <Login />
{/if}

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100%;
  }
  
  .agent-interface {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
</style>
