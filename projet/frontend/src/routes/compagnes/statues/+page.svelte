<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import StatusStats from '$lib/components/status/StatusStats.svelte';
    import CampaignCard from '$lib/components/campaign/CampaignCard.svelte';
    import StatusCard from '$lib/components/status/StatusCard.svelte';
    import StatusEditModal from '$lib/components/status/StatusEditModal.svelte';
    import StatusDeleteModal from '$lib/components/status/StatusDeleteModal.svelte';

    /**
   * @type {any[]}
   */
    let campaigns = [];
    /**
   * @type {string | any[]}
   */
    let campaignStatuses = [];
    let loading = true;
    let loadingStatuses = false;
    /**
   * @type {string | null}
   */
    let error = null;
    /**
   * @type {{ campaign_id: any; campaign_name: any; } | null}
   */
    let selectedCampaign = null;
    /**
   * @type {null}
   */
    let editingStatus = null;
    let showDeleteModal = false;
    /**
   * @type {null}
   */
    let statusToDelete = null;

    onMount(async () => {
        await fetchCampaigns();
    });

    async function fetchCampaigns() {
        try {
            loading = true;
            error = null;
            
            const response = await fetch('http://localhost:8000/api/admin/compagnies/recuperer', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error('Format de données invalide');
            }

            campaigns = data;
        } catch (err) {
            console.error('Erreur lors de la récupération des campagnes:', err);
            // @ts-ignore
            error = err.message || 'Impossible de récupérer les campagnes. Veuillez réessayer plus tard.';
            campaigns = [];
        } finally {
            loading = false;
        }
    }

    /**
   * @param {any} campaignId
   */
    async function selectCampaign(campaignId) {
        try {
            selectedCampaign = campaigns.find(c => c.campaign_id === campaignId);
            if (!selectedCampaign) {
                throw new Error('Campagne non trouvée');
            }
            await fetchCampaignStatuses(campaignId);
        } catch (err) {
            // @ts-ignore
            error = err.message;
            console.error('Erreur lors de la sélection de la campagne:', err);
        }
    }

    /**
   * @param {any} campaignId
   */
    async function fetchCampaignStatuses(campaignId) {
        try {
            loadingStatuses = true;
            error = null;
            const response = await fetch(`http://localhost:8000/api/admin/compagnies/getStatusCountsByCampaign/${campaignId}`);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des statuts');
            }
            const { success, data } = await response.json();
            if (!success || !Array.isArray(data)) {
                throw new Error('Format de données invalide');
            }
            campaignStatuses = data;
        } catch (err) {
            // @ts-ignore
            error = `Erreur lors de la récupération des statuts: ${err.message}`;
            console.error(error);
            campaignStatuses = [];
        } finally {
            loadingStatuses = false;
        }
    }

    /**
   * @param {{ status: any; status_name: any; min_sec: string; max_sec: string; selectable: any; human_answered: any; sale: any; dnc: any; customer_contact: any; not_interested: any; unworkable: any; scheduled_callback: any; completed: any; answering_machine: any; }} status
   */
    async function updateStatus(status) {
        try {
            if (!selectedCampaign || !selectedCampaign.campaign_id) {
                throw new Error('Aucune campagne sélectionnée');
            }

            if (!status || !status.status) {
                throw new Error('Données du statut invalides');
            }

            // Ensure all required fields are present with default values
            const statusData = {
                status: status.status,
                status_name: status.status_name || '',
                min_sec: parseInt(status.min_sec) || 0,
                max_sec: parseInt(status.max_sec) || 0,
                selectable: Boolean(status.selectable),
                human_answered: Boolean(status.human_answered),
                sale: Boolean(status.sale),
                dnc: Boolean(status.dnc),
                customer_contact: Boolean(status.customer_contact),
                not_interested: Boolean(status.not_interested),
                unworkable: Boolean(status.unworkable),
                scheduled_callback: Boolean(status.scheduled_callback),
                completed: Boolean(status.completed),
                answering_machine: Boolean(status.answering_machine)
            };

            // Validate numeric fields
            if (statusData.min_sec < 0 || statusData.max_sec < 0) {
                throw new Error('Les temps minimum et maximum doivent être positifs');
            }

            if (statusData.max_sec < statusData.min_sec) {
                throw new Error('Le temps maximum doit être supérieur au temps minimum');
            }

            const response = await fetch(
                `http://localhost:8000/api/admin/compagnies/updateStatus/${selectedCampaign.campaign_id}/${status.status}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(statusData)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour');
            }

            await fetchCampaignStatuses(selectedCampaign.campaign_id);
            editingStatus = null;
        } catch (err) {
            // @ts-ignore
            error = err.message;
            console.error('Erreur de mise à jour:', err);
        }
    }

    /**
   * @param {{ status: any; }} status
   */
    async function deleteStatus(status) {
        try {
            const response = await fetch(
                // @ts-ignore
                `http://localhost:8000/api/admin/compagnies/deleteStatus/${selectedCampaign.campaign_id}/${status.status}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json'
                    }
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
            error = err.message;
            console.error('Erreur de suppression:', err);
        }
    }

    function startEdit(status) {
        editingStatus = { ...status };
    }

    function cancelEdit() {
        editingStatus = null;
    }

    function confirmDelete(status) {
        statusToDelete = status;
        showDeleteModal = true;
    }

    function cancelDelete() {
        statusToDelete = null;
        showDeleteModal = false;
    }

    function getStatusColor(status) {
        if (status.completed === true) return 'success';
        if (status.scheduled_callback === true) return 'info';
        if (status.not_interested === true) return 'warning';
        if (status.unworkable === true) return 'danger';
        return 'secondary';
    }

    function getStatusIcon(status) {
        if (status.completed) return 'bi-check-circle-fill';
        if (status.scheduled_callback) return 'bi-calendar-event';
        if (status.not_interested) return 'bi-x-circle';
        if (status.unworkable) return 'bi-dash-circle';
        return 'bi-circle';
    }

    function handleBackToList() {
        selectedCampaign = null;
        campaignStatuses = [];
        error = null;
    }

    function handleEditStatus(status) {
        startEdit(status);
    }

    function handleDeleteStatus(status) {
        confirmDelete(status);
    }

    function handleSaveStatus(status) {
        updateStatus(status);
    }

    function handleConfirmDelete(status) {
        deleteStatus(status);
    }
