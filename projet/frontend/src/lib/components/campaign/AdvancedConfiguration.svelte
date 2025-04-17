<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
    import { errorStore } from '$lib/stores/errorStore';
    
    const dispatch = createEventDispatcher();
    
    export let company;
    
    // UI state
    let saving = false;
    let hasChanges = false;
    
    // Split the dial_statuses string into an array
    $: dialStatuses = company.dial_statuses ? company.dial_statuses.split(' ') : [];
    
    // For adding new dial status
    let newDialStatus = "";
    let originalDialStatuses = company.dial_statuses || '';
    let statusCounts = {};
    let loadingCounts = false;
    let error = null;

    // For campaign lists
    let campaignLists = [];
    let loadingLists = false;
    let listsError = null;
    
    async function fetchStatusCounts() {
        try {
            loadingCounts = true;
            error = null;
            const response = await fetchWithAuth(`http://localhost:8000/api/admin/compagnies/getStatusCountsByList/${company.list_id}`);
            
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: Impossible de récupérer les statistiques de statut`);
            }
            
            statusCounts = await response.json();
        } catch (err) {
            console.error('Error fetching status counts:', err);
            error = err.message || 'Échec du chargement des statistiques de statut';
            errorStore.set(error);
            setTimeout(() => errorStore.set(""), 3000);
        } finally {
            loadingCounts = false;
        }
    }

    async function fetchCampaignLists() {
        try {
            loadingLists = true;
            listsError = "";
            const response = await fetchWithAuth(`http://localhost:8000/api/admin/compagnies/getCampaignLists/${company.campaign_id}`);
            
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: Impossible de récupérer les listes de la campagne`);
            }
            
            const data = await response.json();
            
            // Check if data.data exists, otherwise use data directly
            campaignLists = (data.data !== undefined) ? data.data : 
                           (Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching campaign lists:', err);
            listsError = err.message || 'Échec du chargement des listes de campagne';
            errorStore.set(listsError);
            setTimeout(() => errorStore.set(""), 3000);
        } finally {
            loadingLists = false;
        }
    }
    
    function addDialStatus() {
        if (newDialStatus.trim()) {
            // Check if status already exists
            if (dialStatuses.includes(newDialStatus.trim())) {
                errorStore.set(`Le statut "${newDialStatus.trim()}" existe déjà`);
                setTimeout(() => errorStore.set(''), 3000);
                return;
            }
            
            dialStatuses = [...dialStatuses, newDialStatus.trim()];
            company.dial_statuses = dialStatuses.join(' ');
            newDialStatus = "";
            hasChanges = true;
        }
    }
    
    function removeDialStatus(index) {
        dialStatuses = dialStatuses.filter((_, i) => i !== index);
        company.dial_statuses = dialStatuses.join(' ');
        hasChanges = true;
    }

    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    async function saveDialStatuses() {
        try {
            saving = true;
            
            // Only save if there are changes
            if (!hasChanges) {
                errorStore.set('Aucun changement à enregistrer');
                setTimeout(() => errorStore.set(''), 3000);
                saving = false;
                return;
            }
            
            // Prepare data for update
            const updateData = {
                dial_statuses: company.dial_statuses
            };
            
            // Call API to update campaign
            const response = await fetchWithAuth(`http://localhost:8000/api/admin/compagnies/update/${company.campaign_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: Impossible de mettre à jour les statuts`);
            }
            
            // Update original value to track future changes
            originalDialStatuses = company.dial_statuses;
            hasChanges = false;
            
            // Show success message
            errorStore.set('Statuts d\'appel mis à jour avec succès');
            setTimeout(() => errorStore.set(''), 3000);
            
            // Notify parent component
            dispatch('saved');
            
        } catch (err) {
            console.error('Error saving dial statuses:', err);
            const errorMessage = err && typeof err === 'object' && 'message' in err ? err.message : 'Erreur lors de la mise à jour des statuts';
            errorStore.set(errorMessage);
            setTimeout(() => errorStore.set(''), 5000);
        } finally {
            saving = false;
        }
    }
    
    // Handle key press in input field
    function handleKeyDown(event) {
        if (event.key === 'Enter') {
            addDialStatus();
        }
    }

    // Fetch data when component mounts
    onMount(() => {
        if (company.campaign_id) {
            fetchCampaignLists();
        }
        if (company.list_id) {
            fetchStatusCounts();
        }
    });
