<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
  import { fade, fly } from 'svelte/transition';

  let users = [];
  let filteredUsers = [];
  let showAll = false;
  let isLoading = true;
  let searchQuery = '';
  let sortField = 'user';
  let sortDirection = 'asc';
  
  // Variables pour la notification
  let showNotification = false;
  let notificationType = 'success';
  let notificationMessage = '';

  // Fetch the list of users when the component mounts
  onMount(async () => {
    try {
      const response = await fetchWithAuth('http://localhost:8000/api/admin/user/allUsers');
      if (response.ok) {
        users = await response.json();
        applyFilters();
        
        // Vérifier s'il y a une notification dans localStorage
        checkForNotification();
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      isLoading = false;
    }
  });
  
  // Fonction pour vérifier et afficher les notifications stockées
  function checkForNotification() {
    const storedNotification = localStorage.getItem('userNotification');
    
    if (storedNotification) {
      try {
        const notification = JSON.parse(storedNotification);
        
        // Vérifier si la notification est récente (moins de 10 secondes)
        const currentTime = new Date().getTime();
        if (notification.timestamp && (currentTime - notification.timestamp < 10000)) {
          notificationType = notification.type || 'success';
          notificationMessage = notification.message || 'Opération réussie';
          showNotification = true;
          
          // Masquer la notification après 5 secondes
          setTimeout(() => {
            showNotification = false;
          }, 5000);
        }
        
        // Supprimer la notification du localStorage après l'avoir affichée
        localStorage.removeItem('userNotification');
      } catch (error) {
        console.error('Error parsing notification:', error);
        localStorage.removeItem('userNotification');
      }
    }
  };

  // Function to toggle between showing all users or just active ones
  function toggleShowAll() {
    showAll = !showAll;
    applyFilters();
  }

  // Function to navigate to the detail page with the userId as a query parameter
  function navigateToUserDetail(userId) {
    goto(`/users/detail?id=${userId}`);
  }

  // Function to apply filters and search
  function applyFilters() {
    filteredUsers = users.filter(user => {
      // Filter by active status if not showing all
      if (!showAll && user.active !== 'Y') {
        return false;
      }
      
      // Apply search filter if there's a query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          String(user.user || '').toLowerCase().includes(query) ||
          String(user.full_name || '').toLowerCase().includes(query) ||
          String(user.user_level || '').toLowerCase().includes(query) ||
          String(user.user_group || '').toLowerCase().includes(query) ||
          String(user.phone_login || '').toLowerCase().includes(query)
        );
      }
      
      return true;
    });
    
    // Apply sorting
    sortUsers();
  }

  // Function to handle search input
  function handleSearch() {
    applyFilters();
  }

  // Function to sort users
  function sortUsers() {
    filteredUsers = filteredUsers.sort((a, b) => {
      const fieldA = String(a[sortField] || '');
      const fieldB = String(b[sortField] || '');
      
      if (sortDirection === 'asc') {
        return fieldA.localeCompare(fieldB);
      } else {
        return fieldB.localeCompare(fieldA);
      }
    });
  }

  // Function to change sort field
  function setSortField(field) {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new field and reset direction to asc
      sortField = field;
      sortDirection = 'asc';
    }
    sortUsers();
  }

  // Get status badge class based on active status
  function getStatusBadgeClass(status) {
    return status === 'Y' ? 'badge-active' : 'badge-inactive';
  }

  // Get user level badge class - FIX: Ensure level is a string before calling toLowerCase()
  function getUserLevelBadgeClass(level) {
    // Convert to string first to avoid the "toLowerCase is not a function" error
    const levelStr = String(level || '').toLowerCase();
    
    switch(levelStr) {
      case 'admin':
        return 'badge-admin';
      case 'manager':
        return 'badge-manager';
      default:
        return 'badge-user';
    }
  }
</script>

