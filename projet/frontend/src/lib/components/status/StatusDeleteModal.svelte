<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let status = null;
    export let show = false;

    function handleConfirm() {
        dispatch('confirm', status);
    }

    function handleClose() {
        dispatch('close');
    }
</script>

<div class="modal" class:show class:d-block={show} tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Confirmer la Suppression</h5>
                <button type="button" class="btn-close" on:click={handleClose}></button>
            </div>
            <div class="modal-body">
                <p>Êtes-vous sûr de vouloir supprimer le statut <strong>{status?.status}</strong> ?</p>
                <p class="text-danger mb-0">Cette action est irréversible.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" on:click={handleClose}>Annuler</button>
                <button type="button" class="btn btn-danger" on:click={handleConfirm}>Supprimer</button>
            </div>
        </div>
    </div>
</div>

{#if show}
<div class="modal-backdrop show"></div>
{/if}

<style>
    .modal-dialog {
        max-width: 400px;
    }
</style>
