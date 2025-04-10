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

  let editedList = { list_id: '', list_name: '', list_description: '', campaign_id: '', active: 'Y' };
  let showEditForm = false;

  let searchQuery = '';
  let campaigns = [];
  let activeTab = 'lists'; // 'lists' or 'trash'
  let showInactiveLists = false;

  // Confirmation dialog state
  let showConfirmDialog = false;
  let confirmAction = null;
  let confirmMessage = '';
  let confirmTitle = '';
  let listToDelete = null;

  async function loadLists() {
    isLoading = true;
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
      errorMessage = error.message;
    } finally {
      isLoading = false;
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
      errorMessage = error.message;
    }
  }

  async function addList() {
    isLoading = true;
    try {
      const response = await fetch('http://localhost:8000/api/lists/ajouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newList),
      });
      if (response.ok) {
        showNotification('Liste ajoutée avec succès !', 'success');
        loadLists();
        showAddListForm = false; // Hide the form after adding
        // Reset form
        newList = { list_id: '', list_name: '', list_description: '', campaign_id: '', active: 'Y' };
      } else {
        const errorData = await response.json();
        showNotification(`Erreur: ${errorData.error}`, 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      showNotification('Une erreur est survenue.', 'error');
    } finally {
      isLoading = false;
    }
  }

  function confirmDelete(list) {
    if (!list) {
      showNotification("Erreur : Impossible de supprimer, list_id invalide !", 'error');
      return;
    }

    listToDelete = list;
    confirmTitle = "Confirmer la suppression";
    confirmMessage = `Êtes-vous sûr de vouloir déplacer la liste "${list.list_name}" (ID: ${list.list_id}) vers la corbeille ?`;
    confirmAction = () => deleteList(list);
    showConfirmDialog = true;
  }

  async function deleteList(list) {
    isLoading = true;
    try {
      const response = await fetch(`http://localhost:8000/api/lists/supprimer/${list.list_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(list),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Erreur serveur: ${errorMessage}`);
      }

      // Supprimer la liste du front-end après suppression réussie
      lists = lists.filter(item => item.list_id !== list.list_id);
      activeLists = activeLists.filter(item => item.list_id !== list.list_id);
      inactiveLists = inactiveLists.filter(item => item.list_id !== list.list_id);

      showNotification('Liste déplacée vers la corbeille !', 'success');
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      showNotification(`Problème lors de la suppression : ${error.message}`, 'error');
    } finally {
      isLoading = false;
      showConfirmDialog = false;
    }
  }

  function confirmRestore(list_id) {
    confirmTitle = "Confirmer la restauration";
    confirmMessage = `Êtes-vous sûr de vouloir restaurer cette liste ?`;
    confirmAction = () => restoreList(list_id);
    showConfirmDialog = true;
  }

  async function restoreList(list_id) {
    isLoading = true;
    try {
      const response = await fetch(`http://localhost:8000/api/lists/restaurer/${list_id}`, {
        method: 'PUT',
      });
      if (response.ok) {
        deletedLists = deletedLists.filter(list => list.list_id !== list_id);
        showNotification('Liste restaurée avec succès !', 'success');
        loadLists();
      } else {
        throw new Error('Impossible de restaurer la liste.');
      }
    } catch (error) {
      errorMessage = 'Problème lors de la restauration de la liste.';
      console.error('Error during restoration:', error);
    } finally {
      isLoading = false;
      showConfirmDialog = false;
    }
  }

  function confirmPermanentDelete(list) {
    confirmTitle = "Supprimer définitivement";
    confirmMessage = `Êtes-vous sûr de vouloir supprimer définitivement la liste "${list.list_name}" (ID: ${list.list_id}) ? Cette action est irréversible.`;
    confirmAction = () => permanentDeleteList(list.list_id);
    showConfirmDialog = true;
  }

  async function permanentDeleteList(list_id) {
    isLoading = true;
    try {
      const response = await fetch(`http://localhost:8000/api/lists/supprimerdefinitivement/${list_id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        deletedLists = deletedLists.filter(list => list.list_id !== list_id);
        showNotification('Liste supprimée définitivement !', 'success');
      } else {
        throw new Error('Impossible de supprimer définitivement la liste.');
      }
    } catch (error) {
      errorMessage = 'Problème lors de la suppression définitive de la liste.';
      console.error('Error during permanent deletion:', error);
    } finally {
      isLoading = false;
      showConfirmDialog = false;
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
    isLoading = true;
    try {
      const response = await fetch('http://localhost:8000/api/lists/corbeille');
      if (response.ok) {
        deletedLists = await response.json();
      } else {
        throw new Error('Erreur lors de la récupération des listes supprimées.');
      }
    } catch (error) {
      errorMessage = 'Problème lors de la récupération des listes supprimées.';
    } finally {
      isLoading = false;
    }
  }

  function openEditForm(list) {
    editedList = { ...list };
    showEditForm = true;
  }

  async function saveEdit() {
    isLoading = true;
    try {
      const response = await fetch(`http://localhost:8000/api/lists/modifier/${editedList.list_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedList),
      });
      if (response.ok) {
        showNotification('Liste modifiée avec succès !', 'success');
        loadLists();
        showEditForm = false;
      } else {
        errorMessage = 'Erreur lors de la mise à jour de la liste.';
      }
    } catch (error) {
      console.error('Error during update:', error);
      errorMessage = 'Une erreur est survenue.';
    } finally {
      isLoading = false;
    }
  }

  function toggleListStatus(list) {
    const updatedList = { ...list, active: list.active === 'Y' ? 'N' : 'Y' };
    
    // Update the list in the backend
    updateListStatus(updatedList);
  }

  async function updateListStatus(list) {
    isLoading = true;
    try {
      const response = await fetch(`http://localhost:8000/api/lists/modifier/${list.list_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list),
      });
      if (response.ok) {
        showNotification(`Liste ${list.active === 'Y' ? 'activée' : 'désactivée'} avec succès !`, 'success');
        loadLists();
      } else {
        errorMessage = 'Erreur lors de la mise à jour du statut.';
      }
    } catch (error) {
      console.error('Error during status update:', error);
      errorMessage = 'Une erreur est survenue.';
    } finally {
      isLoading = false;
    }
  }

  // Notification system
  let notification = { message: '', type: '', visible: false };
  
  function showNotification(message, type = 'info') {
    notification = { message, type, visible: true };
    setTimeout(() => {
      notification = { ...notification, visible: false };
    }, 3000);
  }

  onMount(() => {
    loadLists();
    fetchDeletedLists();
    loadCampaigns();
  });
</script>

<div class="page-container">
  {#if notification.visible}
    <div class="notification {notification.type}">
      <span>{notification.message}</span>
      <button on:click={() => notification = {...notification, visible: false}}>×</button>
    </div>
  {/if}

  <!-- Confirmation Dialog -->
  {#if showConfirmDialog}
    <div class="modal-overlay">
      <div class="modal-content confirm-dialog">
        <div class="modal-header">
          <h2>{confirmTitle}</h2>
          <button class="close-button" on:click={() => showConfirmDialog = false}>×</button>
        </div>
        <div class="confirm-body">
          <div class="confirm-icon">
            <span>⚠️</span>
          </div>
          <p>{confirmMessage}</p>
        </div>
        <div class="confirm-actions">
          <button class="btn btn-secondary" on:click={() => showConfirmDialog = false}>Annuler</button>
          <button class="btn btn-danger" on:click={confirmAction}>Confirmer</button>
        </div>
      </div>
    </div>
  {/if}

  <header class="header">
    <h1 class="header-title">Gestion des Listes</h1>
    <p class="header-subtitle">Créez, modifiez et gérez vos listes d'appels</p>
  </header>

  <div class="actions-bar">
    <button class="btn btn-primary" on:click={() => showAddListForm = true}>
      <span class="icon">+</span> Nouvelle liste
    </button>
    
    <div class="search-container">
      <input 
        type="text" 
        bind:value={searchQuery} 
        placeholder="Rechercher par nom ou ID..." 
        on:input={filterLists}
        class="search-input" 
      />
      <button class="search-button" on:click={filterLists}>
        <span class="icon">🔍</span>
      </button>
    </div>
  </div>

  <!-- Add New List Form Modal -->
  {#if showAddListForm}
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Ajouter une nouvelle liste</h2>
          <button class="close-button" on:click={() => showAddListForm = false}>×</button>
        </div>
        <form on:submit|preventDefault={addList}>
          <div class="form-group">
            <label for="list_id">ID de la liste</label>
            <input id="list_id" type="text" bind:value={newList.list_id} required />
          </div>
          
          <div class="form-group">
            <label for="list_name">Nom de la liste</label>
            <input id="list_name" type="text" bind:value={newList.list_name} required />
          </div>
          
          <div class="form-group">
            <label for="list_description">Description</label>
            <textarea id="list_description" bind:value={newList.list_description} rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label for="campaign_id">Campagne</label>
            <select id="campaign_id" bind:value={newList.campaign_id}>
              <option value="" disabled selected>Sélectionner une campagne</option>
              {#each campaigns as campaign}
                <option value={campaign.campaign_id}>{campaign.campaign_name}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label for="active">Statut</label>
            <div class="toggle-container">
              <label class="toggle">
                <input 
                  type="checkbox" 
                  checked={newList.active === 'Y'} 
                  on:change={() => newList.active = newList.active === 'Y' ? 'N' : 'Y'}
                />
                <span class="slider"></span>
              </label>
              <span class="toggle-label">{newList.active === 'Y' ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" on:click={() => showAddListForm = false}>Annuler</button>
            <button type="submit" class="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Ajout en cours...' : 'Ajouter la liste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Edit List Form Modal -->
  {#if showEditForm}
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Modifier la liste</h2>
          <button class="close-button" on:click={() => showEditForm = false}>×</button>
        </div>
        <form on:submit|preventDefault={saveEdit}>
          <div class="form-group">
            <label for="edit_list_id">ID de la liste</label>
            <input id="edit_list_id" type="text" value={editedList.list_id} disabled class="input-disabled" />
          </div>
          
          <div class="form-group">
            <label for="edit_list_name">Nom de la liste</label>
            <input id="edit_list_name" type="text" bind:value={editedList.list_name} required />
          </div>
          
          <div class="form-group">
            <label for="edit_list_description">Description</label>
            <textarea id="edit_list_description" bind:value={editedList.list_description} rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label for="edit_campaign_id">Campagne</label>
            <select id="edit_campaign_id" bind:value={editedList.campaign_id}>
              <option value="" disabled>Sélectionner une campagne</option>
              {#each campaigns as campaign}
                <option value={campaign.campaign_id}>{campaign.campaign_name}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit_active">Statut</label>
            <div class="toggle-container">
              <label class="toggle">
                <input 
                  type="checkbox" 
                  checked={editedList.active === 'Y'} 
                  on:change={() => editedList.active = editedList.active === 'Y' ? 'N' : 'Y'}
                />
                <span class="slider"></span>
              </label>
              <span class="toggle-label">{editedList.active === 'Y' ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" on:click={() => showEditForm = false}>Annuler</button>
            <button type="submit" class="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Tabs Navigation -->
  <div class="tabs">
    <button 
      class="tab-button {activeTab === 'lists' ? 'active' : ''}" 
      on:click={() => activeTab = 'lists'}
    >
      Listes <span class="badge">{activeLists.length + inactiveLists.length}</span>
    </button>
    <button 
      class="tab-button {activeTab === 'trash' ? 'active' : ''}" 
      on:click={() => { activeTab = 'trash'; fetchDeletedLists(); }}
    >
      Corbeille <span class="badge">{deletedLists.length}</span>
    </button>
  </div>

  <!-- Loading Indicator -->
  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement en cours...</p>
    </div>
  {/if}

  <!-- Error Message -->
  {#if errorMessage}
    <div class="error-message">
      <p>{errorMessage}</p>
      <button on:click={() => errorMessage = ''}>Fermer</button>
    </div>
  {/if}

  <!-- Lists Tab -->
  {#if activeTab === 'lists'}
    <div class="card">
      <div class="card-header">
        <h2>Listes</h2>
        <div class="card-actions">
          <div class="toggle-inactive-container">
            <label class="toggle-inactive">
              <input type="checkbox" bind:checked={showInactiveLists} />
              <span class="toggle-inactive-label">Afficher les listes inactives</span>
            </label>
          </div>
          <span class="list-count">
            {activeLists.length} active{activeLists.length !== 1 ? 's' : ''} 
            {showInactiveLists ? `/ ${inactiveLists.length} inactive${inactiveLists.length !== 1 ? 's' : ''}` : ''}
          </span>
        </div>
      </div>
      
      {#if activeLists.length > 0 || (showInactiveLists && inactiveLists.length > 0)}
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Campagne</th>
                <th>Description</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each activeLists as list}
                <tr>
                  <td>{list.list_id}</td>
                  <td>{list.list_name}</td>
                  <td>{list.campaign_id || 'N/A'}</td>
                  <td class="description-cell">{list.list_description || 'Aucune description'}</td>
                  <td>
                    <span class="status-badge active">Active</span>
                  </td>
                  <td class="actions-cell">
                    <div class="action-buttons">
                      <button class="btn btn-icon btn-view" title="Voir les fichiers" on:click={() => goto(`/liste/fileliste/${list.list_id}`)}>
                        <span class="icon">📁</span>
                      </button>
                      <button class="btn btn-icon btn-edit" title="Modifier" on:click={() => openEditForm(list)}>
                        <span class="icon">✏️</span>
                      </button>
                      <button class="btn btn-icon btn-status" title="Désactiver" on:click={() => toggleListStatus(list)}>
                        <span class="icon">🔄</span>
                      </button>
                      <button class="btn btn-icon btn-delete" title="Supprimer" on:click={() => confirmDelete(list)}>
                        <span class="icon">🗑️</span>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
              
              {#if showInactiveLists}
                {#each inactiveLists as list}
                  <tr class="inactive-row">
                    <td>{list.list_id}</td>
                    <td>{list.list_name}</td>
                    <td>{list.campaign_id || 'N/A'}</td>
                    <td class="description-cell">{list.list_description || 'Aucune description'}</td>
                    <td>
                      <span class="status-badge inactive">Inactive</span>
                    </td>
                    <td class="actions-cell">
                      <div class="action-buttons">
                        <button class="btn btn-icon btn-view" title="Voir les fichiers" on:click={() => goto(`/liste/fileliste/${list.list_id}`)}>
                          <span class="icon">📁</span>
                        </button>
                        <button class="btn btn-icon btn-edit" title="Modifier" on:click={() => openEditForm(list)}>
                          <span class="icon">✏️</span>
                        </button>
                        <button class="btn btn-icon btn-status" title="Activer" on:click={() => toggleListStatus(list)}>
                          <span class="icon">🔄</span>
                        </button>
                        <button class="btn btn-icon btn-delete" title="Supprimer" on:click={() => confirmDelete(list)}>
                          <span class="icon">🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>Aucune liste trouvée</p>
          <button class="btn btn-primary" on:click={() => showAddListForm = true}>Ajouter une liste</button>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Trash Tab -->
  {#if activeTab === 'trash'}
    <div class="card">
      <div class="card-header">
        <h2>Corbeille</h2>
        <span class="list-count">{deletedLists.length} liste{deletedLists.length !== 1 ? 's' : ''}</span>
      </div>
      
      {#if deletedLists.length > 0}
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Campagne</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each deletedLists as list}
                <tr>
                  <td>{list.list_id}</td>
                  <td>{list.list_name}</td>
                  <td>{list.campaign_id || 'N/A'}</td>
                  <td class="description-cell">{list.list_description || 'Aucune description'}</td>
                  <td class="actions-cell">
                    <div class="trash-actions">
                      <button class="btn btn-restore" on:click={() => confirmRestore(list.list_id)}>
                        <span class="icon">↩️</span> Restaurer
                      </button>
                      <button class="btn btn-delete-permanent" on:click={() => confirmPermanentDelete(list)}>
                        <span class="icon">⚠️</span> Supprimer définitivement
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon">🗑️</div>
          <p>La corbeille est vide</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Base Styles */
  :global(body) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f5f7fa;
    color: #333;
    line-height: 1.5;
  }

  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    position: relative;
  }

  /* Header Styles */
  .header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .header-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #2563eb;
    margin-bottom: 0.5rem;
  }

  .header-subtitle {
    font-size: 1.1rem;
    color: #64748b;
    margin-top: 0;
  }

  /* Card Styles */
  .card {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    margin-bottom: 2rem;
    overflow: hidden;
  }

  .card-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .list-count {
    background-color: #e0e7ff;
    color: #4338ca;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Table Styles */
  .table-responsive {
    overflow-x: auto;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table th,
  .data-table td {
    padding: 1rem 1.5rem;
    text-align: left;
  }

  .data-table th {
    background-color: #f8fafc;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
  }

  .data-table tr {
    border-bottom: 1px solid #e5e7eb;
    transition: background-color 0.2s;
  }

  .data-table tr:last-child {
    border-bottom: none;
  }

  .data-table tr:hover {
    background-color: #f8fafc;
  }

  .inactive-row {
    background-color: #f8fafc;
  }

  .inactive-row:hover {
    background-color: #f1f5f9;
  }

  .description-cell {
    max-width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .actions-cell {
    width: 180px;
  }

  /* Status Badge */
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-badge.active {
    background-color: #dcfce7;
    color: #15803d;
  }

  .status-badge.inactive {
    background-color: #f3f4f6;
    color: #6b7280;
  }

  /* Button Styles */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-size: 0.875rem;
  }

  .btn-primary {
    background-color: #2563eb;
    color: white;
  }

  .btn-primary:hover {
    background-color: #1d4ed8;
  }

  .btn-secondary {
    background-color: #e5e7eb;
    color: #4b5563;
  }

  .btn-secondary:hover {
    background-color: #d1d5db;
  }

  .btn-danger {
    background-color: #ef4444;
    color: white;
  }

  .btn-danger:hover {
    background-color: #dc2626;
  }

  .btn-icon {
    padding: 0.5rem;
    border-radius: 0.375rem;
    background-color: transparent;
  }

  .btn-view {
    color: #2563eb;
  }

  .btn-view:hover {
    background-color: #e0e7ff;
  }

  .btn-edit {
    color: #059669;
  }

  .btn-edit:hover {
    background-color: #d1fae5;
  }

  .btn-status {
    color: #0284c7;
  }

  .btn-status:hover {
    background-color: #e0f2fe;
  }

  .btn-delete {
    color: #dc2626;
  }

  .btn-delete:hover {
    background-color: #fee2e2;
  }

  .btn-restore {
    background-color: #059669;
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
  }

  .btn-restore:hover {
    background-color: #047857;
  }

  .btn-delete-permanent {
    background-color: #dc2626;
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .btn-delete-permanent:hover {
    background-color: #b91c1c;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .trash-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* Actions Bar */
  .actions-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  /* Search Styles */
  .search-container {
    display: flex;
    align-items: center;
    background-color: white;
    border-radius: 0.375rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    width: 300px;
  }

  .search-input {
    flex: 1;
    border: none;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    outline: none;
  }

  .search-button {
    background-color: #f3f4f6;
    border: none;
    padding: 0.75rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .search-button:hover {
    background-color: #e5e7eb;
  }

  /* Tabs */
  .tabs {
    display: flex;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .tab-button {
    padding: 1rem 1.5rem;
    background-color: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tab-button:hover {
    color: #2563eb;
  }

  .tab-button.active {
    color: #2563eb;
    border-bottom-color: #2563eb;
  }

  .badge {
    background-color: #e0e7ff;
    color: #4338ca;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
  }

  /* Toggle Inactive Lists */
  .toggle-inactive-container {
    display: flex;
    align-items: center;
  }

  .toggle-inactive {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }

  .toggle-inactive input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .toggle-inactive-label {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    color: #4b5563;
  }

  .toggle-inactive-label::before {
    content: '';
    display: inline-block;
    width: 1rem;
    height: 1rem;
    margin-right: 0.5rem;
    border: 2px solid #cbd5e1;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }

  .toggle-inactive input:checked + .toggle-inactive-label::before {
    background-color: #2563eb;
    border-color: #2563eb;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' width='24px' height='24px'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
    background-size: 0.75rem;
    background-position: center;
    background-repeat: no-repeat;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #cbd5e1;
  }

  .empty-state p {
    color: #64748b;
    margin-bottom: 1.5rem;
    font-size: 1.125rem;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: white;
    border-radius: 0.5rem;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  /* Confirmation Dialog */
  .confirm-dialog {
    max-width: 450px;
  }

  .confirm-body {
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .confirm-icon {
    font-size: 2rem;
    color: #f59e0b;
  }

  .confirm-body p {
    margin: 0;
    color: #4b5563;
    font-size: 1rem;
    line-height: 1.5;
  }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
  }

  .close-button {
    background-color: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #64748b;
  }

  .close-button:hover {
    color: #1e293b;
  }

  form {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #4b5563;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .input-disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }

  /* Toggle Switch */
  .toggle-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .toggle {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: 0.4s;
    border-radius: 24px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: #2563eb;
  }

  input:checked + .slider:before {
    transform: translateX(24px);
  }

  .toggle-label {
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Loading Spinner */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e0e7ff;
    border-top: 4px solid #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Notification */
  .notification {
    position: fixed;
    top: 1rem;
    right: 1rem;
    padding: 1rem 1.5rem;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 1100;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .notification.success {
    background-color: #ecfdf5;
    color: #047857;
    border-left: 4px solid #10b981;
  }

  .notification.error {
    background-color: #fef2f2;
    color: #b91c1c;
    border-left: 4px solid #ef4444;
  }

  .notification.info {
    background-color: #eff6ff;
    color: #1d4ed8;
    border-left: 4px solid #3b82f6;
  }

  .notification button {
    background-color: transparent;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: currentColor;
    opacity: 0.7;
  }

  .notification button:hover {
    opacity: 1;
  }

  /* Error Message */
  .error-message {
    background-color: #fef2f2;
    color: #b91c1c;
    padding: 1rem;
    border-radius: 0.375rem;
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .error-message button {
    background-color: transparent;
    border: none;
    color: #b91c1c;
    cursor: pointer;
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .page-container {
      padding: 1rem;
    }

    .actions-bar {
      flex-direction: column;
      gap: 1rem;
    }

    .search-container {
      width: 100%;
    }

    .tabs {
      overflow-x: auto;
    }

    .tab-button {
      padding: 0.75rem 1rem;
    }

    .data-table th,
    .data-table td {
      padding: 0.75rem;
    }

    .action-buttons {
      flex-wrap: wrap;
    }

    .card-actions {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .trash-actions {
      flex-direction: row;
      width: 100%;
    }
    
    .actions-cell {
      width: auto;
      min-width: 220px;
    }
  }

  /* Ajouter cette règle pour les écrans très petits */
  @media (max-width: 480px) {
    .trash-actions {
      flex-direction: column;
    }
    
    .btn-restore, .btn-delete-permanent {
      width: 100%;
      justify-content: center;
    }
  }
</style>