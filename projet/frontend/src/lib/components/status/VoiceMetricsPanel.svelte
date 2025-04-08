<script>
    export let statuses = [];
    
    function getVoiceMetrics(statuses) {
        return {
            totalCalls: statuses.reduce((sum, status) => sum + (status.call_count || 0), 0),
            humanAnswered: statuses.filter(s => s.human_answered).reduce((sum, status) => sum + (status.call_count || 0), 0),
            answeringMachine: statuses.filter(s => s.answering_machine).reduce((sum, status) => sum + (status.call_count || 0), 0),
            sales: statuses.filter(s => s.sale).reduce((sum, status) => sum + (status.call_count || 0), 0),
            callbacks: statuses.filter(s => s.scheduled_callback).reduce((sum, status) => sum + (status.call_count || 0), 0),
            avgDuration: Math.round(statuses.reduce((sum, status) => sum + ((status.min_sec + status.max_sec) / 2 * (status.call_count || 1)), 0) / 
                              statuses.reduce((sum, status) => sum + (status.call_count || 1), 0))
        };
    }
</script>

<div class="card mb-4">
    <div class="card-header bg-primary text-white">
        <i class="bi bi-telephone-fill me-2"></i> Métriques d'appels
    </div>
    <div class="card-body">
        <div class="row g-3">
            {#if statuses.some(s => s.call_count !== undefined)}
                {@const metrics = getVoiceMetrics(statuses)}
                <div class="col-md-4 col-sm-6">
                    <div class="border rounded p-3 text-center h-100">
                        <div class="display-6 mb-2">{metrics.totalCalls}</div>
                        <div class="text-muted">Appels totaux</div>
                    </div>
                </div>
                <div class="col-md-4 col-sm-6">
                    <div class="border rounded p-3 text-center h-100">
                        <div class="display-6 mb-2">{metrics.humanAnswered}</div>
                        <div class="text-muted">Réponses humaines</div>
                    </div>
                </div>
                <div class="col-md-4 col-sm-6">
                    <div class="border rounded p-3 text-center h-100">
                        <div class="display-6 mb-2">{metrics.answeringMachine}</div>
                        <div class="text-muted">Répondeurs</div>
                    </div>
                </div>
                <div class="col-md-4 col-sm-6">
                    <div class="border rounded p-3 text-center h-100">
                        <div class="display-6 mb-2">{metrics.sales}</div>
                        <div class="text-muted">Ventes</div>
                    </div>
                </div>
                <div class="col-md-4 col-sm-6">
                    <div class="border rounded p-3 text-center h-100">
                        <div class="display-6 mb-2">{metrics.callbacks}</div>
                        <div class="text-muted">Rappels planifiés</div>
                    </div>
                </div>
                <div class="col-md-4 col-sm-6">
                    <div class="border rounded p-3 text-center h-100">
                        <div class="display-6 mb-2">{metrics.avgDuration}s</div>
                        <div class="text-muted">Durée moyenne</div>
                    </div>
                </div>
            {:else}
                <div class="col-12 text-center py-3">
                    <i class="bi bi-info-circle me-2"></i>
                    Aucune donnée d'appel disponible pour cette campagne
                </div>
            {/if}
        </div>
    </div>
</div>