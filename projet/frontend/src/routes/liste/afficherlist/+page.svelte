<script>
// @ts-nocheck

  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade, slide, fly, scale } from 'svelte/transition';
  import { quintOut, elasticOut, backOut } from 'svelte/easing';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  // Add Font Awesome
  let fontAwesomeLoaded = false;

  function loadFontAwesome() {
    if (fontAwesomeLoaded) return;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    link.integrity = 'sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    fontAwesomeLoaded = true;
  }

  // Modify the onMount function to also load Font Awesome
  onMount(() => {
    loadFontAwesome();
    loadLists();
    fetchDeletedLists();
    loadCampaigns();
  });

  let lists = [];
  let activeLists = [];
  let inactiveLists = [];
  let deletedLists = [];
  let isLoading = false;
  let errorMessage = '';

  let newList = { list_id: '', list_name: '', list_description: '', campaign_id: '', active: 'Y' };
  let showAddListForm = false;

  let listId = null;

  let searchQuery = '';
  let campaigns = [];
  let activeTab = 'active'; // To track which tab is active
  
  // Dialog state
  let showDialog = false;
  let dialogType = ''; // 'delete', 'restore', 'permanent-delete'
  let dialogTitle = '';
  let dialogMessage = '';
  let dialogConfirmAction = () => {};
  let dialogData = null;
  
  // Bulk actions
  let selectedItems = [];
  let showBulkActions = false;
  
  // Sorting
  let sortField = 'list_id';
  let sortDirection = 'asc';
  
  // Pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalPages = 1;

  async function loadLists() {
    try {
      isLoading = true;
      const res = await fetchWithAuth('http://localhost:8000/api/lists/afficher');
      if (res.ok) {
        lists = await res.json();
        activeLists = lists.filter(list => list.active === 'Y');
        inactiveLists = lists.filter(list => list.active === 'N');
        updatePagination();
      } else {
        throw new Error('Erreur lors de la récupération des listes');
      }
    } catch (error) {
      errorMessage = `⚠️ ${error.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function loadCampaigns() {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/lists/campaigns');
      if (res.ok) {
        campaigns = await res.json();
      } else {
        throw new Error('Erreur lors de la récupération des campagnes');
      }
    } catch (error) {
      errorMessage = `⚠️ ${error.message}`;
    }
  }

  function openDeleteDialog(list) {
    if (!list) {
      errorMessage = "⚠️ Erreur : Impossible de supprimer, list_id invalide !";
      return;
    }
    
    dialogType = 'delete';
    dialogTitle = 'Confirmer la suppression';
    dialogMessage = `Êtes-vous sûr de vouloir déplacer la liste "${list.list_name}" (ID: ${list.list_id}) vers la corbeille ?`;
    dialogData = list;
    dialogConfirmAction = () => performDeleteList(list);
    showDialog = true;
  }
  
  async function performDeleteList(list) {
    try {
      isLoading = true;
      const response = await fetchWithAuth(`http://localhost:8000/api/lists/supprimer/${list.list_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(list),
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(`Erreur serveur: ${errorMsg}`);
      }

      // Supprimer la liste du front-end après suppression réussie
      lists = lists.filter(item => item.list_id !== list.list_id);
      activeLists = activeLists.filter(item => item.list_id !== list.list_id);
      inactiveLists = inactiveLists.filter(item => item.list_id !== list.list_id);
      updatePagination();

      showNotification('success', 'Liste déplacée vers la corbeille !');
    } catch (error) {
      console.error("❌ Erreur lors de la suppression :", error);
      errorMessage = `⚠️ Problème lors de la suppression : ${error.message}`;
    } finally {
      isLoading = false;
      showDialog = false;
    }
  }

  function openRestoreDialog(list) {
    dialogType = 'restore';
    dialogTitle = 'Confirmer la restauration';
    dialogMessage = `Êtes-vous sûr de vouloir restaurer la liste "${list.list_name}" (ID: ${list.list_id}) ?`;
    dialogData = list;
    dialogConfirmAction = () => performRestoreList(list.list_id);
    showDialog = true;
  }
  
  async function performRestoreList(list_id) {
    try {
      isLoading = true;
      const response = await fetchWithAuth(`http://localhost:8000/api/lists/restaurer/${list_id}`, {
        method: 'PUT',
      });
      if (response.ok) {
        deletedLists = deletedLists.filter(list => list.list_id !== list_id);
        updatePagination();
        showNotification('success', 'Liste restaurée avec succès !');
        loadLists();
      } else {
        throw new Error('Impossible de restaurer la liste.');
      }
    } catch (error) {
      errorMessage = '⚠️ Problème lors de la restauration de la liste.';
      console.error('Error during restoration:', error);
    } finally {
      isLoading = false;
      showDialog = false;
    }
  }
  
  function openPermanentDeleteDialog(list) {
    dialogType = 'permanent-delete';
    dialogTitle = 'Confirmer la suppression définitive';
    dialogMessage = `⚠️ ATTENTION : Cette action est irréversible. Êtes-vous absolument sûr de vouloir supprimer définitivement la liste "${list.list_name}" (ID: ${list.list_id}) ?`;
    dialogData = list;
    dialogConfirmAction = () => performPermanentDelete(list.list_id);
    showDialog = true;
  }
  
  async function performPermanentDelete(list_id) {
    try {
      isLoading = true;
      const response = await fetchWithAuth(`http://localhost:8000/api/lists/supprimer/${list_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        deletedLists = deletedLists.filter(list => list.list_id !== list_id);
        updatePagination();
        showNotification('success', 'Liste supprimée définitivement !');
      } else {
        throw new Error('Impossible de supprimer la liste définitivement.');
      }
    } catch (error) {
      errorMessage = `⚠️ Problème lors de la suppression définitive de la liste: ${error.message}`;
    } finally {
      isLoading = false;
      showDialog = false;
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
    updatePagination();
  }
  
  function filterDeletedLists() {
    if (!searchQuery) return sortLists(deletedLists);
    const filtered = deletedLists.filter(({ list_name, list_id }) =>
      list_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(list_id).includes(searchQuery)
    );
    return sortLists(filtered);
  }
  
  function sortLists(listsToSort) {
    return [...listsToSort].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
      
      // Handle numeric comparison
      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }
  
  function handleSort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
  }
  
  function updatePagination() {
    let currentList;
    if (activeTab === 'active') {
      currentList = activeLists;
    } else if (activeTab === 'inactive') {
      currentList = inactiveLists;
    } else {
      currentList = deletedLists;
    }
    
    totalPages = Math.ceil(currentList.length / itemsPerPage);
    if (currentPage > totalPages) {
      currentPage = Math.max(1, totalPages);
    }
  }
  
  function getPaginatedLists(listArray) {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return listArray.slice(start, end);
  }
  
  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  async function fetchDeletedLists() {
    try {
      isLoading = true;
      const response = await fetchWithAuth('http://localhost:8000/api/lists/corbeille');
      if (response.ok) {
        deletedLists = await response.json();
        updatePagination();
      } else {
        throw new Error('Erreur lors de la récupération des listes supprimées.');
      }
    } catch (error) {
      errorMessage = '⚠️ Problème lors de la récupération des listes supprimées.';
    } finally {
      isLoading = false;
    }
  }

  async function editList(list_id) {
    goto(`/liste/modifier/${list_id}`);
  }

  async function saveEdit() {
    try {
      isLoading = true;
      const response = await fetchWithAuth(`http://localhost:8000/api/lists/modifier/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedList),
      });
      if (response.ok) {
        showNotification('success', 'Liste modifiée avec succès !');
        loadLists();
      } else {
        errorMessage = '⚠️ Error updating the list.';
      }
    } catch (error) {
      console.error('Error during update:', error);
      errorMessage = '⚠️ An error occurred.';
    } finally {
      isLoading = false;
    }
  }
  
  function toggleSelectItem(item) {
    const index = selectedItems.findIndex(i => i.list_id === item.list_id);
    if (index === -1) {
      selectedItems = [...selectedItems, item];
    } else {
      selectedItems = selectedItems.filter(i => i.list_id !== item.list_id);
    }
    showBulkActions = selectedItems.length > 0;
  }
  
  function selectAllItems() {
    let currentList;
    if (activeTab === 'active') {
      currentList = activeLists;
    } else if (activeTab === 'inactive') {
      currentList = inactiveLists;
    } else {
      currentList = deletedLists;
    }
    
    if (selectedItems.length === currentList.length) {
      // Deselect all
      selectedItems = [];
    } else {
      // Select all
      selectedItems = [...currentList];
    }
    
    showBulkActions = selectedItems.length > 0;
  }
  
  function bulkDelete() {
    dialogType = 'bulk-delete';
    dialogTitle = 'Confirmer la suppression en masse';
    dialogMessage = `Êtes-vous sûr de vouloir déplacer ${selectedItems.length} liste(s) vers la corbeille ?`;
    dialogConfirmAction = performBulkDelete;
    showDialog = true;
  }
  
  async function performBulkDelete() {
    try {
      isLoading = true;
      let successCount = 0;
      
      for (const item of selectedItems) {
        const response = await fetch(`http://localhost:8000/api/lists/supprimer/${item.list_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        });
        
        if (response.ok) {
          successCount++;
        }
      }
      
      if (successCount > 0) {
        showNotification('success', `${successCount} liste(s) déplacée(s) vers la corbeille !`);
        loadLists();
        fetchDeletedLists();
      }
      
      selectedItems = [];
      showBulkActions = false;
    } catch (error) {
      errorMessage = `⚠️ Problème lors de la suppression en masse : ${error.message}`;
    } finally {
      isLoading = false;
      showDialog = false;
    }
  }
  
  function bulkRestore() {
    dialogType = 'bulk-restore';
    dialogTitle = 'Confirmer la restauration en masse';
    dialogMessage = `Êtes-vous sûr de vouloir restaurer ${selectedItems.length} liste(s) ?`;
    dialogConfirmAction = performBulkRestore;
    showDialog = true;
  }
  
  async function performBulkRestore() {
    try {
      isLoading = true;
      let successCount = 0;
      
      for (const item of selectedItems) {
        const response = await fetchWithAuth(`http://localhost:8000/api/lists/restaurer/${item.list_id}`, {
          method: 'PUT',
        });
        
        if (response.ok) {
          successCount++;
        }
      }
      
      if (successCount > 0) {
        showNotification('success', `${successCount} liste(s) restaurée(s) avec succès !`);
        loadLists();
        fetchDeletedLists();
      }
      
      selectedItems = [];
      showBulkActions = false;
    } catch (error) {
      errorMessage = `⚠️ Problème lors de la restauration en masse : ${error.message}`;
    } finally {
      isLoading = false;
      showDialog = false;
    }
  }

  // Notification system
  let notification = null;
  function showNotification(type, message) {
    notification = { type, message };
    setTimeout(() => {
      notification = null;
    }, 3000);
  }

  function setActiveTab(tab) {
    activeTab = tab;
    selectedItems = [];
    showBulkActions = false;
    currentPage = 1;
    updatePagination();
  }

