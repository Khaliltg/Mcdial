<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { fade, slide, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
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
        
        // Ajouter les modales directement au body pour éviter les problèmes de z-index
        document.body.classList.add('has-modal-container');
        const modalContainer = document.createElement('div');
        modalContainer.id = 'modal-container';
        modalContainer.style.position = 'fixed';
        modalContainer.style.top = '0';
        modalContainer.style.left = '0';
        modalContainer.style.width = '100%';
        modalContainer.style.height = '100%';
        modalContainer.style.pointerEvents = 'none';
        modalContainer.style.zIndex = '9999';
        document.body.appendChild(modalContainer);
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
        console.log('Modal should be open:', showAddModal);
        
        // Force le focus sur la modale pour aider à la rendre visible
        setTimeout(() => {
            const modalElement = document.querySelector('.modal');
            if (modalElement) {
                modalElement.focus();
            }
        }, 100);
    }
    
    function openEditModal(pauseCode) {
        currentPauseCode = { ...pauseCode };
        showEditModal = true;
        console.log('Edit modal should be open:', showEditModal);
        
        // Force le focus sur la modale pour aider à la rendre visible
        setTimeout(() => {
            const modalElement = document.querySelector('.modal');
            if (modalElement) {
                modalElement.focus();
            }
        }, 100);
    }
    
    function openDeleteModal(pauseCode) {
        currentPauseCode = pauseCode;
        showDeleteModal = true;
        console.log('Delete modal should be open:', showDeleteModal);
        
        // Force le focus sur la modale pour aider à la rendre visible
        setTimeout(() => {
            const modalElement = document.querySelector('.modal');
            if (modalElement) {
                modalElement.focus();
            }
        }, 100);
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

<div class="pause-codes-container">
    <!-- Notification -->
    {#if error}
        <div 
            class="notification {error.type === 'success' ? 'notification-success' : 'notification-error'}" 
            transition:fly={{ y: -20, duration: 300, easing: quintOut }}
            role="alert"
        >
            <div class="notification-icon">
                {#if error.type === 'success'}
                    <i class="bi bi-check-circle-fill"></i>
                {:else}
                    <i class="bi bi-exclamation-triangle-fill"></i>
                {/if}
            </div>
            <div class="notification-content">
                {error.message || error}
            </div>
            <button class="notification-close" on:click={() => errorStore.set(null)} aria-label="Fermer" name="close-notification" id="close-notification">
                <i class="bi bi-x"></i>
            </button>
        </div>
    {/if}

    <!-- Header -->
    <header class="page-header">
        <div class="header-content">
            <h1 class="page-title">
                {#if selectedCampaign}
                    <button 
                        class="back-button" 
                        on:click={handleBackToList}
                        aria-label="Retour à la liste des campagnes"
                        id="back-button"
                        name="back-button"
                    >
                        <i class="bi bi-arrow-left"></i>
                    </button>
                    <span>Codes de pause - {selectedCampaign.campaign_name}</span>
                {:else}
                    <span>Gestion des codes de pause</span>
                {/if}
            </h1>
            
            <div class="header-actions">
                {#if !selectedCampaign}
                    <div class="search-container">
                        <div class="search-input-wrapper">
                            <span class="search-icon">
                                <i class="bi bi-search"></i>
                            </span>
                            <input 
                                type="text" 
                                class="search-input" 
                                placeholder="Rechercher une campagne..." 
                                bind:value={searchQuery}
                                name="search"
                                id="search"
                                aria-label="Rechercher une campagne"
                            />
                            {#if searchQuery}
                                <button 
                                    class="search-clear" 
                                    on:click={() => searchQuery = ''}
                                    aria-label="Effacer la recherche"
                                    id="clear-search"
                                    name="clear-search"
                                >
                                    <i class="bi bi-x"></i>
                                </button>
                            {/if}
                        </div>
                    </div>
                    <button 
                        class="btn btn-primary" 
                        on:click={fetchCampaigns}
                        id="refresh-campaigns"
                        name="refresh-campaigns"
                    >
                        <i class="bi bi-arrow-clockwise"></i>
                        <span class="btn-text">Actualiser</span>
                    </button>
                {:else}
                    <button 
                        class="btn btn-primary" 
                        on:click={openAddModal}
                        id="add-pause-code"
                        name="add-pause-code"
                    >
                        <i class="bi bi-plus-circle"></i>
                        <span class="btn-text">Ajouter un code de pause</span>
                    </button>
                {/if}
            </div>
        </div>
    </header>

    <!-- Main content -->
    <main class="main-content">
        {#if !selectedCampaign}
            {#if loading}
                <div class="loading-state" transition:fade={{ duration: 200 }}>
                    <div class="loader"></div>
                    <p>Chargement des campagnes...</p>
                </div>
            {:else if campaigns.length === 0}
                <div class="empty-state" transition:fade={{ duration: 300 }}>
                    <div class="empty-icon">
                        <i class="bi bi-inbox-fill"></i>
                    </div>
                    <h2>Aucune campagne trouvée</h2>
                    <p>Aucune campagne n'est disponible actuellement.</p>
                    <button 
                        class="btn btn-primary" 
                        on:click={fetchCampaigns}
                        id="refresh-empty"
                        name="refresh-empty"
                    >
                        <i class="bi bi-arrow-clockwise"></i>
                        <span>Actualiser</span>
                    </button>
                </div>
            {:else}
                <div class="campaigns-list" transition:fade={{ duration: 300 }}>
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
                </div>
            {/if}
        {:else}
            {#if loadingPauseCodes}
                <div class="loading-state" transition:fade={{ duration: 200 }}>
                    <div class="loader"></div>
                    <p>Chargement des codes de pause...</p>
                </div>
            {:else if pauseCodes.length === 0}
                <div class="empty-state" transition:fade={{ duration: 300 }}>
                    <div class="empty-icon">
                        <i class="bi bi-pause-circle-fill"></i>
                    </div>
                    <h2>Aucun code de pause</h2>
                    <p>Cette campagne ne contient aucun code de pause.</p>
                    <button 
                        class="btn btn-primary" 
                        on:click={openAddModal}
                        id="add-first-pause-code"
                        name="add-first-pause-code"
                    >
                        <i class="bi bi-plus-circle"></i>
                        <span>Ajouter un code de pause</span>
                    </button>
                </div>
            {:else}
                <div class="card" transition:fade={{ duration: 300 }}>
                    <div class="card-header">
                        <div class="card-title">
                            <i class="bi bi-pause-circle"></i>
                            <span>Codes de pause</span>
                        </div>
                        <div class="card-actions">
                            <button 
                                class="btn btn-icon" 
                                on:click={() => fetchPauseCodes(selectedCampaign.campaign_id)} 
                                title="Actualiser"
                                id="refresh-pause-codes"
                                name="refresh-pause-codes"
                            >
                                <i class="bi bi-arrow-clockwise"></i>
                            </button>
                            <button 
                                class="btn btn-primary" 
                                on:click={openAddModal}
                                id="add-pause-code-card"
                                name="add-pause-code-card"
                            >
                                <i class="bi bi-plus-circle"></i>
                                <span class="btn-text">Ajouter</span>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Nom</th>
                                        <th>Facturable</th>
                                        <th>Limite de temps</th>
                                        <th>Approbation</th>
                                        <th class="actions-column">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each pauseCodes as pauseCode (pauseCode.pause_code)}
                                        <tr transition:slide|local={{ duration: 300 }}>
                                            <td class="code-cell" data-label="Code">{pauseCode.pause_code}</td>
                                            <td class="name-cell" data-label="Nom">{pauseCode.pause_code_name || 'Sans nom'}</td>
                                            <td data-label="Facturable">
                                                <span class="badge {getBillableBadgeClass(pauseCode.billable)}">
                                                    {getBillableLabel(pauseCode.billable)}
                                                </span>
                                            </td>
                                            <td class="time-cell" data-label="Limite de temps">{formatTimeLimit(pauseCode.time_limit)}</td>
                                            <td data-label="Approbation">
                                                {#if pauseCode.require_mgr_approval}
                                                    <span class="badge bg-warning">
                                                        <i class="bi bi-shield-check"></i>
                                                        <span>Requise</span>
                                                    </span>
                                                {:else}
                                                    <span class="badge bg-light text-dark">
                                                        <i class="bi bi-shield"></i>
                                                        <span>Non requise</span>
                                                    </span>
                                                {/if}
                                            </td>
                                            <td class="actions-cell" data-label="Actions">
                                                <div class="actions-group">
                                                    <button 
                                                        class="action-button edit-button" 
                                                        on:click={() => openEditModal(pauseCode)}
                                                        title="Modifier"
                                                        aria-label="Modifier le code de pause"
                                                        id="edit-{pauseCode.pause_code}"
                                                        name="edit-pause-code"
                                                    >
                                                        <i class="bi bi-pencil"></i>
                                                    </button>
                                                    <button 
                                                        class="action-button delete-button" 
                                                        on:click={() => openDeleteModal(pauseCode)}
                                                        title="Supprimer"
                                                        aria-label="Supprimer le code de pause"
                                                        id="delete-{pauseCode.pause_code}"
                                                        name="delete-pause-code"
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
    </main>
</div>

<!-- Portail pour les modales -->
<div class="modal-portal">
    <!-- Add Pause Code Modal -->
    {#if showAddModal}
    <div class="modal-wrapper">
        <div class="modal-backdrop" on:click={() => showAddModal = false}></div>
        <div class="modal-dialog" role="dialog" aria-labelledby="add-modal-title" tabindex="-1">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title" id="add-modal-title">
                        <i class="bi bi-plus-circle"></i>
                        <span>Ajouter un code de pause</span>
                    </h2>
                    <button 
                        class="modal-close" 
                        on:click={() => showAddModal = false} 
                        aria-label="Fermer"
                        id="close-add-modal"
                        name="close-add-modal"
                    >
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="addPauseCodeForm" on:submit|preventDefault={() => addPauseCode(currentPauseCode)} name="addPauseCodeForm">
                        <div class="form-group">
                            <label for="pause_code" class="form-label">Code de pause <span class="required">*</span></label>
                            <input 
                                type="text" 
                                class="form-input" 
                                id="pause_code" 
                                name="pause_code"
                                bind:value={currentPauseCode.pause_code}
                                maxlength="6"
                                required
                            />
                            <div class="form-hint">Maximum 6 caractères</div>
                        </div>
                        <div class="form-group">
                            <label for="pause_code_name" class="form-label">Nom du code de pause <span class="required">*</span></label>
                            <input 
                                type="text" 
                                class="form-input" 
                                id="pause_code_name" 
                                name="pause_code_name"
                                bind:value={currentPauseCode.pause_code_name}
                                maxlength="30"
                                required
                            />
                            <div class="form-hint">Maximum 30 caractères</div>
                        </div>
                        <div class="form-group">
                            <label for="billable" class="form-label">Facturable</label>
                            <select class="form-select" id="billable" name="billable" bind:value={currentPauseCode.billable}>
                                <option value="NO">Non</option>
                                <option value="YES">Oui</option>
                                <option value="HALF">Moitié</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="time_limit" class="form-label">Limite de temps (secondes)</label>
                            <input 
                                type="number" 
                                class="form-input" 
                                id="time_limit" 
                                name="time_limit"
                                bind:value={currentPauseCode.time_limit}
                                min="0"
                                max="65000"
                            />
                            <div class="form-hint">0-65000 (65000 = illimité)</div>
                        </div>
                        <div class="form-group checkbox-group">
                            <label class="checkbox-label" for="require_mgr_approval">
                                <input 
                                    type="checkbox" 
                                    class="checkbox-input" 
                                    id="require_mgr_approval" 
                                    name="require_mgr_approval"
                                    bind:checked={currentPauseCode.require_mgr_approval}
                                />
                                <span class="checkbox-text">Nécessite l'approbation d'un manager</span>
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button 
                        type="button" 
                        class="btn btn-secondary" 
                        on:click={() => showAddModal = false} 
                        disabled={isSubmitting}
                        id="cancel-add"
                        name="cancel-add"
                    >
                        Annuler
                    </button>
                    <button 
                        type="submit"
                        form="addPauseCodeForm"
                        class="btn btn-primary" 
                        disabled={isSubmitting || !currentPauseCode.pause_code || !currentPauseCode.pause_code_name}
                        id="submit-add"
                        name="submit-add"
                    >
                        {#if isSubmitting}
                            <span class="spinner"></span>
                            <span>Traitement...</span>
                        {:else}
                            <i class="bi bi-plus-circle"></i>
                            <span>Ajouter</span>
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
    {/if}

    <!-- Edit Pause Code Modal -->
    {#if showEditModal && currentPauseCode}
    <div class="modal-wrapper">
        <div class="modal-backdrop" on:click={() => showEditModal = false}></div>
        <div class="modal-dialog" role="dialog" aria-labelledby="edit-modal-title" tabindex="-1">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title" id="edit-modal-title">
                        <i class="bi bi-pencil-square"></i>
                        <span>Modifier le code de pause</span>
                    </h2>
                    <button 
                        class="modal-close" 
                        on:click={() => showEditModal = false} 
                        aria-label="Fermer"
                        id="close-edit-modal"
                        name="close-edit-modal"
                    >
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="editPauseCodeForm" on:submit|preventDefault={() => updatePauseCode(currentPauseCode)} name="editPauseCode " on:submit|preventDefault={() => updatePauseCode(currentPauseCode)} >
                        <div class="form-group">
                            <label for="edit_pause_code" class="form-label">Code de pause</label>
                            <input 
                                type="text" 
                                class="form-input form-input-disabled" 
                                id="edit_pause_code" 
                                name="edit_pause_code"
                                value={currentPauseCode.pause_code}
                                disabled
                            />
                            <div class="form-hint">Le code ne peut pas être modifié</div>
                        </div>
                        <div class="form-group">
                            <label for="edit_pause_code_name" class="form-label">Nom du code de pause <span class="required">*</span></label>
                            <input 
                                type="text" 
                                class="form-input" 
                                id="edit_pause_code_name" 
                                name="edit_pause_code_name"
                                bind:value={currentPauseCode.pause_code_name}
                                maxlength="30"
                                required
                            />
                        </div>
                        <div class="form-group">
                            <label for="edit_billable" class="form-label">Facturable</label>
                            <select class="form-select" id="edit_billable" name="edit_billable" bind:value={currentPauseCode.billable}>
                                <option value="NO">Non</option>
                                <option value="YES">Oui</option>
                                <option value="HALF">Moitié</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit_time_limit" class="form-label">Limite de temps (secondes)</label>
                            <input 
                                type="number" 
                                class="form-input" 
                                id="edit_time_limit" 
                                name="edit_time_limit"
                                bind:value={currentPauseCode.time_limit}
                                min="0"
                                max="65000"
                            />
                            <div class="form-hint">0-65000 (65000 = illimité)</div>
                        </div>
                        <div class="form-group checkbox-group">
                            <label class="checkbox-label" for="edit_require_mgr_approval">
                                <input 
                                    type="checkbox" 
                                    class="checkbox-input" 
                                    id="edit_require_mgr_approval" 
                                    name="edit_require_mgr_approval"
                                    bind:checked={currentPauseCode.require_mgr_approval}
                                />
                                <span class="checkbox-text">Nécessite l'approbation d'un manager</span>
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button 
                        type="button" 
                        class="btn btn-secondary" 
                        on:click={() => showEditModal = false} 
                        disabled={isSubmitting}
                        id="cancel-edit"
                        name="cancel-edit"
                    >
                        Annuler
                    </button>
                    <button 
                        type="submit"
                        form="editPauseCodeForm"
                        class="btn btn-primary" 
                        disabled={isSubmitting || !currentPauseCode.pause_code_name}
                        id="submit-edit"
                        name="submit-edit"
                    >
                        {#if isSubmitting}
                            <span class="spinner"></span>
                            <span>Traitement...</span>
                        {:else}
                            <i class="bi bi-save"></i>
                            <span>Enregistrer</span>
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
    {/if}

    <!-- Delete Pause Code Modal -->
    {#if showDeleteModal && currentPauseCode}
    <div class="modal-wrapper">
        <div class="modal-backdrop" on:click={() => showDeleteModal = false}></div>
        <div class="modal-dialog" role="dialog" aria-labelledby="delete-modal-title" tabindex="-1">
            <div class="modal-content">
                <div class="modal-header modal-header-danger">
                    <h2 class="modal-title" id="delete-modal-title">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                        <span>Confirmer la suppression</span>
                    </h2>
                    <button 
                        class="modal-close" 
                        on:click={() => showDeleteModal = false} 
                        aria-label="Fermer"
                        id="close-delete-modal"
                        name="close-delete-modal"
                    >
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                        <span>Cette action est irréversible.</span>
                    </div>
                    <p>Êtes-vous sûr de vouloir supprimer le code de pause suivant ?</p>
                    <div class="pause-code-preview">
                        <div class="preview-header">
                            <span class="preview-code">{currentPauseCode.pause_code}</span>
                            <span class="preview-name">{currentPauseCode.pause_code_name || 'Sans nom'}</span>
                        </div>
                        <div class="preview-details">
                            <div class="preview-item">
                                <span class="preview-label">Facturable:</span>
                                <span class={`badge ${getBillableBadgeClass(currentPauseCode.billable)}`}>
                                    {getBillableLabel(currentPauseCode.billable)}
                                </span>
                            </div>
                            <div class="preview-item">
                                <span class="preview-label">Limite de temps:</span>
                                <span class="preview-value">{formatTimeLimit(currentPauseCode.time_limit)}</span>
                            </div>
                            <div class="preview-item">
                                <span class="preview-label">Approbation manager:</span>
                                <span class="preview-value">{currentPauseCode.require_mgr_approval ? 'Requise' : 'Non requise'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button 
                        type="button" 
                        class="btn btn-secondary" 
                        on:click={() => showDeleteModal = false} 
                        disabled={isSubmitting}
                        id="cancel-delete"
                        name="cancel-delete"
                    >
                        Annuler
                    </button>
                    <button 
                        type="button"
                        class="btn btn-danger" 
                        on:click={() => deletePauseCode(currentPauseCode)}
                        disabled={isSubmitting}
                        id="confirm-delete"
                        name="confirm-delete"
                    >
                        {#if isSubmitting}
                            <span class="spinner"></span>
                            <span>Traitement...</span>
                        {:else}
                            <i class="bi bi-trash"></i>
                            <span>Supprimer</span>
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
    {/if}
</div>

<style>
    /* Base styles */
    .pause-codes-container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 1.5rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        color: #333;
    }
    
    /* Header styles */
    .page-header {
        margin-bottom: 2rem;
    }
    
    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .page-title {
        display: flex;
        align-items: center;
        font-size: 1.5rem;
        font-weight: 600;
        color: #2563eb;
        margin: 0;
    }
    
    .back-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 0.375rem;
        background-color: #f3f4f6;
        border: none;
        color: #4b5563;
        margin-right: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .back-button:hover {
        background-color: #e5e7eb;
        color: #1f2937;
        transform: translateX(-2px);
    }
    
    .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    /* Search styles */
    .search-container {
        position: relative;
    }
    
    .search-input-wrapper {
        position: relative;
        width: 300px;
    }
    
    .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .search-input {
        width: 100%;
        padding: 0.625rem 2.5rem 0.625rem 2.5rem;
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
        gap: 0.5rem;
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
    
    .btn-primary:disabled {
        background-color: #93c5fd;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
    
    .btn-secondary {
        background-color: #f3f4f6;
        color: #4b5563;
    }
    
    .btn-secondary:hover {
        background-color: #e5e7eb;
        transform: translateY(-1px);
    }
    
    .btn-danger {
        background-color: #ef4444;
        color: white;
    }
    
    .btn-danger:hover {
        background-color: #dc2626;
        transform: translateY(-1px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    
    .btn-icon {
        padding: 0.5rem;
        border-radius: 0.375rem;
        background-color: transparent;
    }
    
    .btn-icon:hover {
        background-color: #f3f4f6;
    }
    
    .btn-text {
        display: inline-block;
    }
    
    /* Card styles */
    .card {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        transition: box-shadow 0.3s ease;
    }
    
    .card:hover {
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    }
    
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background-color: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .card-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: #1f2937;
    }
    
    .card-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .card-body {
        padding: 0;
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
        border-bottom: 1px solid #e5e7eb;
    }
    
    .data-table th {
        font-weight: 600;
        color: #4b5563;
        background-color: #f9fafb;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .data-table tr:last-child td {
        border-bottom: none;
    }
    
    .data-table tr {
        transition: background-color 0.2s;
    }
    
    .data-table tr:hover {
        background-color: #f9fafb;
    }
    
    .code-cell {
        font-weight: 600;
        font-family: monospace;
    }
    
    .name-cell {
        max-width: 250px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .time-cell {
        font-family: monospace;
        color: #4b5563;
    }
    
    .actions-column {
        width: 100px;
        text-align: center;
    }
    
    .actions-cell {
        text-align: center;
    }
    
    .actions-group {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
    }
    
    .action-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 0.375rem;
        background-color: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .edit-button {
        color: #2563eb;
    }
    
    .edit-button:hover {
        background-color: #eff6ff;
        transform: translateY(-1px);
    }
    
    .delete-button {
        color: #ef4444;
    }
    
    .delete-button:hover {
        background-color: #fef2f2;
        transform: translateY(-1px);
    }
    
    /* Badge styles */
    .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.625rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
    }
    
    .bg-success {
        background-color: #dcfce7;
        color: #15803d;
    }
    
    .bg-warning {
        background-color: #fef3c7;
        color: #b45309;
    }
    
    .bg-danger {
        background-color: #fee2e2;
        color: #b91c1c;
    }
    
    .bg-light {
        background-color: #f3f4f6;
        color: #4b5563;
    }
    
    /* Loading state */
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1.5rem;
        text-align: center;
    }
    
    .loader {
        width: 40px;
        height: 40px;
        border: 3px solid #e0e7ff;
        border-top: 3px solid #2563eb;
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
        color: #d1d5db;
        margin-bottom: 1rem;
    }
    
    .empty-state h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }
    
    .empty-state p {
        color: #6b7280;
        margin-bottom: 1.5rem;
    }
    
    /* Modal styles */
    .modal-portal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 0;
        overflow: visible;
        z-index: 9999;
    }
    
    .modal-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
    }
    
    .modal-dialog {
        position: relative;
        width: 90%;
        max-width: 500px;
        margin: 1.75rem auto;
        z-index: 10000;
    }
    
    .modal-content {
        position: relative;
        display: flex;
        flex-direction: column;
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        overflow: hidden;
        animation: modalAppear 0.3s ease-out;
    }
    
    @keyframes modalAppear {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        background-color: #f9fafb;
    }
    
    .modal-header-danger {
        background-color: #fee2e2;
        color: #b91c1c;
    }
    
    .modal-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
    }
    
    .modal-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 0.375rem;
        background-color: transparent;
        border: none;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .modal-close:hover {
        background-color: #f3f4f6;
        color: #1f2937;
    }
    
    .modal-body {
        padding: 1.5rem;
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1.25rem 1.5rem;
        border-top: 1px solid #e5e7eb;
        background-color: #f9fafb;
    }
    
    /* Form styles */
    .form-group {
        margin-bottom: 1.25rem;
    }
    
    .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #4b5563;
    }
    
    .required {
        color: #ef4444;
        margin-left: 0.25rem;
    }
    
    .form-input,
    .form-select {
        width: 100%;
        padding: 0.625rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    .form-input:focus,
    .form-select:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    
    .form-input-disabled {
        background-color: #f3f4f6;
        cursor: not-allowed;
    }
    
    .form-hint {
        margin-top: 0.375rem;
        font-size: 0.75rem;
        color: #6b7280;
    }
    
    .checkbox-group {
        display: flex;
        align-items: center;
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }
    
    .checkbox-input {
        width: 1rem;
        height: 1rem;
    }
    
    .checkbox-text {
        font-size: 0.875rem;
        color: #4b5563;
    }
    
    /* Alert styles */
    .alert {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
    }
    
    .alert-warning {
        background-color: #fef3c7;
        color: #b45309;
    }
    
    /* Notification styles */
    .notification {
        position: fixed;
        top: 1rem;
        right: 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 0.375rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        max-width: 400px;
        z-index: 1100;
        animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .notification-success {
        background-color: #dcfce7;
        color: #15803d;
        border-left: 4px solid #10b981;
    }
    
    .notification-error {
        background-color: #fee2e2;
        color: #b91c1c;
        border-left: 4px solid #ef4444;
    }
    
    .notification-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    
    .notification-content {
        flex: 1;
    }
    
    .notification-close {
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        color: currentColor;
        opacity: 0.7;
        cursor: pointer;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
    
    /* Pause code preview styles */
    .pause-code-preview {
        background-color: #f9fafb;
        border-radius: 0.375rem;
        border: 1px solid #e5e7eb;
        overflow: hidden;
        margin-top: 1rem;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .pause-code-preview:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .preview-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background-color: #f3f4f6;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .preview-code {
        font-weight: 600;
        font-family: monospace;
        color: #1f2937;
    }
    
    .preview-name {
        font-weight: 500;
        color: #4b5563;
    }
    
    .preview-details {
        padding: 0.75rem 1rem;
    }
    
    .preview-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    
    .preview-item:last-child {
        margin-bottom: 0;
    }
    
    .preview-label {
        font-weight: 500;
        color: #6b7280;
        width: 140px;
    }
    
    .preview-value {
        color: #1f2937;
    }
    
    /* Spinner */
    .spinner {
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .header-content {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .header-actions {
            width: 100%;
            flex-wrap: wrap;
        }
        
        .search-input-wrapper {
            width: 100%;
        }
        
        .btn {
            width: 100%;
        }
        
        .data-table th,
        .data-table td {
            padding: 0.75rem 0.5rem;
        }
        
        .actions-column {
            width: 80px;
        }
    }
    
    @media (max-width: 640px) {
        .pause-codes-container {
            padding: 1rem;
        }
        
        .data-table {
            display: block;
        }
        
        .data-table thead {
            display: none;
        }
        
        .data-table tbody {
            display: block;
        }
        
        .data-table tr {
            display: block;
            margin-bottom: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            padding: 1rem;
        }
        
        .data-table td {
            display: flex;
            padding: 0.5rem 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .data-table td:last-child {
            border-bottom: none;
        }
        
        .data-table td::before {
            content: attr(data-label);
            font-weight: 600;
            width: 120px;
            min-width: 120px;
            color: #6b7280;
        }
        
        .actions-cell {
            justify-content: flex-start;
        }
        
        .actions-group {
            justify-content: flex-start;
        }
    }
</style>