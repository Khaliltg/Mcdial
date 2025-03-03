<script>
// @ts-nocheck

  import { onMount } from 'svelte';

  let name = '';
  let phone = '';
  let listId = '';
  let lists = [];

  // Charger les listes disponibles
  async function loadLists() {
      try {
          const res = await fetch('http://localhost:8000/api/lists/afficher');
          if (!res.ok) throw new Error('Erreur lors de la récupération des listes');
          
          const data = await res.json();
          console.log("Listes récupérées :", data);

          lists = data; // Mise à jour des listes

          if (lists.length > 0) {
              listId = lists[0].id; // Sélectionner la première liste par défaut
          }
      } catch (error) {
          console.error(error);
          alert(error.message);
      }

  }

  onMount(loadLists);
  console.log(lists);

</script>


<h1>Ajouter un prospect</h1>
<!-- svelte-ignore missing-declaration -->
<form >
  <label for="name">Nom du prospect</label>
  <input type="text" id="name" bind:value={name} required />

  <label for="phone">Numéro de téléphone</label>
  <input type="text" id="phone" bind:value={phone} required />

  <label for="listId">Liste</label>
  <select bind:value={listId} required>
      <option value="" disabled selected hidden>Choisissez une liste</option>
      {#each lists as list}
          <option value={list.id}>{list.list_name}</option>
      {/each}
  </select>

  <button type="submit">Ajouter Prospect</button>
</form>
