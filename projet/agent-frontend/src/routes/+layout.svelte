<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { isAuthenticated } from '$lib/utils/fetchWithAuth';
  
  // État d'authentification
  let loading = true;
  let authenticated = false;
  
  onMount(() => {
    // Vérifier l'authentification
    checkAuth();
  });
  
  // Fonction pour vérifier l'authentification
  function checkAuth() {
    loading = true;
    authenticated = isAuthenticated();
    console.log('Vérification auth dans layout:', { authenticated, path: $page.url.pathname });
    
    // Vérifier le localStorage et les cookies pour déboguer
    const token = localStorage.getItem('agent_token');
    const hasCookie = document.cookie.split(';').some(item => item.trim().startsWith('jwt='));
    console.log('Détails auth:', { token: !!token, hasCookie });
    
    // Si l'utilisateur n'est pas authentifié et n'est pas sur la page de login, rediriger vers login
    if (!authenticated && !$page.url.pathname.includes('/login')) {
      console.log('Non authentifié, redirection vers /login');
      goto('/login');
    }
    
    // Si l'utilisateur est authentifié et est sur la page de login, rediriger vers la page d'accueil
    if (authenticated && $page.url.pathname.includes('/login')) {
      console.log('Authentifié sur page login, redirection vers /');
      goto('/');
    }
    
    loading = false;
  }
  
  // Observer les changements de route pour vérifier l'authentification à chaque changement
  $: {
    if (!loading) {
      const currentPath = $page.url.pathname;
      console.log('Changement de route détecté:', { currentPath, authenticated });
      if (!authenticated && !currentPath.includes('/login')) {
        console.log('Redirection vers /login depuis l\'observateur de route');
        goto('/login');
      }
    }
  }
</script>

{#if loading}
  <!-- Écran de chargement pendant la vérification de l'authentification -->
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
{:else if !authenticated && !$page.url.pathname.includes('/login')}
  <!-- Ne rien afficher pendant la redirection -->
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <p class="text-gray-500">Redirection vers la page de connexion...</p>
  </div>
{:else}
  <!-- Afficher le contenu normal si authentifié ou sur la page de login -->
  <slot />
{/if}
