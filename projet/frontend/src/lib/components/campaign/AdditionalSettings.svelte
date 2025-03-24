<script>
    export let company;
</script>

<div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="border-b px-6 py-4 flex items-center gap-2 bg-gray-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        <h2 class="text-xl font-semibold text-gray-900">Additional Settings</h2>
    </div>
    <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
                <label for="hopper_level" class="block text-sm font-medium text-gray-700">Hopper Level</label>
                <input 
                    type="number" 
                    id="hopper_level" 
                    class="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm" 
                    bind:value={company.hopper_level}
                    min="1"
                    placeholder="Enter hopper level"
                >
            </div>
            
            <div class="space-y-2">
                <label for="local_call_time" class="block text-sm font-medium text-gray-700">Local Call Time</label>
                <input 
                    type="text" 
                    id="local_call_time" 
                    class="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm" 
                    bind:value={company.local_call_time}
                    placeholder="Enter local call time"
                >
            </div>
            
            <div class="space-y-2">
                <label for="auto_dial_level" class="block text-sm font-medium text-gray-700">Auto Dial Level</label>
                <input 
                    type="number" 
                    id="auto_dial_level" 
                    class="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm" 
                    bind:value={company.auto_dial_level}
                    min="1"
                    placeholder="Enter auto dial level"
                >
            </div>
            
            <div class="space-y-2">
                <label for="next_agent_call" class="block text-sm font-medium text-gray-700">Next Agent Call</label>
                <select 
                    id="next_agent_call" 
                    class="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm" 
                    bind:value={company.next_agent_call}
                >
                    <option value="random">Random</option>
                    <option value="oldest_call_start">Oldest Call Start</option>
                    <option value="oldest_call_finish">Oldest Call Finish</option>
                </select>
            </div>
        </div>
    </div>
</div>
