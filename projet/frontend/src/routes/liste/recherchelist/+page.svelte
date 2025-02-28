<script>
  import { onMount } from 'svelte';
  
  let lists = [];
  let searchQuery = '';
  
  // Fonction pour récupérer les listes depuis l'API
  async function loadLists() {
    const res = await fetch('/api/vicidial_lists'); // Assure-toi que l'URL correspond à la route API correcte
    if (res.ok) {
      lists = await res.json();
    } else {
      alert('Erreur lors de la récupération des listes');
    }
  }
  
  // Fonction pour rechercher les listes
  async function searchLists() {
    const res = await fetch(`/api/lists/search?query=${searchQuery}`);
    if (res.ok) {
      lists = await res.json();
    } else {
      alert('Erreur lors de la recherche');
    }
  }
  
  // Charger les listes lors du montage de la page
  onMount(loadLists);
</script>

<h1>Recherche de listes</h1>

<form on:submit|preventDefault={searchLists}>
  <label for="search">Rechercher une liste</label>
  <input type="text" id="search" bind:value={searchQuery} />
  <button type="submit">Rechercher</button>
</form>

<h2>Listes existantes</h2>
<table>
  <thead>
    <tr>
      <th>Nom de la liste</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each lists as { list_id, list_name }}
      <tr>
        <td>{list_name}</td>
        <td>
          <button>Voir</button>
          <button>Modifier</button>
          <button>Supprimer</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
