<script context="module" lang="ts">
  export async function load({ fetch }) {
    const res = await fetch('/api/lists');
    const lists = await res.json();
    return { props: { lists } };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  export let lists: Array<{ id: number; name: string }> = [];
  let searchTerm = '';
  let selectedListId = null;
  let editedListName = '';

  async function fetchLists() {
    const res = await fetch('/api/lists');
    lists = await res.json();
  }

  function filterLists() {
    lists = lists.filter(list => list.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }

  async function editList(id) {
    selectedListId = id;
    editedListName = lists.find(list => list.id === id).name;
  }

  async function saveEdit() {
    if (selectedListId !== null) {
      const response = await fetch(`/api/lists/${selectedListId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedListName })
      });

      if (response.ok) {
        fetchLists();
        selectedListId = null;
        editedListName = '';
      } else {
        alert('Erreur lors de la modification de la liste.');
      }
    }
  }

  onMount(() => {
    fetchLists();
  });
</script>

<h1>Listes</h1>
<input type="text" placeholder="Rechercher une liste" bind:value={searchTerm} on:input={filterLists} />
<table>
  <thead>
    <tr>
      <th>Nom de la liste</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each lists as { id, name }}
      <tr>
        <td>{name}</td>
        <td>
          <button on:click={() => goto(`/liste/${id}`)}>Voir</button>
          <button on:click={() => editList(id)}>Modifier</button>
          <button>Supprimer</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#if selectedListId !== null}
  <div>
    <h2>Modifier la liste</h2>
    <input type="text" bind:value={editedListName} placeholder="Nouveau nom de la liste" />
    <button on:click={saveEdit}>Enregistrer</button>
    <button on:click={() => { selectedListId = null; editedListName = ''; }}>Annuler</button>
  </div>
{/if}
