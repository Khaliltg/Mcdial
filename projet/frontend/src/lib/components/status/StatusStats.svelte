<script>
    export let statuses = [];

    $: totalStatuses = statuses.length;
    $: selectableStatuses = statuses.filter(s => s.selectable).length;
    $: humanAnsweredStatuses = statuses.filter(s => s.human_answered).length;
    $: salesStatuses = statuses.filter(s => s.sale).length;
    $: dncStatuses = statuses.filter(s => s.dnc).length;
    $: customerContactStatuses = statuses.filter(s => s.customer_contact).length;
    $: scheduledCallbackStatuses = statuses.filter(s => s.scheduled_callback).length;

    $: averageMinTime = Math.round(statuses.reduce((acc, s) => acc + s.min_sec, 0) / totalStatuses) || 0;
    $: averageMaxTime = Math.round(statuses.reduce((acc, s) => acc + s.max_sec, 0) / totalStatuses) || 0;
</script>

<div class="stats-container">
    <div class="row g-4">
        <!-- Total Statuses -->
        <div class="col-md-6 col-lg-3">
            <div class="card stat-card bg-primary text-white">
                <div class="card-body">
                    <div class="stat-icon">
                        <i class="bi bi-list-check"></i>
                    </div>
                    <h3 class="stat-value">{totalStatuses}</h3>
                    <p class="stat-label mb-0">Total Statuts</p>
                </div>
            </div>
        </div>

        <!-- Average Time -->
        <div class="col-md-6 col-lg-3">
            <div class="card stat-card bg-success text-white">
                <div class="card-body">
                    <div class="stat-icon">
                        <i class="bi bi-clock"></i>
                    </div>
                    <h3 class="stat-value">{averageMinTime}s - {averageMaxTime}s</h3>
                    <p class="stat-label mb-0">Temps Moyen</p>
                </div>
            </div>
        </div>

        <!-- Sales Status -->
        <div class="col-md-6 col-lg-3">
            <div class="card stat-card bg-info text-white">
                <div class="card-body">
                    <div class="stat-icon">
                        <i class="bi bi-cart"></i>
                    </div>
                    <h3 class="stat-value">{salesStatuses}</h3>
                    <p class="stat-label mb-0">Statuts de Vente</p>
                </div>
            </div>
        </div>

        <!-- Human Answered -->
        <div class="col-md-6 col-lg-3">
            <div class="card stat-card bg-warning text-white">
                <div class="card-body">
                    <div class="stat-icon">
                        <i class="bi bi-person"></i>
                    </div>
                    <h3 class="stat-value">{humanAnsweredStatuses}</h3>
                    <p class="stat-label mb-0">Réponses Humaines</p>
                </div>
            </div>
        </div>
    </div>

    <div class="row g-4 mt-2">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title mb-4">Répartition des Statuts</h5>
                    <div class="status-distribution">
                        <div class="status-type">
                            <span class="label">
                                <i class="bi bi-check-circle me-2"></i>
                                Sélectionnable
                            </span>
                            <div class="progress">
                                <div class="progress-bar" role="progressbar" 
                                    style="width: {(selectableStatuses/totalStatuses*100)}%" 
                                    aria-valuenow={selectableStatuses} aria-valuemin="0" 
                                    aria-valuemax={totalStatuses}>
                                    {selectableStatuses}
                                </div>
                            </div>
                        </div>
                        <div class="status-type">
                            <span class="label">
                                <i class="bi bi-shield me-2"></i>
                                DNC
                            </span>
                            <div class="progress">
                                <div class="progress-bar bg-danger" role="progressbar" 
                                    style="width: {(dncStatuses/totalStatuses*100)}%" 
                                    aria-valuenow={dncStatuses} aria-valuemin="0" 
                                    aria-valuemax={totalStatuses}>
                                    {dncStatuses}
                                </div>
                            </div>
                        </div>
                        <div class="status-type">
                            <span class="label">
                                <i class="bi bi-telephone me-2"></i>
                                Contact Client
                            </span>
                            <div class="progress">
                                <div class="progress-bar bg-success" role="progressbar" 
                                    style="width: {(customerContactStatuses/totalStatuses*100)}%" 
                                    aria-valuenow={customerContactStatuses} aria-valuemin="0" 
                                    aria-valuemax={totalStatuses}>
                                    {customerContactStatuses}
                                </div>
                            </div>
                        </div>
                        <div class="status-type">
                            <span class="label">
                                <i class="bi bi-calendar me-2"></i>
                                Rappel Programmé
                            </span>
                            <div class="progress">
                                <div class="progress-bar bg-info" role="progressbar" 
                                    style="width: {(scheduledCallbackStatuses/totalStatuses*100)}%" 
                                    aria-valuenow={scheduledCallbackStatuses} aria-valuemin="0" 
                                    aria-valuemax={totalStatuses}>
                                    {scheduledCallbackStatuses}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .stats-container {
        margin-bottom: 2rem;
    }

    .stat-card {
        border: none;
        border-radius: 1rem;
        transition: transform 0.2s ease-in-out;
    }

    .stat-card:hover {
        transform: translateY(-5px);
    }

    .stat-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }

    .stat-value {
        font-size: 1.75rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
    }

    .stat-label {
        font-size: 0.875rem;
        opacity: 0.9;
    }

    .status-distribution {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .status-type {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .label {
        font-size: 0.875rem;
        color: #6c757d;
    }

    .progress {
        height: 1.5rem;
        border-radius: 0.75rem;
        background-color: #f8f9fa;
    }

    .progress-bar {
        border-radius: 0.75rem;
        min-width: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
        transition: width 0.3s ease-in-out;
    }
</style>
