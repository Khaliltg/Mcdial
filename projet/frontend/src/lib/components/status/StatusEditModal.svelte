<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let status = null;
    export let show = false;

    let editedStatus = {
        status: '',
        status_name: '',
        min_sec: 0,
        max_sec: 0,
        selectable: false,
        human_answered: false,
        sale: false,
        dnc: false,
        customer_contact: false,
        not_interested: false,
        unworkable: false,
        scheduled_callback: false,
        completed: false,
        answering_machine: false
    };

    $: if (status && show) {
        editedStatus = {
            ...editedStatus,
            status: status.status || '',
            status_name: status.status_name || '',
            min_sec: status.min_sec || 0,
            max_sec: status.max_sec || 0,
            selectable: status.selectable || false,
            human_answered: status.human_answered || false,
            sale: status.sale || false,
            dnc: status.dnc || false,
            customer_contact: status.customer_contact || false,
            not_interested: status.not_interested || false,
            unworkable: status.unworkable || false,
            scheduled_callback: status.scheduled_callback || false,
            completed: status.completed || false,
            answering_machine: status.answering_machine || false
        };
    }

    function validateStatus(status) {
        if (!status.status || !status.status_name) {
            throw new Error('Le code et le nom du statut sont requis');
        }

        return {
            status: status.status.trim(),
            status_name: status.status_name.trim(),
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
    }

    function handleSubmit() {
        try {
            const validatedStatus = validateStatus(editedStatus);
            dispatch('save', validatedStatus);
        } catch (error) {
            alert(error.message);
        }
    }

    function handleClose() {
        dispatch('close');
    }
</script>

<div class="modal" class:show class:d-block={show} tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Modifier le Statut</h5>
                <button type="button" class="btn-close" on:click={handleClose}></button>
            </div>
            <div class="modal-body">
                <form on:submit|preventDefault={handleSubmit}>
                    <div class="mb-3">
                        <label class="form-label">Code du Statut</label>
                        <input type="text" class="form-control" bind:value={editedStatus.status} required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Nom du Statut</label>
                        <input type="text" class="form-control" bind:value={editedStatus.status_name} required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Temps Min (secondes)</label>
                        <input type="number" class="form-control" bind:value={editedStatus.min_sec} required min="0">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Temps Max (secondes)</label>
                        <input type="number" class="form-control" bind:value={editedStatus.max_sec} required min="0">
                    </div>
                    <div class="form-check mb-2">
                        <input type="checkbox" class="form-check-input" id="selectable" 
                            bind:checked={editedStatus.selectable}>
                        <label class="form-check-label" for="selectable">Sélectionnable</label>
                    </div>
                    <div class="form-check mb-2">
                        <input type="checkbox" class="form-check-input" id="humanAnswered" 
                            bind:checked={editedStatus.human_answered}>
                        <label class="form-check-label" for="humanAnswered">Réponse Humaine</label>
                    </div>
                    <div class="form-check mb-2">
                        <input type="checkbox" class="form-check-input" id="sale" 
                            bind:checked={editedStatus.sale}>
                        <label class="form-check-label" for="sale">Vente</label>
                    </div>
                    <div class="form-check mb-2">
                        <input type="checkbox" class="form-check-input" id="dnc" 
                            bind:checked={editedStatus.dnc}>
                        <label class="form-check-label" for="dnc">DNC</label>
                    </div>
                    <div class="form-check mb-2">
                        <input type="checkbox" class="form-check-input" id="customerContact" 
                            bind:checked={editedStatus.customer_contact}>
                        <label class="form-check-label" for="customerContact">Contact Client</label>
                    </div>
                    <div class="form-check mb-3">
                        <input type="checkbox" class="form-check-input" id="scheduledCallback" 
                            bind:checked={editedStatus.scheduled_callback}>
                        <label class="form-check-label" for="scheduledCallback">Rappel Programmé</label>
                    </div>
                    <div class="modal-footer px-0 pb-0">
                        <button type="button" class="btn btn-secondary" on:click={handleClose}>Annuler</button>
                        <button type="submit" class="btn btn-primary">Enregistrer</button>
                    </div>
                </form>
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
</style>
