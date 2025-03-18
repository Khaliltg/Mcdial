<script>
     import { onMount } from 'svelte';
     import { goto } from '$app/navigation';

     export let editedList = { list_id: null, list_name: "", list_description: "", campaign_id: "", active: "" };
  export let isLoading = false;
  export let errorMessage = '';

  async function saveEdit(id) {
    isLoading = true;
    errorMessage = '';

    try {
      const response = await fetch(`http://localhost:8000/api/lists/modifier/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedList),
      });

      if (response.ok) {
        alert("✅ Liste modifiée avec succès !");
      } else {
        throw new Error("Impossible de modifier la liste.");
      }
    } catch (error) {
      errorMessage = "⚠️ Problème lors de la modification.";
    } finally {
      isLoading = false;
    }
  }

  function cancelEdit() {
    editedList = { list_id: null, list_name: "", list_description: "", campaign_id: "", active: "" };
  }
</script>

{#if editedList.list_id}
  <div class="edit-form">
    <h3>Modifier la liste</h3>
    <input type="text" bind:value={editedList.list_name} placeholder="Nom de la liste" />
    <input type="text" bind:value={editedList.list_description} placeholder="Description" />
    <input type="text" bind:value={editedList.campaign_id} placeholder="ID de la campagne" />
    <select bind:value={editedList.active}>
      <option value="Y">Active</option>
      <option value="N">Inactive</option>
    </select>
    <button on:click={() => saveEdit(editedList.list_id)} class="save-button">Enregistrer</button>
    <button on:click={cancelEdit} class="cancel-button">Annuler</button>
  </div>
{/if}

<style>
  .edit-form {
    margin-top: 20px;
  }
  /* Ajoutez d'autres styles si nécessaire */
</style>