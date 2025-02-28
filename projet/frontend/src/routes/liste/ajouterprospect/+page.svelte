<script>
    let name = '';
    let phone = '';
    let listId = '';
    let lists = [];
  
    // Charger les listes disponibles
    async function loadLists() {
      const res = await fetch('/api/lists');
      if (res.ok) {
        lists = await res.json();
      } else {
        alert('Erreur lors de la récupération des listes');
      }
    }
  
    // Fonction pour ajouter un prospect
    async function addProspect() {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone, listId }),
      });
  
      if (res.ok) {
        alert('Prospect ajouté !');
        name = '';
        phone = '';
      } else {
        alert('Erreur lors de l\'ajout du prospect');
      }
    }
  
    // Charger les listes lors du montage
    import { onMount } from 'svelte';
    onMount(loadLists);
  </script>
  
  <h1>Ajouter un prospect</h1>
  <form on:submit|preventDefault={addProspect}>
    <label for="name">Nom du prospect</label>
    <input type="text" id="name" bind:value={name} required />
  
    <label for="phone">Numéro de téléphone</label>
    <input type="text" id="phone" bind:value={phone} required />
  
    <label for="listId">Liste</label>
    <select bind:value={listId}>
      {#each lists as { id, name }}
        <option value={id}>{name}</option>
      {/each}
    </select>
  
    <button type="submit">Ajouter Prospect</button>
  </form>
  <script context="module" lang="ts">
    import { json } from '@sveltejs/kit';
  
    // POST : Ajouter un prospect
    export async function POST({ request }) {
      const { name, phone, listId } = await request.json();
      const newProspect = await addProspectToDatabase(name, phone, listId);
      return json(newProspect, { status: 201 });
    }
  
    async function addProspectToDatabase(name: string, phone: string, listId: string) {
      return { id: Date.now(), name, phone, listId }; // Simulation de l'ajout de prospect à la base de données
    }
  </script>
  