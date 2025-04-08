<script>
    import { slide } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    
    export let statuses = [];
    
    const dispatch = createEventDispatcher();
    
    function handleEdit(status) {
        dispatch('edit', status);
    }
    
    function handleDelete(status) {
        dispatch('delete', status);
    }
    
    function handleCreate() {
        dispatch('create');
    }
    
    function getStatusColor(status) {
        if (status.completed === true) return 'success';
        if (status.scheduled_callback === true) return 'info';
        if (status.not_interested === true) return 'warning';
        if (status.unworkable === true) return 'danger';
        if (status.answering_machine === true) return 'purple';
        if (status.human_answered === true) return 'teal';
        return 'secondary';
    }

    function getStatusIcon(status) {
        if (status.completed) return 'bi-check-circle-fill';
        if (status.scheduled_callback) return 'bi-calendar-event';
        if (status.not_interested) return 'bi-x-circle';
        if (status.unworkable) return 'bi-dash-circle';
        if (status.answering_machine) return 'bi-voicemail';
        if (status.human_answered) return 'bi-person-fill';
        if (status.sale) return 'bi-cart-check-fill';
        if (status.dnc) return 'bi-slash-circle-fill';
        return 'bi-telephone-fill';
    }

    function getStatusDescription(status) {
        if (status.completed) return 'Appel complété';
        if (status.scheduled_callback) return 'Rappel planifié';
        if (status.not_interested) return 'Non intéressé';
        if (status.unworkable) return 'Non exploitable';
        if (status.answering_machine) return 'Répondeur';
        if (status.human_answered) return 'Réponse humaine';
        if (status.sale) return 'Vente réalisée';
        if (status.dnc) return 'Ne pas appeler';
        if (status.customer_contact) return 'Contact client';
        return 'Statut standard';
    }

    function formatCallDuration(minSec, maxSec) {
        if (minSec === 0 && maxSec === 0) return 'Durée non spécifiée';
        if (minSec === maxSec) return `${minSec} secondes`;
        return `${minSec} - ${maxSec} secondes`;
    }
</script>

<div class="card">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Statuts de la campagne</h5>
        <button class="btn btn-sm btn-success" on:click={handleCreate}>
            <i class="bi bi-plus-circle me-1"></i> Nouveau statut
        </button>
    </div>
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover table-striped mb-0">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Nom</th>
                        <th>Type</th>
                        <th>Durée</th>
                        <th>Propriétés</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each statuses as status (status.status)}
                        <tr transition:slide>
                            <td>{status.status}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <span class="status-icon bg-{getStatusColor(status)} me-2">
                                        <i class="bi {getStatusIcon(status)} text-white"></i>
                                    </span>
                                    <div>
                                        <div class="fw-medium">{status.status_name}</div>
                                        <div class="text-muted small">{getStatusDescription(status)}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                {#if status.human_answered}
                                    <span class="badge bg-teal">Humain</span>
                                {:else if status.answering_machine}
                                    <span class="badge bg-purple">Répondeur</span>
                                {:else if status.completed}
                                    <span class="badge bg-success">Complété</span>
                                {:else if status.scheduled_callback}
                                    <span class="badge bg-info">Rappel</span>
                                {:else}
                                    <span class="badge bg-secondary">Standard</span>
                                {/if}
                            </td>
                            <td>{formatCallDuration(status.min_sec, status.max_sec)}</td>
                            <td>
                                <div class="d-flex flex-wrap gap-1">
                                    {#if status.selectable}
                                        <span class="badge bg-light text-dark">Sélectionnable</span>
                                    {/if}
                                    {#if status.sale}
                                        <span class="badge bg-success">Vente</span>
                                    {/if}
                                    {#if status.dnc}
                                        <span class="badge bg-danger">DNC</span>
                                    {/if}
                                    {#if status.customer_contact}
                                        <span class="badge bg-primary">Contact</span>
                                    {/if}
                                    {#if status.not_interested}
                                        <span class="badge bg-warning">Non intéressé</span>
                                    {/if}
                                    {#if status.unworkable}
                                        <span class="badge bg-danger">Non exploitable</span>
                                    {/if}
                                </div>
                            </td>
                            <td class="text-end">
                                <div class="btn-group">
                                    <button 
                                        class="btn btn-sm btn-outline-primary" 
                                        on:click={() => handleEdit(status)}
                                    >
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button 
                                        class="btn btn-sm btn-outline-danger" 
                                        on:click={() => handleDelete(status)}
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

<style>
    .status-icon {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    
    .bg-purple {
        background-color: #6f42c1 !important;
    }

    .bg-teal {
        background-color: #20c997 !important;
    }
</style>