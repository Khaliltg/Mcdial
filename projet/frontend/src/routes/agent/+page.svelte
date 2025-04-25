<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  // Rediriger vers le tableau de bord de l'agent
  onMount(() => {
    goto('/agent/dashboard');
  });
</script>

<div class="loading-container">
  <div class="spinner"></div>
  <p>Chargement de l'interface agent...</p>
</div>

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100%;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
