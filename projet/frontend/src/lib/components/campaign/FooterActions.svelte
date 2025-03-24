<script>
    export let onCancel;
    export let onSave;
    export let disabled = false;
</script>

<div class="footer-actions bg-white border-top py-3">
    <div class="container-fluid px-4">
        <div class="d-flex justify-content-end gap-2">
            <button 
                on:click={onCancel}
                {disabled}
                class="btn btn-light d-flex align-items-center gap-2 {disabled ? 'opacity-50' : ''}"
            >
                <i class="bi bi-x-lg"></i>
                annuler
            </button>
            <button 
                on:click={onSave}
                {disabled}
                class="btn btn-primary d-flex align-items-center gap-2 {disabled ? 'opacity-50' : ''}"
            >
                <i class="bi bi-check-lg"></i>
                enregistrer
            </button>
        </div>
    </div>
</div>

<style>
    .footer-actions {
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1020;
        backdrop-filter: blur(8px);
    }

    :global(.btn) {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 0.5rem;
    }

    :global(.btn-light) {
        background-color: var(--bs-gray-100);
        border-color: var(--bs-gray-200);
    }

    :global(.btn-light:hover) {
        background-color: var(--bs-gray-200);
        border-color: var(--bs-gray-300);
    }

    :global(.btn-primary) {
        background-color: var(--bs-primary);
        border-color: var(--bs-primary);
    }

    :global(.btn-primary:hover) {
        background-color: var(--bs-primary-dark);
        border-color: var(--bs-primary-dark);
    }
</style>
