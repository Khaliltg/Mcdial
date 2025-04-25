<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  // Vérifier si le token est valide (non expiré)
  function isTokenValid(token: string): boolean {
    try {
      // Décoder le token JWT (sans vérification de signature)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decodedToken = JSON.parse(window.atob(base64));
      
      // Vérifier si le token a expiré
      const currentTime = Math.floor(Date.now() / 1000);
      return decodedToken.exp > currentTime;
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return false;
    }
  }
  
  onMount(() => {
    console.log('Vérification de l\'authentification...');
    
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem('agent_token');
    
    if (token && isTokenValid(token)) {
      // Si l'utilisateur est connecté avec un token valide, rediriger vers l'interface agent
      console.log('Token valide détecté, redirection vers /agent');
      goto('/agent');
    } else {
      // Si le token est invalide ou absent, le supprimer et rediriger vers la page de login
      if (token) {
        console.log('Token invalide ou expiré, suppression...');
        localStorage.removeItem('agent_token');
      }
      console.log('Redirection vers /login');
      goto('/login');
    }
  });
</script>

<div class="min-h-screen bg-gray-100 flex items-center justify-center">
  <div class="text-center">
    <h1 class="text-2xl font-bold text-blue-800 mb-4">Bienvenue sur McDial</h1>
    <p class="text-lg text-blue-600">Redirection en cours...</p>
  </div>
</div>
