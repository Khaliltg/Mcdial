<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { fade, slide } from 'svelte/transition';
    import CampaignTable from '$lib/components/campaign/CampaignTable.svelte';

    const campaignsStore = writable([]);
    const pauseCodesStore = writable([]);
    const errorStore = writable(null);
    
    $: campaigns = $campaignsStore;
    $: pauseCodes = $pauseCodesStore;
    $: error = $errorStore;

    let loading = true;
    let loadingPauseCodes = false;
    let selectedCampaign = null;
    let searchQuery = '';
    let sortField = 'campaign_name';
    let sortDirection = 'asc';
    let apiBaseUrl = 'http://localhost:8000/api/admin';
    
    let showAddModal = false;
    let showEditModal = false;
    let showDeleteModal = false;
    let currentPauseCode = null;
    let isSubmitting = false;

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
    });

    async function fetchCampaigns() {
        try {
            loading = true;
            errorStore.set(null);
            
            const response = await fetch(`${apiBaseUrl}/compagnies/recuperer`, {
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
            await fetchPauseCodes(campaignId);
        } catch (err) {
            errorStore.set(err.message);
            console.error('Erreur lors de la sélection de la campagne:', err);
        }
    }

    async function fetchPauseCodes(campaignId) {
        try {
            loadingPauseCodes = true;
            errorStore.set(null);
            
            const response = await fetch(`${apiBaseUrl}/compagnies/getPauseCodes/${campaignId}`);
            
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data === null || data === undefined) {
                throw new Error('Réponse vide du serveur');
            }
            
            if (typeof data === 'object') {
                if (data.success === true && Array.isArray(data.data)) {
                    pauseCodesStore.set(data.data);
                } 
                else if (Array.isArray(data)) {
                    pauseCodesStore.set(data);
                }
                else if (data.pause_codes && Array.isArray(data.pause_codes)) {
                    pauseCodesStore.set(data.pause_codes);
                }
                else {
                    console.log('Unexpected data structure:', data);
                    pauseCodesStore.set([]);
                }
            } else {
                throw new Error('Format de données invalide');
            }
        } catch (err) {
            errorStore.set(`Erreur lors de la récupération des codes de pause: ${err.message}`);
            console.error('Error fetching pause codes:', err);
            pauseCodesStore.set([]);
        } finally {
            loadingPauseCodes = false;
        }
    }
    
    async function addPauseCode(pauseCode) {
        try {
            isSubmitting = true;
            if (!selectedCampaign) {
                throw new Error('Aucune campagne sélectionnée');
            }
            
            const response = await fetch(`${apiBaseUrl}/compagnies/createPauseCode/${selectedCampaign.campaign_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(pauseCode)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la création du code de pause');
            }
            
            await fetchPauseCodes(selectedCampaign.campaign_id);
            showAddModal = false;
            
            const successMessage = 'Code de pause ajouté avec succès';
            errorStore.set({ type: 'success', message: successMessage });
            setTimeout(() => errorStore.set(null), 3000);
            
        } catch (err) {
            errorStore.set(err.message);
            console.error('Erreur lors de la création du code de pause:', err);
        } finally {
            isSubmitting = false;
        }
    }
    
    async function updatePauseCode(pauseCode) {
        try {
            isSubmitting = true;
            if (!selectedCampaign) {
                throw new Error('Aucune campagne sélectionnée');
            }
            
            const response = await fetch(`${apiBaseUrl}/compagnies/updatePauseCode/${selectedCampaign.campaign_id}/${pauseCode.pause_code}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(pauseCode)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour du code de pause');
            }
            
            await fetchPauseCodes(selectedCampaign.campaign_id);
            showEditModal = false;
            currentPauseCode = null;
            
            // Show success message
            const successMessage = 'Code de pause mis à jour avec succès';
            errorStore.set({ type: 'success', message: successMessage });
            setTimeout(() => errorStore.set(null), 3000);
            
        } catch (err) {
            errorStore.set(err.message);
            console.error('Erreur lors de la mise à jour du code de pause:', err);
        } finally {
            isSubmitting = false;
        }
    }
    
    async function deletePauseCode(pauseCode) {
        try {
            isSubmitting = true;
            if (!selectedCampaign) {
                throw new Error('Aucune campagne sélectionnée');
            }
            
            const response = await fetch(`${apiBaseUrl}/compagnies/deletePauseCode/${selectedCampaign.campaign_id}/${pauseCode.pause_code}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la suppression du code de pause');
            }
            
            await fetchPauseCodes(selectedCampaign.campaign_id);
            showDeleteModal = false;
            currentPauseCode = null;
            
            // Show success message
            const successMessage = 'Code de pause supprimé avec succès';
            errorStore.set({ type: 'success', message: successMessage });
            setTimeout(() => errorStore.set(null), 3000);
            
        } catch (err) {
            errorStore.set(err.message);
            console.error('Erreur lors de la suppression du code de pause:', err);
        } finally {
            isSubmitting = false;
        }
    }

    function handleBackToList() {
        selectedCampaign = null;
        pauseCodesStore.set([]);
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
    
    function openAddModal() {
        currentPauseCode = {
            pause_code: '',
            pause_code_name: '',
            billable: 'NO',
            time_limit: 65000,
            require_mgr_approval: false
        };
        showAddModal = true;
    }
    
    function openEditModal(pauseCode) {
        currentPauseCode = { ...pauseCode };
        showEditModal = true;
    }
    
    function openDeleteModal(pauseCode) {
        currentPauseCode = pauseCode;
        showDeleteModal = true;
    }
    
    function getBillableLabel(billable) {
        if (!billable) return 'Non';
        if (billable === 'YES') return 'Oui';
        if (billable === 'HALF') return 'Moitié';
        return 'Non';
    }
    
    function getBillableBadgeClass(billable) {
        if (!billable) return 'bg-danger';
        if (billable === 'YES') return 'bg-success';
        if (billable === 'HALF') return 'bg-warning';
        return 'bg-danger';
    }
    
    function formatTimeLimit(timeLimit) {
        if (!timeLimit || timeLimit === 65000) return 'Illimité';
        
        // Format time in minutes and seconds
        const minutes = Math.floor(timeLimit / 60);
        const seconds = timeLimit % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${seconds > 0 ? seconds + 's' : ''}`;
        }
        return `${seconds}s`;
    }
</script>

<div class="container-fluid py-4">
    <div class="page-header mb-4 d-flex justify-content-between align-items-center">
        <h1 class="display-6 mb-0">
            {#if selectedCampaign}
                <button class="btn btn-link text-decoration-none p-0 me-3" on:click={handleBackToList}>
                    <i class="bi bi-arrow-left"></i>
                </button>
                Codes de pause - {selectedCampaign.campaign_name}
            {:else}
                Gestion des codes de pause
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
            <div>
                <button class="btn btn-success" on:click={openAddModal}>
                    <i class="bi bi-plus-circle me-1"></i> Ajouter un code de pause
                </button>
            </div>
        {/if}
    </div>

    {#if error}
        <div class="alert alert-{error.type === 'success' ? 'success' : 'danger'}" role="alert" transition:fade>
            <i class="bi bi-{error.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
            {error.message || error}
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
        {#if loadingPauseCodes}
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p class="mt-3">Chargement des codes de pause...</p>
            </div>
        {:else if pauseCodes.length === 0}
            <div class="card shadow-sm" transition:fade>
                <div class="card-body text-center py-5">
                    <i class="bi bi-inbox display-4 text-muted"></i>
                    <p class="mt-3 mb-4">Aucun code de pause trouvé pour cette campagne</p>
                    <button class="btn btn-primary" on:click={openAddModal}>
                        <i class="bi bi-plus-circle me-1"></i> Ajouter un code de pause
                    </button>
                </div>
            </div>
        {:else}
            <div class="card shadow-sm" transition:fade>
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-pause-circle me-2"></i> Codes de pause
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-light" on:click={() => fetchPauseCodes(selectedCampaign.campaign_id)}>
                            <i class="bi bi-arrow-clockwise me-1"></i> Actualiser
                        </button>
                        <button class="btn btn-sm btn-success" on:click={openAddModal}>
                            <i class="bi bi-plus-circle me-1"></i> Ajouter
                        </button>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Code</th>
                                    <th>Nom</th>
                                    <th>Facturable</th>
                                    <th>Limite de temps</th>
                                    <th>Approbation manager</th>
                                    <th class="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each pauseCodes as pauseCode (pauseCode.pause_code)}
                                    <tr transition:slide class="pause-code-row">
                                        <td><strong>{pauseCode.pause_code}</strong></td>
                                        <td>{pauseCode.pause_code_name || 'Sans nom'}</td>
                                        <td>
                                            <span class="badge {getBillableBadgeClass(pauseCode.billable)}">
                                                {getBillableLabel(pauseCode.billable)}
                                            </span>
                                        </td>
                                        <td>{formatTimeLimit(pauseCode.time_limit)}</td>
                                        <td>
                                            {#if pauseCode.require_mgr_approval}
                                                <span class="badge bg-warning">
                                                    <i class="bi bi-shield-check me-1"></i> Requise
                                                </span>
                                            {:else}
                                                <span class="badge bg-light text-dark">
                                                    <i class="bi bi-shield me-1"></i> Non requise
                                                </span>
                                            {/if}
                                        </td>
                                        <td class="text-end">
                                            <div class="btn-group">
                                                <button 
                                                    class="btn btn-sm btn-outline-primary" 
                                                    on:click={() => openEditModal(pauseCode)}
                                                    title="Modifier"
                                                >
                                                    <i class="bi bi-pencil"></i>
                                                </button>
                                                <button 
                                                    class="btn btn-sm btn-outline-danger" 
                                                    on:click={() => openDeleteModal(pauseCode)}
                                                    title="Supprimer"
                                                >
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>

<!-- Add Pause Code Modal -->
{#if showAddModal}
<div class="modal fade show" style="display: block;" tabindex="-1" aria-modal="true" role="dialog">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header bg-light">
                <h5 class="modal-title">
                    <i class="bi bi-plus-circle me-2 text-success"></i>
                    Ajouter un code de pause
                </h5>
                <button type="button" class="btn-close" on:click={() => showAddModal = false}></button>
            </div>
            <div class="modal-body">
                <form id="addPauseCodeForm">
                    <div class="mb-3">
                        <label for="pause_code" class="form-label">Code de pause <span class="text-danger">*</span></label>
                        <input 
                            type="text" 
                            class="form-control" 
                            id="pause_code" 
                            bind:value={currentPauseCode.pause_code}
                            maxlength="6"
                            required
                        />
                        <div class="form-text">Maximum 6 caractères</div>
                    </div>
                    <div class="mb-3">
                        <label for="pause_code_name" class="form-label">Nom du code de pause <span class="text-danger">*</span></label>
                        <input 
                            type="text" 
                            class="form-control" 
                            id="pause_code_name" 
                            bind:value={currentPauseCode.pause_code_name}
                            maxlength="30"
                            required
                        />
                        <div class="form-text">Maximum 30 caractères</div>
                    </div>
                    <div class="mb-3">
                        <label for="billable" class="form-label">Facturable</label>
                        <select class="form-select" id="billable" bind:value={currentPauseCode.billable}>
                            <option value="NO">Non</option>
                            <option value="YES">Oui</option>
                            <option value="HALF">Moitié</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="time_limit" class="form-label">Limite de temps (secondes)</label>
                        <input 
                            type="number" 
                            class="form-control" 
                            id="time_limit" 
                            bind:value={currentPauseCode.time_limit}
                            min="0"
                            max="65000"
                        />
                        <div class="form-text">0-65000 (65000 = illimité)</div>
                    </div>
                    <div class="mb-3 form-check">
                        <input 
                            type="checkbox" 
                            class="form-check-input" 
                            id="require_mgr_approval" 
                            bind:checked={currentPauseCode.require_mgr_approval}
                        />
                        <label class="form-check-label" for="require_mgr_approval">Nécessite l'approbation d'un manager</label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" on:click={() => showAddModal = false} disabled={isSubmitting}>
                    Annuler
                </button>
                <button 
                    type="button" 
                    class="btn btn-success" 
                    on:click={() => addPauseCode(currentPauseCode)}
                    disabled={isSubmitting || !currentPauseCode.pause_code || !currentPauseCode.pause_code_name}
                >
                    {#if isSubmitting}
                        <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Traitement...
                    {:else}
                        <i class="bi bi-plus-circle me-1"></i> Ajouter
                    {/if}
                </button>
            </div>
        </div>
    </div>
</div>
<div class="modal-backdrop fade show"></div>
{/if}

<!-- Edit Pause Code Modal -->
{#if showEditModal && currentPauseCode}
<div class="modal fade show" style="display: block;" tabindex="-1" aria-modal="true" role="dialog">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header bg-light">
                <h5 class="modal-title">
                    <i class="bi bi-pencil-square me-2 text-primary"></i>
                    Modifier le code de pause
                </h5>
                <button type="button" class="btn-close" on:click={() => showEditModal = false}></button>
            </div>
            <div class="modal-body">
                <form id="editPauseCodeForm">
                    <div class="mb-3">
                        <label for="edit_pause_code" class="form-label">Code de pause</label>
                        <input 
                            type="text" 
                            class="form-control bg-light" 
                            id="edit_pause_code" 
                            value={currentPauseCode.pause_code}
                            disabled
                        />
                        <div class="form-text">Le code ne peut pas être modifié</div>
                    </div>
                    <div class="mb-3">
                        <label for="edit_pause_code_name" class="form-label">Nom du code de pause <span class="text-danger">*</span></label>
                        <input 
                            type="text" 
                            class="form-control" 
                            id="edit_pause_code_name" 
                            bind:value={currentPauseCode.pause_code_name}
                            maxlength="30"
                            required
                        />
                    </div>
                    <div class="mb-3">
                        <label for="edit_billable" class="form-label">Facturable</label>
                        <select class="form-select" id="edit_billable" bind:value={currentPauseCode.billable}>
                            <option value="NO">Non</option>
                            <option value="YES">Oui</option>
                            <option value="HALF">Moitié</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="edit_time_limit" class="form-label">Limite de temps (secondes)</label>
                        <input 
                            type="number" 
                            class="form-control" 
                            id="edit_time_limit" 
                            bind:value={currentPauseCode.time_limit}
                            min="0"
                            max="65000"
                        />
                        <div class="form-text">0-65000 (65000 = illimité)</div>
                    </div>
                    <div class="mb-3 form-check">
                        <input 
                            type="checkbox" 
                            class="form-check-input" 
                            id="edit_require_mgr_approval" 
                            bind:checked={currentPauseCode.require_mgr_approval}
                        />
                        <label class="form-check-label" for="edit_require_mgr_approval">Nécessite l'approbation d'un manager</label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" on:click={() => showEditModal = false} disabled={isSubmitting}>
                    Annuler
                </button>
                <button 
                    type="button" 
                    class="btn btn-primary" 
                    on:click={() => updatePauseCode(currentPauseCode)}
                    disabled={isSubmitting || !currentPauseCode.pause_code_name}
                >
                    {#if isSubmitting}
                        <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Traitement...
                    {:else}
                        <i class="bi bi-save me-1"></i> Enregistrer
                    {/if}
                </button>
            </div>
        </div>
    </div>
</div>
<div class="modal-backdrop fade show"></div>
{/if}

<!-- Delete Pause Code Modal -->
{#if showDeleteModal && currentPauseCode}
<div class="modal fade show" style="display: block;" tabindex="-1" aria-modal="true" role="dialog">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Confirmer la suppression
                </h5>
                <button type="button" class="btn-close btn-close-white" on:click={() => showDeleteModal = false}></button>
            </div>
            <div class="modal-body">
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Cette action est irréversible.
                </div>
                <p>Êtes-vous sûr de vouloir supprimer le code de pause suivant ?</p>
                <div class="card bg-light mt-3">
                    <div class="card-body">
                        <h5 class="card-title">{currentPauseCode.pause_code}</h5>
                        <p class="card-text mb-1"><strong>Nom:</strong> {currentPauseCode.pause_code_name || 'Sans nom'}</p>
                        <p class="card-text mb-1">
                            <strong>Facturable:</strong> 
                            <span class="badge {getBillableBadgeClass(currentPauseCode.billable)}">
                                {getBillableLabel(currentPauseCode.billable)}
                            </span>
                        </p>
                        <p class="card-text mb-0"><strong>Limite de temps:</strong> {formatTimeLimit(currentPauseCode.time_limit)}</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" on:click={() => showDeleteModal = false} disabled={isSubmitting}>
                    Annuler
                </button>
                <button 
                    type="button" 
                    class="btn btn-danger" 
                    on:click={() => deletePauseCode(currentPauseCode)}
                    disabled={isSubmitting}
                >
                    {#if isSubmitting}
                        <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Traitement...
                    {:else}
                        <i class="bi bi-trash me-1"></i> Supprimer
                    {/if}
                </button>
            </div>
        </div>
    </div>
</div>
<div class="modal-backdrop fade show"></div>
{/if}

<style>
    .page-header {
        border-bottom: 1px solid #dee2e6;
        padding-bottom: 1rem;
    }
    
    .card {
        border: none;
        border-radius: 0.5rem;
        overflow: hidden;
    }
    
    .card-header {
        padding: 1rem;
        font-weight: 500;
    }
    
    .table th {
        font-weight: 600;
    }
    
    .pause-code-row {
        transition: background-color 0.2s;
    }
    
    .pause-code-row:hover {
        background-color: rgba(0, 0, 0, 0.02);
    }
    
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1040;
    }
    
    .modal {
        z-index: 1050;
    }
    
    .shadow-sm {
        box-shadow: 0 .125rem .25rem rgba(0,0,0,.075)!important;
    }
    
    /* Add animation for alerts */
    .alert {
        animation: fadeIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    /* Improve button hover states */
    .btn-outline-primary:hover, .btn-outline-danger:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
</style>