<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    const dispatch = createEventDispatcher();

    export let status = null;
    export let show = false;
    
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

<div class="modal" class:show class:d-block={show} tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" in:fade={{ duration: 200 }} out:fade={{ duration: 150 }}>
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Confirmer la Suppression
                </h5>
                <button type="button" class="btn-close btn-close-white" on:click={handleClose}></button>
            </div>
            <div class="modal-body">
                <div class="alert alert-warning">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Attention :</strong> Cette action est irréversible et pourrait affecter les campagnes utilisant ce statut.
                </div>
                
                <p>Vous êtes sur le point de supprimer le statut :</p>
                <div class="d-flex align-items-center mb-3 p-2 border rounded bg-light">
                    <div class="status-badge me-2">{status?.status}</div>
                    <div>
                        <strong>{status?.status_name || 'Sans nom'}</strong>
                        {#if status?.selectable === 1}
                            <span class="badge bg-success ms-2">Sélectionnable</span>
                        {/if}
                    </div>
                </div>
                
                {#if showConfirmField}
                    <div class="mt-3" transition:fade={{ duration: 200 }}>
                        <label for="confirmField" class="form-label">Pour confirmer, saisissez le code du statut <strong>"{status?.status}"</strong> :</label>
                        <input 
                            type="text" 
                            class="form-control" 
                            id="confirmField" 
                            bind:value={confirmInput}
                            placeholder="Saisissez le code du statut"
                            autocomplete="off"
                        />
                    </div>
                {/if}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" on:click={handleClose}>
                    <i class="bi bi-x-circle me-1"></i> Annuler
                </button>
                <button 
                    type="button" 
                    class="btn btn-danger" 
                    on:click={handleConfirm} 
                    disabled={isConfirmButtonDisabled}
                >
                    <i class="bi bi-trash me-1"></i> Supprimer
                </button>
            </div>
        </div>
    </div>
</div>

{#if show}
<div class="modal-backdrop show"></div>
{/if}

<style>
    .modal-dialog {
        max-width: 500px;
    }
    
    .status-badge {
        background: #e9ecef;
        color: #495057;
        font-weight: bold;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-family: monospace;
        font-size: 1rem;
    }
    
    :global(.modal-backdrop) {
        opacity: 0.7 !important;
    }
    
    .form-control:focus {
        border-color: #dc3545;
        box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
    }
</style>
