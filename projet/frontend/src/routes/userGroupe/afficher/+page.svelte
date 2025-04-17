<script>
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { goto } from '$app/navigation';
  
    // Add Font Awesome
    let fontAwesomeLoaded = false;
  
    function loadFontAwesome() {
      if (fontAwesomeLoaded) return;
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
      link.integrity = 'sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      
      fontAwesomeLoaded = true;
    }
  
    // Data state
    let userGroups = [];
    let filteredGroups = [];
    let isLoading = true;
    let error = null;
  
    // UI state
    let searchQuery = '';
    let sortField = 'user_group';
    let sortDirection = 'asc';
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalPages = 1;
  
    // Fetch user groups from API
    async function fetchUserGroups() {
      try {
        isLoading = true;
        const response = await fetchWithAuth('http://localhost:8000/api/admin/usergroup/getUsersGroups');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        userGroups = Array.isArray(data) ? data : [];
        applyFilters();
      } catch (err) {
        console.error('Erreur lors de la récupération des groupes:', err);
        error = err.message;
      } finally {
        isLoading = false;
      }
    }
  
    // Apply filters, sorting and update pagination
    function applyFilters() {
      // Filter by search query
      if (searchQuery.trim() === '') {
        filteredGroups = [...userGroups];
      } else {
        const query = searchQuery.toLowerCase();
        filteredGroups = userGroups.filter(group => 
          group.user_group?.toLowerCase().includes(query) || 
          group.group_name?.toLowerCase().includes(query)
        );
      }
      
      // Apply sorting
      sortGroups();
      
      // Update pagination
      totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
      if (currentPage > totalPages) {
        currentPage = Math.max(1, totalPages);
      }
    }
  
    // Sort groups
    function sortGroups() {
      filteredGroups.sort((a, b) => {
        let aValue = a[sortField] || '';
        let bValue = b[sortField] || '';
        
        // Handle string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (sortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        }
        
        // Handle numeric comparison
        if (sortDirection === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }
  
    // Handle sort click
    function handleSort(field) {
      if (sortField === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortField = field;
        sortDirection = 'asc';
      }
      sortGroups();
    }
  
    // Get paginated groups
    function getPaginatedGroups() {
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredGroups.slice(start, end);
    }
  
    // Pagination functions
    function goToPage(page) {
      if (page >= 1 && page <= totalPages) {
        currentPage = page;
      }
    }
  
    // View group details
    function viewGroupDetails(groupId) {
      goto(`/userGroupe/details?id=${groupId}`);
    }
  
    // Format text fields that might be NULL or empty
    function formatField(value) {
      if (value === null || value === undefined || value === '') {
        return '-';
      }
      return value;
    }
  
    // Initialize component
    onMount(() => {
      loadFontAwesome();
      fetchUserGroups();
    });
  </script>
  
  <div class="page-container">
    <header class="header">
      <div class="header-content">
        <h1 class="header-title">
          <i class="fas fa-users-cog"></i> Gestion des Groupes d'Utilisateurs
        </h1>
        <div class="header-actions">
          <button class="btn btn-success" on:click={() => goto('/userGroupe/ajouter')}>
            <i class="fas fa-plus-circle"></i> Ajouter un groupe
          </button>
          <button class="btn btn-primary" on:click={() => fetchUserGroups()}>
            <i class="fas fa-sync-alt"></i> Actualiser
          </button>
        </div>
      </div>
    </header>
  
    {#if error}
      <div class="error-message" role="alert" transition:slide={{ duration: 300 }}>
        <i class="fas fa-exclamation-circle"></i> {error}
        <button type="button" class="error-close" on:click={() => error = null}>
          <i class="fas fa-times"></i>
        </button>
      </div>
    {/if}
  
    <div class="search-section">
      <div class="search-form">
        <div class="search-input-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input 
            type="text" 
            class="search-input" 
            bind:value={searchQuery} 
            placeholder="Rechercher par ID ou nom de groupe..." 
            aria-label="Search" 
            on:input={() => {
              currentPage = 1;
              applyFilters();
            }}
          />
          {#if searchQuery}
            <button class="search-clear" on:click={() => { 
              searchQuery = ''; 
              currentPage = 1;
              applyFilters();
            }}>
              <i class="fas fa-times"></i>
            </button>
          {/if}
        </div>
      </div>
    </div>
  
    <main class="main-content">
      {#if isLoading}
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Chargement des groupes d'utilisateurs...</p>
        </div>
      {:else if userGroups.length === 0}
        <div class="empty-state">
          <i class="fas fa-users-slash empty-icon"></i>
          <h3>Aucun groupe d'utilisateurs trouvé</h3>
          <p>Il n'y a aucun groupe d'utilisateurs disponible ou une erreur s'est produite lors de la récupération des données.</p>
          <div class="empty-state-actions">
            <button class="btn btn-success" on:click={() => goto('/userGroupe/ajouter')}>
              <i class="fas fa-plus-circle"></i> Ajouter un groupe
            </button>
            <button class="btn btn-primary" on:click={() => fetchUserGroups()}>
              <i class="fas fa-sync-alt"></i> Réessayer
            </button>
          </div>
        </div>
      {:else}
        <div class="table-container" transition:fade={{ duration: 200 }}>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="sortable" on:click={() => handleSort('user_group')}>
                    ID Groupe
                    {#if sortField === 'user_group'}
                      <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                    {/if}
                  </th>
                  <th class="sortable" on:click={() => handleSort('group_name')}>
                    Nom du Groupe
                    {#if sortField === 'group_name'}
                      <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                    {/if}
                  </th>
                  <th>Campagnes Autorisées</th>
                  <th>Connexion Forcée</th>
                  <th>Rapports Autorisés</th>
                  <th class="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each getPaginatedGroups() as group (group.user_group)}
                  <tr class="data-row" transition:slide|local={{ duration: 300 }}>
                    <td class="group-id">{formatField(group.user_group)}</td>
                    <td class="group-name">{formatField(group.group_name)}</td>
                    <td class="truncate-text" title={formatField(group.allowed_campaigns)}>
                      {formatField(group.allowed_campaigns)}
                    </td>
                    <td class="text-center">
                      {#if group.forced_timeclock_login === 'Y'}
                        <span class="badge badge-success">Oui</span>
                      {:else if group.forced_timeclock_login === 'N'}
                        <span class="badge badge-danger">Non</span>
                      {:else if group.forced_timeclock_login === 'ADMIN_EXEMPT'}
                        <span class="badge badge-warning">Admin Exempt</span>
                      {:else}
                        <span class="badge badge-secondary">-</span>
                      {/if}
                    </td>
                    <td class="truncate-text" title={formatField(group.allowed_reports)}>
                      {formatField(group.allowed_reports)}
                    </td>
                    <td class="actions-cell">
                      <button class="btn btn-icon btn-info" title="Voir les détails" on:click={() => viewGroupDetails(group.user_group)}>
                        <i class="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          
          <!-- Pagination -->
          {#if totalPages > 1}
            <div class="pagination">
              <button 
                class="pagination-button" 
                disabled={currentPage === 1}
                on:click={() => goToPage(1)}
              >
                <i class="fas fa-angle-double-left"></i>
              </button>
              <button 
                class="pagination-button" 
                disabled={currentPage === 1}
                on:click={() => goToPage(currentPage - 1)}
              >
                <i class="fas fa-angle-left"></i>
              </button>
              
              {#each Array(totalPages) as _, i}
                {#if i + 1 === currentPage || i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)}
                  <button 
                    class="pagination-button {currentPage === i + 1 ? 'active' : ''}"
                    on:click={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                {:else if i + 1 === currentPage - 2 || i + 1 === currentPage + 2}
                  <span class="pagination-ellipsis">...</span>
                {/if}
              {/each}
              
              <button 
                class="pagination-button" 
                disabled={currentPage === totalPages}
                on:click={() => goToPage(currentPage + 1)}
              >
                <i class="fas fa-angle-right"></i>
              </button>
              <button 
                class="pagination-button" 
                disabled={currentPage === totalPages}
                on:click={() => goToPage(totalPages)}
              >
                <i class="fas fa-angle-double-right"></i>
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </main>
  </div>
  
  <style>
    /* Base styles */
    :global(body) {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fa;
      color: #333;
      line-height: 1.6;
    }
  
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      position: relative;
    }
  
    /* Header styles */
    .header {
      margin-bottom: 2rem;
    }
  
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e9ecef;
    }
  
    .header-title {
      font-size: 2rem;
      font-weight: 600;
      color: #2563eb;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  
    .header-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
  
    /* Button styles */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      font-size: 0.875rem;
    }
  
    .btn-icon {
      width: 2rem;
      height: 2rem;
      padding: 0;
      border-radius: 0.375rem;
    }
  
    .btn-primary {
      background-color: #2563eb;
      color: white;
    }
  
    .btn-primary:hover {
      background-color: #1d4ed8;
      transform: translateY(-1px);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
  
    .btn-success {
      background-color: #10b981;
      color: white;
    }
  
    .btn-success:hover {
      background-color: #059669;
      transform: translateY(-1px);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
  
    .btn-info {
      background-color: #3b82f6;
      color: white;
    }
  
    .btn-info:hover {
      background-color: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
  
    /* Search section */
    .search-section {
      background-color: white;
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  
    .search-form {
      display: flex;
      gap: 0.75rem;
    }
  
    .search-input-wrapper {
      position: relative;
      flex-grow: 1;
    }
  
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
    }
  
    .search-input {
      width: 100%;
      padding: 0.625rem 2.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
  
    .search-input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  
    .search-clear {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
  
    .search-clear:hover {
      color: #4b5563;
    }
  
    /* Table styles */
    .table-container {
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
  
    .table-responsive {
      overflow-x: auto;
    }
  
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
  
    .data-table th,
    .data-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
  
    .data-table th {
      background-color: #f9fafb;
      font-weight: 600;
      color: #4b5563;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }
  
    .data-table th.sortable {
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s;
    }
  
    .data-table th.sortable:hover {
      background-color: #f3f4f6;
    }
  
    .data-row {
      transition: all 0.2s;
    }
  
    .data-row:hover {
      background-color: #f9fafb;
    }
  
    .group-id {
      font-family: monospace;
      font-weight: 600;
      color: #4b5563;
    }
  
    .group-name {
      font-weight: 500;
      color: #1f2937;
    }
  
    .truncate-text {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  
    .text-center {
      text-align: center;
    }
  
    .actions-column {
      width: 80px;
      text-align: center;
    }
  
    .actions-cell {
      text-align: center;
    }
  
    /* Badge styles */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
  
    .badge-success {
      background-color: #d1fae5;
      color: #065f46;
    }
  
    .badge-danger {
      background-color: #fee2e2;
      color: #b91c1c;
    }
  
    .badge-warning {
      background-color: #fef3c7;
      color: #92400e;
    }
  
    .badge-secondary {
      background-color: #f3f4f6;
      color: #4b5563;
    }
  
    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  
    .empty-icon {
      font-size: 3rem;
      color: #d1d5db;
      margin-bottom: 1rem;
    }
  
    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #4b5563;
      margin-bottom: 0.5rem;
    }
  
    .empty-state p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }
    
    .empty-state-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }
  
    /* Loading spinner */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(37, 99, 235, 0.2);
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
  
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  
    /* Error message */
    .error-message {
      padding: 1rem;
      border-radius: 0.375rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      position: relative;
      background-color: #fee2e2;
      color: #b91c1c;
      border-left: 4px solid #ef4444;
    }
  
    .error-close {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: currentColor;
      font-size: 1.25rem;
      cursor: pointer;
      opacity: 0.7;
    }
  
    .error-close:hover {
      opacity: 1;
    }
  
    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.25rem;
      margin-top: 1.5rem;
      flex-wrap: wrap;
      padding: 1rem;
    }
  
    .pagination-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      height: 2rem;
      padding: 0 0.5rem;
      border-radius: 0.375rem;
      background-color: white;
      border: 1px solid #e5e7eb;
      color: #4b5563;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }
  
    .pagination-button:hover:not(:disabled) {
      background-color: #f3f4f6;
      border-color: #d1d5db;
      color: #1f2937;
    }
  
    .pagination-button.active {
      background-color: #2563eb;
      border-color: #2563eb;
      color: white;
    }
  
    .pagination-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  
    .pagination-ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      height: 2rem;
      color: #6b7280;
    }
  
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .search-form {
        flex-direction: column;
      }
      
      .page-container {
        padding: 1rem;
      }
    }
    
    @media (max-width: 480px) {
      .data-table th,
      .data-table td {
        padding: 0.75rem 0.5rem;
        font-size: 0.875rem;
      }
      
      .truncate-text {
        max-width: 120px;
      }
    }
  </style>