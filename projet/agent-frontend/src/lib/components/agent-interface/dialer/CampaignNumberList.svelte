<script lang="ts">
  export let campaignNumbers = [];
  export let isLoading = false;
  export let errorMessage = '';
  export let disabled = false;
  export let status = '';
  export let callFromList: (phoneNumber: string, contactName: string, leadId?: string) => void;
</script>

<div class="my-4">
  <h3 class="text-lg font-semibold text-blue-700 mb-2">Numéros de campagne</h3>
  {#if isLoading}
    <div class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if errorMessage}
    <div class="bg-red-100 text-red-700 p-2 rounded mb-2">{errorMessage}</div>
  {:else if campaignNumbers.length === 0}
    <div class="text-gray-500 text-center py-4">Aucun numéro n'est actuellement disponible pour cette campagne</div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liste</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appels</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each campaignNumbers as number}
            <tr class="hover:bg-gray-50">
              <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{number.phone_number}</td>
              <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{number.first_name} {number.last_name}</td>
              <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                  {number.list_name || 'Liste principale'}
                </span>
              </td>
              <td class="px-3 py-2 whitespace-nowrap text-sm">
                <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  number.status === 'NEW' || !number.status
                    ? 'bg-green-100 text-green-800'
                    : number.status === 'CBHOLD'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  {number.status || 'NEW'}
                </span>
              </td>
              <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{number.called_count || 0}</td>
              <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                <button
                  on:click={() => callFromList(number.phone_number, `${number.first_name} ${number.last_name}`, number.lead_id)}
                  class="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={disabled || status === 'dialing' || status === 'ready'}
                  title="Appeler ce numéro"
                >
                  Appeler
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
