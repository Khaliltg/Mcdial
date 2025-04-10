<script>
    import { slide, fade } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    
    export let campaigns = [];
    export let currentPage = 1;
    export let itemsPerPage = 10;
    export let sortField = 'campaign_name';
    export let sortDirection = 'asc';
    export let isLoading = false;
    export let searchQuery = '';
    
    const dispatch = createEventDispatcher();
    
    // Filtrer les campagnes en fonction de la recherche
    $: filteredCampaigns = searchQuery 
        ? campaigns.filter(campaign => 
            campaign.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            campaign.campaign_id.toString().includes(searchQuery) ||
            (campaign.description && campaign.description.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : campaigns;
    
    $: totalItems = filteredCampaigns.length;
    $: totalPages = Math.ceil(totalItems / itemsPerPage);
    $: paginatedCampaigns = filteredCampaigns.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    
    // Calculer les pages à afficher dans la pagination
    $: paginationRange = getPaginationRange(currentPage, totalPages);
    
    function getPaginationRange(current, total) {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        
        if (current <= 3) {
            return [1, 2, 3, 4, '...', total];
        }
        
        if (current >= total - 2) {
            return [1, '...', total - 3, total - 2, total - 1, total];
        }
        
        return [1, '...', current - 1, current, current + 1, '...', total];
    }
    
    function handleSelectCampaign(campaignId) {
        dispatch('selectCampaign', campaignId);
    }
    
    function handleSort(field) {
        dispatch('sort', field);
    }
    
    function changePage(newPage) {
        if (newPage >= 1 && newPage <= totalPages) {
            dispatch('changePage', newPage);
        }
    }
    
    function handleSearch(event) {
        dispatch('search', event.target.value);
    }
    
    function getSortIcon(field) {
        if (sortField !== field) return 'sort-icon neutral';
        return sortDirection === 'asc' ? 'sort-icon asc' : 'sort-icon desc';
    }
    
    // Format date if available in campaign data
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }
    
    // Obtenir la classe de badge en fonction du statut
    function getStatusBadgeClass(status) {
        switch(status?.toLowerCase()) {
            case 'active':
                return 'badge-active';
            case 'paused':
                return 'badge-paused';
            case 'completed':
                return 'badge-completed';
            default:
                return 'badge-default';
        }
    }
    
    // Obtenir le texte du statut en français
    function getStatusText(status) {
        switch(status?.toLowerCase()) {
            case 'active':
                return 'Actif';
            case 'paused':
                return 'En pause';
            case 'completed':
                return 'Terminé';
            default:
                return status || 'Non défini';
        }
    }
</script>

<div class="campaign-list-container">
    <!-- Search and filters -->
    <div class="search-container">
        <div class="search-input-wrapper">
            <input 
                type="text" 
                class="search-input" 
                placeholder="Rechercher une campagne..." 
                value={searchQuery}
                on:input={handleSearch}
                aria-label="Rechercher une campagne"
            />
            <span class="search-icon">🔍</span>
        </div>
        
        <div class="results-info">
            {#if !isLoading}
                <span class="results-count">
                    {totalItems} campagne{totalItems !== 1 ? 's' : ''}
                </span>
            {/if}
        </div>
    </div>

    <!-- Main content card -->
    <div class="card">
        {#if isLoading}
            <div class="loading-container" transition:fade>
                <div class="loading-spinner"></div>
                <p>Chargement des campagnes...</p>
            </div>
        {:else if paginatedCampaigns.length === 0}
            <div class="empty-state" transition:fade>
                <div class="empty-icon">📊</div>
                <h3>Aucune campagne trouvée</h3>
                {#if searchQuery}
                    <p>Aucun résultat pour "{searchQuery}"</p>
                    <button class="btn btn-secondary" on:click={() => dispatch('search', '')}>
                        Effacer la recherche
                    </button>
                {:else}
                    <p>Commencez par créer une nouvelle campagne</p>
                    <button class="btn btn-primary" on:click={() => dispatch('createCampaign')}>
                        Créer une campagne
                    </button>
                {/if}
            </div>
        {:else}
            <div class="table-container" transition:fade>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th class="sortable" on:click={() => handleSort('campaign_id')}>
                                <div class="th-content">
                                    ID
                                    <span class={getSortIcon('campaign_id')}></span>
                                </div>
                            </th>
                            <th class="sortable" on:click={() => handleSort('campaign_name')}>
                                <div class="th-content">
                                    Nom de la campagne
                                    <span class={getSortIcon('campaign_name')}></span>
                                </div>
                            </th>
                            <th class="sortable" on:click={() => handleSort('status')}>
                                <div class="th-content">
                                    Statut
                                    <span class={getSortIcon('status')}></span>
                                </div>
                            </th>
                            <th class="sortable" on:click={() => handleSort('created_at')}>
                                <div class="th-content">
                                    Date de création
                                    <span class={getSortIcon('created_at')}></span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each paginatedCampaigns as campaign (campaign.campaign_id)}
                            <tr 
                                class="campaign-row" 
                                transition:slide|local={{ duration: 300 }}
                                on:click={() => handleSelectCampaign(campaign.campaign_id)}
                                on:keydown={(e) => e.key === 'Enter' && handleSelectCampaign(campaign.campaign_id)}
                                tabindex="0"
                                role="button"
                                aria-label="Sélectionner la campagne {campaign.campaign_name}"
                            >
                                <td>{campaign.campaign_id}</td>
                                <td>
                                    <div class="campaign-name">{campaign.campaign_name}</div>
                                    {#if campaign.description}
                                        <div class="campaign-description">{campaign.description}</div>
                                    {/if}
                                </td>
                                <td>
                                    <span class={`status-badge ${getStatusBadgeClass(campaign.status)}`}>
                                        {getStatusText(campaign.status)}
                                    </span>
                                </td>
                                <td>{formatDate(campaign.created_at)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination -->
            {#if totalPages > 1}
                <div class="pagination-container">
                    <div class="pagination">
                        <button 
                            class="pagination-button" 
                            disabled={currentPage === 1}
                            on:click={() => changePage(1)}
                            aria-label="Première page"
                        >
                            <span class="pagination-icon">«</span>
                        </button>
                        
                        <button 
                            class="pagination-button" 
                            disabled={currentPage === 1}
                            on:click={() => changePage(currentPage - 1)}
                            aria-label="Page précédente"
                        >
                            <span class="pagination-icon">‹</span>
                        </button>
                        
                        {#each paginationRange as page}
                            {#if page === '...'}
                                <span class="pagination-ellipsis">…</span>
                            {:else}
                                <button 
                                    class="pagination-button {currentPage === page ? 'active' : ''}" 
                                    on:click={() => changePage(page)}
                                    aria-label="Page {page}"
                                    aria-current={currentPage === page ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            {/if}
                        {/each}
                        
                        <button 
                            class="pagination-button" 
                            disabled={currentPage === totalPages}
                            on:click={() => changePage(currentPage + 1)}
                            aria-label="Page suivante"
                        >
                            <span class="pagination-icon">›</span>
                        </button>
                        
                        <button 
                            class="pagination-button" 
                            disabled={currentPage === totalPages}
                            on:click={() => changePage(totalPages)}
                            aria-label="Dernière page"
                        >
                            <span class="pagination-icon">»</span>
                        </button>
                    </div>
                    
                    <div class="pagination-info">
                        Page {currentPage} sur {totalPages}
                    </div>
                </div>
            {/if}
        {/if}
    </div>
</div>

<style>
    /* Container styles */
    .campaign-list-container {
        width: 100%;
    }
    
    /* Card styles */
    .card {
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        margin-bottom: 1.5rem;
        overflow: hidden;
    }
    
    /* Search styles */
    .search-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .search-input-wrapper {
        position: relative;
        width: 300px;
    }
    
    .search-input {
        width: 100%;
        padding: 0.625rem 1rem 0.625rem 2.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        background-color: white;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    .search-input:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    
    .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        font-size: 0.875rem;
    }
    
    .results-info {
        color: #6b7280;
        font-size: 0.875rem;
    }
    
    .results-count {
        background-color: #e0e7ff;
        color: #4338ca;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    /* Table styles */
    .table-container {
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
    
    .th-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .sortable {
        cursor: pointer;
        user-select: none;
    }
    
    .sortable:hover {
        background-color: #f1f5f9;
    }
    
    .sort-icon {
        display: inline-block;
        width: 16px;
        height: 16px;
        position: relative;
    }
    
    .sort-icon.neutral::before {
        content: '⇅';
        opacity: 0.3;
        font-size: 0.75rem;
    }
    
    .sort-icon.asc::before {
        content: '↓';
        color: #2563eb;
        font-size: 0.75rem;
    }
    
    .sort-icon.desc::before {
        content: '↑';
        color: #2563eb;
        font-size: 0.75rem;
    }
    
    .data-table tr {
        border-bottom: 1px solid #e5e7eb;
        transition: background-color 0.2s;
    }
    
    .data-table tr:last-child {
        border-bottom: none;
    }
    
    /* Campaign row styles */
    .campaign-row {
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
    }
    
    .campaign-row::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background-color: transparent;
        transition: background-color 0.2s;
    }
    
    .campaign-row:hover {
        background-color: #f8fafc;
    }
    
    .campaign-row:hover::before {
        background-color: #2563eb;
    }
    
    .campaign-row:focus {
        outline: none;
        background-color: #eff6ff;
    }
    
    .campaign-row:focus::before {
        background-color: #2563eb;
    }
    
    .campaign-name {
        font-weight: 500;
        color: #1e293b;
        margin-bottom: 0.25rem;
    }
    
    .campaign-description {
        color: #64748b;
        font-size: 0.75rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    /* Status badge styles */
    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .badge-active {
        background-color: #dcfce7;
        color: #15803d;
    }
    
    .badge-paused {
        background-color: #fef3c7;
        color: #b45309;
    }
    
    .badge-completed {
        background-color: #dbeafe;
        color: #1d4ed8;
    }
    
    .badge-default {
        background-color: #f3f4f6;
        color: #6b7280;
    }
    
    /* Pagination styles */
    .pagination-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-top: 1px solid #e5e7eb;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .pagination {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .pagination-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        height: 2rem;
        padding: 0 0.5rem;
        border: 1px solid #e5e7eb;
        background-color: white;
        color: #4b5563;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .pagination-button:hover:not(:disabled) {
        background-color: #f3f4f6;
        border-color: #d1d5db;
    }
    
    .pagination-button:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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
    
    .pagination-icon {
        font-size: 1rem;
        line-height: 1;
    }
    
    .pagination-ellipsis {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        height: 2rem;
        color: #6b7280;
    }
    
    .pagination-info {
        color: #6b7280;
        font-size: 0.875rem;
    }
    
    /* Loading state */
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
    
    /* Empty state */
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
    
    .empty-state h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 0.5rem;
    }
    
    .empty-state p {
        color: #64748b;
        margin-bottom: 1.5rem;
    }
    
    /* Button styles */
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.625rem 1.25rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        font-size: 0.875rem;
    }
    
    .btn-primary {
        background-color: #2563eb;
        color: white;
    }
    
    .btn-primary:hover {
        background-color: #1d4ed8;
    }
    
    .btn-secondary {
        background-color: #e5e7eb;
        color: #4b5563;
    }
    
    .btn-secondary:hover {
        background-color: #d1d5db;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .search-container {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .search-input-wrapper {
            width: 100%;
        }
        
        .pagination-container {
            flex-direction: column;
            align-items: center;
        }
        
        .pagination {
            order: 2;
        }
        
        .pagination-info {
            order: 1;
            margin-bottom: 0.5rem;
        }
    }
    
    @media (max-width: 640px) {
        .data-table th,
        .data-table td {
            padding: 0.75rem;
        }
        
        .pagination {
            gap: 0.125rem;
        }
        
        .pagination-button {
            min-width: 1.75rem;
            height: 1.75rem;
            font-size: 0.75rem;
        }
    }
</style>