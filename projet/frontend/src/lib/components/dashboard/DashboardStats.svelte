<script>
    export let stats = {
        totalCalls: 0,
        activeCampaigns: 0,
        completedCalls: 0,
        successRate: 0
    };
</script>

<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-icon bg-primary">
            <i class="bi bi-telephone"></i>
        </div>
        <div class="stat-content">
            <h3 class="stat-value">{stats.totalCalls.toLocaleString()}</h3>
            <p class="stat-label">Appels Totaux</p>
        </div>
    </div>

    <div class="stat-card">
        <div class="stat-icon bg-success">
            <i class="bi bi-graph-up"></i>
        </div>
        <div class="stat-content">
            <h3 class="stat-value">{stats.activeCampaigns}</h3>
            <p class="stat-label">Campagnes Actives</p>
        </div>
    </div>

    <div class="stat-card">
        <div class="stat-icon bg-info">
            <i class="bi bi-check2-circle"></i>
        </div>
        <div class="stat-content">
            <h3 class="stat-value">{stats.completedCalls.toLocaleString()}</h3>
            <p class="stat-label">Appels Complétés</p>
        </div>
    </div>

    <div class="stat-card">
        <div class="stat-icon bg-warning">
            <i class="bi bi-lightning"></i>
        </div>
        <div class="stat-content">
            <h3 class="stat-value">{stats.successRate}%</h3>
            <p class="stat-label">Taux de Succès</p>
        </div>
    </div>
</div>

<style>
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: white;
        border-radius: 1rem;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1.25rem;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
    }

    .stat-content {
        flex: 1;
    }

    .stat-value {
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0;
        line-height: 1.2;
    }

    .stat-label {
        color: #6c757d;
        margin: 0;
        font-size: 0.875rem;
        margin-top: 0.25rem;
    }
</style>
