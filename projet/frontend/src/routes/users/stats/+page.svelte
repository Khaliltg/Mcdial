<script>
  import axios from 'axios';
  import { goto } from '$app/navigation';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  // State variables
  let startDate = '';
  let endDate = '';
  let status = '';
  let user = '';
  let stats = [];
  let error = '';
  let loading = false;
  let currentPage = 1;
  let itemsPerPage = 10; // Increased from 5 to 10
  let totalItems = 0;
  let sortField = 'entry_date';
  let sortDirection = 'desc';
  let showFilters = true;
  let totalPages = 0;
  let sortedStats = [];
  let paginatedStats = [];

  // Reactive declarations
  $: totalPages = Math.ceil(totalItems / itemsPerPage);
  
  $: sortedStats = [...stats].sort((a, b) => {
    if (sortField === 'entry_date') {
      return sortDirection === 'asc' 
        ? new Date(a.entry_date) - new Date(b.entry_date)
        : new Date(b.entry_date) - new Date(a.entry_date);
    } else if (sortField === 'talk_sec') {
      return sortDirection === 'asc' 
        ? a.talk_sec - b.talk_sec
        : b.talk_sec - a.talk_sec;
    } else {
      return sortDirection === 'asc'
        ? String(a[sortField]).localeCompare(String(b[sortField]))
        : String(b[sortField]).localeCompare(String(a[sortField]));
    }
  });
  
  $: paginatedStats = sortedStats.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // Set default dates if empty
  function setDefaultDates() {
    if (!startDate) {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      startDate = start.toISOString().slice(0, 16);
    }
    
    if (!endDate) {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      endDate = end.toISOString().slice(0, 16);
    }
  }

  // Fetch data
  async function handleSubmit() {
    setDefaultDates();
    
    const requestBody = {
      user,
      startDate,
      endDate,
      status
    };

    loading = true;
    error = '';

    try {
      const response = await axios.post('http://localhost:8000/api/admin/user/userStats', requestBody);
      stats = response.data || [];
      totalItems = stats.length;
      currentPage = 1; // Reset to page 1 when new data is fetched
    } catch (err) {
      console.error('Axios error:', err);
      error = err.response?.data?.message || 'Failed to fetch stats. Please try again.';
      stats = [];
    } finally {
      loading = false;
    }
  }

  // Navigation functions
  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function getPaginationPages() {
    const pages = [];
    if (totalPages <= 1) return pages;

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  }

  // Sorting function
  function sortBy(field) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
  }

  // Format date for display
  function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  // Format duration in seconds to mm:ss
  function formatDuration(seconds) {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Toggle filters visibility
  function toggleFilters() {
    showFilters = !showFilters;
  }

  // Export to CSV
  function exportToCSV() {
    if (stats.length === 0) return;
    
    const headers = [
      'ID', 'LEAD_ID', 'PHONE', 'CAMPAIGN', 'CALL DATE', 
      'STATUS', 'USER', 'LIST_ID', 'LENGTH'
    ];
    
    const csvContent = [
      headers.join(','),
      ...stats.map((stat, index) => [
        index + 1,
        stat.lead_id,
        stat.phone_number,
        stat.campaign_id,
        new Date(stat.entry_date).toLocaleString(),
        stat.status,
        stat.user,
        stat.list_id,
        stat.talk_sec
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `user_stats_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<div class="stats-container">
  <div class="card">
    <div class="card-header">
      <h2>Statistiques des utilisateurs</h2>
      <div class="header-actions">
        <button class="btn-icon" on:click={toggleFilters} title="Toggle Filters">
          <i class="filter-icon">{showFilters ? '▲' : '▼'}</i>
          {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
        </button>
        {#if stats.length > 0}
          <button class="btn-secondary" on:click={exportToCSV}>
            <i class="export-icon">↓</i> Exporter CSV
          </button>
        {/if}
      </div>
    </div>

    {#if showFilters}
      <div class="filter-section" transition:fly={{ y: -20, duration: 300, easing: quintOut }}>
        <div class="form-grid">
          <div class="form-group">
            <label for="startDate">Date de début</label>
            <input 
              type="datetime-local" 
              id="startDate"
              bind:value={startDate} 
              placeholder="Date de début" 
              step="1" 
            />
          </div>
          
          <div class="form-group">
            <label for="endDate">Date de fin</label>
            <input 
              type="datetime-local" 
              id="endDate"
              bind:value={endDate} 
              placeholder="Date de fin" 
              step="1" 
            />
          </div>
          
          <div class="form-group">
            <label for="status">Statut</label>
            <input 
              type="text" 
              id="status"
              bind:value={status} 
              placeholder="Statut" 
            />
          </div>
          
          <div class="form-group">
            <label for="user">Utilisateur</label>
            <input 
              type="text" 
              id="user"
              bind:value={user} 
              placeholder="Utilisateur" 
            />
          </div>
          
          <div class="form-group submit-group">
            <button 
              on:click={handleSubmit} 
              class="btn-primary" 
              disabled={loading}
            >
              {#if loading}
                <span class="loader"></span> Chargement...
              {:else}
                Rechercher
              {/if}
            </button>
          </div>
        </div>
      </div>
    {/if}

    {#if error}
      <div class="error-message" transition:fade={{ duration: 200 }}>
        <i class="error-icon">⚠️</i> {error}
      </div>
    {/if}

    {#if loading && !paginatedStats.length}
      <div class="loading-container" transition:fade={{ duration: 200 }}>
        <div class="loader"></div>
        <p>Chargement des données...</p>
      </div>
    {:else if paginatedStats.length > 0}
      <div class="results-info" transition:fade={{ duration: 200 }}>
        <p>Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} résultats</p>
        <div class="page-size">
          <label for="itemsPerPage">Résultats par page:</label>
          <select id="itemsPerPage" bind:value={itemsPerPage}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div class="table-responsive" transition:fade={{ duration: 200 }}>
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th class="sortable" on:click={() => sortBy('lead_id')}>
                LEAD ID
                {#if sortField === 'lead_id'}
                  <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th class="sortable" on:click={() => sortBy('phone_number')}>
                TÉLÉPHONE
                {#if sortField === 'phone_number'}
                  <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th class="sortable" on:click={() => sortBy('campaign_id')}>
                CAMPAGNE
                {#if sortField === 'campaign_id'}
                  <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th class="sortable" on:click={() => sortBy('entry_date')}>
                DATE D'APPEL
                {#if sortField === 'entry_date'}
                  <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th class="sortable" on:click={() => sortBy('status')}>
                STATUT
                {#if sortField === 'status'}
                  <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th class="sortable" on:click={() => sortBy('user')}>
                UTILISATEUR
                {#if sortField === 'user'}
                  <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th class="sortable" on:click={() => sortBy('list_id')}>
                LIST ID
                {#if sortField === 'list_id'}
                  <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
              <th class="sortable" on:click={() => sortBy('talk_sec')}>
                DURÉE
                {#if sortField === 'talk_sec'}
                  <span class="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </th>
            </tr>
          </thead>
          <tbody>
            {#each paginatedStats as stat, index (stat.lead_id + '-' + index)}
              <tr transition:fade={{ duration: 150 }}>
                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td>{stat.lead_id}</td>
                <td class="phone-cell">{stat.phone_number}</td>
                <td>{stat.campaign_id}</td>
                <td>{formatDate(stat.entry_date)}</td>
                <td>
                  <span class="status-badge" class:status-success={stat.status === 'SUCCESS'} class:status-failed={stat.status === 'FAILED'}>
                    {stat.status}
                  </span>
                </td>
                <td>{stat.user}</td>
                <td>
                  <button 
                    class="list-link" 
                    on:click={() => goto(`/liste/fileliste/${stat.list_id}`)}
                    title="Voir les détails de la liste"
                  >
                    {stat.list_id}
                  </button>
                </td>
                <td>{formatDuration(stat.talk_sec)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if totalPages > 1}
        <div class="pagination-container" transition:fade={{ duration: 200 }}>
          <div class="pagination">
            <button 
              class="page-btn" 
              on:click={() => goToPage(1)} 
              disabled={currentPage === 1}
              title="Première page"
            >
              «
            </button>
            
            <button 
              class="page-btn" 
              on:click={() => goToPage(currentPage - 1)} 
              disabled={currentPage === 1}
              title="Page précédente"
            >
              ‹
            </button>
            
            {#each getPaginationPages() as page}
              {#if page === '...'}
                <span class="page-ellipsis">…</span>
              {:else}
                <button 
                  class="page-btn" 
                  class:active={currentPage === page}
                  on:click={() => goToPage(page)}
                >
                  {page}
                </button>
              {/if}
            {/each}
            
            <button 
              class="page-btn" 
              on:click={() => goToPage(currentPage + 1)} 
              disabled={currentPage === totalPages}
              title="Page suivante"
            >
              ›
            </button>
            
            <button 
              class="page-btn" 
              on:click={() => goToPage(totalPages)} 
              disabled={currentPage === totalPages}
              title="Dernière page"
            >
              »
            </button>
          </div>
          
          <div class="page-jump">
            <span>Aller à la page:</span>
            <input 
              type="number" 
              min="1" 
              max={totalPages} 
              bind:value={currentPage}
              on:change={() => {
                if (currentPage < 1) currentPage = 1;
                if (currentPage > totalPages) currentPage = totalPages;
              }}
            />
            <span>sur {totalPages}</span>
          </div>
        </div>
      {/if}
    {:else if !loading && !error}
      <div class="empty-state" transition:fade={{ duration: 200 }}>
        <div class="empty-icon">📊</div>
        <h3>Aucune donnée trouvée</h3>
        <p>Ajustez vos filtres ou essayez une autre recherche.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Variables */
  :root {
    --primary-color: #4361ee;
    --primary-hover: #3a56d4;
    --secondary-color: #4cc9f0;
    --success-color: #4ade80;
    --danger-color: #f87171;
    --warning-color: #fbbf24;
    --text-color: #1e293b;
    --text-light: #64748b;
    --bg-color: #f8fafc;
    --card-bg: #ffffff;
    --border-color: #e2e8f0;
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --transition: all 0.2s ease;
  }

  /* Global Styles */
  .stats-container {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: var(--text-color);
    background-color: var(--bg-color);
    padding: 1.5rem;
    min-height: 100vh;
  }

  /* Card Styles */
  .card {
    background-color: var(--card-bg);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    margin-bottom: 2rem;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    background-color: #f8fafc;
  }

  .card-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary-color);
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  /* Filter Section */
  .filter-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    background-color: #f1f5f9;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-light);
  }

  input[type="text"],
  input[type="datetime-local"],
  input[type="number"],
  select {
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    transition: var(--transition);
    background-color: white;
  }

  input[type="text"]:focus,
  input[type="datetime-local"]:focus,
  input[type="number"]:focus,
  select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
  }

  .submit-group {
    display: flex;
    align-items: flex-end;
  }

  /* Buttons */
  button {
    cursor: pointer;
    font-weight: 500;
    transition: var(--transition);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: none;
    font-size: 0.875rem;
  }

  .btn-primary {
    background-color: var(--primary-color);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-md);
    width: 100%;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: var(--primary-hover);
    transform: translateY(-1px);
  }

  .btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn-secondary {
    background-color: white;
    color: var(--text-color);
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover {
    background-color: #f1f5f9;
  }

  .btn-icon {
    background-color: transparent;
    color: var(--text-light);
    padding: 0.5rem;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
  }

  .btn-icon:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .filter-icon, .export-icon {
    font-size: 0.75rem;
    margin-right: 0.25rem;
  }

  /* Error Message */
  .error-message {
    background-color: #fef2f2;
    color: #b91c1c;
    padding: 1rem;
    margin: 1rem 1.5rem;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .error-icon {
    font-size: 1.25rem;
  }

  /* Loading */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 0;
    color: var(--text-light);
  }

  .loader {
    width: 2rem;
    height: 2rem;
    border: 3px solid #f3f3f3;
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Results Info */
  .results-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    color: var(--text-light);
    font-size: 0.875rem;
    border-bottom: 1px solid var(--border-color);
  }

  .page-size {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .page-size select {
    padding: 0.25rem 0.5rem;
  }

  /* Table Styles */
  .table-responsive {
    overflow-x: auto;
    padding: 0 1.5rem;
  }

  .data-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 1rem 0;
  }

  .data-table th, .data-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  .data-table th {
    background-color: #f8fafc;
    font-weight: 600;
    color: var(--text-light);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .data-table tbody tr:hover {
    background-color: #f1f5f9;
  }

  .sortable {
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
  }

  .sortable:hover {
    color: var(--primary-color);
  }

  .sort-icon {
    display: inline-block;
    margin-left: 0.25rem;
  }

  .phone-cell {
    font-family: monospace;
  }

  /* Status Badge */
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    background-color: #e2e8f0;
    color: var(--text-color);
  }

  .status-success {
    background-color: #dcfce7;
    color: #166534;
  }

  .status-failed {
    background-color: #fee2e2;
    color: #b91c1c;
  }

  /* List Link */
  .list-link {
    color: var(--primary-color);
    background: none;
    border: none;
    padding: 0;
    font-weight: 500;
    text-decoration: underline;
    cursor: pointer;
  }

  .list-link:hover {
    color: var(--primary-hover);
  }

  /* Pagination */
  .pagination-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid var(--border-color);
  }

  .pagination {
    display: flex;
    gap: 0.25rem;
  }

  .page-btn {
    min-width: 2.5rem;
    height: 2.5rem;
    padding: 0 0.5rem;
    border-radius: var(--radius-md);
    background-color: white;
    color: var(--text-color);
    border: 1px solid var(--border-color);
  }

  .page-btn:hover:not(:disabled) {
    background-color: #f1f5f9;
  }

  .page-btn.active {
    background-color: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }

  .page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-ellipsis {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2.5rem;
    height: 2.5rem;
    color: var(--text-light);
  }

  .page-jump {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-light);
  }

  .page-jump input {
    width: 3rem;
    padding: 0.25rem 0.5rem;
    text-align: center;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--text-light);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    font-weight: 600;
  }

  .empty-state p {
    margin: 0;
    max-width: 24rem;
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .stats-container {
      padding: 1rem;
    }

    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .header-actions {
      width: 100%;
      justify-content: space-between;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .results-info {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .pagination-container {
      flex-direction: column;
      gap: 1rem;
    }

    .data-table {
      font-size: 0.875rem;
    }

    .data-table th, .data-table td {
      padding: 0.75rem 0.5rem;
    }
  }

  @media (max-width: 480px) {
    .card-header h2 {
      font-size: 1.25rem;
    }

    .pagination {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
</style>