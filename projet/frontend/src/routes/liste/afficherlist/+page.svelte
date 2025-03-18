<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let lists = [];
  let activeLists = [];
  let inactiveLists = [];
  let deletedLists = [];
  let isLoading = false;
  let errorMessage = '';

  let newList = { list_id: '', list_name: '', list_description: '', campaign_id: '', active: 'Y' };
  let showAddListForm = false;

  let editedList = { list_name: '', list_description: '', campaign_id: '' };
  let listId = null;

  let searchQuery = '';
  let campaigns = [];

  async function loadLists() {
    try {
      const res = await fetch('http://localhost:8000/api/lists/afficher');
      if (res.ok) {
        lists = await res.json();
        activeLists = lists.filter(list => list.active === 'Y');
        inactiveLists = lists.filter(list => list.active === 'N');
      } else {
        throw new Error('Erreur lors de la récupération des listes');
      }
    } catch (error) {
      alert(error.message);
    }
  }

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

  async function addList() {
    try {
      const response = await fetch('http://localhost:8000/api/lists/ajouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newList),
      });
      if (response.ok) {
        alert('Liste ajoutée avec succès !');
        loadLists();
        showAddListForm = false; // Hide the form after adding
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      alert('Une erreur est survenue.');
    }
  }

  async function deleteList(list) {
    if (!list) {
      console.error("❌ Erreur : list ou list_id est indéfini !");
      alert("Erreur : Impossible de supprimer, list_id invalide !");
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir déplacer la liste ${list.list_id} vers la corbeille ?`)) {
      return;
    }

    console.log("📝 Liste à supprimer :", list);

    try {
      const response = await fetch(`http://localhost:8000/api/lists/supprimer/${list.list_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(list),
      });

      console.log("📡 Réponse du serveur :", response);

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Erreur serveur: ${errorMessage}`);
      }

      // Supprimer la liste du front-end après suppression réussie
      lists = lists.filter(item => item.list_id !== list.list_id);
      activeLists = activeLists.filter(item => item.list_id !== list.list_id);
      inactiveLists = inactiveLists.filter(item => item.list_id !== list.list_id);

      alert('✅ Liste déplacée vers la corbeille !');

    } catch (error) {
      console.error("❌ Erreur lors de la suppression :", error);
      alert(`⚠️ Problème lors de la suppression : ${error.message}`);
    }
  }

  async function restoreList(list_id) {
    if (confirm('Êtes-vous sûr de vouloir restaurer cette liste ?')) {
      try {
        const response = await fetch(`http://localhost:8000/api/lists/restaurer/${list_id}`, {
          method: 'PUT',
        });
        if (response.ok) {
          deletedLists = deletedLists.filter(list => list.list_id !== list_id);
          alert('Liste restaurée avec succès !');
          loadLists();
        } else {
          throw new Error('Impossible de restaurer la liste.');
        }
      } catch (error) {
        errorMessage = '⚠️ Problème lors de la restauration de la liste.';
        console.error('Error during restoration:', error);
      }
    }
  }

  function filterLists() {
    const filtered = searchQuery
      ? lists.filter(({ list_name, list_id }) =>
          list_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(list_id).includes(searchQuery)
        )
      : lists;
    activeLists = filtered.filter(list => list.active === 'Y');
    inactiveLists = filtered.filter(list => list.active === 'N');
  }

  async function fetchDeletedLists() {
    try {
      const response = await fetch('http://localhost:8000/api/lists/corbeille');
      if (response.ok) {
        deletedLists = await response.json();
      } else {
        throw new Error('Erreur lors de la récupération des listes supprimées.');
      }
    } catch (error) {
      errorMessage = '⚠️ Problème lors de la récupération des listes supprimées.';
    }
  }

  async function editList(list_id) {
    goto(`/liste/modifier/${list_id}`);
  }

  async function saveEdit() {
    try {
      const response = await fetch(`http://localhost:8000/api/lists/modifier/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedList),
      });
      if (response.ok) {
        alert('Liste modifiée avec succès !');
        loadLists();
      } else {
        errorMessage = '⚠️ Error updating the list.';
      }
    } catch (error) {
      console.error('Error during update:', error);
      errorMessage = '⚠️ An error occurred.';
    }
  }

  onMount(() => {
    loadLists();
    fetchDeletedLists();
    loadCampaigns();
  });
</script>

<div class="page-container">
  <header class="header">
    <h1 class="header-title">📋 Afficher les Listes</h1>
  </header>

  <main class="main-content">
    <!-- Add New List Button -->
    <button class="add-list-button" on:click={() => showAddListForm = true}>
      Ajouter une nouvelle liste
    </button>

    <!-- Add New List Form -->
    {#if showAddListForm}
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
          <button type="button" class="form-button cancel-button" on:click={() => showAddListForm = false}>Annuler</button>
        </form>
      </div>
    {/if}

    <!-- Search List Form -->
    <div class="search-section">
      <h2>Rechercher une liste</h2>
      <form class="search-form" on:submit|preventDefault={filterLists}>
        <input type="text" class="search-input" bind:value={searchQuery} placeholder="Rechercher par nom ou ID..." aria-label="Search" />
        <button type="submit" class="search-button">Rechercher</button>
      </form>
      <button on:click={() => goto('/liste/corbeille')} class="btn btn-warning">Voir la Corbeille 🗑️</button>
    </div>

    <!-- List Containers -->
    <div class="list-containers">
      <!-- Active Lists Display -->
      <div class="list-container">
        <h2 class="list-title">📋 Listes Actives</h2>
        {#if activeLists.length > 0}
          <table class="list-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom de la liste</th>
                <th>ID de campagne</th>
                <th>Actif</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each activeLists as list}
                <tr class="list-item">
                  <td>{list.list_id}</td>
                  <td>{list.list_name}</td>
                  <td>{list.campaign_id}</td>
                  <td>✅</td>
                  <td>
                    <button class="action-button view-button" on:click={() => goto(`/liste/fileliste/${list.list_id}`)}>Voir les fichiers</button>
                    <button class="action-button edit-button" on:click={() => editList(list.list_id)}>Modifier</button>
                    <button class="action-button delete-button" on:click={() => deleteList(list)}>Supprimer</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else}
          <p class="no-list">Aucune liste active trouvée.</p>
        {/if}
      </div>

      <!-- Inactive Lists Display -->
      <div class="list-container">
        <h2 class="list-title">📋 Listes Inactives</h2>
        {#if inactiveLists.length > 0}
          <table class="list-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom de la liste</th>
                <th>ID de campagne</th>
                <th>Actif</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each inactiveLists as list}
                <tr class="list-item">
                  <td>{list.list_id}</td>
                  <td>{list.list_name}</td>
                  <td>{list.campaign_id}</td>
                  <td>❌</td>
                  <td>
                    <button class="action-button view-button" on:click={() => goto(`/liste/fileliste/${list.list_id}`)}>Voir les fichiers</button>
                    <button class="action-button edit-button" on:click={() => editList(list.list_id)}>Modifier</button>
                    <button class="action-button delete-button" on:click={() => deleteList(list.list_id)}>Supprimer</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else}
          <p class="no-list">Aucune liste inactive trouvée.</p>
        {/if}
      </div>
    </div>

    <!-- Edit List Form -->
    {#if listId}
      <div class="form-section">
        <h2>Modifier la liste</h2>
        <input type="text" bind:value={editedList.list_name} placeholder="Nom de la liste" aria-label="Nom de la liste" class="form-input" />
        <input type="text" bind:value={editedList.list_description} placeholder="Description" aria-label="Description de la liste" class="form-input" />
        <select bind:value={editedList.campaign_id} class="form-input">
          <option value="" disabled selected>Sélectionner une campagne</option>
          {#each campaigns as campaign}
            <option value={campaign.campaign_id}>{campaign.campaign_name}</option>
          {/each}
        </select>
        <button on:click={saveEdit} disabled={isLoading} class="form-button">Enregistrer</button>
        <button on:click={() => listId = null} class="form-button cancel-button">Annuler</button>
        {#if errorMessage}
          <p style="color: red;">{errorMessage}</p>
        {/if}
      </div>
    {/if}

    <!-- Deleted Lists -->
    {#if deletedLists.length > 0}
      {#each deletedLists as list}
        <div>
          <p>{list.list_name}</p>
        </div>
      {/each}
    {:else}
      <p>Aucune liste supprimée.</p>
    {/if}
  </main>
</div>

<style>
  /* Overall container styles */
  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    background-color: #f4f7fc;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    font-family: 'Arial', sans-serif;
  }

  /* Title styles */
  .header-title {
    font-size: 2.5rem;
    font-weight: 600;
    color: #007bff;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  /* Add List Button */
  .add-list-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin-bottom: 2rem;
    display: block;
  }

  .add-list-button:hover {
    background-color: #0056b3;
  }

  /* Form section styles */
  .form-section, .search-section {
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
  }

  .form-button, .search-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
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

  /* List containers layout */
  .list-containers {
    display: flex;
    justify-content: space-between;
    gap: 2rem;
  }

  .list-container {
    flex: 1;
  }

  /* Table styles */
  .list-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .list-table th,
  .list-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  .list-table th {
    background-color: #007bff;
    color: white;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .list-item {
    transition: background-color 0.3s;
  }

  .list-item:hover {
    background-color: #f1f1f1;
  }

  /* No list message styles */
  .no-list {
    text-align: center;
    color: #888;
    margin-top: 2rem;
    font-size: 1.2rem;
  }
</style>
