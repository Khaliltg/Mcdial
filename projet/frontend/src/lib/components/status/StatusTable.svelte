<script>
    import { slide, fade } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    
    export let statuses = [];
    export let isLoading = false;
    export let searchQuery = '';
    
    const dispatch = createEventDispatcher();
    
    // État pour la confirmation de suppression
    let statusToDelete = null;
    let showDeleteConfirm = false;
    
    // Filtrer les statuts en fonction de la recherche
    $: filteredStatuses = searchQuery 
        ? statuses.filter(status => 
            status.status_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            status.status.toString().includes(searchQuery)
          )
        : statuses;
    
    function handleEdit(status, event) {
        event.stopPropagation();
        dispatch('edit', status);
    }
    
    function confirmDelete(status, event) {
        event.stopPropagation();
        statusToDelete = status;
        showDeleteConfirm = true;
    }
    
    function cancelDelete() {
        statusToDelete = null;
        showDeleteConfirm = false;
    }
    
    function executeDelete() {
        if (statusToDelete) {
            dispatch('delete', statusToDelete);
            showDeleteConfirm = false;
            statusToDelete = null;
        }
    }
    
    function handleCreate() {
        dispatch('create');
    }
    
    function handleSearch(event) {
        dispatch('search', event.target.value);
    }
    
    function handleStatusClick(status) {
        dispatch('view', status);
    }
    
    function getStatusColor(status) {
        if (status.completed === true) return 'success';
        if (status.scheduled_callback === true) return 'info';
        if (status.not_interested === true) return 'warning';
        if (status.unworkable === true) return 'danger';
        if (status.answering_machine === true) return 'purple';
        if (status.human_answered === true) return 'teal';
        if (status.sale === true) return 'green';
        if (status.dnc === true) return 'red';
        return 'secondary';
    }

    function getStatusIcon(status) {
        if (status.completed) return 'check-circle';
        if (status.scheduled_callback) return 'calendar';
        if (status.not_interested) return 'x-circle';
        if (status.unworkable) return 'slash-circle';
        if (status.answering_machine) return 'voicemail';
        if (status.human_answered) return 'person';
        if (status.sale) return 'cart-check';
        if (status.dnc) return 'shield-x';
        return 'telephone';
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
    
    function getStatusTypeBadge(status) {
        if (status.human_answered) return { label: 'Humain', color: 'teal' };
        if (status.answering_machine) return { label: 'Répondeur', color: 'purple' };
        if (status.completed) return { label: 'Complété', color: 'success' };
        if (status.scheduled_callback) return { label: 'Rappel', color: 'info' };
        return { label: 'Standard', color: 'secondary' };
    }
</script>

<div class="status-list-container">
    <!-- Search and actions header -->
    <div class="header-container">
        <div class="search-container">
            <div class="search-input-wrapper">
                <input 
                    type="text" 
                    class="search-input" 
                    placeholder="Rechercher un statut..." 
                    value={searchQuery}
                    on:input={handleSearch}
                    aria-label="Rechercher un statut"
                />
                <span class="search-icon">🔍</span>
            </div>
            
            <div class="results-info">
                {#if !isLoading}
                    <span class="results-count">
                        {filteredStatuses.length} statut{filteredStatuses.length !== 1 ? 's' : ''}
                    </span>
                {/if}
            </div>
        </div>
        
        <button class="btn btn-primary" on:click={handleCreate}>
            <span class="btn-icon">+</span>
            <span class="btn-text">Nouveau statut</span>
        </button>
    </div>

    <!-- Main content card -->
    <div class="card">
        {#if isLoading}
            <div class="loading-container" transition:fade>
                <div class="loading-spinner"></div>
                <p>Chargement des statuts...</p>
            </div>
        {:else if filteredStatuses.length === 0}
            <div class="empty-state" transition:fade>
                <div class="empty-icon">📋</div>
                <h3>Aucun statut trouvé</h3>
                {#if searchQuery}
                    <p>Aucun résultat pour "{searchQuery}"</p>
                    <button class="btn btn-secondary" on:click={() => dispatch('search', '')}>
                        Effacer la recherche
                    </button>
                {:else}
                    <p>Commencez par créer un nouveau statut pour cette campagne</p>
                    <button class="btn btn-primary" on:click={handleCreate}>
                        Créer un statut
                    </button>
                {/if}
            </div>
        {:else}
            <div class="table-container" transition:fade>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nom</th>
                            <th>Type</th>
                            <th>Durée</th>
                            <th>Propriétés</th>
                            <th class="actions-column">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredStatuses as status (status.status)}
                            <tr 
                                class="status-row" 
                                transition:slide|local={{ duration: 300 }}
                                on:click={() => handleStatusClick(status)}
                                on:keydown={(e) => e.key === 'Enter' && handleStatusClick(status)}
                                tabindex="0"
                                role="button"
                                aria-label="Voir les détails du statut {status.status_name}"
                            >
                                <td>{status.status}</td>
                                <td>
                                    <div class="status-name-container">
                                        <div class={`status-icon status-${getStatusColor(status)}`}>
                                            <span class="icon-{getStatusIcon(status)}"></span>
                                        </div>
                                        <div class="status-name-info">
                                            <div class="status-name">{status.status_name}</div>
                                            <div class="status-description">{getStatusDescription(status)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    {#if status.human_answered || status.answering_machine || status.completed || status.scheduled_callback}
                                        {@const typeBadge = getStatusTypeBadge(status)}
                                        <span class={`status-badge badge-${typeBadge.color}`}>
                                            {typeBadge.label}
                                        </span>
                                    {:else}
                                        <span class="status-badge badge-secondary">Standard</span>
                                    {/if}
                                </td>
                                <td>
                                    <div class="duration-info">
                                        {formatCallDuration(status.min_sec, status.max_sec)}
                                    </div>
                                </td>
                                <td>
                                    <div class="properties-container">
                                        {#if status.selectable}
                                            <span class="property-badge badge-light">Sélectionnable</span>
                                        {/if}
                                        {#if status.sale}
                                            <span class="property-badge badge-success">Vente</span>
                                        {/if}
                                        {#if status.dnc}
                                            <span class="property-badge badge-danger">DNC</span>
                                        {/if}
                                        {#if status.customer_contact}
                                            <span class="property-badge badge-primary">Contact</span>
                                        {/if}
                                        {#if status.not_interested}
                                            <span class="property-badge badge-warning">Non intéressé</span>
                                        {/if}
                                        {#if status.unworkable}
                                            <span class="property-badge badge-danger">Non exploitable</span>
                                        {/if}
                                    </div>
                                </td>
                                <td class="actions-cell">
                                    <div class="actions-container">
                                        <button 
                                            class="action-button edit-button" 
                                            on:click={(e) => handleEdit(status, e)}
                                            aria-label="Modifier le statut"
                                        >
                                            <span class="icon-pencil"></span>
                                        </button>
                                        <button 
                                            class="action-button delete-button" 
                                            on:click={(e) => confirmDelete(status, e)}
                                            aria-label="Supprimer le statut"
                                        >
                                            <span class="icon-trash"></span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
    
    <!-- Delete confirmation modal -->
    {#if showDeleteConfirm}
        <div class="modal-backdrop" transition:fade={{ duration: 200 }}>
            <div class="modal-container" transition:slide={{ duration: 200 }}>
                <div class="modal-header">
                    <h3>Confirmer la suppression</h3>
                </div>
                <div class="modal-body">
                    <p>Êtes-vous sûr de vouloir supprimer le statut <strong>{statusToDelete?.status_name}</strong> ?</p>
                    <p class="warning-text">Cette action est irréversible et pourrait affecter les données associées à ce statut.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" on:click={cancelDelete}>Annuler</button>
                    <button class="btn btn-danger" on:click={executeDelete}>Supprimer</button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* Container styles */
    .status-list-container {
        width: 100%;
    }
    
    /* Header styles */
    .header-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    /* Search styles */
    .search-container {
        display: flex;
        align-items: center;
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
    
    /* Card styles */
    .card {
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        margin-bottom: 1.5rem;
        overflow: hidden;
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
    
    .data-table tr {
        border-bottom: 1px solid #e5e7eb;
        transition: background-color 0.2s;
    }
    
    .data-table tr:last-child {
        border-bottom: none;
    }
    
    /* Status row styles */
    .status-row {
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
    }
    
    .status-row::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background-color: transparent;
        transition: background-color 0.2s;
    }
    
    .status-row:hover {
        background-color: #f8fafc;
    }
    
    .status-row:hover::before {
        background-color: #2563eb;
    }
    
    .status-row:focus {
        outline: none;
        background-color: #eff6ff;
    }
    
    .status-row:focus::before {
        background-color: #2563eb;
    }
    
    /* Status name and icon styles */
    .status-name-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .status-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: white;
        font-size: 1rem;
    }
    
    .status-success { background-color: #10b981; }
    .status-info { background-color: #3b82f6; }
    .status-warning { background-color: #f59e0b; }
    .status-danger { background-color: #ef4444; }
    .status-purple { background-color: #8b5cf6; }
    .status-teal { background-color: #14b8a6; }
    .status-green { background-color: #22c55e; }
    .status-red { background-color: #dc2626; }
    .status-secondary { background-color: #64748b; }
    
    .status-name-info {
        display: flex;
        flex-direction: column;
    }
    
    .status-name {
        font-weight: 500;
        color: #1e293b;
        margin-bottom: 0.25rem;
    }
    
    .status-description {
        color: #64748b;
        font-size: 0.75rem;
    }
    
    /* Duration info styles */
    .duration-info {
        color: #4b5563;
        font-size: 0.875rem;
    }
    
    /* Status badge styles */
    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .badge-success { background-color: #dcfce7; color: #15803d; }
    .badge-info { background-color: #dbeafe; color: #1d4ed8; }
    .badge-warning { background-color: #fef3c7; color: #b45309; }
    .badge-danger { background-color: #fee2e2; color: #b91c1c; }
    .badge-purple { background-color: #ede9fe; color: #7c3aed; }
    .badge-teal { background-color: #ccfbf1; color: #0d9488; }
    .badge-secondary { background-color: #f3f4f6; color: #4b5563; }
    .badge-light { background-color: #f8fafc; color: #334155; border: 1px solid #e2e8f0; }
    .badge-primary { background-color: #dbeafe; color: #1d4ed8; }
    
    /* Properties container styles */
    .properties-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
    }
    
    .property-badge {
        display: inline-block;
        padding: 0.125rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.6875rem;
        font-weight: 500;
    }
    
    /* Actions column styles */
    .actions-column {
        width: 120px;
        text-align: center;
    }
    
    .actions-cell {
        padding: 0.5rem 1rem;
    }
    
    .actions-container {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
    }
    
    .action-button {
        width: 32px;
        height: 32px;
        border-radius: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
        background-color: transparent;
        color: #64748b;
    }
    
    .action-button:hover {
        background-color: #f1f5f9;
    }
    
    .edit-button:hover {
        color: #2563eb;
    }
    
    .delete-button:hover {
        color: #dc2626;
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
    }
    
    .btn-secondary {
        background-color: #e5e7eb;
        color: #4b5563;
    }
    
    .btn-secondary:hover {
        background-color: #d1d5db;
    }
    
    .btn-danger {
        background-color: #ef4444;
        color: white;
    }
    
    .btn-danger:hover {
        background-color: #dc2626;
    }
    
    .btn-icon {
        font-size: 1rem;
        line-height: 1;
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
    
    /* Modal styles */
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal-container {
        background-color: white;
        border-radius: 0.5rem;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        overflow: hidden;
    }
    
    .modal-header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .modal-header h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
    }
    
    .modal-body {
        padding: 1.5rem;
    }
    
    .modal-body p {
        margin-top: 0;
        color: #4b5563;
    }
    
    .warning-text {
        color: #b91c1c;
        font-size: 0.875rem;
    }
    
    .modal-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }
    
    /* Icons */
    [class^="icon-"] {
        display: inline-block;
        width: 1em;
        height: 1em;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
    }
    
    .icon-check-circle::before { content: '✓'; }
    .icon-calendar::before { content: '📅'; }
    .icon-x-circle::before { content: '✕'; }
    .icon-slash-circle::before { content: '⊘'; }
    .icon-voicemail::before { content: '🔊'; }
    .icon-person::before { content: '👤'; }
    .icon-cart-check::before { content: '🛒'; }
    .icon-shield-x::before { content: '🛡️'; }
    .icon-telephone::before { content: '📞'; }
    .icon-pencil::before { content: '✏️'; }
    .icon-trash::before { content: '🗑️'; }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .header-container {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .search-container {
            width: 100%;
        }
        
        .search-input-wrapper {
            width: 100%;
        }
        
        .btn {
            width: 100%;
        }
        
        .status-name-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
        
        .actions-column {
            width: auto;
        }
        
        .data-table th,
        .data-table td {
            padding: 0.75rem 0.5rem;
        }
        
        .properties-container {
            flex-direction: column;
            align-items: flex-start;
        }
    }
    
    @media (max-width: 640px) {
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
            border-radius: 0.5rem;
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
            color: #64748b;
        }
        
        .actions-container {
            justify-content: flex-start;
        }
    }
</style>