</script>

<div class="container-fluid py-4">
    <div class="page-header mb-4">
        <h1 class="display-6 mb-0">
            {#if selectedCampaign}
                <button class="btn btn-link text-decoration-none p-0 me-3" on:click={() => selectedCampaign = null}>
                    <i class="bi bi-arrow-left"></i>
                </button>
                {selectedCampaign.campaign_name}
            {:else}
                Campagnes
            {/if}
        </h1>
    </div>

    {#if !selectedCampaign}
        <div class="row g-4">
            {#each campaigns as campaign}
                <div class="col-md-6 col-lg-4">
                    <CampaignCard {campaign} onSelect={() => selectCampaign(campaign.campaign_id)} />
                </div>
            {/each}
        </div>
    {:else}

        {#if loadingStatuses}
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
            </div>
        {:else if error}
            <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                {error}
            </div>
        {:else if campaignStatuses.length === 0}
            <div class="text-center py-4">
                <i class="bi bi-inbox display-4 text-muted"></i>
                <p class="mt-3">Aucun statut trouvé pour cette campagne</p>
            </div>
        {:else}
            <StatusStats statuses={campaignStatuses} />

            <div class="status-grid mt-4">
                {#each campaignStatuses as status}
                    <StatusCard 
                        {status} 
                        onEdit={handleEditStatus} 
                        onDelete={handleDeleteStatus}
                    />
                {/each}
            </div>
        {/if}
    {/if}
</div>

<StatusEditModal 
    status={editingStatus}
    show={!!editingStatus}
    on:save={handleSaveStatus}
    on:close={() => editingStatus = null}
/>

<StatusDeleteModal 
    status={statusToDelete}
    show={!!statusToDelete}
    on:confirm={handleConfirmDelete}
    on:close={() => statusToDelete = null}
/>

<style>
    .hover-shadow {
        transition: box-shadow 0.3s ease-in-out;
    }
    
    .hover-shadow:hover {
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }

    .campaign-card {
        transition: transform 0.2s ease-in-out;
    }

    .campaign-card:hover {
        transform: translateY(-5px);
    }

    .status-card {
        transition: all 0.2s ease-in-out;
    }

    .status-card:hover {
        transform: translateY(-3px);
    }

    .status-properties {
        display: grid;
        gap: 0.5rem;
    }

    .status-property {
        padding: 0.5rem;
        border-radius: 0.25rem;
        background-color: #f8f9fa;
        color: #6c757d;
        font-size: 0.875rem;
    }

    .status-property.active {
        background-color: #e3f2fd;
        color: #0d6efd;
    }

    .modal {
        background-color: rgba(0, 0, 0, 0.5);
    }
</style>