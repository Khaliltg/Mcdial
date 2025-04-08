<!-- src/routes/ajouter-liste.svelte -->
<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation'; // Pour la redirection après l'ajout de la liste

  let newList = { list_id: '', list_name: '', list_description: '', campaign_id: '', active: 'Y' };
  let campaigns = [];

  // Fonction pour charger les campagnes
  async function loadCampaigns() {
    try {
      const res = await fetch('http://localhost:8000/api/lists/campaigns');
      if (res.ok) {
        campaigns = await res.json();
      } else {
        throw new Error('Erreur lors de la récupération des campagnes');
      }
    } catch (error) {
      alert(error.message);
    }
  }

  // Fonction pour ajouter une nouvelle liste
  async function addList() {
    try {
      const response = await fetch('http://localhost:8000/api/lists/ajouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newList),
      });
      if (response.ok) {
        alert('Liste ajoutée avec succès !');
        goto('/'); // Redirection vers la page principale après ajout
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.error}`);
      }
    } catch (error) {
      alert('Une erreur est survenue.');
    }
  }

  // Charger les campagnes au montage du composant
  onMount(loadCampaigns());
  console.log(campaigns)
</script>

<h2>Ajouter une nouvelle liste</h2>
<form on:submit|preventDefault={addList}>
  <input type="text" bind:value={newList.list_id} placeholder="ID de la liste" required class="form-input" />
  <input type="text" bind:value={newList.list_name} placeholder="Nom de la liste" required class="form-input" />
  <input type="text" bind:value={newList.list_description} placeholder="Description de la liste" class="form-input" />
  <select bind:value={newList.campaign_id} class="form-input">
    <option value="" disabled selected>Sélectionner une campagne</option>
    {#each campaigns as campaign}
      <option value={campaign.campaign_id}>{campaign.campaign_name}</option>
    {/each}
  </select>
  <select bind:value={newList.active} class="form-input">
    <option value="Y">Active</option>
    <option value="N">Inactive</option>
  </select>
  <button type="submit" class="form-button">Ajouter</button>
</form>

<style>
  .form-input {
    width: 100%;
    padding: 10px;
    margin: 5px 0;
    border-radius: 5px;
    border: 1px solid #ddd;
  }
  
  .form-button {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
  }

  .form-button:hover {
    background-color: #45a049;
  }
</style>
