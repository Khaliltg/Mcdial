<script>
  import { onMount } from 'svelte';

  let lists = [];
  
    // Fonction pour récupérer les listes depuis l'API
    async function loadLists() {
      const res = await fetch('http://localhost:8000/api/lists/afficher');
      if (res.ok) {
        lists = await res.json();
      } else {
        alert('Erreur lors de la récupération des listes');
      }
    }
    
    
  onMount(loadLists);

</script>

<div class="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
  <h1 class="text-3xl font-semibold text-gray-800 mb-4">📋 Listes enregistrées</h1>

  {#if lists.length > 0}

    <ul class="space-y-4">
      {#each lists as list}
        <li class="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm">
          <span class="text-lg text-gray-800">ID :{list.list_id}</span><br>
          <span class="text-sm text-gray-500">List name: {list.list_name}</span><br>
          <span class="text-sm text-gray-500">campaign id: {list.campaign_id}</span><br>
          <span class="text-sm text-gray-500">Active: {list.active}</span><br>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="text-gray-500 mt-4">Aucune liste trouvée.</p>
  {/if}
</div>
