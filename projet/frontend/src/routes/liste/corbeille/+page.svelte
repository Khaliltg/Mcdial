<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let deletedLists = [];
  let isLoading = false;
  let errorMessage = '';

  async function fetchDeletedLists() {
    isLoading = true;
    errorMessage = '';

    try {
      const response = await fetch('http://localhost:8000/api/lists/corbeille');
      if (response.ok) {
        deletedLists = await response.json();
      } else {
        throw new Error('Erreur lors de la récupération des listes supprimées.');
      }
    } catch (error) {
      errorMessage = `⚠️ Problème lors de la récupération des listes supprimées: ${error.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function restoreList(list_id) {
    if (confirm('Êtes-vous sûr de vouloir restaurer cette liste ?')) {
      isLoading = true;
      try {
        const response = await fetch(`http://localhost:8000/api/lists/restaurer/${list_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          deletedLists = deletedLists.filter(list => list.list_id !== list_id);
          alert('✅ Liste restaurée avec succès !');
        } else {
          throw new Error('Impossible de restaurer la liste.');
        }
      } catch (error) {
        errorMessage = `⚠️ Problème lors de la restauration de la liste: ${error.message}`;
      } finally {
        isLoading = false;
      }
    }
  }

  async function deletePermanently(list_id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette liste définitivement ?')) {
      isLoading = true;
      try {
        const response = await fetch(`http://localhost:8000/api/lists/supprimer-definitivement/${list_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          deletedLists = deletedLists.filter(list => list.list_id !== list_id);
          alert('✅ Liste supprimée définitivement !');
        } else {
          throw new Error('Impossible de supprimer la liste définitivement.');
        }
      } catch (error) {
        errorMessage = `⚠️ Problème lors de la suppression définitive de la liste: ${error.message}`;
      } finally {
        isLoading = false;
      }
    }
  }

  function handleBack() {
    goto('/liste/afficherlist'); // Remplacez par l'URL correcte
  }

  onMount(fetchDeletedLists);
</script>

<style>
  main {
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    max-width: 600px;
    margin: auto;
  }

  h1 {
    color: #007bff;
    font-size: 2rem;
    margin-bottom: 20px;
    text-align: center;
  }

  button {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 10px 15px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin: 10px 0;
  }

  button:hover {
    background-color: #0056b3;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    padding: 10px;
    margin-bottom: 10px;
  }

  .btn-secondary {
    background-color: transparent;
    color: #007bff;
    border: 1px solid #007bff;
    padding: 8px 12px;
  }

  .btn-secondary:hover {
    background-color: #007bff;
    color: white;
  }
</style>

<main>
  <h1>Listes Supprimées</h1>
  <button on:click={handleBack} class="btn btn-secondary">
    Retour
  </button>
  {#if isLoading}
    <p>Chargement des listes supprimées...</p>
  {:else if errorMessage}
    <p>{errorMessage}</p>
  {:else if deletedLists.length === 0}
    <p>Aucune liste supprimée.</p>
  {:else}
    <ul>
      {#each deletedLists as list}
        <li>
          {list.list_name}
          <button on:click={() => restoreList(list.list_id)}>Restaurer</button>
          <button on:click={() => deletePermanently(list.list_id)}>Supprimer définitivement</button>
        </li>
      {/each}
    </ul>
  {/if}
</main>