<div class="page-container">
  {#if showNotification}
    <div class="notification-toast {notificationType}" transition:fly={{ y: -50, duration: 300 }}>
      <div class="notification-icon">
        {#if notificationType === 'success'}
          <i class="bi bi-check-circle-fill"></i>
        {:else if notificationType === 'error'}
          <i class="bi bi-exclamation-triangle-fill"></i>
        {:else}
          <i class="bi bi-info-circle-fill"></i>
        {/if}
      </div>
      <div class="notification-content">
        {notificationMessage}
      </div>
      <button class="notification-close" on:click={() => showNotification = false}>
        <i class="bi bi-x"></i>
      </button>
    </div>
  {/if}
  <div class="page-header">
    <h1>Gestion des Utilisateurs</h1>
    <p class="subtitle">Consultez et gérez tous les utilisateurs du système</p>
  </div>

  <div class="card">
    <div class="card-header">
      <div class="header-actions">
        <a href="/users/add" class="btn btn-primary">
          <span class="icon">+</span>
          Ajouter un utilisateur
        </a>
        
        <button class="btn btn-secondary" on:click={toggleShowAll}>
          {#if showAll}
            <span class="icon">👁️</span> Afficher utilisateurs actifs
          {:else}
            <span class="icon">👥</span> Afficher tous les utilisateurs
          {/if}
        </button>
      </div>
      
      <div class="search-container">
        <input 
          type="text" 
          bind:value={searchQuery} 
          on:input={handleSearch} 
          placeholder="Rechercher un utilisateur..." 
          class="search-input"
        />
        <button class="search-button" on:click={handleSearch}>
          <span class="icon">🔍</span>
        </button>
      </div>
    </div>

    <div class="card-body">
      {#if isLoading}
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Chargement des utilisateurs...</p>
        </div>
      {:else if filteredUsers.length === 0}
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <p>Aucun utilisateur trouvé</p>
          {#if searchQuery}
            <p class="empty-subtitle">Essayez de modifier vos critères de recherche</p>
            <button class="btn btn-secondary" on:click={() => { searchQuery = ''; applyFilters(); }}>
              Effacer la recherche
            </button>
          {:else if !showAll}
            <p class="empty-subtitle">Aucun utilisateur actif trouvé</p>
            <button class="btn btn-secondary" on:click={toggleShowAll}>
              Afficher tous les utilisateurs
            </button>
          {:else}
            <a href="/users/add" class="btn btn-primary">
              Ajouter un utilisateur
            </a>
          {/if}
        </div>
      {:else}
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sortable" on:click={() => setSortField('user')}>
                  Nom d'utilisateur
                  {#if sortField === 'user'}
                    <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </th>
                <th class="sortable" on:click={() => setSortField('full_name')}>
                  Nom complet
                  {#if sortField === 'full_name'}
                    <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </th>
                <th class="sortable" on:click={() => setSortField('user_level')}>
                  Niveau
                  {#if sortField === 'user_level'}
                    <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </th>
                <th class="sortable" on:click={() => setSortField('active')}>
                  Statut
                  {#if sortField === 'active'}
                    <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </th>
                <th class="sortable" on:click={() => setSortField('user_group')}>
                  Groupe
                  {#if sortField === 'user_group'}
                    <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </th>
                <th>Téléphone</th>
                <th>Mot de passe</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredUsers as user}
                <tr class={user.active === 'Y' ? '' : 'inactive-row'}>
                  <td>
                    <a href="javascript:void(0)" class="user-link" on:click={() => navigateToUserDetail(user.user_id)}>
                      {user.user || '-'}
                    </a>
                  </td>
                  <td>{user.full_name || '-'}</td>
                  <td>
                    <span class={`badge ${getUserLevelBadgeClass(user.user_level)}`}>
                      {user.user_level || 'Standard'}
                    </span>
                  </td>
                  <td>
                    <span class={`badge ${getStatusBadgeClass(user.active)}`}>
                      {user.active === 'Y' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>{user.user_group || '-'}</td>
                  <td>{user.phone_login || '-'}</td>
                  <td>
                    <span class="password-mask">••••••••</span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        
        <div class="table-footer">
          <p class="results-count">
            Affichage de <strong>{filteredUsers.length}</strong> utilisateur{filteredUsers.length !== 1 ? 's' : ''}
            {#if !showAll}
              (actifs uniquement)
            {/if}
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Base Styles */
  :global(body) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f5f7fa;
    color: #333;
    line-height: 1.5;
  }

  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  /* Header Styles */
  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #2563eb;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #64748b;
    margin-top: 0;
  }

  /* Card Styles */
  .card {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    margin-bottom: 2rem;
    overflow: hidden;
  }

  .card-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .card-body {
    padding: 0;
  }

  /* Button Styles */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-size: 0.875rem;
    text-decoration: none;
    gap: 0.5rem;
  }

  .btn-primary {
    background-color: #2563eb;
    color: white;
  }

  .btn-primary:hover {
    background-color: #1d4ed8;
  }

  .btn-secondary {
    background-color: #f3f4f6;
    color: #4b5563;
  }

  .btn-secondary:hover {
    background-color: #e5e7eb;
  }

  .icon {
    display: inline-block;
    font-size: 1rem;
  }

  /* Search Styles */
  .search-container {
    display: flex;
    align-items: center;
    background-color: #f9fafb;
    border-radius: 0.375rem;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    width: 300px;
  }

  .search-input {
    flex: 1;
    border: none;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    outline: none;
    background-color: transparent;
  }

  .search-button {
    background-color: transparent;
    border: none;
    padding: 0.625rem;
    cursor: pointer;
    transition: background-color 0.2s;
    color: #6b7280;
  }

  .search-button:hover {
    background-color: #e5e7eb;
  }

  /* Table Styles */
  .table-responsive {
    overflow-x: auto;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th,
  .data-table td {
    padding: 1rem 1.5rem;
    text-align: left;
  }

  .data-table th {
    background-color: #f8fafc;
    font-weight: 600;
    color: #64748b;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .sortable {
    cursor: pointer;
    user-select: none;
    position: relative;
  }

  .sortable:hover {
    background-color: #f1f5f9;
  }

  .sort-icon {
    margin-left: 0.5rem;
    display: inline-block;
    color: #2563eb;
  }

  .data-table tr {
    border-bottom: 1px solid #e5e7eb;
    transition: background-color 0.2s;
  }

  .data-table tr:last-child {
    border-bottom: none;
  }

  .data-table tr:hover {
    background-color: #f8fafc;
  }

  .inactive-row {
    background-color: #f8fafc;
  }

  .inactive-row:hover {
    background-color: #f1f5f9;
  }

  /* Badge Styles */
  .badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-align: center;
  }

  .badge-active {
    background-color: #dcfce7;
    color: #15803d;
  }

  .badge-inactive {
    background-color: #f3f4f6;
    color: #6b7280;
  }

  .badge-admin {
    background-color: #fef3c7;
    color: #b45309;
  }

  .badge-manager {
    background-color: #e0e7ff;
    color: #4338ca;
  }

  .badge-user {
    background-color: #dbeafe;
    color: #1d4ed8;
  }

  /* User Link */
  .user-link {
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }

  .user-link:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }

  /* Password Mask */
  .password-mask {
    color: #6b7280;
    letter-spacing: 1px;
  }

  /* Table Footer */
  .table-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .results-count {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;
  }

  /* Loading State */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e0e7ff;
    border-top: 4px solid #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #cbd5e1;
  }

  .empty-state p {
    color: #64748b;
    margin-bottom: 0.5rem;
    font-size: 1.125rem;
  }

  .empty-subtitle {
    color: #94a3b8;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
  }

    /* Notification Toast */
  .notification-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    align-items: center;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 400px;
    background-color: white;
    border-left: 4px solid;
  }
  
  .notification-toast.success {
    border-left-color: #10b981;
  }
  
  .notification-toast.error {
    border-left-color: #ef4444;
  }
  
  .notification-toast.info {
    border-left-color: #3b82f6;
  }
  
  .notification-icon {
    margin-right: 0.75rem;
    font-size: 1.25rem;
  }
  
  .notification-toast.success .notification-icon {
    color: #10b981;
  }
  
  .notification-toast.error .notification-icon {
    color: #ef4444;
  }
  
  .notification-toast.info .notification-icon {
    color: #3b82f6;
  }
  
  .notification-content {
    flex: 1;
    font-size: 0.875rem;
  }
  
  .notification-close {
    background: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.25rem;
    margin-left: 0.5rem;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }
  
  .notification-close:hover {
    background-color: #f3f4f6;
    color: #4b5563;
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .page-container {
      padding: 1rem;
    }

    .card-header {
      flex-direction: column;
      align-items: stretch;
    }

    .search-container {
      width: 100%;
    }

    .header-actions {
      flex-direction: column;
      width: 100%;
    }
    
    .notification-toast {
      left: 20px;
      right: 20px;
      max-width: calc(100% - 40px);
    }

    .btn {
      width: 100%;
    }

    .data-table th,
    .data-table td {
      padding: 0.75rem;
    }
  }
</style>