</script>

<div class="container-fluid p-0">
    <div class="row g-4">
        
        <!-- Advanced Parameters Section -->
        <div class="col-12">
            <div class="card border shadow-sm rounded-3">
                <div class="card-header bg-primary bg-opacity-10 py-3">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-sliders text-primary fs-5"></i>
                        <h5 class="mb-0 fw-semibold">Paramètres Avancés</h5>
                    </div>
                </div>
                <div class="card-body p-4">
                    <div class="row g-3">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="list_order" class="form-label">List Order</label>
                            <select 
                                id="list_order" 
                                class="form-select form-select-sm" 
                                bind:value={company.list_order}
                            >
                                <option value="DOWN">Down</option>
                                <option value="UP">Up</option>
                                <option value="RANDOM">Random</option>
                            </select>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="force_reset_hopper" class="form-label">Force Reset of Hopper</label>
                            <select 
                                id="force_reset_hopper" 
                                class="form-select form-select-sm" 
                                bind:value={company.force_reset_hopper}
                            >
                                <option value="Y">Yes</option>
                                <option value="N">No</option>
                            </select>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="dial_timeout" class="form-label">Dial Timeout (seconds)</label>
                            <input 
                                type="number" 
                                id="dial_timeout" 
                                class="form-control form-control-sm" 
                                bind:value={company.dial_timeout}
                                min="1"
                                placeholder="Enter dial timeout"
                            >
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="dial_prefix" class="form-label">Dial Prefix</label>
                            <input 
                                type="text" 
                                id="dial_prefix" 
                                class="form-control form-control-sm" 
                                bind:value={company.dial_prefix}
                                placeholder="Enter dial prefix"
                            >
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Dial Status Configuration -->
        <div class="col-12">
            <div class="card border shadow-sm rounded-3">
                <div class="card-header bg-primary bg-opacity-10 py-3 d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-telephone-x text-primary fs-5"></i>
                        <h5 class="mb-0 fw-semibold">Statuts d'Appel</h5>
                    </div>
                    
                    <button 
                        on:click={saveDialStatuses}
                        disabled={saving || !hasChanges}
                        class="btn btn-sm btn-primary d-flex align-items-center gap-1"
                    >
                        {#if saving}
                            <div class="spinner-border spinner-border-sm me-1" role="status">
                                <span class="visually-hidden">Chargement...</span>
                            </div>
                            Enregistrement...
                        {:else}
                            <i class="bi bi-save"></i>
                            Sauvegarder les statuts
                        {/if}
                    </button>
                </div>
                <div class="card-body p-4">
                    <div class="row g-3">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="hopper_level" class="form-label">Hopper Level</label>
                            <input 
                                type="number" 
                                id="hopper_level" 
                                class="form-control form-control-sm" 
                                bind:value={company.hopper_level}
                                min="1"
                                placeholder="Enter hopper level"
                            >
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="local_call_time" class="form-label">Local Call Time</label>
                            <input 
                                type="text" 
                                id="local_call_time" 
                                class="form-control form-control-sm" 
                                bind:value={company.local_call_time}
                                placeholder="Enter local call time"
                            >
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="auto_dial_level" class="form-label">Auto Dial Level</label>
                            <input 
                                type="number" 
                                id="auto_dial_level" 
                                class="form-control form-control-sm" 
                                bind:value={company.auto_dial_level}
                                min="1"
                                placeholder="Enter auto dial level"
                            >
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="next_agent_call" class="form-label">Next Agent Call</label>
                            <select 
                                id="next_agent_call" 
                                class="form-select form-select-sm" 
                                bind:value={company.next_agent_call}
                            >
                                <option value="random">Random</option>
                                <option value="oldest_call_start">Oldest Call Start</option>
                                <option value="oldest_call_finish">Oldest Call Finish</option>
                            </select>
                        </div>
                    </div>
                    </div>
                    <div class="col-12">
                        <!-- Status Counts -->
                        <div class="mb-4">
                            <h6 class="fw-semibold mb-3">Status Distribution</h6>
                            {#if loadingCounts}
                                <div class="d-flex align-items-center gap-2 text-muted">
                                    <div class="spinner-border spinner-border-sm" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    Loading status counts...
                                </div>
                            {:else if error}
                                <div class="alert alert-danger" role="alert">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    {error}
                                </div>
                            {:else if Object.keys(statusCounts).length === 0}
                                <div class="alert alert-info" role="alert">
                                    <i class="bi bi-info-circle me-2"></i>
                                    No status data available.
                                </div>
                            {:else}
                                <div class="table-responsive">
                                    <table class="table table-sm table-hover">
                                        <thead class="table-light">
                                            <tr>
                                                <th>Status</th>
                                                <th>Count</th>
                                                <th>Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each Object.entries(statusCounts) as [status, count]}
                                                <tr>
                                                    <td>
                                                        <span class="badge" class:bg-success={status === 'ANSWERED'}
                                                                          class:bg-warning={status === 'NOANSWER'}
                                                                          class:bg-danger={status === 'FAILED'}
                                                                          class:bg-secondary={!['ANSWERED', 'NOANSWER', 'FAILED'].includes(status)}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td>{count}</td>
                                                    <td>
                                                        {((count / Object.values(statusCounts).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {/if}
                        </div>

                        <!-- Add new status -->
                        <div class="d-flex gap-2 mb-3">
                            <input 
                                type="text" 
                                bind:value={newDialStatus}
                                placeholder="Enter new dial status"
                                class="form-control form-control-sm"
                            >
                            <button 
                                on:click={addDialStatus}
                                class="btn btn-primary btn-sm d-flex align-items-center gap-2"
                            >
                                <i class="bi bi-plus-lg"></i>
                                Add Status
                            </button>
                        </div>

                        <!-- Status list -->
                        {#if dialStatuses.length === 0}
                            <div class="alert alert-info" role="alert">
                                <i class="bi bi-info-circle me-2"></i>
                                No dial statuses added yet.
                            </div>
                        {:else}
                            <div class="list-group">
                                {#each dialStatuses as status, index}
                                    <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                                        <span class="badge" class:bg-success={status === 'ANSWERED'}
                                                          class:bg-warning={status === 'NOANSWER'}
                                                          class:bg-danger={status === 'FAILED'}
                                                          class:bg-secondary={!['ANSWERED', 'NOANSWER', 'FAILED'].includes(status)}>
                                            {status}
                                        </span>
                                        <button 
                                            on:click={() => removeDialStatus(index)}
                                            class="btn btn-sm btn-light text-danger"
                                            title="Remove status"
                                        >
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    :global(.form-control), :global(.form-select) {
        border-color: var(--bs-gray-200);
    }

    :global(.form-control:focus), :global(.form-select:focus) {
        border-color: var(--bs-primary);
        box-shadow: 0 0 0 0.25rem rgba(var(--bs-primary-rgb), 0.1);
    }

    :global(.form-label) {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--bs-gray-700);
        margin-bottom: 0.5rem;
    }

    :global(.list-group-item) {
        padding: 0.75rem 1rem;
        border-color: var(--bs-gray-200);
    }

    :global(.list-group-item:hover) {
        background-color: var(--bs-gray-100);
    }

    :global(.badge) {
        font-weight: 500;
        padding: 0.5em 0.75em;
    }

    :global(.btn-light) {
        background-color: var(--bs-gray-100);
        border-color: var(--bs-gray-200);
    }

    :global(.btn-light:hover) {
        background-color: var(--bs-gray-200);
        border-color: var(--bs-gray-300);
    }

    :global(.table) {
        --bs-table-hover-bg: var(--bs-gray-100);
        --bs-table-hover-color: var(--bs-gray-900);
    }

    :global(.table td), :global(.table th) {
        white-space: nowrap;
    }
</style>