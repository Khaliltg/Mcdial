<script>
    import { slide } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    
    export let campaigns = [];
    export let currentPage = 1;
    export let itemsPerPage = 10;
    export let sortField = 'campaign_name';
    export let sortDirection = 'asc';
    
    const dispatch = createEventDispatcher();
    
    $: totalPages = Math.ceil(campaigns.length / itemsPerPage);
    $: paginatedCampaigns = campaigns.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    
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
    
    function getSortIcon(field) {
        if (sortField !== field) return 'bi-arrow-down-up text-muted';
        return sortDirection === 'asc' ? 'bi-sort-down-alt' : 'bi-sort-up-alt';
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
</script>

<div class="card">
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover table-striped mb-0">
                <thead class="table-light">
                    <tr>
                        <th class="sortable" on:click={() => handleSort('campaign_id')}>
                            ID <i class="bi {getSortIcon('campaign_id')}"></i>
                        </th>
                        <th class="sortable" on:click={() => handleSort('campaign_name')}>
                            Nom de la campagne <i class="bi {getSortIcon('campaign_name')}"></i>
                        </th>
                        <th class="sortable" on:click={() => handleSort('status')}>
                            Statut <i class="bi {getSortIcon('status')}"></i>
                        </th>
                        <th class="sortable" on:click={() => handleSort('created_at')}>
                            Date de création <i class="bi {getSortIcon('created_at')}"></i>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {#each paginatedCampaigns as campaign (campaign.campaign_id)}
                        <tr 
                            class="campaign-row" 
                            transition:slide
                            on:click={() => handleSelectCampaign(campaign.campaign_id)}
                        >
                            <td>{campaign.campaign_id}</td>
                            <td>
                                <div class="fw-medium">{campaign.campaign_name}</div>
                                {#if campaign.description}
                                    <div class="text-muted small">{campaign.description}</div>
                                {/if}
                            </td>
                            <td>
                                {#if campaign.status === 'active'}
                                    <span class="badge bg-success">Actif</span>
                                {:else if campaign.status === 'paused'}
                                    <span class="badge bg-warning">En pause</span>
                                {:else if campaign.status === 'completed'}
                                    <span class="badge bg-info">Terminé</span>
                                {:else}
                                    <span class="badge bg-secondary">{campaign.status || 'Non défini'}</span>
                                {/if}
                            </td>
                            <td>{formatDate(campaign.created_at)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Pagination -->
{#if totalPages > 1}
    <nav aria-label="Page navigation" class="mt-4">
        <ul class="pagination justify-content-center">
            <li class="page-item" class:disabled={currentPage === 1}>
                <button class="page-link" on:click={() => changePage(currentPage - 1)}>
                    <i class="bi bi-chevron-left"></i>
                </button>
            </li>
            
            {#each Array(totalPages) as _, i}
                <li class="page-item" class:active={currentPage === i + 1}>
                    <button class="page-link" on:click={() => changePage(i + 1)}>
                        {i + 1}
                    </button>
                </li>
            {/each}
            
            <li class="page-item" class:disabled={currentPage === totalPages}>
                <button class="page-link" on:click={() => changePage(currentPage + 1)}>
                    <i class="bi bi-chevron-right"></i>
                </button>
            </li>
        </ul>
    </nav>
{/if}

<style>
    .sortable {
        cursor: pointer;
    }

    .sortable:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }

    .campaign-row {
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .campaign-row:hover {
        background-color: rgba(13, 110, 253, 0.1) !important;
    }
    
    /* Add a subtle visual indicator that the row is clickable */
    .campaign-row td:first-child {
        border-left: 3px solid transparent;
    }
    
    .campaign-row:hover td:first-child {
        border-left: 3px solid #0d6efd;
    }
</style>