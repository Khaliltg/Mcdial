<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { errorStore } from '$lib/stores/errorStore';
    
    /**
     * @typedef {Object} Status
     * @property {string} status - Status code
     * @property {string} status_name - Status name
     * @property {number} min_sec - Minimum seconds
     * @property {number} max_sec - Maximum seconds
     * @property {boolean} selectable - Whether status is selectable
     * @property {boolean} human_answered - Whether status represents human answered
     * @property {boolean} sale - Whether status represents a sale
     * @property {boolean} dnc - Whether status represents DNC (Do Not Call)
     * @property {boolean} customer_contact - Whether status represents customer contact
     * @property {boolean} not_interested - Whether status represents not interested
     * @property {boolean} unworkable - Whether status represents unworkable
     * @property {boolean} scheduled_callback - Whether status represents scheduled callback
     * @property {boolean} completed - Whether status represents completed
     * @property {boolean} answering_machine - Whether status represents answering machine
     */
    
    const dispatch = createEventDispatcher();

    /** @type {Status|null} */
    export let status = null;
    export let show = false;
    export let isNew = false;
    
    // Form validation state
    let errors = {
        status: '',
        status_name: '',
        min_sec: '',
        max_sec: '',
        general: ''
    };
    let touched = {
        status: false,
        status_name: false,
        min_sec: false,
        max_sec: false
    };
    let isSubmitting = false;
    let formValid = false;

    // Initialize with empty values
    /** @type {Status} */
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
    
    // Group checkboxes for better UI organization
    const checkboxGroups = [
        {
            title: 'Propriétés Principales',
            items: [
                { id: 'selectable', field: 'selectable', label: 'Sélectionnable', description: 'Ce statut peut être sélectionné par les agents' },
                { id: 'humanAnswered', field: 'human_answered', label: 'Réponse Humaine', description: 'Indique qu\'un humain a répondu à l\'appel' }
            ]
        },
        {
            title: 'Résultats d\'Appel',
            items: [
                { id: 'sale', field: 'sale', label: 'Vente', description: 'Indique une vente réussie' },
                { id: 'customerContact', field: 'customer_contact', label: 'Contact Client', description: 'Un contact direct avec le client a été établi' },
                { id: 'completed', field: 'completed', label: 'Complété', description: 'L\'appel a été complété avec succès' }
            ]
        },
        {
            title: 'Résultats Négatifs',
            items: [
                { id: 'dnc', field: 'dnc', label: 'Ne Pas Appeler', description: 'Marquer comme "Ne pas appeler"' },
                { id: 'notInterested', field: 'not_interested', label: 'Non Intéressé', description: 'Le client n\'est pas intéressé' },
                { id: 'unworkable', field: 'unworkable', label: 'Non Exploitable', description: 'Le contact ne peut pas être travaillé' }
            ]
        },
        {
            title: 'Autres',
            items: [
                { id: 'scheduledCallback', field: 'scheduled_callback', label: 'Rappel Programmé', description: 'Un rappel a été programmé' },
                { id: 'answeringMachine', field: 'answering_machine', label: 'Répondeur', description: 'Un répondeur a été détecté' }
            ]
        }
    ];

    // Reset the form when modal is shown/hidden
    $: if (show && status) {
        resetForm();
        resetErrors();
    }
    
    // Validate form on input changes
    $: {
        validateForm(editedStatus);
    }
    
    // Reset validation errors
    function resetErrors() {
        errors = {
            status: '',
            status_name: '',
            min_sec: '',
            max_sec: '',
            general: ''
        };
        touched = {
            status: false,
            status_name: false,
            min_sec: false,
            max_sec: false
        };
        formValid = false;
    }

    // Reset form with status data or empty values
    function resetForm() {
        if (status) {
            editedStatus = {
                status: status.status || '',
                status_name: status.status_name || '',
                min_sec: typeof status.min_sec === 'number' ? status.min_sec : parseInt(String(status.min_sec)) || 0,
                max_sec: typeof status.max_sec === 'number' ? status.max_sec : parseInt(String(status.max_sec)) || 0,
                selectable: !!status.selectable,
                human_answered: !!status.human_answered,
                sale: !!status.sale,
                dnc: !!status.dnc,
                customer_contact: !!status.customer_contact,
                not_interested: !!status.not_interested,
                unworkable: !!status.unworkable,
                scheduled_callback: !!status.scheduled_callback,
                completed: !!status.completed,
                answering_machine: !!status.answering_machine
            };
        } else {
            editedStatus = {
                status: '',
                status_name: '',
                min_sec: 0,
                max_sec: 60,
                selectable: true,
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
        }
    }
    
    // Mark field as touched when user interacts with it
    function handleBlur(field) {
        touched[field] = true;
        validateForm(editedStatus);
    }

    /**
     * Validates the form and updates error state
     * @param {Status} status - The status to validate
     */
    function validateForm(status) {
        let isValid = true;
        let newErrors = {
            status: '',
            status_name: '',
            min_sec: '',
            max_sec: '',
            general: ''
        };
        
        // Validate status code
        if (!status.status.trim()) {
            newErrors.status = 'Le code du statut est requis';
            isValid = false;
        } else if (!/^[A-Za-z0-9]{1,6}$/.test(status.status.trim())) {
            newErrors.status = 'Le code doit contenir 1 à 6 caractères alphanumériques';
            isValid = false;
        }
        
        // Validate status name
        if (!status.status_name.trim()) {
            newErrors.status_name = 'Le nom du statut est requis';
            isValid = false;
        } else if (status.status_name.trim().length > 30) {
            newErrors.status_name = 'Le nom ne doit pas dépasser 30 caractères';
            isValid = false;
        }
        
        // Validate min_sec
        const minSec = typeof status.min_sec === 'number' ? status.min_sec : parseInt(String(status.min_sec)) || 0;
        if (minSec < 0) {
            newErrors.min_sec = 'La durée minimale doit être positive';
            isValid = false;
        }
        
        // Validate max_sec
        const maxSec = typeof status.max_sec === 'number' ? status.max_sec : parseInt(String(status.max_sec)) || 0;
        if (maxSec < 0) {
            newErrors.max_sec = 'La durée maximale doit être positive';
            isValid = false;
        } else if (maxSec < minSec) {
            newErrors.max_sec = 'La durée maximale doit être supérieure ou égale à la durée minimale';
            isValid = false;
        }
        
        errors = newErrors;
        formValid = isValid;
        return isValid;
    }

    /**
     * Prepares the status object for submission
     * @param {Status} status - The status to prepare
     * @returns {Status} - The prepared status
     */
    function prepareStatusForSubmission(status) {
        return {
            status: status.status.trim(),
            status_name: status.status_name.trim(),
            min_sec: typeof status.min_sec === 'number' ? status.min_sec : parseInt(String(status.min_sec)) || 0,
            max_sec: typeof status.max_sec === 'number' ? status.max_sec : parseInt(String(status.max_sec)) || 0,
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

    async function handleSubmit() {
        // Mark all fields as touched
        Object.keys(touched).forEach(key => {
            touched[key] = true;
        });
        
        if (!validateForm(editedStatus)) {
            errors.general = 'Veuillez corriger les erreurs avant de soumettre';
            return;
        }
        
        try {
            isSubmitting = true;
            const preparedStatus = prepareStatusForSubmission(editedStatus);
            dispatch('save', preparedStatus);
        } catch (error) {
            // Handle error message safely
            const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
            errors.general = errorMessage;
            errorStore.set(errorMessage);
            setTimeout(() => errorStore.set(null), 5000);
        } finally {
            isSubmitting = false;
        }
    }

    function handleClose() {
        dispatch('close');
    }
</script>

<div class="modal" class:show class:d-block={show} tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content" in:fade={{ duration: 200 }}>
            <div class="modal-header" class:bg-primary={isNew} class:bg-info={!isNew} class:text-white={true}>
                <h5 class="modal-title">
                    <i class="bi bi-{isNew ? 'plus-circle' : 'pencil-square'} me-2"></i>
                    {isNew ? 'Créer un Nouveau Statut' : 'Modifier le Statut'}
                </h5>
                <button type="button" class="btn-close btn-close-white" on:click={handleClose}></button>
            </div>
            <div class="modal-body">
                {#if errors.general}
                    <div class="alert alert-danger" transition:fade={{ duration: 200 }}>
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        {errors.general}
                    </div>
                {/if}
                
                <form on:submit|preventDefault={handleSubmit} class="needs-validation" novalidate>
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <div class="form-floating mb-3">
                                <input 
                                    type="text" 
                                    id="status-code" 
                                    class="form-control" 
                                    class:is-invalid={touched.status && errors.status}
                                    class:is-valid={touched.status && !errors.status}
                                    bind:value={editedStatus.status} 
                                    on:blur={() => handleBlur('status')}
                                    placeholder="Code du statut"
                                    required 
                                    disabled={!isNew}
                                    maxlength="6"
                                    pattern="[A-Za-z0-9]{1,6}"
                                />
                                <label for="status-code">Code du Statut</label>
                                {#if touched.status && errors.status}
                                    <div class="invalid-feedback" transition:fade={{ duration: 150 }}>
                                        {errors.status}
                                    </div>
                                {/if}
                                <small class="form-text text-muted">
                                    Code unique de 1-6 caractères alphanumériques
                                </small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-floating mb-3">
                                <input 
                                    type="text" 
                                    id="status-name" 
                                    class="form-control" 
                                    class:is-invalid={touched.status_name && errors.status_name}
                                    class:is-valid={touched.status_name && !errors.status_name}
                                    bind:value={editedStatus.status_name} 
                                    on:blur={() => handleBlur('status_name')}
                                    placeholder="Nom du statut"
                                    required
                                    maxlength="30"
                                />
                                <label for="status-name">Nom du Statut</label>
                                {#if touched.status_name && errors.status_name}
                                    <div class="invalid-feedback" transition:fade={{ duration: 150 }}>
                                        {errors.status_name}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <div class="form-floating mb-3">
                                <input 
                                    type="number" 
                                    id="min-sec" 
                                    class="form-control" 
                                    class:is-invalid={touched.min_sec && errors.min_sec}
                                    class:is-valid={touched.min_sec && !errors.min_sec}
                                    bind:value={editedStatus.min_sec} 
                                    on:blur={() => handleBlur('min_sec')}
                                    placeholder="Temps minimum"
                                    required 
                                    min="0"
                                />
                                <label for="min-sec">Temps Min (secondes)</label>
                                {#if touched.min_sec && errors.min_sec}
                                    <div class="invalid-feedback" transition:fade={{ duration: 150 }}>
                                        {errors.min_sec}
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-floating mb-3">
                                <input 
                                    type="number" 
                                    id="max-sec" 
                                    class="form-control" 
                                    class:is-invalid={touched.max_sec && errors.max_sec}
                                    class:is-valid={touched.max_sec && !errors.max_sec}
                                    bind:value={editedStatus.max_sec} 
                                    on:blur={() => handleBlur('max_sec')}
                                    placeholder="Temps maximum"
                                    required 
                                    min="0"
                                />
                                <label for="max-sec">Temps Max (secondes)</label>
                                {#if touched.max_sec && errors.max_sec}
                                    <div class="invalid-feedback" transition:fade={{ duration: 150 }}>
                                        {errors.max_sec}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header bg-light">
                            <h6 class="mb-0">Propriétés du Statut</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                {#each checkboxGroups as group}
                                    <div class="col-md-6 mb-3">
                                        <h6 class="text-muted mb-2">{group.title}</h6>
                                        {#each group.items as item}
                                            <div class="form-check form-switch mb-2">
                                                <input 
                                                    type="checkbox" 
                                                    class="form-check-input" 
                                                    id={item.id} 
                                                    bind:checked={editedStatus[item.field]}
                                                />
                                                <label class="form-check-label" for={item.id}>
                                                    {item.label}
                                                    <small class="text-muted d-block">{item.description}</small>
                                                </label>
                                            </div>
                                        {/each}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" on:click={handleClose}>
                            <i class="bi bi-x-circle me-1"></i> Annuler
                        </button>
                        <button 
                            type="submit" 
                            class="btn btn-{isNew ? 'primary' : 'info'}"
                            disabled={isSubmitting || !formValid}
                        >
                            <i class="bi bi-{isSubmitting ? 'hourglass-split' : (isNew ? 'plus-lg' : 'check-lg')} me-1"></i>
                            {isSubmitting ? 'Traitement...' : (isNew ? 'Créer' : 'Enregistrer')}
                        </button>
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
        max-width: 800px;
    }
    
    .form-floating > label {
        z-index: 3;
    }
    
    .form-check-input:checked {
        background-color: #0d6efd;
        border-color: #0d6efd;
    }
    
    .form-switch .form-check-input {
        width: 2.5em;
        margin-left: -2.8em;
    }
    
    .form-check-label small {
        font-size: 0.75rem;
        opacity: 0.8;
    }
    
    .form-check.form-switch {
        padding-left: 2.8em;
    }
    
    :global(.modal-backdrop) {
        opacity: 0.5 !important;
    }
    
    .card-header h6 {
        font-weight: 600;
    }
</style>
