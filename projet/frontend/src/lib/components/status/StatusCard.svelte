<script>
    export let status;
    export let onEdit;
    export let onDelete;
</script>

<div class="card h-100 status-card hover-shadow">
    <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
        <h5 class="mb-0">{status.status}</h5>
        <div class="btn-group">
            <button class="btn btn-sm btn-outline-primary" on:click={() => onEdit(status)}>
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" on:click={() => onDelete(status)}>
                <i class="bi bi-trash"></i>
            </button>
        </div>
    </div>
    <div class="card-body">
        <h6 class="mb-3">{status.status_name || 'Sans nom'}</h6>
        <div class="status-properties">
            <div class="status-property {status.selectable ? 'active' : ''}">
                <i class="bi bi-check-circle me-2"></i>
                Sélectionnable
            </div>
            <div class="status-property {status.human_answered ? 'active' : ''}">
                <i class="bi bi-person me-2"></i>
                Réponse Humaine
            </div>
            <div class="status-property {status.sale ? 'active' : ''}">
                <i class="bi bi-cart me-2"></i>
                Vente
            </div>
            <div class="status-property {status.dnc ? 'active' : ''}">
                <i class="bi bi-shield me-2"></i>
                DNC
            </div>
            <div class="status-property {status.customer_contact ? 'active' : ''}">
                <i class="bi bi-telephone me-2"></i>
                Contact Client
            </div>
            <div class="status-property {status.scheduled_callback ? 'active' : ''}">
                <i class="bi bi-calendar me-2"></i>
                Rappel Programmé
            </div>
        </div>
        <div class="mt-3 text-muted">
            <small>
                Temps: {status.min_sec}s - {status.max_sec}s
            </small>
        </div>
    </div>
</div>

<style>
    .status-card {
        transition: all 0.2s ease-in-out;
    }

    .status-card:hover {
        transform: translateY(-3px);
    }

    .hover-shadow {
        transition: box-shadow 0.3s ease-in-out;
    }
    
    .hover-shadow:hover {
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }

    .status-properties {
        display: grid;
        gap: 0.5rem;
    }

    .status-property {
        padding: 0.5rem;
        border-radius: 0.25rem;
        background-color: #f8f9fa;
        color: #6c757d;
        font-size: 0.875rem;
    }

    .status-property.active {
        background-color: #e3f2fd;
        color: #0d6efd;
    }
</style>
