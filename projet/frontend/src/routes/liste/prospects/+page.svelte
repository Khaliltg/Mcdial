<script>
  import { onMount } from 'svelte';

  let name = '';
  let phone = '';
  let listId = '';
  let Liste = [];

  async function loadLists() {
    const res = await fetch('/api/lists');
    if (res.ok) {
      lists = await res.json();
    }
  }

  async function addProspect() {
    const res = await fetch('/api/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, listId }),
    });

    if (res.ok) {
      name = '';
      phone = '';
      listId = '';
      alert('Prospect ajouté avec succès');
    }
  }

  onMount(loadLists);
</script>

<div class="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
  <h1 class="text-2xl font-semibold text-gray-800">👤 Ajouter un prospect</h1>

  <div class="mt-4">
    <label class="block text-gray-700">Nom</label>
    <input type="text" bind:value={name} class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" />

    <label class="block mt-2 text-gray-700">Téléphone</label>
    <input type="text" bind:value={phone} class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" />

    <label class="block mt-2 text-gray-700">Liste</label>
    <select bind:value={listId} class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500">
      <option value="" disabled selected>Choisissez une liste</option>
      {#each lists as { id, name }}
        <option value={id}>{name}</option>
      {/each}
    </select>

    <button on:click={addProspect} class="w-full mt-4 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
      Ajouter
    </button>
  </div>
</div>
