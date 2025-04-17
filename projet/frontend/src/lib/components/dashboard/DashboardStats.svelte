<script lang="ts">
    import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';

    export let stats = {
        totalCalls: 0,
        activeCampaigns: 0,
        completedCalls: 0,
        successRate: 0
    };
</script>

<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
    <Card class="shadow-sm border border-border/50 overflow-hidden">
        <div class="bg-gradient-to-br from-primary/5 to-primary/10 absolute h-full w-full"></div>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle class="text-sm font-medium">Appels Totaux</CardTitle>
            <div class="h-9 w-9 rounded-full bg-background shadow-sm flex items-center justify-center">
                <i class="bi bi-telephone-fill text-primary"></i>
            </div>
        </CardHeader>
        <CardContent class="relative">
            <div class="text-2xl font-bold">{stats.totalCalls.toLocaleString()}</div>
            <div class="flex items-center justify-between mt-1">
                <p class="text-xs text-muted-foreground">Tous les appels</p>
                <span class="text-xs font-medium px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary">Total</span>
            </div>
        </CardContent>
    </Card>

    <a href="/compagnes" class="no-underline">
        <Card class="shadow-sm border border-border/50 overflow-hidden">
            <div class="bg-gradient-to-br from-secondary/5 to-secondary/10 absolute h-full w-full"></div>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle class="text-sm font-medium">Campagnes Actives</CardTitle>
                <div class="h-9 w-9 rounded-full bg-background shadow-sm flex items-center justify-center">
                    <i class="bi bi-megaphone-fill text-secondary"></i>
                </div>
            </CardHeader>
            <CardContent class="relative">
                <div class="text-2xl font-bold">{stats.activeCampaigns}</div>
                <div class="flex items-center justify-between mt-1">
                    <p class="text-xs text-muted-foreground">Campagnes en cours</p>
                    <span class="text-xs font-medium px-1.5 py-0.5 rounded-sm bg-secondary/10 text-secondary">Actif</span>
                </div>
            </CardContent>
        </Card>
    </a>

    <Card class="shadow-sm border border-border/50 overflow-hidden">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 absolute h-full w-full"></div>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle class="text-sm font-medium">Appels Complétés</CardTitle>
            <div class="h-9 w-9 rounded-full bg-background shadow-sm flex items-center justify-center">
                <i class="bi bi-check2-circle-fill text-blue-500"></i>
            </div>
        </CardHeader>
        <CardContent class="relative">
            <div class="text-2xl font-bold">{stats.completedCalls.toLocaleString()}</div>
            <div class="flex items-center justify-between mt-1">
                <p class="text-xs text-muted-foreground">Conversations terminées</p>
                <span class="text-xs font-medium px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-700">Complété</span>
            </div>
        </CardContent>
    </Card>

    <Card class="shadow-sm border border-border/50 overflow-hidden">
        <div class="bg-gradient-to-br from-amber-50 to-amber-100/50 absolute h-full w-full"></div>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle class="text-sm font-medium">Taux de Succès</CardTitle>
            <div class="h-9 w-9 rounded-full bg-background shadow-sm flex items-center justify-center">
                <i class="bi bi-lightning-charge-fill text-amber-500"></i>
            </div>
        </CardHeader>
        <CardContent class="relative">
            <div class="text-2xl font-bold">{stats.successRate}%</div>
            <div class="flex items-center justify-between mt-1">
                <p class="text-xs text-muted-foreground">Appels réussis</p>
                <span class="text-xs font-medium px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-700">Succès</span>
            </div>
        </CardContent>
    </Card>
</div>

<style>
</style>
