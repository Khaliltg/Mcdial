<script>
    export let campaign;
    export let onSelect;
</script>

<div class="card h-100 campaign-card hover-shadow">
    <div class="card-body">
        <h5 class="card-title text-primary mb-3">
            <i class="bi bi-megaphone me-2"></i>
            {campaign.campaign_name}
        </h5>
        <p class="card-text text-muted">
            {campaign.campaign_description || 'Aucune description'}
        </p>
        <button 
            class="btn btn-primary w-100"
            on:click={() => onSelect()}
        >
            <i class="bi bi-eye me-2"></i>
            Voir les Statuts
        </button>
    </div>
</div>

<style>
    .campaign-card {
        transition: transform 0.2s ease-in-out;
    }

    .campaign-card:hover {
        transform: translateY(-5px);
    }

    .hover-shadow {
        transition: box-shadow 0.3s ease-in-out;
    }
    
    .hover-shadow:hover {
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }
</style>
