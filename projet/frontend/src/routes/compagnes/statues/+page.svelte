<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
    import StatusEditModal from '$lib/components/status/StatusEditModal.svelte';
    import StatusDeleteModal from '$lib/components/status/StatusDeleteModal.svelte';
    import CampaignTable from '$lib/components/campaign/CampaignTable.svelte';
    import StatusTable from '$lib/components/status/StatusTable.svelte';
    import VoiceMetricsPanel from '$lib/components/status/VoiceMetricsPanel.svelte';
    import { writable } from 'svelte/store';
    import { fade } from 'svelte/transition';

    // Create stores for better state management
    const campaignsStore = writable([]);
    const statusesStore = writable([]);
    const errorStore = writable(null);
    
    // Derived from the stores
    $: campaigns = $campaignsStore;
    $: campaignStatuses = $statusesStore;
    $: error = $errorStore;

    // State variables
    let loading = true;
    let loadingStatuses = false;
    let selectedCampaign = null;
    let editingStatus = null;
    let statusToDelete = null;
    let showDeleteModal = false;
    let searchQuery = '';
    let sortField = 'campaign_name';
    let sortDirection = 'asc';
    let refreshInterval;
    let apiBaseUrl = 'http://localhost:8000/api/admin';

    // Pagination
    let currentPage = 1;
    let itemsPerPage = 10;
    $: filteredCampaigns = campaigns
        .filter(campaign => 
            campaign.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];
            const direction = sortDirection === 'asc' ? 1 : -1;
            
            if (typeof aValue === 'string') {
                return aValue.localeCompare(bValue) * direction;
            }
            return (aValue - bValue) * direction;
        });

    onMount(async () => {
        await fetchCampaigns();
        
        // Set up auto-refresh every 5 minutes
        refreshInterval = setInterval(() => {
            if (selectedCampaign) {
                fetchCampaignStatuses(selectedCampaign.campaign_id);
            } else {
                fetchCampaigns();
            }
        }, 5 * 60 * 1000);
        
        return () => {
            if (refreshInterval) clearInterval(refreshInterval);
        };
    });

    async function fetchCampaigns() {
        try {
            loading = true;
            errorStore.set(null);
            
            const response = await fetchWithAuth(`${apiBaseUrl}/compagnies/recuperer`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error('Format de données invalide');
            }

            campaignsStore.set(data);
            currentPage = 1; // Reset to first page when fetching new data
        } catch (err) {
            console.error('Erreur lors de la récupération des campagnes:', err);
            errorStore.set(err.message || 'Impossible de récupérer les campagnes. Veuillez réessayer plus tard.');
            campaignsStore.set([]);
        } finally {
            loading = false;
        }
    }

    async function selectCampaign(campaignId) {
        try {
            const campaign = campaigns.find(c => c.campaign_id === campaignId);
            if (!campaign) {
                throw new Error('Campagne non trouvée');
            }
            selectedCampaign = campaign;
            await fetchCampaignStatuses(campaignId);
        } catch (err) {
            errorStore.set(err.message);
            console.error('Erreur lors de la sélection de la campagne:', err);
        }
    }

    async function fetchCampaignStatuses(campaignId) {
        try {
            loadingStatuses = true;
            errorStore.set(null);
            const response = await fetchWithAuth(`${apiBaseUrl}/compagnies/getStatusCountsByCampaign/${campaignId}`);
            
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des statuts');
            }
            
            const { success, data } = await response.json();
            if (!success || !Array.isArray(data)) {
                throw new Error('Format de données invalide');
            }
            
            statusesStore.set(data);
        } catch (err) {
            errorStore.set(`Erreur lors de la récupération des statuts: ${err.message}`);
            console.error(error);
            statusesStore.set([]);
        } finally {
            loadingStatuses = false;
        }
    }

    async function createStatus() {
        if (!selectedCampaign) {
            errorStore.set('Veuillez d\'abord sélectionner une campagne');
            setTimeout(() => errorStore.set(null), 3000);
            return;
        }
        
        // Generate a unique status code suggestion (2 letters + 1 number)
        const existingCodes = new Set(campaignStatuses.map(s => s.status));
        let suggestedCode = '';
        
        // Try to generate a unique code
        for (let i = 0; i < 100; i++) {
            // Generate a random 2-letter prefix
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const prefix = letters.charAt(Math.floor(Math.random() * letters.length)) + 
                           letters.charAt(Math.floor(Math.random() * letters.length));
            
            // Add a random number (1-9)
            const number = Math.floor(Math.random() * 9) + 1;
            const code = `${prefix}${number}`;
            
            if (!existingCodes.has(code)) {
                suggestedCode = code;
                break;
            }
        }
        
        // Create a new empty status template with suggested values
        editingStatus = {
            status: suggestedCode,
            status_name: '',
            min_sec: '0',
            max_sec: '60',  // Default to 60 seconds max
            selectable: true,
            human_answered: false,
            sale: false,
            dnc: false,
            customer_contact: false,
            not_interested: false,
            unworkable: false,
            scheduled_callback: false,
            completed: false,
            answering_machine: false
        };
        
        // Log for debugging
        console.log('Creating new status with suggested code:', suggestedCode);
    }

    /**
     * Updates a status based on the event data from StatusEditModal
     * @param {CustomEvent} event - The event containing the validated status data
     */
    async function updateStatus(event) {
        try {
            // Get the validated status from the event detail
            const status = event.detail;
            
            if (!selectedCampaign || !selectedCampaign.campaign_id) {
                throw new Error('Aucune campagne sélectionnée');
            }

            if (!status || !status.status) {
                throw new Error('Données du statut invalides');
            }

            // Prepare status data for API
            const statusData = {
                status: status.status,
                status_name: status.status_name,
                min_sec: status.min_sec,
                max_sec: status.max_sec,
                selectable: status.selectable ? 1 : 0,
                human_answered: status.human_answered ? 1 : 0,
                sale: status.sale ? 1 : 0,
                dnc: status.dnc ? 1 : 0,
                customer_contact: status.customer_contact ? 1 : 0,
                not_interested: status.not_interested ? 1 : 0,
                unworkable: status.unworkable ? 1 : 0,
                scheduled_callback: status.scheduled_callback ? 1 : 0,
                completed: status.completed ? 1 : 0,
                answering_machine: status.answering_machine ? 1 : 0
            };

            // Note: validation is already done in the StatusEditModal component

            const isNewStatus = !campaignStatuses.some(s => s.status === status.status);
            // For existing statuses, use the updateStatus endpoint
            if (!isNewStatus) {
                const endpoint = `${apiBaseUrl}/compagnies/updateStatus/${selectedCampaign.campaign_id}/${status.status}`;
                
                const response = await fetchWithAuth(endpoint, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(statusData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erreur lors de la mise à jour');
                }
            } 
            // For new statuses, use the new createStatus endpoint
            else {
                const endpoint = `${apiBaseUrl}/compagnies/createStatus/${selectedCampaign.campaign_id}`;
                const response = await fetchWithAuth(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        status: status.status,
                        status_name: status.status_name,
                        selectable: statusData.selectable,
                        human_answered: statusData.human_answered,
                        sale: statusData.sale,
                        dnc: statusData.dnc,
                        customer_contact: statusData.customer_contact,
                        not_interested: statusData.not_interested,
                        unworkable: statusData.unworkable,
                        scheduled_callback: statusData.scheduled_callback,
                        completed: statusData.completed,
                        answering_machine: statusData.answering_machine,
                        min_sec: statusData.min_sec,
                        max_sec: statusData.max_sec
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erreur lors de la création du statut');
                }
            }

            await fetchCampaignStatuses(selectedCampaign.campaign_id);
            editingStatus = null;
        } catch (err) {
            errorStore.set(err.message);
            console.error('Erreur de mise à jour:', err);
        }
    }

    async function deleteStatus(status) {
        try {
            const response = await fetchWithAuth(
                `${apiBaseUrl}/compagnies/deleteStatus/${selectedCampaign.campaign_id}/${status.status}`,
                {
                    method: 'DELETE'
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la suppression');
            }

            await fetchCampaignStatuses(selectedCampaign.campaign_id);
            showDeleteModal = false;
            statusToDelete = null;
        } catch (err) {
            errorStore.set(err.message);
            console.error('Erreur de suppression:', err);
        }
    }

    async function exportStatuses() {
        if (!selectedCampaign) return;
        
        try {
            const csvContent = [
                // Header row
                ['Status ID', 'Status Name', 'Min Sec', 'Max Sec', 'Selectable', 'Human Answered', 
                 'Sale', 'DNC', 'Customer Contact', 'Not Interested', 'Unworkable', 
                 'Scheduled Callback', 'Completed', 'Answering Machine'].join(','),
                // Data rows
                ...campaignStatuses.map(status => [
                    status.status,
                    `"${status.status_name.replace(/"/g, '""')}"`, // Escape quotes in CSV
                    status.min_sec,
                    status.max_sec,
                    status.selectable ? 'Yes' : 'No',
                    status.human_answered ? 'Yes' : 'No',
                    status.sale ? 'Yes' : 'No',
                    status.dnc ? 'Yes' : 'No',
                    status.customer_contact ? 'Yes' : 'No',
                    status.not_interested ? 'Yes' : 'No',
                    status.unworkable ? 'Yes' : 'No',
                    status.scheduled_callback ? 'Yes' : 'No',
                    status.completed ? 'Yes' : 'No',
                    status.answering_machine ? 'Yes' : 'No'
                ].join(','))
            ].join('\n');
            
            // Create a blob and download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${selectedCampaign.campaign_name}_statuses.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            errorStore.set('Erreur lors de l\'exportation des statuts');
            console.error('Erreur d\'exportation:', err);
        }
    }

    function handleBackToList() {
        selectedCampaign = null;
        statusesStore.set([]);
        errorStore.set(null);
    }

    function handleSort(field) {
        if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortDirection = 'asc';
        }
    }

    function handleEditStatus(status) {
        editingStatus = { ...status };
    }

    function handleDeleteStatus(status) {
        statusToDelete = status;
        showDeleteModal = true;
    }

    function handleCancelEdit() {
        editingStatus = null;
    }

    function handleCancelDelete() {
        statusToDelete = null;
        showDeleteModal = false;
    }
</script>

<div class="container-fluid py-4">
    <div class="page-header mb-4 d-flex justify-content-between align-items-center">
        <h1 class="display-6 mb-0">
            {#if selectedCampaign}
                <button class="btn btn-link text-decoration-none p-0 me-3" on:click={handleBackToList}>
                    <i class="bi bi-arrow-left"></i>
                </button>
                {selectedCampaign.campaign_name}
            {:else}
                Campagnes
            {/if}
        </h1>
        
        {#if !selectedCampaign}
            <div class="d-flex gap-2">
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input 
                        type="text" 
                        class="form-control" 
                        placeholder="Rechercher une campagne..." 
                        bind:value={searchQuery}
                    />
                </div>
                <button class="btn btn-primary" on:click={fetchCampaigns}>
                    <i class="bi bi-arrow-clockwise me-1"></i> Actualiser
                </button>
            </div>
        {:else}
            <div class="d-flex gap-2">
                <button class="btn btn-success" on:click={createStatus}>
                    <i class="bi bi-plus-circle me-1"></i> Nouveau statut
                </button>
                <button class="btn btn-outline-secondary" on:click={exportStatuses}>
                    <i class="bi bi-download me-1"></i> Exporter
                </button>
            </div>
        {/if}
    </div>

    {#if error}
        <div class="alert alert-danger" role="alert" transition:fade>
            <i class="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button type="button" class="btn-close float-end" on:click={() => errorStore.set(null)}></button>
        </div>
    {/if}

    {#if !selectedCampaign}
        {#if loading}
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p class="mt-3">Chargement des campagnes...</p>
            </div>
        {:else if campaigns.length === 0}
            <div class="text-center py-5" transition:fade>
                <i class="bi bi-inbox display-4 text-muted"></i>
                <p class="mt-3">Aucune campagne trouvée</p>
                <button class="btn btn-primary mt-2" on:click={fetchCampaigns}>
                    <i class="bi bi-arrow-clockwise me-1"></i> Actualiser
                </button>
            </div>
        {:else}
            <CampaignTable 
                campaigns={filteredCampaigns} 
                {currentPage}
                {itemsPerPage}
                {sortField}
                {sortDirection}
                on:selectCampaign={e => selectCampaign(e.detail)}
                on:sort={e => handleSort(e.detail)}
                on:changePage={e => currentPage = e.detail}
            />
        {/if}
    {:else}
        {#if loadingStatuses}
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p class="mt-3">Chargement des statuts...</p>
            </div>
        {:else if campaignStatuses.length === 0}
            <div class="text-center py-4" transition:fade>
                <i class="bi bi-inbox display-4 text-muted"></i>
                <p class="mt-3">Aucun statut trouvé pour cette campagne</p>
                <button class="btn btn-primary mt-2" on:click={createStatus}>
                    <i class="bi bi-plus-circle me-1"></i> Créer un statut
                </button>
            </div>
        {:else}
            <div transition:fade>
                
                <VoiceMetricsPanel statuses={campaignStatuses} />
                
                <StatusTable 
                    statuses={campaignStatuses} 
                    on:edit={e => handleEditStatus(e.detail)}
                    on:delete={e => handleDeleteStatus(e.detail)}
                    on:create={createStatus}
                />
            </div>
        {/if}
    {/if}
</div>

<StatusEditModal 
    status={editingStatus}
    show={!!editingStatus}
    on:save={updateStatus}
    on:close={handleCancelEdit}
    isNew={editingStatus && !campaignStatuses.some(s => s.status === editingStatus.status)}
/>

<StatusDeleteModal 
    status={statusToDelete}
    show={showDeleteModal}
    on:confirm={() => deleteStatus(statusToDelete)}
    on:close={handleCancelDelete}
/>

<style>
    .page-header {
        border-bottom: 1px solid #dee2e6;
        padding-bottom: 1rem;
    }
</style>