<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  let lists = [];
  let searchQuery = '';
  let filteredLists = [];
  let isLoading = false;
  let errorMessage = '';
  let editMode = false;
  let editedList = { list_id: null, list_name: "", list_description: "", campaign_id: "", active: "" };
  let deletedLists = [];
  let id = null;
  let additionalData = []; // Pour stocker les données supplémentaires
  let showAdditionalTables = false; // État pour afficher ou masquer les tableaux supplémentaires
  let selectedListDetails = null; // Détails de la liste sélectionnée

  

  async function fetchListDetails(list_id) {
    const response = await fetch(`http://localhost:8000/api/lists/getListById/${list_id}`);
    if (response.ok) {
      selectedListDetails = await response.json();
    } else {
      alert('⚠️ Problème lors de la récupération des détails de la liste.');
    }
  }

  async function loadLists() {
    isLoading = true;
    errorMessage = '';

    try {
      const response = await fetch('http://localhost:8000/api/lists/afficher');
      if (response.ok) {
        lists = await response.json();
        filteredLists = lists; // Show all lists initially
      } else {
        throw new Error('Failed to load lists.');
      }
    } catch (error) {
      errorMessage = '⚠️ Problème de connexion.';
    } finally {
      isLoading = false;
    }
  }

  async function deleteList(list_id) {
    const listToDelete = lists.find(list => list.list_id === list_id);
    if (confirm('Êtes-vous sûr de vouloir déplacer cette liste vers la corbeille ?')) {
      isLoading = true; // Afficher le chargement
      try {
        const response = await fetch(`http://localhost:8000/api/lists/supprimer/${list_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(listToDelete),
        });

        if (response.ok) {
          lists = lists.filter(list => list.list_id !== list_id);
          filteredLists = lists; // Mettre à jour la liste filtrée
          alert('✅ Liste déplacée vers la corbeille !');
        } else {
          throw new Error('Impossible de déplacer la liste vers la corbeille.');
        }
      } catch (error) {
        errorMessage = '⚠️ Problème lors de la suppression.';
      } finally {
        isLoading = false; // Cacher le chargement
      }
    }
  }

  async function fetchCorbeille() {
    isLoading = true;
    errorMessage = '';

    try {
      const response = await fetch('http://localhost:8000/api/lists/corbeille');
      if (response.ok) {
        deletedLists = await response.json();
        console.log("Listes supprimées récupérées :", deletedLists);
      } else {
        throw new Error('Erreur lors de la récupération des listes supprimées.');
      }
    } catch (error) {
      errorMessage = '⚠️ Problème lors de la récupération des listes supprimées.';
      console.error("Erreur :", error);
    } finally {
      isLoading = false;
    }
  }

  async function restoreList(list_id) {
    if (confirm('Êtes-vous sûr de vouloir restaurer cette liste ?')) {
      isLoading = true; // Afficher le chargement
      try {
        const response = await fetch(`http://localhost:8000/api/lists/restaurer/${list_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          await fetchCorbeille(); // Recharger les listes supprimées
          await loadLists(); // Recharger les listes principales
          alert('✅ Liste restaurée avec succès !');
        } else {
          throw new Error('Impossible de restaurer la liste.');
        }
      } catch (error) {
        errorMessage = '⚠️ Problème lors de la restauration.';
      } finally {
        isLoading = false; // Cacher le chargement
      }
    }
  }

  function filterLists() {
    filteredLists = searchQuery
      ? lists.filter(({ list_name, list_id }) =>
          list_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(list_id).includes(searchQuery)
        )
      : lists;
  }

  function viewList(list_id) {
    window.location.href = `/liste/list-details/${list_id}`;
    fetchListDetails(list_id);
    fetchAdditionalData(list_id);
  }

  function editList(list) {
    id = list;
    editMode = true;
    editedList = { ...list };
  }

  async function saveEdit() {
    isLoading = true;
    errorMessage = '';

    try {
      const response = await fetch(`http://localhost:8000/api/lists/modifier/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedList),
      });

      if (response.ok) {
        await loadLists();
        editMode = false;
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

  // Update results in real-time
  $: filterLists();

  // Load lists on component mount
  onMount(loadLists);

  function viewAdditionalTables(list_id) {
  goto(`/liste/details/${list_id}`);
}
</script>

<div class="page-container">
  <header class="header">
    <h1 class="header-title">🔍 Recherche de Listes</h1>
  </header>

  <main class="main-content">
    <form class="search-form" on:submit|preventDefault={filterLists}>
      <input 
        type="text" 
        class="search-input" 
        bind:value={searchQuery} 
        placeholder="Rechercher par nom ou ID..." 
        aria-label="Search"
      />
      <button type="submit" class="search-button">
        Rechercher
      </button>
      <button on:click={fetchCorbeille} class="btn btn-warning">
        Voir la Corbeille 🗑️
      </button>
    </form>

    {#if isLoading}
      <div class="loader">
        <div class="spinner"></div>
        <p class="loading-text">Chargement des listes...</p>
      </div>
    {/if}

    {#if errorMessage}
      <div class="alert alert-danger">{errorMessage}</div>
    {/if}

    <div class="list-container">
      <h2 class="list-title">📋 Listes existantes</h2>
      {#if filteredLists.length === 0 && !isLoading && !errorMessage}
        <div class="alert alert-warning">Aucune liste disponible.</div>
      {:else}
        <table class="list-table">
          <thead>
            <tr>
              <th>Nom de la liste</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredLists as { list_id, list_name }}
              <tr>
                <td class="list-name">{list_name}</td>
                <td>
                  <button class="action-button view-button" on:click={() => viewList(list_id)}>Voir</button>
                  <button class="action-button" on:click={() => viewAdditionalTables(list_id)}>Afficher les détails supplémentaires</button>
                  <button class="action-button edit-button" on:click={() => editList({ list_id, list_name })}>Modifier</button>
                  <button class="action-button delete-button" on:click={() => deleteList(list_id)}>Supprimer</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>

   

    {#if showAdditionalTables}
      <div class="additional-data-container">
        <h2>Détails supplémentaires</h2>

        <div class="table-section">
          <h3>Fuseaux horaires dans cette liste :</h3>
          <table class="styled-table">
            <thead>
              <tr>
                <th>Décalage GMT (heure locale)</th>
                <th>Appels</th>
                <th>Non appelés</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>-5.00 (Wed 5 Mar 2025 03:43)</td>
                <td>0</td>
                <td>1</td>
              </tr>
              <tr>
                <td>Sous-totaux</td>
                <td>0</td>
                <td>1</td>
              </tr>
              <tr>
                <td>Total</td>
                <td>1</td>
                <td>1</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-section">
          <h3>Propriétaires dans cette liste :</h3>
          <table class="styled-table">
            <thead>
              <tr>
                <th>Propriétaire</th>
                <th>Appels</th>
                <th>Non appelés</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0</td>
                <td>0</td>
                <td>1</td>
              </tr>
              <tr>
                <td>Sous-totaux</td>
                <td>0</td>
                <td>1</td>
              </tr>
              <tr>
                <td>Total</td>
                <td>0</td>
                <td>1</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-section">
          <h3>Rangs dans cette liste :</h3>
          <table class="styled-table">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Appels</th>
                <th>Non appelés</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0</td>
                <td>0</td>
                <td>1</td>
              </tr>
              <tr>
                <td>Sous-totaux</td>
                <td>0</td>
                <td>1</td>
              </tr>
              <tr>
                <td>Total</td>
                <td>0</td>
                <td>1</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-section">
          <h3>Comptes d'appels dans cette liste :</h3>
          <table class="styled-table">
            <thead>
              <tr>
                <th>Statut</th>
                <th>Nom du statut</th>
                <th>0</th>
                <th>Sous-total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>NOUVEAU</td>
                <td>Nouveau Lead</td>
                <td>1</td>
                <td>1</td>
              </tr>
              <tr>
                <td>Total</td>
                <td></td>
                <td>1</td>
                <td>1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    {#if deletedLists.length > 0}
      <h2>Listes supprimées</h2>
      {#each deletedLists as list}
        <div>
          <p>{list.list_name}</p>
          <button on:click={() => restoreList(list.list_id)}>Restaurer</button>
        </div>
      {/each}
    {:else}
      <p>Aucune liste supprimée.</p>
    {/if}
  </main>
</div>

{#if editMode}
  <div class="edit-form">
    <h3>Modifier la liste</h3>
    <input type="text" bind:value={editedList.list_name} placeholder="Nom de la liste" />
    <input type="text" bind:value={editedList.list_description} placeholder="Description" />
    <input type="text" bind:value={editedList.campaign_id} placeholder="ID de la campagne" />
    <select bind:value={editedList.active}>
      <option value="Y">Active</option>
      <option value="N">Inactive</option>
    </select>
    <button on:click={saveEdit} class="save-button">Enregistrer</button>
    <button on:click={() => (editMode = false)} class="cancel-button">Annuler</button>
  </div>
{/if}

<style>
  /* Full screen styles */
  html, body {
    height: 100%;
    margin: 0;
    font-family: 'Arial', sans-serif;
    background-color: #f4f7fa;
  }

  .page-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  /* Header styles */
  .header {
    text-align: center;
    margin-bottom: 20px;
  }

  .header-title {
    font-size: 2rem;
    color: #007bff;
  }

  /* Main content styles */
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  /* Search form styles */
  .search-form {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }

  .search-input {
    width: 70%;
    padding: 10px;
    border-radius: 20px;
    border: 1px solid #007bff;
    margin-right: 10px;
    outline: none;
  }

  .search-button {
    padding: 10px 15px;
    border-radius: 20px;
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
  }

  /* Loader styles */
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

  /* List container styles */
  .list-container {
    margin-top: 20px;
    width: 100%;
  }

  .list-title {
    font-size: 1.5rem;
    margin-bottom: 10px;
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

  .alert-warning {
    background-color: #fff3cd;
    color: #856404;
  }

  /* Table styles */
  .list-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }

  .list-table th, .list-table td {
    padding: 12px;
    border: 1px solid #ddd;
    text-align: left;
  }

  .list-table th {
    background-color: #007bff;
    color: white;
  }

  .list-name {
    font-weight: bold;
  }

  /* Button styles */
  .action-button {
    padding: 5px 10px;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    margin-right: 5px;
    transition: background-color 0.3s;
  }

  .view-button {
    background-color: #17a2b8;
    color: white;
  }

  .edit-button {
    background-color: #ffc107;
    color: white;
  }

  .delete-button {
    background-color: #dc3545;
    color: white;
  }

  /* Button hover effects */
  .action-button:hover {
    opacity: 0.8;
  }

  /* Additional Data Styles */
  .additional-data-container {
    margin-top: 20px;
    width: 100%;
  }

  .table-section {
    margin-bottom: 30px;
  }

  h2 {
    font-size: 1.8rem;
    color: #333;
    text-align: center;
  }

  h3 {
    font-size: 1.5rem;
    color: #007bff;
    margin-bottom: 10px;
  }

  .styled-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    background-color: #f9f9f9;
    border-radius: 5px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(63, 63, 66, 0.1);
  }

  .styled-table thead {
    background-color: #007bff;
    color: white;
  }

  .styled-table th, .styled-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  .styled-table tr:hover {
    background-color: #f1f1f1;
  }

  .styled-table tr:nth-child(even) {
    background-color: #f2f2f2;
  }
  </style>