<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let deletedLists = [];
  let isLoading = false;
  let errorMessage = '';

  async function fetchCorbeille() {
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
      errorMessage = '⚠️ Problème lors de la récupération des listes supprimées.';
    } finally {
      isLoading = false;
    }
  }

  async function deletePermanently(list_id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette liste définitivement ?')) {
      isLoading = true;
      try {
        const response = await fetch(`http://localhost:8000/api/lists/supprimer/${list_id}`, {
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
        errorMessage = '⚠️ Problème lors de la suppression définitive.';
      } finally {
        isLoading = false;
      }
    }
  }

  async function restoreList(list_id) {
    isLoading = true;
    try {
      const response = await fetch(`http://localhost:8000/api/lists/restaurer/${list_id}`, {
        method: 'POST',
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
      errorMessage = '⚠️ Problème lors de la restauration.';
    } finally {
      isLoading = false;
    }
  }

  // Load deleted lists on component mount
  onMount(fetchCorbeille);
</script>

<div class="page-container">
  <header class="header">
    <h1 class="header-title">🗑️ Listes Supprimées</h1>
    <button on:click={() => goto('/liste')} class="btn btn-primary">Retour</button>
  </header>

  <main class="main-content">
    {#if isLoading}
      <div class="loader">
        <div class="spinner"></div>
        <p class="loading-text">Chargement des listes...</p>
      </div>
    {/if}

    {#if errorMessage}
      <div class="alert alert-danger">{errorMessage}</div>
    {/if}

    {#if deletedLists.length > 0}
      <h2>Listes supprimées</h2>
      {#each deletedLists as list}
        <div>
          <p>{list.list_name}</p>
          <button on:click={() => restoreList(list.list_id)}>Restaurer</button>
          <button on:click={() => deletePermanently(list.list_id)}>Supprimer définitivement</button>
        </div>
      {/each}
    {:else}
      <p>Aucune liste supprimée.</p>
    {/if}
  </main>
</div>

<style>
  /* Styles pour l'interface utilisateur */
  .page-container {
    padding: 20px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .header-title {
    font-size: 1.5rem;
    margin-right: 20px;
  }

  .btn {
    padding: 10px 20px;
    border-radius: 5px;
    border: none;
    cursor: pointer;
  }

  .btn-primary {
    background-color: #007bff;
    color: white;
  }

  .main-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .loader {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .spinner {
    border: 4px solid #007bff;
    border-top: 4px solid transparent;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    margin-top: 10px;
    color: #666;
  }

  .alert {
    text-align: center;
    padding: 10px;
    border-radius: 5px;
  }

  .alert-danger {
    background-color: #f8d7da;
    color: #721c24;
  }

  button {
    margin: 5px;
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  button:hover {
    opacity: 0.8;
  }
</style>
