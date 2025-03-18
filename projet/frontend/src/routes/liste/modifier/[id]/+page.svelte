<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let editedList = {
    list_name: '',
    list_description: '',
    campaign_id: ''
  };
  let isLoading = false;
  let errorMessage = '';
  let list = {};

  // Fetch the listId from URL parameters
  $: listId = $page.params?.id;
  console.log("List ID:", listId);

  // Fetch data on mount
  onMount(async () => {
    if (!listId) {
      console.error("List ID is missing in the URL");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/lists/getListById/${listId}`);
      if (response.ok) {
        list = await response.json();
        console.log("List data:", list);

        editedList = {
          list_name: list.list_name,
          list_description: list.list_description,
          campaign_id: list.campaign_id
        };

        console.log("Loaded list for editing:", editedList);
      } else {
        alert('⚠️ Error fetching the list details.');
      }
    } catch (error) {
      console.error("Error fetching the list:", error);
    }
  });

  // Save the edited list
  async function saveEdit() {
    isLoading = true;
    errorMessage = '';

    console.log("Saving list with data:", editedList);

    try {
      const response = await fetch(`http://localhost:8000/api/lists/modifier/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          list_name: editedList.list_name,
          list_description: editedList.list_description,
          campaign_id: editedList.campaign_id
        }),
      });

      if (response.ok) {
        alert('✅ List updated successfully!');
        goto("/liste/recherchelist");
      } else {
        errorMessage = '⚠️ Error updating the list.';
      }
    } catch (error) {
      console.error("Error during update:", error);
      errorMessage = '⚠️ An error occurred.';
    } finally {
      isLoading = false;
    }
  }
</script>

<h2>Modifier la liste</h2>

<!-- Form fields to modify the list -->
<input
  type="text"
  bind:value={editedList.list_name}
  placeholder="Nom de la liste"
  aria-label="Nom de la liste"
/>
<input
  type="text"
  bind:value={editedList.list_description}
  placeholder="Description"
  aria-label="Description de la liste"
/>
<input
  type="text"
  bind:value={editedList.campaign_id}
  placeholder="ID de la campagne"
  aria-label="ID de la campagne"
/>

<!-- Save and cancel buttons -->
<button on:click={saveEdit} disabled={isLoading}>Enregistrer</button>
<button on:click={() => history.back()}>Annuler</button>

<!-- Error message display -->
{#if errorMessage}
  <p style="color: red;">{errorMessage}</p>
{/if}
