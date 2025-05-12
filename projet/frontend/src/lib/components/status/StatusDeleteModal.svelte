<script>
    import { createEventDispatcher, onMount } from 'svelte';
    const dispatch = createEventDispatcher();

    export let status = null;
    export let show = false;
    export let isSubmitting = false;
    
    let confirmInput = '';
    let isConfirmButtonDisabled = true;
    let showConfirmField = false;
    let confirmTimer;
    
    $: isConfirmButtonDisabled = !status || confirmInput !== status?.status;
    
    // Reset the confirmation input when the modal is shown/hidden
    $: if (show) {
        // Add a small delay before showing the confirmation field for better UX
        confirmTimer = setTimeout(() => {
            confirmInput = '';
            showConfirmField = true;
        }, 300);
    } else {
        showConfirmField = false;
        if (confirmTimer) clearTimeout(confirmTimer);
    }

    function handleConfirm() {
        if (confirmInput === status?.status) {
            dispatch('confirm', status);
        }
    }

    function handleClose() {
        confirmInput = '';
        dispatch('close');
    }
    
    // Clean up timer on component destruction
    onMount(() => {
        return () => {
            if (confirmTimer) clearTimeout(confirmTimer);
        };
    });
</script>

{#if show}
<div class="modal-wrapper">
    <div class="modal-backdrop" on:click={handleClose} on:keydown={(e) => e.key === 'Escape' && handleClose()} role="presentation"></div>
    <div class="modal-dialog" role="dialog" aria-labelledby="delete-modal-title" tabindex="-1">
        <div class="modal-content">
            <div class="modal-header modal-header-danger">
                <h2 class="modal-title" id="delete-modal-title">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <span>Confirmer la suppression</span>
                </h2>
                <button 
                    class="modal-close" 
                    on:click={handleClose} 
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
                    <span>Cette action est irréversible et pourrait affecter les campagnes utilisant ce statut.</span>
                </div>
                <p>Êtes-vous sûr de vouloir supprimer le statut suivant ?</p>
                <div class="status-preview">
                    <div class="preview-header">
                        <span class="preview-code">{status?.status}</span>
                        <span class="preview-name">{status?.status_name || 'Sans nom'}</span>
                    </div>
                    <div class="preview-details">
                        <div class="preview-item">
                            <span class="preview-label">Sélectionnable:</span>
                            <span class="badge bg-{status?.selectable ? 'success' : 'secondary'}">
                                {status?.selectable ? 'Oui' : 'Non'}
                            </span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Temps min/max:</span>
                            <span class="preview-value">{status?.min_sec}s / {status?.max_sec}s</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Réponse humaine:</span>
                            <span class="preview-value">{status?.human_answered ? 'Oui' : 'Non'}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Champ de confirmation -->
                {#if showConfirmField}
                    <div class="confirm-field">
                        <label for="confirmField">Pour confirmer, saisissez le code du statut <strong>"{status?.status}"</strong> :</label>
                        <div class="input-group">
                            <span class="input-group-text bg-danger text-white">
                                <i class="bi bi-shield-lock"></i>
                            </span>
                            <input 
                                type="text" 
                                id="confirmField" 
                                class="form-control"
                                bind:value={confirmInput}
                                placeholder="Saisissez le code du statut"
                                autocomplete="off"
                            />
                        </div>
                    </div>
                {/if}
            </div>
            <div class="modal-footer">
                <button 
                    type="button" 
                    class="btn btn-secondary" 
                    on:click={handleClose} 
                    id="cancel-delete"
                    name="cancel-delete"
                >
                    Annuler
                </button>
                <button 
                    type="button"
                    class="btn btn-danger" 
                    on:click={handleConfirm} 
                    disabled={isConfirmButtonDisabled}
                    id="confirm-delete"
                    name="confirm-delete"
                >
                    <i class="bi bi-trash"></i>
                    <span>Supprimer</span>
                </button>
            </div>
        </div>
    </div>
</div>
{/if}

<style>
    .modal-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1050;
    }
    
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1051;
    }
    
    .modal-dialog {
        position: relative;
        width: 100%;
        max-width: 500px;
        margin: 1.75rem auto;
        z-index: 1052;
    }
    
    .modal-content {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
        outline: 0;
    }
    
    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid #dee2e6;
    }
    
    .modal-header-danger {
        background-color: #dc3545;
        color: white;
    }
    
    .modal-title {
        margin: 0;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .modal-close {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        color: white;
        cursor: pointer;
    }
    
    .modal-body {
        position: relative;
        flex: 1 1 auto;
        padding: 1rem;
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        padding: 1rem;
        border-top: 1px solid #dee2e6;
        gap: 0.5rem;
    }
    
    .status-preview {
        margin-top: 1rem;
        border: 1px solid #dee2e6;
        border-radius: 0.375rem;
        overflow: hidden;
    }
    
    .preview-header {
        display: flex;
        align-items: center;
        background-color: #f8f9fa;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #dee2e6;
    }
    
    .preview-code {
        font-weight: bold;
        padding: 0.25rem 0.5rem;
        background-color: #e9ecef;
        border-radius: 0.25rem;
        margin-right: 0.75rem;
    }
    
    .preview-name {
        font-weight: 500;
        color: #495057;
    }
    
    .preview-details {
        padding: 1rem;
    }
    
    .preview-item {
        display: flex;
        margin-bottom: 0.5rem;
    }
    
    .preview-label {
        font-weight: 500;
        width: 150px;
        color: #6c757d;
    }
    
    .preview-value {
        color: #212529;
    }
    
    .alert {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .confirm-field {
        margin-top: 1.5rem;
        background-color: #f8f9fa;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #dc3545;
    }
    
    .confirm-field label {
        display: block;
        margin-bottom: 0.5rem;
    }
    
    .input-group {
        display: flex;
    }
    
    .input-group-text {
        display: flex;
        align-items: center;
        padding: 0.375rem 0.75rem;
        border: 1px solid #dc3545;
        border-radius: 0.25rem 0 0 0.25rem;
    }
    
    .form-control {
        flex: 1;
        padding: 0.375rem 0.75rem;
        font-size: 1rem;
        border: 1px solid #ced4da;
        border-left: none;
        border-radius: 0 0.25rem 0.25rem 0;
    }
</style>
