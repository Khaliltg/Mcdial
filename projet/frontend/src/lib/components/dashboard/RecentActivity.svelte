<script lang="ts">
    import type { ActivityItem } from '$lib/types';
    import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';

    export let activities: ActivityItem[] = [];
</script>

<Card class="shadow-sm border border-border/50 h-full flex flex-col overflow-hidden">
    <div class="bg-gradient-to-br from-muted/30 to-muted/50 absolute h-full w-full"></div>
    <CardHeader class="pb-2 relative">
        <CardTitle class="flex items-center gap-2">
            <i class="bi bi-clock-history text-primary"></i>
            Activité Récente
        </CardTitle>
    </CardHeader>
    <CardContent class="p-0 flex-1 overflow-auto relative" style="max-height: calc(100vh - 20rem);">
        {#if activities.length === 0}
            <div class="text-center p-6 text-muted-foreground">
                <i class="bi bi-clock-history text-3xl mb-2 inline-block opacity-50"></i>
                <p>Aucune activité récente</p>
                <button class="mt-3 text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <i class="bi bi-arrow-clockwise mr-1"></i> Rafraîchir
                </button>
            </div>
        {:else}
            <div class="activity-list space-y-0">
                {#each activities as activity (activity.text + activity.time)}
                    <div class="activity-item flex items-start gap-4 p-4 hover:bg-background transition-colors border-l-2 border-transparent hover:border-primary/50">
                        <span class="activity-icon flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center text-lg text-primary-foreground {activity.type}">
                            <i class="bi {activity.icon}"></i>
                        </span>
                        <div class="activity-content flex-1 min-w-0">
                            <p class="activity-text text-sm font-medium mb-1">{activity.text}</p>
                            <small class="activity-time text-xs text-muted-foreground">{activity.time}</small>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </CardContent>
</Card>

<style>
    .activity-icon.call {
        background-color: hsl(var(--primary));
    }

    .activity-icon.campaign {
        background-color: hsl(var(--secondary));
    }

    .activity-icon.alert {
        background-color: hsl(var(--destructive));
    }
</style>
