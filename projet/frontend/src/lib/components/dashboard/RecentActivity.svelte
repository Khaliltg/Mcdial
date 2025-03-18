<script>
    export let activities = [];
</script>

<div class="card">
    <div class="card-header border-0 bg-white">
        <h5 class="mb-0">Activité Récente</h5>
    </div>
    <div class="card-body p-0">
        {#if activities.length === 0}
            <div class="text-center py-5">
                <i class="bi bi-clock-history display-4 text-muted"></i>
                <p class="mt-3 text-muted">Aucune activité récente</p>
            </div>
        {:else}
            <div class="activity-list">
                {#each activities as activity}
                    <div class="activity-item">
                        <div class="activity-icon {activity.type}">
                            <i class="bi {activity.icon}"></i>
                        </div>
                        <div class="activity-content">
                            <p class="activity-text mb-0">{activity.text}</p>
                            <small class="activity-time text-muted">{activity.time}</small>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .activity-list {
        display: flex;
        flex-direction: column;
    }

    .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e9ecef;
        transition: background-color 0.2s ease-in-out;
    }

    .activity-item:last-child {
        border-bottom: none;
    }

    .activity-item:hover {
        background-color: #f8f9fa;
    }

    .activity-icon {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        color: white;
        flex-shrink: 0;
    }

    .activity-icon.call {
        background-color: var(--bs-primary);
    }

    .activity-icon.campaign {
        background-color: var(--bs-success);
    }

    .activity-icon.alert {
        background-color: var(--bs-danger);
    }

    .activity-content {
        flex: 1;
        min-width: 0;
    }

    .activity-text {
        font-size: 0.9375rem;
        margin-bottom: 0.25rem;
    }

    .activity-time {
        font-size: 0.8125rem;
    }
</style>
