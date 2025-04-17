<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    
    export let activeTab = "general";
    export let tabs = [];
    
    function handleTabChange(tabId) {
        dispatch('change', tabId);
    }
</script>

<div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
    <div class="card-header bg-white border-bottom-0 p-0">
        <nav class="nav nav-tabs nav-tabs-custom border-0">
            {#each tabs as tab}
                <button
                    class="nav-link border-0 px-4 py-3 {activeTab === tab.id ? 'active' : ''}"
                    class:text-primary={activeTab === tab.id}
                    on:click={() => handleTabChange(tab.id)}
                >
                    <div class="d-flex align-items-center gap-2">
                        {#if tab.id === 'general'}
                            <i class="bi bi-info-circle"></i>
                        {:else if tab.id === 'additional'}
                            <i class="bi bi-gear"></i>
                        {:else if tab.id === 'dial'}
                            <i class="bi bi-telephone"></i>
                        {:else if tab.id === 'advanced'}
                            <i class="bi bi-sliders"></i>
                        {/if}
                        <span>{tab.label}</span>
                    </div>
                </button>
            {/each}
        </nav>
    </div>
</div>

<style>
    :global(.nav-tabs-custom) {
        background: linear-gradient(to right, rgba(var(--bs-primary-rgb), 0.05), rgba(var(--bs-primary-rgb), 0.02));
    }

    :global(.nav-tabs-custom .nav-link) {
        color: var(--bs-gray-600);
        font-weight: 500;
        transition: all 0.2s ease;
        position: relative;
    }

    :global(.nav-tabs-custom .nav-link:hover) {
        color: var(--bs-primary);
        background: rgba(var(--bs-primary-rgb), 0.05);
    }

    :global(.nav-tabs-custom .nav-link.active) {
        background: white;
        font-weight: 600;
    }

    :global(.nav-tabs-custom .nav-link.active::after) {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--bs-primary);
    }
</style>
