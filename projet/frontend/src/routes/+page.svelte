<script lang="ts">
  import { goto } from '$app/navigation';

  // Fonction pour rediriger vers la page de connexion appropriée
  function navigateToLogin(role: 'agent' | 'admin') {
    goto(`/${role}/login`);
  }
</script>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f5f7fa;
    height: 100vh;
  }
  
  .selection-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    padding: 0 20px;
  }
  
  h1 {
    font-size: 1.8rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 2rem;
    text-align: center;
  }
  
  .role-buttons {
    display: flex;
    gap: 1.5rem;
  }
  
  @media (max-width: 600px) {
    .role-buttons {
      flex-direction: column;
    }
  }
  
  .role-button {
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 500;
    cursor: pointer;
    min-width: 200px;
    text-align: center;
  }
  
  .role-button.admin {
    background-color: #1f2937;
  }
  
  .role-button:hover {
    opacity: 0.9;
  }
</style>

<div class="selection-container">
  <h1>Choisissez votre mode de connexion</h1>
  
  <div class="role-buttons">
    <button 
      class="role-button" 
      on:click={() => navigateToLogin('agent')}
    >
      Agent
    </button>
    
    <button 
      class="role-button admin" 
      on:click={() => navigateToLogin('admin')}
    >
      Administrateur
    </button>
  </div>
</div>
