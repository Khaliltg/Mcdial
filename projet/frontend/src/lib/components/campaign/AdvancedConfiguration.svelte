<script>
    import axios from 'axios';
    import { onMount } from 'svelte';
    
    export let company;
    
    // Split the dial_statuses string into an array
    $: dialStatuses = company.dial_statuses ? company.dial_statuses.split(' ') : [];
    
    // For adding new dial status
    let newDialStatus = "";
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
            const response = await axios.get(`http://localhost:8000/api/admin/compagnies/getStatusCountsByList/${company.list_id}`);
            statusCounts = response.data;
        } catch (err) {
            console.error('Error fetching status counts:', err);
            error = 'Failed to load status counts';
        } finally {
            loadingCounts = false;
        }
    }

    async function fetchCampaignLists() {
        try {
            loadingLists = true;
            listsError = null;
            const response = await axios.get(`http://localhost:8000/api/admin/compagnies/getCampaignLists/${company.campaign_id}`);
            campaignLists = response.data;
        } catch (err) {
            console.error('Error fetching campaign lists:', err);
            listsError = 'Failed to load campaign lists';
        } finally {
            loadingLists = false;
        }
    }
    
    function addDialStatus() {
        if (newDialStatus.trim()) {
            dialStatuses = [...dialStatuses, newDialStatus.trim()];
            company.dial_statuses = dialStatuses.join(' ');
            newDialStatus = "";
        }
    }
    
    function removeDialStatus(index) {
        dialStatuses = dialStatuses.filter((_, i) => i !== index);
        company.dial_statuses = dialStatuses.join(' ');
    }

    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleString();
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

<div class="card border-0 rounded-4 bg-white">
    <div class="card-header bg-light border-0 py-3">
        <div class="d-flex align-items-center gap-2">
            <div class="bg-primary bg-opacity-10 p-2 rounded-3">
                <i class="bi bi-sliders text-primary"></i>
            </div>
            <h5 class="mb-0 fw-semibold">Advanced Configuration</h5>
        </div>
    </div>

    <div class="card-body p-4">
        <div class="row g-4">
        
            <!-- Dialing Configuration -->
            <div class="col-12">
                <h6 class="fw-semibold mb-3 d-flex align-items-center gap-2">
                    <i class="bi bi-telephone text-primary"></i>
                    Dialing Configuration
                </h6>
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

            <!-- Additional Settings -->
            <div class="col-12">
                <h6 class="fw-semibold mb-3 d-flex align-items-center gap-2">
                    <i class="bi bi-gear text-primary"></i>
                    Additional Settings
                </h6>
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
            </div>

            <!-- Dial Statuses -->
            <div class="col-12">
                <h6 class="fw-semibold mb-3 d-flex align-items-center gap-2">
                    <i class="bi bi-activity text-primary"></i>
                    Dial Statuses
                </h6>
                <div class="row g-3">
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