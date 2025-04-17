<script>
    import { createEventDispatcher } from 'svelte';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
    import { errorStore } from '$lib/stores/errorStore';
    
    const dispatch = createEventDispatcher();
    
    export let company;
    
    // UI state
    let saving = false;
    let hasChanges = false;
    
    // Split the dial_statuses string into an array
    $: dialStatuses = company.dial_statuses ? company.dial_statuses.split(' ') : [];
    
    // For adding new dial status
    let newDialStatus = "";
    let originalDialStatuses = company.dial_statuses || '';
    
    function addDialStatus() {
        if (newDialStatus.trim()) {
            // Check if status already exists
            if (dialStatuses.includes(newDialStatus.trim())) {
                errorStore.set(`Le statut "${newDialStatus.trim()}" existe déjà`);
                setTimeout(() => errorStore.set(''), 3000);
                return;
            }
            
            dialStatuses = [...dialStatuses, newDialStatus.trim()];
            company.dial_statuses = dialStatuses.join(' ');
            newDialStatus = "";
            hasChanges = true;
        }
    }
    
    function removeDialStatus(index) {
        dialStatuses = dialStatuses.filter((_, i) => i !== index);
        company.dial_statuses = dialStatuses.join(' ');
        hasChanges = true;
    }
    
    async function saveChanges() {
        try {
            saving = true;
            
            // Only save if there are changes
            if (!hasChanges) {
                errorStore.set('Aucun changement à enregistrer');
                setTimeout(() => errorStore.set(''), 3000);
                saving = false;
                return;
            }
            
            // Prepare data for update
            const updateData = {
                dial_statuses: company.dial_statuses
            };
            
            // Call API to update campaign
            const response = await fetchWithAuth(`http://localhost:8000/api/admin/compagnies/update/${company.campaign_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: Impossible de mettre à jour les statuts`);
            }
            
            // Update original value to track future changes
            originalDialStatuses = company.dial_statuses;
            hasChanges = false;
            
            // Show success message
            errorStore.set('Statuts d\'appel mis à jour avec succès');
            setTimeout(() => errorStore.set(''), 3000);
            
            // Notify parent component
            dispatch('saved');
            
        } catch (err) {
            console.error('Error saving dial statuses:', err);
            const errorMessage = err && typeof err === 'object' && 'message' in err ? err.message : 'Erreur lors de la mise à jour des statuts';
            errorStore.set(errorMessage);
            setTimeout(() => errorStore.set(''), 5000);
        } finally {
            saving = false;
        }
    }
    
    // Handle key press in input field
    function handleKeyDown(event) {
        if (event.key === 'Enter') {
            addDialStatus();
        }
    }
</script>

<div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="border-b px-6 py-4 flex items-center gap-2 bg-gray-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
        <h2 class="text-xl font-semibold text-gray-900">Dial Statuses</h2>
    </div>
    <div class="p-6">
        <div class="space-y-6">
            <!-- Add new status -->
            <div class="flex gap-3">
                <input 
                    type="text" 
                    bind:value={newDialStatus}
                    placeholder="Entrer un nouveau statut d'appel"
                    on:keydown={handleKeyDown}
                    class="flex-1 px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                >
                <button 
                    on:click={addDialStatus}
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                    Ajouter
                </button>
            </div>

            <!-- Status list -->
            <div class="space-y-2">
                {#if dialStatuses.length === 0}
                    <p class="text-gray-500 text-sm">No dial statuses added yet.</p>
                {:else}
                    {#each dialStatuses as status, index}
                        <div class="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
                            <span class="text-gray-900">{status}</span>
                            <button 
                                on:click={() => removeDialStatus(index)}
                                class="text-red-600 hover:text-red-700 focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                            </button>
                        </div>
                    {/each}
                {/if}
            </div>
            
            <!-- Save button -->
            <div class="mt-6 flex justify-end">
                <button 
                    on:click={saveChanges}
                    disabled={saving || !hasChanges}
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {#if saving}
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enregistrement...
                    {:else}
                        Enregistrer les modifications
                    {/if}
                </button>
            </div>
        </div>
    </div>
</div>
