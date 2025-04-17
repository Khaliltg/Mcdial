<script>
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let newList = {
    list_id: '',
    list_name: '',
    list_description: '',
    campaign_id: '',
    active: 'Y'
  };

  let campaigns = [];
  let showAddListForm = true;
  let errorMessage = '';

  onMount(loadCampaigns);

  async function addList() {
    // Validation côté client
    if (!newList.list_id || !newList.list_name || !newList.campaign_id) {
      alert('Tous les champs requis doivent être remplis.');
      return;
    }

    try {
      const response = await fetchWithAuth('http://localhost:8000/api/lists/ajouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newList),
      });
      if (response.ok) {
        alert('Liste ajoutée avec succès !');
        goto('/liste/afficherlist'); // Assurez-vous que cette route est correcte
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      alert('Une erreur est survenue.');
    }
  }

  async function loadCampaigns() {
    try {
      const response = await fetchWithAuth('http://localhost:8000/api/lists/campaigns');
      if (response.ok) {
        campaigns = await response.json();
      } else {
        console.error('Erreur lors du chargement des campagnes');
      }
    } catch (error) {
      console.error('Erreur lors de la requête des campagnes:', error);
    }
  }
</script>

<div class="form-section add-list-form">
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
    <button type="button" class="form-button cancel-button" on:click={() => goto('/liste/afficherlist')}>Annuler</button>
  </form>
  {#if errorMessage}
    <p style="color: red;">{errorMessage}</p>
  {/if}
</div>

<style>
  /* Styles inchangés */
  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    background-color: #f4f7fc;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    font-family: 'Arial', sans-serif;
  }

  .header-title {
    font-size: 2.5rem;
    font-weight: 600;
    color: #007bff;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .form-section {
    background-color: #ffffff;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .add-list-form {
    border-top: 5px solid #007bff;
  }

  .form-input, .search-input {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 16px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    transition: border-color 0.3s;
  }

  .form-input:focus, .search-input:focus {
    border-color: #007bff;
    outline: none;
  }

  .form-button, .search-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
    font-size: 16px;
  }

  .form-button:hover, .search-button:hover {
    background-color: #0056b3;
  }

  .cancel-button {
    background-color: #6c757d;
    color: white;
  }

  .cancel-button:hover {
    background-color: #5a6268;
  }
</style>
