<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  
  let user = null;
  let loading = true;
  let error = '';
  
  onMount(async () => {
    try {
      // Vérifier si l'utilisateur est connecté
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        goto('/admin/login');
        return;
      }
      
      user = JSON.parse(userStr);
      
      // Vérifier si l'utilisateur est un administrateur
      if (user.user_level != 9) {
        error = "Accès non autorisé. Vous n'avez pas les droits d'administrateur.";
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setTimeout(() => goto('/admin/login'), 2000);
        return;
      }
      
      // Charger les données du tableau de bord
      // Vous pouvez ajouter ici des appels API pour récupérer les données nécessaires
      
    } catch (err) {
      console.error('Erreur lors du chargement du tableau de bord:', err);
      error = "Une erreur s'est produite lors du chargement du tableau de bord.";
    } finally {
      loading = false;
    }
  });
  
  // Fonction pour se déconnecter
  async function handleLogout() {
    try {
      await fetchWithAuth('http://localhost:8000/api/auth/logout', {
        method: 'POST'
      });
      
      // Supprimer les données d'authentification du localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user_level');
      
      // Supprimer les cookies
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'token_js=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'user_level=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      goto('/admin/login');
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  }
</script>

<svelte:head>
  <title>Tableau de bord administrateur | McDial</title>
</svelte:head>

<div class="dashboard-container">
  {#if loading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Chargement du tableau de bord...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <div class="error-icon">
        <i class="bi bi-exclamation-triangle"></i>
      </div>
      <h2>Erreur</h2>
      <p>{error}</p>
    </div>
  {:else if user}
    <header class="dashboard-header">
      <div class="welcome-section">
        <h1>Tableau de bord administrateur</h1>
        <p>Bienvenue, {user.name || user.username}</p>
      </div>
      <div class="actions-section">
        <button class="logout-button" on:click={handleLogout}>
          <i class="bi bi-box-arrow-right"></i>
          Se déconnecter
        </button>
      </div>
    </header>
    
    <div class="dashboard-content">
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-people"></i>
          </div>
          <div class="stat-info">
            <h3>Utilisateurs</h3>
            <p class="stat-value">--</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-telephone"></i>
          </div>
          <div class="stat-info">
            <h3>Appels</h3>
            <p class="stat-value">--</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-list-check"></i>
          </div>
          <div class="stat-info">
            <h3>Listes</h3>
            <p class="stat-value">--</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-building"></i>
          </div>
          <div class="stat-info">
            <h3>Compagnies</h3>
            <p class="stat-value">--</p>
          </div>
        </div>
      </div>
      
      <div class="dashboard-sections">
        <section class="dashboard-section">
          <h2>Administration</h2>
          <div class="admin-links">
            <a href="/users" class="admin-link-card">
              <i class="bi bi-person-gear"></i>
              <span>Gestion des utilisateurs</span>
            </a>
            <a href="/userGroupe" class="admin-link-card">
              <i class="bi bi-people"></i>
              <span>Groupes d'utilisateurs</span>
            </a>
            <a href="/phone" class="admin-link-card">
              <i class="bi bi-telephone"></i>
              <span>Téléphones</span>
            </a>
          </div>
        </section>
        
        <section class="dashboard-section">
          <h2>Campagnes</h2>
          <div class="admin-links">
            <a href="/compagnes" class="admin-link-card">
              <i class="bi bi-megaphone"></i>
              <span>Gestion des campagnes</span>
            </a>
            <a href="/liste" class="admin-link-card">
              <i class="bi bi-list-check"></i>
              <span>Listes d'appels</span>
            </a>
            <a href="/admin/conferences" class="admin-link-card">
              <i class="bi bi-people-fill"></i>
              <span>Conférences</span>
            </a>
          </div>
        </section>
        
        <section class="dashboard-section">
          <h2>Rapports</h2>
          <div class="admin-links">
            <a href="/stats" class="admin-link-card">
              <i class="bi bi-bar-chart"></i>
              <span>Statistiques</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard-container {
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .loading-container, .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(59, 130, 246, 0.2);
    border-radius: 50%;
    border-top-color: #3b82f6;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-icon {
    font-size: 3rem;
    color: #ef4444;
    margin-bottom: 1rem;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .welcome-section h1 {
    font-size: 1.8rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }
  
  .welcome-section p {
    color: #6b7280;
    font-size: 1.1rem;
  }
  
  .logout-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #f3f4f6;
    color: #4b5563;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .logout-button:hover {
    background-color: #e5e7eb;
    color: #1f2937;
  }
  
  .dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .stat-card {
    background-color: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background-color: #3b82f6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }
  
  .stat-info h3 {
    font-size: 1rem;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .dashboard-sections {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .dashboard-section {
    background-color: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .dashboard-section h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .admin-links {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .admin-link-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem 1rem;
    background-color: #f9fafb;
    border-radius: 0.5rem;
    color: #4b5563;
    text-decoration: none;
    transition: all 0.2s;
  }
  
  .admin-link-card:hover {
    background-color: #3b82f6;
    color: white;
    transform: translateY(-3px);
  }
  
  .admin-link-card i {
    font-size: 1.75rem;
    margin-bottom: 0.75rem;
  }
  
  .admin-link-card span {
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .actions-section {
      width: 100%;
    }
    
    .logout-button {
      width: 100%;
      justify-content: center;
    }
  }
</style>
