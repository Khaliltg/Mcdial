<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  /**
   * @type {any[]}
   */
  let compagnies = [];
  let showAll = false;
  let searchTerm = '';
  let isLoading = true;

  onMount(async () => {
    try {
      // Get token from localStorage
const token = localStorage.getItem('token');
console.log('Token from localStorage:', token); // Debug log

// Send request with credentials and Authorization header
const response = await fetchWithAuth('http://localhost:8000/api/admin/compagnies/recuperer');
      if (response.ok) {
        const data = await response.json();
        compagnies = Array.isArray(data) ? data : [];
      } else {
        console.error('Failed to retrieve companies');
      }
    } catch (error) {
      console.error('Error retrieving companies:', error);
    } finally {
      isLoading = false;
    }
  });

  function toggleShowAll() {
    showAll = !showAll;
  }

  /**
   * @param {any} id
   */
  function copyCompany(id) {
    goto(`/compagnes/copy/${id}`);
  }

  $: filteredCompanies = Array.isArray(compagnies) ? compagnies.filter(company => 
    (showAll || company.active === 'Y') && 
    (company.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     company.campaign_id?.toString().includes(searchTerm))
  ) : [];
</script>

<!-- Navbar -->
<nav class="navbar">
  <div class="container">
    <div class="navbar-content">
      <div class="navbar-brand">Company Management</div>
      <div class="navbar-links">
        <a href="/compagnes/add" class="navbar-link">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Company
        </a>
        <button class="navbar-link" on:click={()=>goto('/compagnes/copy')}>
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
          Copy Company
        </button>
      </div>
    </div>
  </div>
</nav>

<div class="page-container">
  <div class="container">
    <div class="page-header">
      <h1>Companies</h1>
      <p class="subtitle">Manage your company listings</p>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="search-container">
          <input 
            type="text" 
            bind:value={searchTerm}
            placeholder="Search companies..." 
            class="search-input"
          />
          <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div class="button-group">
          <a href="/compagnes/add" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Company
          </a>
          
          <button 
            on:click={toggleShowAll} 
            class="btn btn-secondary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {#if showAll}
              Show Active Companies
            {:else}
              Show All Companies
            {/if}
          </button>
        </div>
      </div>
      
      <div class="table-responsive">
        {#if isLoading}
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading companies...</p>
          </div>
        {:else if filteredCompanies.length > 0}
          <table class="table">
            <thead>
              <tr>
                <th>Company ID</th>
                <th>Company Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredCompanies as company}
                <tr>
                  <td>
                    <a href="/compagnes/detail/{company.campaign_id}" class="company-link">
                      {company.campaign_id}
                    </a>
                  </td>
                  <td>
                    <div class="company-name">{company.campaign_name}</div>
                  </td>
                  <td>
                    <span class={`badge ${company.active === 'Y' ? 'badge-success' : 'badge-danger'}`}>
                      {company.active === 'Y' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <a href="/compagnes/detail/{company.campaign_id}" class="action-button view-button">
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      <button on:click={() => copyCompany(company.campaign_id)} class="action-button copy-button">
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else}
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="empty-title">No companies found</p>
            <p class="empty-subtitle">Try adjusting your search or filter criteria</p>
          </div>
        {/if}
      </div>
      
      {#if filteredCompanies.length > 0}
        <div class="card-footer">
          <p class="results-count">
            Showing <span class="count-highlight">{filteredCompanies.length}</span> {filteredCompanies.length === 1 ? 'company' : 'companies'}
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Base styles */
  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  /* Navbar styles */
  .navbar {
    border-bottom: 1px solid #e5e7eb;
    color: #111827;
  }

  .navbar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    flex-wrap: wrap;
  }

  .navbar-brand {
    font-size: 1.25rem;
    font-weight: bold;
  }

  .navbar-links {
    display: flex;
    gap: 1rem;
  }

  .navbar-link {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border-radius: 0.25rem;
    color: #4b5563;
    text-decoration: none;
    transition: background-color 0.2s, color 0.2s;
  }

  .navbar-link:hover {
    background-color: #f3f4f6;
    color: #111827;
  }

  /* Page container */
  .page-container {
    background-color: #f9fafb;
    min-height: calc(100vh - 65px);
    padding: 1.5rem 0;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .page-header h1 {
    font-size: 1.875rem;
    font-weight: bold;
    color: #111827;
    margin: 0;
    margin-bottom: 0.25rem;
  }

  .subtitle {
    color: #6b7280;
    margin: 0;
  }

  /* Card styles */
  .card {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .card-header {
    padding: 1rem;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .card-footer {
    padding: 1rem 1.5rem;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }

  /* Search input */
  .search-container {
    position: relative;
    width: 100%;
    max-width: 16rem;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.25rem;
    height: 1.25rem;
    color: #9ca3af;
  }

  /* Button styles */
  .button-group {
    display: flex;
    gap: 0.75rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
    text-decoration: none;
  }

  .btn-primary:hover {
    background-color: #2563eb;
  }

  .btn-secondary {
    background-color: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover {
    background-color: #f9fafb;
  }

  /* Table styles */
  .table-responsive {
    overflow-x: auto;
  }

  .table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }

  .table th {
    padding: 0.75rem 1.5rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    color: #6b7280;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .table td {
    padding: 1rem 1.5rem;
    vertical-align: middle;
    border-bottom: 1px solid #e5e7eb;
  }

  .table tr:hover {
    background-color: #f9fafb;
  }

  /* Badge styles */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.625rem;
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

  /* Link styles */
  .company-link {
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
  }

  .company-link:hover {
    text-decoration: underline;
  }

  .company-name {
    font-size: 0.875rem;
    color: #111827;
  }

  /* Action buttons */
  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 0.375rem;
    background-color: transparent;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .action-button:hover {
    background-color: #f3f4f6;
  }

  .view-button {
    color: #2563eb;
  }

  .copy-button {
    color: #4f46e5;
  }

  /* Empty state */
  .empty-state {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
  }

  .empty-icon {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 1rem;
    color: #9ca3af;
  }

  .empty-title {
    font-size: 1.125rem;
    font-weight: 500;
    margin: 0 0 0.25rem;
  }

  .empty-subtitle {
    margin: 0;
  }

  /* Results count */
  .results-count {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .count-highlight {
    font-weight: 500;
  }

  /* Icons */
  .icon {
    width: 1.25rem;
    height: 1.25rem;
    margin-right: 0.5rem;
  }

  /* Loading state */
  .loading-state {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top: 4px solid #3b82f6;
    margin: 0 auto 1rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .card-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .search-container {
      max-width: 100%;
    }

    .button-group {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>