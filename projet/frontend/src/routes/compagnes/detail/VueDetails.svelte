<script>
    export let company;

    function formatDate(dateString) {
        return new Date(dateString).toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    // Split the dial_statuses string into an array
    $: dialStatuses = company.dial_statuses ? company.dial_statuses.split(' ') : [];
    
    // For adding new dial status
    let newDialStatus = "";
    
    // Active tab tracking
    let activeTab = "general";
</script>

<div class="container mx-auto py-8 px-4 max-w-6xl bg-gray-50 min-h-screen">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
            <h1 class="text-3xl font-bold text-gray-800">Campaign Details</h1>
            <p class="text-gray-500 mt-1">
                Manage your campaign settings and configuration
            </p>
        </div>
        <div class="flex items-center gap-3">
            <button class="px-4 py-2.5 border border-gray-200 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-sm text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Settings
            </button>
            <button class="px-4 py-2.5 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                Launch Campaign
            </button>
        </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b bg-white rounded-t-xl shadow-sm">
        <div class="flex overflow-x-auto">
            <button 
                class="px-6 py-4 font-medium transition-colors {activeTab === 'general' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}"
                on:click={() => activeTab = 'general'}
            >
                General Information
            </button>
            <button 
                class="px-6 py-4 font-medium transition-colors {activeTab === 'additional' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}"
                on:click={() => activeTab = 'additional'}
            >
                Additional Settings
            </button>
            <button 
                class="px-6 py-4 font-medium transition-colors {activeTab === 'dial' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}"
                on:click={() => activeTab = 'dial'}
            >
                Dial Statuses
            </button>
            <button 
                class="px-6 py-4 font-medium transition-colors {activeTab === 'advanced' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}"
                on:click={() => activeTab = 'advanced'}
            >
                Advanced Configuration
            </button>
        </div>
    </div>

    <!-- Tab Content -->
    <div class="space-y-6">
        <!-- General Information Tab -->
        {#if activeTab === 'general'}
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div class="border-b px-6 py-4 flex items-center gap-2 bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                    <h2 class="text-xl font-semibold text-gray-800">General Information</h2>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label for="campaign_id" class="block text-sm font-medium text-gray-700">ID de la Campagne</label>
                            <input 
                                type="text" 
                                id="campaign_id" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" 
                                value={company.campaign_id} 
                                readonly
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="campaign_name" class="block text-sm font-medium text-gray-700">Nom de la Campagne</label>
                            <input 
                                type="text" 
                                id="campaign_name" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.campaign_name}
                            >
                        </div>
                        
                        <div class="space-y-2 md:col-span-2">
                            <label for="campaign_description" class="block text-sm font-medium text-gray-700">Description</label>
                            <input 
                                type="text" 
                                id="campaign_description" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.campaign_description}
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="campaign_changedate" class="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
                                Date de Changement
                            </label>
                            <input 
                                type="text" 
                                id="campaign_changedate" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" 
                                value={formatDate(company.campaign_changedate)} 
                                readonly
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="campaign_logindate" class="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                Login Date
                            </label>
                            <input 
                                type="text" 
                                id="campaign_logindate" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" 
                                value={formatDate(company.campaign_logindate)} 
                                readonly
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="campaign_calldate" class="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                Call Date
                            </label>
                            <input 
                                type="text" 
                                id="campaign_calldate" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" 
                                value={formatDate(company.campaign_calldate)} 
                                readonly
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="campaign_active" class="block text-sm font-medium text-gray-700">Active</label>
                            <select 
                                id="campaign_active" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.campaign_active}
                            >
                                <option value={1}>Y</option>
                                <option value={0}>N</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Additional Information Tab -->
        {#if activeTab === 'additional'}
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div class="border-b px-6 py-4 flex items-center gap-2 bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <h2 class="text-xl font-semibold text-gray-800">Additional Information</h2>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label for="user_group" class="block text-sm font-medium text-gray-700">Admin User Group</label>
                            <input 
                                type="text" 
                                id="user_group" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.user_group}
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="park_music" class="block text-sm font-medium text-gray-700">Park Music-on-Hold</label>
                            <input 
                                type="text" 
                                id="park_music" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.park_file_name}
                            >
                        </div>
                        
                        <div class="space-y-2 md:col-span-2">
                            <label for="web_form" class="block text-sm font-medium text-gray-700">Web Form</label>
                            <input 
                                type="text" 
                                id="web_form" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.web_form_address}
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="allow_closers" class="block text-sm font-medium text-gray-700">Allow Closers</label>
                            <input 
                                type="text" 
                                id="allow_closers" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.allow_closers}
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="default_transfer_group" class="block text-sm font-medium text-gray-700">Default Transfer Group</label>
                            <input 
                                type="text" 
                                id="default_transfer_group" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.default_xfer_group}
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="allow_inbound_blended" class="block text-sm font-medium text-gray-700">Allow Inbound and Blended</label>
                            <input 
                                type="text" 
                                id="allow_inbound_blended" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.campaign_allow_inbound}
                            >
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Dial Statuses Tab -->
        {#if activeTab === 'dial'}
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div class="border-b px-6 py-4 flex items-center gap-2 bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <h2 class="text-xl font-semibold text-gray-800">Dial Statuses</h2>
                </div>
                <div class="p-6">
                    <div class="space-y-6">
                        <div class="flex flex-wrap gap-2">
                            {#if dialStatuses.length > 0}
                                {#each dialStatuses as status, index}
                                    <div class="inline-flex items-center bg-indigo-50 text-indigo-700 rounded-full py-1.5 pl-4 pr-2 text-sm font-medium shadow-sm">
                                        {status}
                                        <a 
                                            href={`?ADD=68&campaign_id=${company.campaign_id}&status=${status}`} 
                                            class="ml-1.5 p-1 rounded-full hover:bg-indigo-100 text-indigo-500 hover:text-red-500 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                                        </a>
                                    </div>
                                {/each}
                            {:else}
                                <div class="w-full p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p class="text-gray-500">No dial statuses configured</p>
                                    <p class="text-gray-400 text-sm mt-1">Add your first status below</p>
                                </div>
                            {/if}
                        </div>
                        
                        <hr class="border-gray-200" />
                        
                        <div class="space-y-3">
                            <label for="add_dial_status" class="block text-sm font-medium text-gray-700">Add A Dial Status to Call</label>
                            <div class="flex gap-3">
                                <input 
                                    type="text" 
                                    id="add_dial_status" 
                                    class="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                    bind:value={newDialStatus}
                                    placeholder="Enter new status"
                                >
                                <button 
                                    class="px-5 py-2.5 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    on:click={() => {
                                        if (newDialStatus.trim()) {
                                            company.dial_statuses = company.dial_statuses 
                                                ? `${company.dial_statuses} ${newDialStatus.trim()}`
                                                : newDialStatus.trim();
                                            newDialStatus = "";
                                        }
                                    }}
                                    disabled={!newDialStatus.trim()}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                                    Add Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Advanced Configuration Tab -->
        {#if activeTab === 'advanced'}
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div class="border-b px-6 py-4 flex items-center gap-2 bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <h2 class="text-xl font-semibold text-gray-800">Advanced Configuration</h2>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label for="list_order" class="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"   stroke-linejoin="round" class="text-gray-500"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                                Ordre de Liste
                            </label>
                            <select 
                                id="list_order" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.lead_order}
                            >
                                <option value="DOWN">DOWN</option>
                                <option value="UP">UP</option>
                                <option value="DOWN PHONE">DOWN PHONE</option>
                                <option value="UP PHONE">UP PHONE</option>
                                <option value="DOWN LAST NAME">DOWN LAST NAME</option>
                                <option value="UP LAST NAME">UP LAST NAME</option>
                                <option value="DOWN COUNT">DOWN COUNT</option>
                                <option value="UP COUNT">UP COUNT</option>
                                <option value="RANDOM">RANDOM</option>
                                <option value="DOWN LAST CALL TIME">DOWN LAST CALL TIME</option>
                                <option value="UP LAST CALL TIME">UP LAST CALL TIME</option>
                                <!-- Additional options would be included here -->
                            </select>
                        </div>
                        
                        <div class="space-y-2">
                            <label for="list_mix" class="block text-sm font-medium text-gray-700">List Mix</label>
                            <input 
                                type="text" 
                                id="list_mix" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.list_order_mix}
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="lead_filter" class="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                                Lead Filter
                            </label>
                            <input 
                                type="text" 
                                id="lead_filter" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.lead_filter_id}
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="minimum_hopper_level" class="block text-sm font-medium text-gray-700">Minimum Hopper Level</label>
                            <input 
                                type="text" 
                                id="minimum_hopper_level" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.hopper_level}
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="force_reset_hopper" class="block text-sm font-medium text-gray-700">Force Reset of Hopper</label>
                            <input 
                                type="text" 
                                id="force_reset_hopper" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.force_reset_hopper}
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="dial_method" class="block text-sm font-medium text-gray-700">Dial Method</label>
                            <input 
                                type="text" 
                                id="dial_method" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.dial_method}
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="auto_dial_level" class="block text-sm font-medium text-gray-700">Auto Dial Level</label>
                            <input 
                                type="text" 
                                id="auto_dial_level" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.auto_dial_level}
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="adapt_intensity_modifier" class="block text-sm font-medium text-gray-700">Modificateur d'Intensité Adaptée</label>
                            <select 
                                id="adapt_intensity_modifier" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.adaptive_intensity}
                            >
                                {#each Array(40).fill(0).map((_, i) => -(i + 1)) as intensity}
                                    <option value={intensity}>
                                        {intensity} - Moins Intense
                                    </option>
                                {/each}
                                <option value={0}>0 - Équilibré</option>
                                {#each Array(40).fill(0).map((_, i) => i + 1) as intensity}
                                    <option value={intensity}>
                                        +{intensity} - Plus Intense
                                    </option>
                                {/each}
                            </select>
                        </div>
                        
                        <div class="space-y-2">
                            <label for="script" class="block text-sm font-medium text-gray-700">Script</label>
                            <input 
                                type="text" 
                                id="script" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.campaign_script}
                            >
                        </div>
                        
                        <div class="space-y-2">
                            <label for="get_call_launch" class="block text-sm font-medium text-gray-700">Get Call Launch</label>
                            <input 
                                type="text" 
                                id="get_call_launch" 
                                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                bind:value={company.get_call_launch}
                            >
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <div class="mt-8 flex justify-end gap-3">
        <button class="px-5 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-gray-700 font-medium">
            Cancel
        </button>
        <button class="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium">
            Save Changes
        </button>
    </div>
</div>

<style>
    /* Custom styles */
    input:read-only, 
    input[readonly] {
        cursor: not-allowed;
    }
    
    /* Smooth transitions */
    button, input, select {
        transition: all 0.2s ease;
    }
    
    /* Custom focus styles */
    input:focus, 
    select:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
</style>