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
      errorMessage = '⚠️ Problème lors de la récupération des listes supprimées.';
    } finally {
      isLoading = false;
    }
  }

  async function restoreList(list_id) {

    if (confirm('Êtes-vous sûr de vouloir restaurer cette liste ?')) {
      isLoading = true; // Afficher le chargement
      try {
        const response = await fetch(`http://localhost:8000/api/lists/restaurer/${list_id}`, {
          method: 'PUT', // Supposons que tu utilises PUT pour restaurer
          headers: {
            'Content-Type': 'application/json',
          },
        });
        

        if (response.ok) {
          // Mettre à jour la liste des listes supprimées après restauration
          deletedLists = deletedLists.filter(list => list.list_id !== list_id);
          alert('✅ Liste restaurée avec succès !');
        } else {
          throw new Error('Impossible de restaurer la liste.');
        }
      } catch (error) {
        errorMessage = '⚠️ Problème lors de la restauration de la liste.';
      } finally {
        isLoading = false; // Cacher le chargement
      }
    }
  }
  

  onMount(fetchDeletedLists);
  function handleBack() {
  goto('/liste/recherchelist'); // Remplacez '/' par l'URL vers laquelle vous souhaitez revenir
}
</script>
<style>
  main {
    padding: 20px;
    background-color: #f8f9fa; /* Couleur de fond claire */
    border-radius: 8px;
    max-width: 600px; /* Largeur maximale pour le centrage */
    margin: auto; /* Centrer le contenu */
  }

  h1 {
    color: #007bff; /* Couleur du titre en bleu */
    font-size: 2rem;
    margin-bottom: 20px;
    text-align: center; /* Centrer le titre */
  }

  button {
    background-color: #007bff; /* Couleur du bouton */
    color: white;
    border: none;
    border-radius: 5px;
    padding: 10px 15px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin: 10px 0; /* Marge autour du bouton */
  }

  button:hover {
    background-color: #0056b3; /* Couleur du bouton au survol */
  }

  ul {
    list-style-type: none; /* Supprimer les puces */
    padding: 0;
  }

  li {
    display: flex;
    justify-content: space-between; /* Espacement entre le nom et le bouton */
    align-items: center;
    background-color: white; /* Fond blanc pour les éléments de la liste */
    border: 1px solid #e0e0e0; /* Bordure légère */
    border-radius: 5px;
    padding: 10px;
    margin-bottom: 10px; /* Espacement entre les éléments */
  }

  .btn-secondary {
    background-color: transparent; /* Bouton transparent pour le retour */
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
  <button on:click={handleBack} class="btn btn-secondary"> <!-- Ajoutez ce bouton -->
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
        <li>{list.list_name} <button on:click={() => restoreList(list.list_id)}>Restaurer</button></li>
      {/each}
    </ul>
  {/if}
</main>
