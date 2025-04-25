<script lang="ts">
  export let callLogs = [];
  export let isLoading = false;
  export let errorMessage = '';

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<div class="my-4">
  <h3 class="text-lg font-semibold text-blue-700 mb-2">Historique des appels</h3>
  {#if isLoading}
    <div class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if errorMessage}
    <div class="bg-red-100 text-red-700 p-2 rounded mb-2">{errorMessage}</div>
  {:else if callLogs.length === 0}
    <div class="text-gray-500 text-center py-4">Aucun appel récent</div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durée</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each callLogs as call}
            <tr>
              <td class="px-3 py-2 whitespace-nowrap text-sm">{call.date || call.timestamp}</td>
              <td class="px-3 py-2 whitespace-nowrap text-sm">{call.phone_number}</td>
              <td class="px-3 py-2 whitespace-nowrap text-sm">{call.contact_name}</td>
              <td class="px-3 py-2 whitespace-nowrap text-sm">{call.duration_formatted || formatDuration(call.duration || 0)}</td>
              <td class="px-3 py-2 whitespace-nowrap text-sm">{call.status || '-'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