</script>

<div class="page-container">
  {#if notification}
    <div class="notification notification-{notification.type}" transition:fly={{ y: -30, duration: 400, easing: backOut }}>
      <div class="notification-icon">
        {#if notification.type === 'success'}
          <i class="fas fa-check-circle"></i>
        {:else}
          <i class="fas fa-exclamation-triangle"></i>
        {/if}
      </div>
      <div class="notification-message">{notification.message}</div>
      <button class="notification-close" on:click={() => notification = null}>
        <i class="fas fa-times"></i>
      </button>
    </div>
  {/if}

  <!-- Confirmation Dialog -->
  {#if showDialog}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="dialog-overlay" transition:fade={{ duration: 200 }} on:click|self={() => showDialog = false}>
      <div class="dialog" transition:scale={{ duration: 300, start: 0.95, opacity: 0, easing: backOut }}>
        <div class="dialog-header {dialogType.includes('delete') ? 'dialog-header-danger' : dialogType.includes('restore') ? 'dialog-header-success' : ''}">
          <h3 class="dialog-title">
            {#if dialogType.includes('delete')}
              <i class="fas fa-trash-alt"></i>
            {:else if dialogType.includes('restore')}
              <i class="fas fa-trash-restore"></i>
            {/if}
            {dialogTitle}
          </h3>
          <button class="dialog-close" on:click={() => showDialog = false}>
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="dialog-body">
          <p>{dialogMessage}</p>
          
          {#if dialogType === 'permanent-delete'}
            <div class="alert alert-danger">
              <i class="fas fa-exclamation-circle"></i>
              <span>Cette action est irréversible et toutes les données associées seront perdues.</span>
            </div>
          {/if}
          
          {#if dialogData && !dialogType.includes('bulk')}
            <div class="dialog-item-preview" transition:slide={{ duration: 300 }}>
              <div class="preview-header">
                <span class="preview-id">ID: {dialogData.list_id}</span>
                <span class="preview-name">{dialogData.list_name}</span>
              </div>
              {#if dialogData.list_description}
                <div class="preview-description">
                  {dialogData.list_description}
                </div>
              {/if}
              <div class="preview-details">
                <div class="preview-detail">
                  <span class="detail-label">Campagne:</span>
                  <span class="detail-value">{dialogData.campaign_id || 'Non assignée'}</span>
                </div>
                <div class="preview-detail">
                  <span class="detail-label">Statut:</span>
                  <span class="detail-value">
                    {#if dialogData.active === 'Y'}
                      <span class="badge badge-success">Actif</span>
                    {:else if dialogData.active === 'N'}
                      <span class="badge badge-danger">Inactif</span>
                    {:else}
                      <span class="badge badge-warning">Supprimé</span>
                    {/if}
                  </span>
                </div>
              </div>
            </div>
          {:else if dialogType.includes('bulk')}
            <div class="bulk-preview" transition:slide={{ duration: 300 }}>
              <div class="bulk-preview-header">
                <i class="fas fa-layer-group"></i>
                <span>{selectedItems.length} élément(s) sélectionné(s)</span>
              </div>
              <div class="bulk-preview-list">
                {#each selectedItems.slice(0, 3) as item}
                  <div class="bulk-preview-item">
                    <span class="bulk-preview-id">{item.list_id}</span>
                    <span class="bulk-preview-name">{item.list_name}</span>
                  </div>
                {/each}
                {#if selectedItems.length > 3}
                  <div class="bulk-preview-more">
                    + {selectedItems.length - 3} autre(s) élément(s)
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" on:click={() => showDialog = false}>
            <i class="fas fa-times"></i> Annuler
          </button>
          <button 
            class="btn {dialogType.includes('permanent-delete') ? 'btn-danger' : dialogType.includes('restore') ? 'btn-success' : 'btn-warning'}" 
            on:click={dialogConfirmAction}
            disabled={isLoading}
          >
            {#if isLoading}
              <span class="spinner-sm"></span>
              <span>Traitement...</span>
            {:else}
              {#if dialogType.includes('delete') && !dialogType.includes('permanent')}
                <i class="fas fa-trash-alt"></i>
                <span>Déplacer vers la corbeille</span>
              {:else if dialogType.includes('permanent-delete')}
                <i class="fas fa-times-circle"></i>
                <span>Supprimer définitivement</span>
              {:else if dialogType.includes('restore')}
                <i class="fas fa-trash-restore"></i>
                <span>Restaurer</span>
              {/if}
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <header class="header">
    <div class="header-content">
      <h1 class="header-title">
        <i class="fas fa-clipboard-list"></i> Gestion des Listes
      </h1>
      <div class="header-actions">
        <button class="btn btn-primary" on:click={() => goto(`/liste/ajouterListe`)}>
          <i class="fas fa-plus-circle"></i> <span class="btn-text">Nouvelle liste</span>
        </button>
        <button class="btn btn-success" on:click={() => goto(`/liste/ajouterprospect`)}>
          <i class="fas fa-upload"></i> <span class="btn-text">Charger les leads</span>
        </button>
        <button 
          class="btn btn-warning {activeTab === 'trash' ? 'active' : ''}" 
          on:click={() => setActiveTab('trash')}
        >
          <i class="fas fa-trash-alt"></i> 
          <span class="btn-text">Corbeille</span>
          {#if deletedLists.length > 0}
            <span class="badge badge-light">{deletedLists.length}</span>
          {/if}
        </button>
      </div>
    </div>
  </header>

  {#if errorMessage}
    <div class="error-message" role="alert" transition:slide={{ duration: 300 }}>
      <i class="fas fa-exclamation-circle"></i> {errorMessage}
      <button type="button" class="error-close" on:click={() => errorMessage = ''}>
        <i class="fas fa-times"></i>
      </button>
    </div>
  {/if}

  <div class="search-section">
    <div class="search-form">
      <div class="search-input-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input 
          type="text" 
          class="search-input" 
          bind:value={searchQuery} 
          placeholder="Rechercher par nom ou ID..." 
          aria-label="Search" 
        />
        {#if searchQuery}
          <button class="search-clear" on:click={() => { searchQuery = ''; filterLists(); }}>
            <i class="fas fa-times"></i>
          </button>
        {/if}
      </div>
      <button type="button" class="btn btn-primary search-button" on:click={filterLists}>
        <i class="fas fa-search"></i> <span class="btn-text">Rechercher</span>
      </button>
    </div>
  </div>

  <div class="tabs">
    <button 
      class="tab-button {activeTab === 'active' ? 'active' : ''}" 
      on:click={() => setActiveTab('active')}
    >
      <i class="fas fa-check-circle"></i> Listes Actives 
      <span class="tab-count">{activeLists.length}</span>
    </button>
    <button 
      class="tab-button {activeTab === 'inactive' ? 'active' : ''}" 
      on:click={() => setActiveTab('inactive')}
    >
      <i class="fas fa-times-circle"></i> Listes Inactives 
      <span class="tab-count">{inactiveLists.length}</span>
    </button>
    <button 
      class="tab-button {activeTab === 'trash' ? 'active' : ''}" 
      on:click={() => setActiveTab('trash')}
    >
      <i class="fas fa-trash-alt"></i> Corbeille 
      <span class="tab-count">{deletedLists.length}</span>
    </button>
  </div>

  <!-- Bulk Actions Bar -->
  {#if showBulkActions}
    <div class="bulk-actions-bar" transition:slide={{ duration: 300 }}>
      <div class="bulk-actions-info">
        <i class="fas fa-check-square"></i>
        <span>{selectedItems.length} élément(s) sélectionné(s)</span>
      </div>
      <div class="bulk-actions-buttons">
        {#if activeTab === 'trash'}
          <button class="btn btn-sm btn-success" on:click={bulkRestore}>
            <i class="fas fa-trash-restore"></i> Restaurer la sélection
          </button>
        {:else}
          <button class="btn btn-sm btn-warning" on:click={bulkDelete}>
            <i class="fas fa-trash-alt"></i> Supprimer la sélection
          </button>
        {/if}
        <button class="btn btn-sm btn-secondary" on:click={() => { selectedItems = []; showBulkActions = false; }}>
          <i class="fas fa-times"></i> Annuler la sélection
        </button>
      </div>
    </div>
  {/if}

  <main class="main-content">
    {#if isLoading}
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Chargement en cours...</p>
      </div>
    {:else}
      {#if activeTab === 'active'}
        <div class="list-container" transition:fade={{ duration: 200 }}>
          {#if activeLists.length > 0}
            <div class="table-responsive">
              <table class="list-table">
                <thead>
                  <tr>
                    <th class="checkbox-column">
                      <label class="checkbox-container">
                        <input 
                          type="checkbox" 
                          on:change={selectAllItems}
                          checked={selectedItems.length === activeLists.length && activeLists.length > 0}
                        />
                        <span class="checkmark"></span>
                      </label>
                    </th>
                    <th class="sortable" on:click={() => handleSort('list_id')}>
                      ID
                      {#if sortField === 'list_id'}
                        <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                      {/if}
                    </th>
                    <th class="sortable" on:click={() => handleSort('list_name')}>
                      Nom de la liste
                      {#if sortField === 'list_name'}
                        <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                      {/if}
                    </th>
                    <th class="sortable" on:click={() => handleSort('campaign_id')}>
                      ID de campagne
                      {#if sortField === 'campaign_id'}
                        <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                      {/if}
                    </th>
                    <th>Statut</th>
                    <th class="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each getPaginatedLists(sortLists(activeLists)) as list}
                    <tr class="list-item {selectedItems.some(item => item.list_id === list.list_id) ? 'selected' : ''}" transition:slide|local={{ duration: 300 }}>
                      <td class="checkbox-column">
                        <label class="checkbox-container">
                          <input 
                            type="checkbox" 
                            checked={selectedItems.some(item => item.list_id === list.list_id)}
                            on:change={() => toggleSelectItem(list)}
                          />
                          <span class="checkmark"></span>
                        </label>
                      </td>
                      <td class="list-id">{list.list_id}</td>
                      <td class="list-name">{list.list_name}</td>
                      <td>{list.campaign_id || '-'}</td>
                      <td>
                        <span class="badge badge-success">
                          <i class="fas fa-check"></i> Actif
                        </span>
                      </td>
                      <td class="actions-cell">
                        <div class="action-buttons">
                          <button class="btn btn-icon btn-info" title="Voir les fichiers" on:click={() => goto(`/liste/fileliste/${list.list_id}`)}>
                            <i class="fas fa-file-alt"></i>
                          </button>
                         
                          <button class="btn btn-icon btn-danger" title="Supprimer" on:click={() => openDeleteDialog(list)}>
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            
            <!-- Pagination -->
            {#if totalPages > 1}
              <div class="pagination">
                <button 
                  class="pagination-button" 
                  disabled={currentPage === 1}
                  on:click={() => goToPage(1)}
                >
                  <i class="fas fa-angle-double-left"></i>
                </button>
                <button 
                  class="pagination-button" 
                  disabled={currentPage === 1}
                  on:click={() => goToPage(currentPage - 1)}
                >
                  <i class="fas fa-angle-left"></i>
                </button>
                
                {#each Array(totalPages) as _, i}
                  {#if i + 1 === currentPage || i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)}
                    <button 
                      class="pagination-button {currentPage === i + 1 ? 'active' : ''}"
                      on:click={() => goToPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  {:else if i + 1 === currentPage - 2 || i + 1 === currentPage + 2}
                    <span class="pagination-ellipsis">...</span>
                  {/if}
                {/each}
                
                <button 
                  class="pagination-button" 
                  disabled={currentPage === totalPages}
                  on:click={() => goToPage(currentPage + 1)}
                >
                  <i class="fas fa-angle-right"></i>
                </button>
                <button 
                  class="pagination-button" 
                  disabled={currentPage === totalPages}
                  on:click={() => goToPage(totalPages)}
                >
                  <i class="fas fa-angle-double-right"></i>
                </button>
              </div>
            {/if}
          {:else}
            <div class="empty-state">
              <i class="fas fa-clipboard-list empty-icon"></i>
              <h3>Aucune liste active trouvée</h3>
              <p>Créez une nouvelle liste ou modifiez les critères de recherche.</p>
              <button class="btn btn-primary" on:click={() => goto(`/liste/ajouterListe`)}>
                <i class="fas fa-plus-circle"></i> Créer une liste
              </button>
            </div>
          {/if}
        </div>
      {:else if activeTab === 'inactive'}
        <div class="list-container" transition:fade={{ duration: 200 }}>
          {#if inactiveLists.length > 0}
            <div class="table-responsive">
              <table class="list-table">
                <thead>
                  <tr>
                    <th class="checkbox-column">
                      <label class="checkbox-container">
                        <input 
                          type="checkbox" 
                          on:change={selectAllItems}
                          checked={selectedItems.length === inactiveLists.length && inactiveLists.length > 0}
                        />
                        <span class="checkmark"></span>
                      </label>
                    </th>
                    <th class="sortable" on:click={() => handleSort('list_id')}>
                      ID
                      {#if sortField === 'list_id'}
                        <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                      {/if}
                    </th>
                    <th class="sortable" on:click={() => handleSort('list_name')}>
                      Nom de la liste
                      {#if sortField === 'list_name'}
                        <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                      {/if}
                    </th>
                    <th class="sortable" on:click={() => handleSort('campaign_id')}>
                      ID de campagne
                      {#if sortField === 'campaign_id'}
                        <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                      {/if}
                    </th>
                    <th>Statut</th>
                    <th class="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each getPaginatedLists(sortLists(inactiveLists)) as list}
                    <tr class="list-item {selectedItems.some(item => item.list_id === list.list_id) ? 'selected' : ''}" transition:slide|local={{ duration: 300 }}>
                      <td class="checkbox-column">
                        <label class="checkbox-container">
                          <input 
                            type="checkbox" 
                            checked={selectedItems.some(item => item.list_id === list.list_id)}
                            on:change={() => toggleSelectItem(list)}
                          />
                          <span class="checkmark"></span>
                        </label>
                      </td>
                      <td class="list-id">{list.list_id}</td>
                      <td class="list-name">{list.list_name}</td>
                      <td>{list.campaign_id || '-'}</td>
                      <td>
                        <span class="badge badge-danger">
                          <i class="fas fa-times"></i> Inactif
                        </span>
                      </td>
                      <td class="actions-cell">
                        <div class="action-buttons">
                          <button class="btn btn-icon btn-info" title="Voir les fichiers" on:click={() => goto(`/liste/fileliste/${list.list_id}`)}>
                            <i class="fas fa-file-alt"></i>
                          </button>
                        
                          <button class="btn btn-icon btn-danger" title="Supprimer" on:click={() => openDeleteDialog(list)}>
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            
            <!-- Pagination -->
            {#if totalPages > 1}
              <div class="pagination">
                <button 
                  class="pagination-button" 
                  disabled={currentPage === 1}
                  on:click={() => goToPage(1)}
                >
                  <i class="fas fa-angle-double-left"></i>
                </button>
                <button 
                  class="pagination-button" 
                  disabled={currentPage === 1}
                  on:click={() => goToPage(currentPage - 1)}
                >
                  <i class="fas fa-angle-left"></i>
                </button>
                
                {#each Array(totalPages) as _, i}
                  {#if i + 1 === currentPage || i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)}
                    <button 
                      class="pagination-button {currentPage === i + 1 ? 'active' : ''}"
                      on:click={() => goToPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  {:else if i + 1 === currentPage - 2 || i + 1 === currentPage + 2}
                    <span class="pagination-ellipsis">...</span>
                  {/if}
                {/each}
                
                <button 
                  class="pagination-button" 
                  disabled={currentPage === totalPages}
                  on:click={() => goToPage(currentPage + 1)}
                >
                  <i class="fas fa-angle-right"></i>
                </button>
                <button 
                  class="pagination-button" 
                  disabled={currentPage === totalPages}
                  on:click={() => goToPage(totalPages)}
                >
                  <i class="fas fa-angle-double-right"></i>
                </button>
              </div>
            {/if}
          {:else}
            <div class="empty-state">
              <i class="fas fa-clipboard-list empty-icon"></i>
              <h3>Aucune liste inactive trouvée</h3>
              <p>Toutes vos listes sont actives ou modifiez les critères de recherche.</p>
            </div>
          {/if}
        </div>
      {:else if activeTab === 'trash'}
        <!-- Trash / Recycle Bin View -->
        <div class="list-container trash-container" transition:fade={{ duration: 200 }}>
          <div class="trash-header">
            <div class="trash-header-content">
              <h2 class="trash-title">
                <i class="fas fa-trash-alt"></i> Corbeille
              </h2>
              <p class="trash-description">
                Les listes dans la corbeille peuvent être restaurées ou supprimées définitivement.
              </p>
            </div>
            <div class="trash-actions">
              <button class="btn btn-outline" on:click={() => fetchDeletedLists()}>
                <i class="fas fa-sync-alt"></i> Actualiser
              </button>
            </div>
          </div>
          
          {#if deletedLists.length > 0}
            <div class="table-responsive">
              <table class="list-table trash-table">
                <thead>
                  <tr>
                    <th class="checkbox-column">
                      <label class="checkbox-container">
                        <input 
                          type="checkbox" 
                          on:change={selectAllItems}
                          checked={selectedItems.length === deletedLists.length && deletedLists.length > 0}
                        />
                        <span class="checkmark"></span>
                      </label>
                    </th>
                    <th class="sortable" on:click={() => handleSort('list_id')}>
                      ID
                      {#if sortField === 'list_id'}
                        <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                      {/if}
                    </th>
                    <th class="sortable" on:click={() => handleSort('list_name')}>
                      Nom de la liste
                      {#if sortField === 'list_name'}
                        <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                      {/if}
                    </th>
                    <th>Description</th>
                    <th class="sortable" on:click={() => handleSort('campaign_id')}>
                      ID de campagne
                      {#if sortField === 'campaign_id'}
                        <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                      {/if}
                    </th>
                    <th class="sortable" on:click={() => handleSort('deleted_at')}>
                      Date de suppression
                      {#if sortField === 'deleted_at'}
                        <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                      {/if}
                    </th>
                    <th class="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each getPaginatedLists(filterDeletedLists()) as list}
                    <tr class="list-item trash-item {selectedItems.some(item => item.list_id === list.list_id) ? 'selected' : ''}" transition:slide|local={{ duration: 300 }}>
                      <td class="checkbox-column">
                        <label class="checkbox-container">
                          <input 
                            type="checkbox" 
                            checked={selectedItems.some(item => item.list_id === list.list_id)}
                            on:change={() => toggleSelectItem(list)}
                          />
                          <span class="checkmark"></span>
                        </label>
                      </td>
                      <td class="list-id">{list.list_id}</td>
                      <td class="list-name">{list.list_name}</td>
                      <td class="list-description">{list.list_description || '-'}</td>
                      <td>{list.campaign_id || '-'}</td>
                      <td class="delete-date">
                        {new Date(list.deleted_at || Date.now()).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td class="actions-cell">
                        <div class="action-buttons">
                          <button class="btn btn-icon btn-success" title="Restaurer" on:click={() => openRestoreDialog(list)}>
                            <i class="fas fa-trash-restore"></i>
                          </button>
                          <button class="btn btn-icon btn-danger" title="Supprimer définitivement" on:click={() => openPermanentDeleteDialog(list)}>
                            <i class="fas fa-times-circle"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            
            <!-- Pagination -->
            {#if totalPages > 1}
              <div class="pagination">
                <button 
                  class="pagination-button" 
                  disabled={currentPage === 1}
                  on:click={() => goToPage(1)}
                >
                  <i class="fas fa-angle-double-left"></i>
                </button>
                <button 
                  class="pagination-button" 
                  disabled={currentPage === 1}
                  on:click={() => goToPage(currentPage - 1)}
                >
                  <i class="fas fa-angle-left"></i>
                </button>
                
                {#each Array(totalPages) as _, i}
                  {#if i + 1 === currentPage || i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)}
                    <button 
                      class="pagination-button {currentPage === i + 1 ? 'active' : ''}"
                      on:click={() => goToPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  {:else if i + 1 === currentPage - 2 || i + 1 === currentPage + 2}
                    <span class="pagination-ellipsis">...</span>
                  {/if}
                {/each}
                
                <button 
                  class="pagination-button" 
                  disabled={currentPage === totalPages}
                  on:click={() => goToPage(currentPage + 1)}
                >
                  <i class="fas fa-angle-right"></i>
                </button>
                <button 
                  class="pagination-button" 
                  disabled={currentPage === totalPages}
                  on:click={() => goToPage(totalPages)}
                >
                  <i class="fas fa-angle-double-right"></i>
                </button>
              </div>
            {/if}
          {:else}
            <div class="empty-state">
              <i class="fas fa-trash empty-icon"></i>
              <h3>La corbeille est vide</h3>
              <p>Aucune liste n'a été supprimée récemment.</p>
              <button class="btn btn-primary" on:click={() => setActiveTab('active')}>
                <i class="fas fa-arrow-left"></i> Retour aux listes
              </button>
            </div>
          {/if}
        </div>
      {/if}
    {/if}

   
  </main>
</div>

<style>
  /* Base styles */
  :global(body) {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f8f9fa;
    color: #333;
    line-height: 1.6;
  }

  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    position: relative;
  }

  /* Header styles */
  .header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e9ecef;
  }

  .header-title {
    font-size: 2rem;
    font-weight: 600;
    color: #2563eb;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* Button styles */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-size: 0.875rem;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .btn-icon {
    width: 2rem;
    height: 2rem;
    padding: 0;
    border-radius: 0.375rem;
  }

  .btn-primary {
    background-color: #2563eb;
    color: white;
  }

  .btn-primary:hover {
    background-color: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .btn-success {
    background-color: #10b981;
    color: white;
  }

  .btn-success:hover {
    background-color: #059669;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .btn-info {
    background-color: #3b82f6;
    color: white;
  }

  .btn-info:hover {
    background-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .btn-warning {
    background-color: #f59e0b;
    color: white;
  }

  .btn-warning:hover {
    background-color: #d97706;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .btn-danger {
    background-color: #ef4444;
    color: white;
  }

  .btn-danger:hover {
    background-color: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .btn-secondary {
    background-color: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background-color: #4b5563;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .btn-outline {
    background-color: transparent;
    border: 1px solid #d1d5db;
    color: #4b5563;
  }

  .btn-outline:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
    color: #1f2937;
  }

  .btn.active {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
  }

  .btn-text {
    display: inline-block;
  }

  /* Search section */
  .search-section {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .search-form {
    display: flex;
    gap: 0.75rem;
  }

  .search-input-wrapper {
    position: relative;
    flex-grow: 1;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }

  .search-input {
    width: 100%;
    padding: 0.625rem 2.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .search-clear {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .search-clear:hover {
    color: #4b5563;
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .tab-button {
    padding: 0.75rem 1.25rem;
    background-color: #f3f4f6;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    justify-content: center;
  }

  .tab-button:hover {
    background-color: #e5e7eb;
  }

  .tab-button.active {
    background-color: #2563eb;
    color: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0 0.375rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    background-color: rgba(0, 0, 0, 0.1);
  }

  .tab-button.active .tab-count {
    background-color: white;
    color: #2563eb;
  }

  /* Table styles */
  .table-responsive {
    overflow-x: auto;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .list-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
  }

  .list-table th,
  .list-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  .list-table th {
    background-color: #f9fafb;
    font-weight: 600;
    color: #4b5563;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
  }

  .list-table th.sortable {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
  }

  .list-table th.sortable:hover {
    background-color: #f3f4f6;
  }

  .list-item {
    transition: all 0.2s;
  }

  .list-item:hover {
    background-color: #f9fafb;
  }

  .list-item.selected {
    background-color: #eff6ff;
  }

  .list-id {
    font-family: monospace;
    font-weight: 600;
  }

  .list-name {
    font-weight: 500;
  }

  .actions-column {
    width: 120px;
    text-align: center;
  }

  .checkbox-column {
    width: 40px;
    text-align: center;
  }

  .actions-cell {
    text-align: center;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  /* Checkbox styles */
  .checkbox-container {
    display: block;
    position: relative;
    padding-left: 25px;
    cursor: pointer;
    user-select: none;
    height: 20px;
    width: 20px;
    margin: 0 auto;
  }

  .checkbox-container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .checkmark {
    position: absolute;
    top: 0;
    left: 0;
    height: 20px;
    width: 20px;
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .checkbox-container:hover input ~ .checkmark {
    background-color: #e5e7eb;
  }

  .checkbox-container input:checked ~ .checkmark {
    background-color: #2563eb;
    border-color: #2563eb;
  }

  .checkmark:after {
    content: "";
    position: absolute;
    display: none;
  }

  .checkbox-container input:checked ~ .checkmark:after {
    display: block;
  }

  .checkbox-container .checkmark:after {
    left: 7px;
    top: 3px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  /* Badge styles */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .badge-success {
    background-color: #d1fae5;
    color: #065f46;
  }

  .badge-danger {
    background-color: #fee2e2;
    color: #b91c1c;
  }

  .badge-warning {
    background-color: #fef3c7;
    color: #92400e;
  }

  .badge-light {
    background-color: #f3f4f6;
    color: #4b5563;
  }

  /* Form styles */
  .form-section {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-top: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-top: 4px solid #2563eb;
  }

  .form-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: #2563eb;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #4b5563;
  }

  .form-input,
  .form-select {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-input:focus,
  .form-select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 3rem 1.5rem;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .empty-icon {
    font-size: 3rem;
    color: #d1d5db;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #4b5563;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }

  /* Loading spinner */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    text-align: center;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(37, 99, 235, 0.2);
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .spinner-sm {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Error message */
  .error-message {
    padding: 1rem;
    border-radius: 0.375rem;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    position: relative;
    background-color: #fee2e2;
    color: #b91c1c;
    border-left: 4px solid #ef4444;
  }

  .error-close {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: currentColor;
    font-size: 1.25rem;
    cursor: pointer;
    opacity: 0.7;
  }

  .error-close:hover {
    opacity: 1;
  }

  /* Notification */
  .notification {
    position: fixed;
    top: 1rem;
    right: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    max-width: 400px;
    z-index: 1100;
  }

  .notification-success {
    background-color: #d1fae5;
    color: #065f46;
    border-left: 4px solid #10b981;
  }

  .notification-error {
    background-color: #fee2e2;
    color: #b91c1c;
    border-left: 4px solid #ef4444;
  }

  .notification-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .notification-message {
    flex: 1;
  }

  .notification-close {
    background: none;
    border: none;
    color: currentColor;
    font-size: 1.25rem;
    cursor: pointer;
    opacity: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .notification-close:hover {
    opacity: 1;
  }

  /* Dialog styles */
  .dialog-overlay {
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
    backdrop-filter: blur(2px);
  }

  .dialog {
    background-color: white;
    border-radius: 0.5rem;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background-color: #f9fafb;
  }

  .dialog-header-danger {
    background-color: #fee2e2;
    color: #b91c1c;
  }

  .dialog-header-success {
    background-color: #d1fae5;
    color: #065f46;
  }

  .dialog-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .dialog-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 0.375rem;
    background-color: transparent;
    border: none;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .dialog-close:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }

  .dialog-body {
    padding: 1.5rem;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    background-color: #f9fafb;
  }

  /* Dialog item preview */
  .dialog-item-preview {
    background-color: #f9fafb;
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
    margin-top: 1rem;
    overflow: hidden;
  }

  .preview-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background-color: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
  }

  .preview-id {
    font-family: monospace;
    font-weight: 600;
    color: #4b5563;
  }

  .preview-name {
    font-weight: 500;
    color: #1f2937;
  }

  .preview-description {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
    color: #4b5563;
    font-style: italic;
  }

  .preview-details {
    padding: 0.75rem 1rem;
  }

  .preview-detail {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .preview-detail:last-child {
    margin-bottom: 0;
  }

  .detail-label {
    font-weight: 500;
    color: #6b7280;
    width: 100px;
  }

  .detail-value {
    color: #1f2937;
  }

  /* Bulk preview */
  .bulk-preview {
    background-color: #f9fafb;
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
    margin-top: 1rem;
    overflow: hidden;
  }

  .bulk-preview-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background-color: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
    font-weight: 500;
  }

  .bulk-preview-list {
    padding: 0.5rem 0;
  }

  .bulk-preview-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .bulk-preview-id {
    font-family: monospace;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .bulk-preview-name {
    font-weight: 500;
  }

  .bulk-preview-more {
    padding: 0.5rem 1rem;
    color: #6b7280;
    font-style: italic;
    font-size: 0.875rem;
    text-align: center;
  }

  /* Bulk actions bar */
  .bulk-actions-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: #eff6ff;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #2563eb;
  }

  .bulk-actions-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #1e40af;
    font-weight: 500;
  }

  .bulk-actions-buttons {
    display: flex;
    gap: 0.5rem;
  }

  /* Trash specific styles */
  .trash-container {
    border-top: 4px solid #f59e0b;
  }

  .trash-header {
    padding: 1.5rem;
    background-color: white;
    border-radius: 0.5rem 0.5rem 0 0;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .trash-header-content {
    flex: 1;
  }

  .trash-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #f59e0b;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .trash-description {
    color: #6b7280;
    margin: 0;
  }

  .trash-actions {
    display: flex;
    gap: 0.5rem;
  }

  .trash-table th {
    background-color: #fffbeb;
  }

  .trash-item {
    background-color: #fefce8;
  }

  .trash-item:hover {
    background-color: #fef9c3;
  }

  .delete-date {
    color: #92400e;
    font-size: 0.875rem;
  }

  .list-description {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Alert styles */
  .alert {
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    margin: 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .alert-danger {
    background-color: #fee2e2;
    color: #b91c1c;
    border-left: 4px solid #ef4444;
  }

  /* Pagination */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.25rem;
    margin-top: 1.5rem;
    flex-wrap: wrap;
  }

  .pagination-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    padding: 0 0.5rem;
    border-radius: 0.375rem;
    background-color: white;
    border: 1px solid #e5e7eb;
    color: #4b5563;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pagination-button:hover:not(:disabled) {
    background-color: #f3f4f6;
    border-color: #d1d5db;
    color: #1f2937;
  }

  .pagination-button.active {
    background-color: #2563eb;
    border-color: #2563eb;
    color: white;
  }

  .pagination-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination-ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    color: #6b7280;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .search-form {
      flex-direction: column;
    }
    
    .action-buttons {
      flex-direction: column;
      width: 100%;
    }
    
    .btn {
      width: 100%;
    }
    
    .tabs {
      flex-direction: column;
    }
    
    .bulk-actions-bar {
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .bulk-actions-buttons {
      width: 100%;
      flex-direction: column;
    }
    
    .trash-header {
      flex-direction: column;
      gap: 1rem;
    }
    
    .trash-actions {
      width: 100%;
    }
    
    .btn-text {
      display: none;
    }
    
    .header-actions .btn {
      padding: 0.5rem;
      width: auto;
    }
  }
  
  @media (max-width: 480px) {
    .page-container {
      padding: 1rem;
    }
    
    .list-table th,
    .list-table td {
      padding: 0.75rem 0.5rem;
      font-size: 0.875rem;
    }
    
    .action-buttons {
      gap: 0.25rem;
    }
    
    .btn-icon {
      width: 1.75rem;
      height: 1.75rem;
    }
  }
</style>