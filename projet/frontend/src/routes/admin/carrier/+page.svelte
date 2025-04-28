<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  // Données et états
  let carriers: any[] = [];
  let error: string = '';
  let newCarrier: any = null;
  let editingCarrier: any = null;

  // Chargement initial des carriers
  onMount(async () => {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/carriers');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      carriers = await res.json();
    } catch (err) {
      error = err.message;
    }
  });

  // Ouvre le formulaire d'ajout
  function openAddForm() {
    error = '';
    newCarrier = {
      carrier_id:'',
      carrier_name: '',
      server_ip: '',
      protocol: '',
      registration_string: '',
      active: false,
      user_group: ''
    };
  }

  // Annule l'ajout
  function cancelAdd() {
    newCarrier = null;
    error = '';
  }

  // Envoie l'ajout au backend
  async function addCarrier() {
    // Validation front
    if (!newCarrier.carrier_name.trim()) {
      error = 'Le nom du carrier est requis.';
      return;
    }
    try {
      const payload = {
        ...newCarrier,
        active: newCarrier.active ? 'Y' : 'N'
      };
      const res = await fetchWithAuth('http://localhost:8000/api/carriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const created = await res.json();
      carriers = [...carriers, created];
      newCarrier = null;
      error = '';
    } catch (err) {
      error = err.message;
    }
  }

  // Ouvre le formulaire de modification
  function editCarrier(c: any) {
    error = '';
    editingCarrier = { ...c, active: c.active === 'Y' };
  }

  // Annule la modification
  function cancelEdit() {
    editingCarrier = null;
    error = '';
  }

  // Envoie la mise à jour au backend
  async function saveChanges() {
    if (!editingCarrier.carrier_name.trim()) {
      error = 'Le nom du carrier est requis.';
      return;
    }
    try {
      const payload = {
        ...editingCarrier,
        active: editingCarrier.active ? 'Y' : 'N'
      };
      const res = await fetchWithAuth(
        `http://localhost:8000/api/carriers/${editingCarrier.carrier_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      carriers = carriers.map(c =>
        c.carrier_id === editingCarrier.carrier_id ? editingCarrier : c
      );
      editingCarrier = null;
      error = '';
    } catch (err) {
      error = err.message;
    }
  }
</script>

<h1 class="text-3xl font-bold mb-6 text-gray-800">Carriers</h1>

{#if error}
  <p class="text-red-600 mb-4">Erreur : {error}</p>
{:else if carriers.length === 0}
  <p class="text-gray-500">Chargement…</p>
{:else}
  <div class="overflow-x-auto mb-6">
    <table class="min-w-full text-sm border border-gray-200 rounded-xl shadow-md">
      <thead class="bg-gray-50 text-gray-700 font-semibold">
        <tr>
          <th class="px-4 py-2 border">ID</th>
          <th class="px-4 py-2 border">Nom</th>
          <th class="px-4 py-2 border">IP serveur</th>
          <th class="px-4 py-2 border">Protocole</th>
          <th class="px-4 py-2 border">Registration</th>
          <th class="px-4 py-2 border">Actif</th>
          <th class="px-4 py-2 border">Groupe</th>
          <th class="px-4 py-2 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each carriers as c}
          <tr class="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition">
            <td class="px-4 py-2 border">{c.carrier_id}</td>
            <td class="px-4 py-2 border">{c.carrier_name}</td>
            <td class="px-4 py-2 border">{c.server_ip}</td>
            <td class="px-4 py-2 border">{c.protocol}</td>
            <td class="px-4 py-2 border truncate">{c.registration_string}</td>
            <td class="px-4 py-2 border">{c.active === 'Y' ? '✔️' : '❌'}</td>
            <td class="px-4 py-2 border">{c.user_group}</td>
            <td class="px-4 py-2 border">
              <button
                class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-full transition"
                on:click={() => editCarrier(c)}
              >
                Modifier
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<!-- Bouton Ajouter -->
<div class="mb-6">
  <button
    class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm transition"
    on:click={openAddForm}
  >
    ➕ Ajouter Carrier
  </button>
</div>

{#if newCarrier}
  <div class="p-6 bg-white border border-gray-200 rounded-xl shadow-md max-w-3xl mx-auto mb-6">
    <h2 class="text-2xl font-semibold text-gray-700 mb-4">Ajouter un nouveau Carrier</h2>
    <form on:submit|preventDefault={addCarrier} class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
          type="text"
          placeholder="Carriers id"
          bind:value={newCarrier.carrier_id}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Nom"
          bind:value={newCarrier.carrier_name}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="IP serveur"
          bind:value={newCarrier.server_ip}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Protocole"
          bind:value={newCarrier.protocol}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Registration"
          bind:value={newCarrier.registration_string}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
        />
        <div class="flex items-center gap-2 col-span-2">
          <input
            id="new-active"
            type="checkbox"
            bind:checked={newCarrier.active}
            class="h-5 w-5 text-blue-600 rounded"
          />
          <label for="new-active" class="text-gray-600 font-medium">Actif</label>
        </div>
        <input
          type="text"
          placeholder="Groupe"
          bind:value={newCarrier.user_group}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 col-span-2"
        />
      </div>
      <div class="pt-4 flex gap-3">
        <button
          type="submit"
          class="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg transition"
        >
          ✅ Ajouter
        </button>
        <button
          type="button"
          on:click={cancelAdd}
          class="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-lg transition"
        >
          ❌ Annuler
        </button>
      </div>
    </form>
  </div>
{/if}

{#if editingCarrier}
  <div class="p-6 bg-white border border-gray-200 rounded-xl shadow-md max-w-3xl mx-auto mb-6">
    <h2 class="text-2xl font-semibold text-gray-700 mb-4">
      Modifier Carrier #{editingCarrier.carrier_id}
    </h2>
    <form on:submit|preventDefault={saveChanges} class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Nom"
          bind:value={editingCarrier.carrier_name}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="IP serveur"
          bind:value={editingCarrier.server_ip}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Protocole"
          bind:value={editingCarrier.protocol}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Registration"
          bind:value={editingCarrier.registration_string}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
        />
        <div class="flex items-center gap-2 col-span-2">
          <input
            id="edit-active"
            type="checkbox"
            bind:checked={editingCarrier.active}
            class="h-5 w-5 text-blue-600 rounded"
          />
          <label for="edit-active" class="text-gray-600 font-medium">Actif</label>
        </div>
        <input
          type="text"
          placeholder="Groupe"
          bind:value={editingCarrier.user_group}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 col-span-2"
        />
      </div>
      <div class="pt-4 flex gap-3">
        <button
          type="submit"
          class="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg transition"
        >
          💾 Enregistrer
        </button>
        <button
          type="button"
          on:click={cancelEdit}
          class="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-lg transition"
        >
          ❌ Annuler
        </button>
      </div>
    </form>
  </div>
{/if}
