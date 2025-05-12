<script>
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  // États et données
  let servers = [];
  let loading = true;
  let error = '';
  let success = '';
  let showSuccessToast = false;
  let successMessage = '';
  let searchTerm = '';
  let filteredServers = [];
  let sortField = 'server_id';
  let sortDirection = 'asc';
  let showDeleteConfirm = false;
  let serverToDelete = null;

  // Chargement initial des serveurs
  onMount(async () => {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/servers');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      servers = await res.json();
    } catch (err) {
      error = err.message || 'Erreur de chargement des serveurs';
    } finally {
      loading = false;
    }
  });

  // Filtrer et trier les serveurs
  $: {
    let filtered = servers;
    
    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        (s.server_description && s.server_description.toLowerCase().includes(term)) ||
        (s.server_ip && s.server_ip.toLowerCase().includes(term)) ||
        s.server_id.toString().includes(term)
      );
    }
    
    // Tri
    filtered = [...filtered].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      // Gestion des valeurs null ou undefined
      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';
      
      // Conversion en string pour comparaison
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    filteredServers = filtered;
  }

  // Changer le tri
  function changeSort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
  }

  // Afficher un toast de succès
  function showToast(message) {
    successMessage = message;
    showSuccessToast = true;
    setTimeout(() => {
      showSuccessToast = false;
    }, 3000);
  }

  // Ajouter un nouveau serveur
  function addServer() {
    servers = [
      ...servers,
      {
        server_id: `temp-${Date.now()}`, // ID temporaire pour le front
        server_description: '',
        server_ip: '',
        active: true,
        active_agent_login_server: 'N',
        asterisk_version: '',
        max_vicidial_trunks: 0,
        local_gmt: 0
      }
    ];
  }

  // Mettre à jour un serveur
  async function updateServer(server) {
    try {
      // Si c'est un nouveau serveur (ID temporaire)
      if (server.server_id.toString().startsWith('temp-')) {
        await createServer(server);
        return;
      }

      // Sinon, mettre à jour un serveur existant
      const res = await fetchWithAuth(`http://localhost:8000/api/servers/${server.server_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(server)
      });

      if (res.ok) {
        showToast('Serveur mis à jour avec succès');
      } else {
        const err = await res.text();
        console.error('Erreur :', err);
        error = 'Erreur lors de la mise à jour du serveur';
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour :', err);
      error = 'Erreur lors de la mise à jour du serveur';
    }
  }

  // Créer un nouveau serveur
  async function createServer(server) {
    try {
      // Préparer les données à envoyer (sans l'ID temporaire)
      const serverData = {
        server_description: server.server_description,
        server_ip: server.server_ip,
        active: server.active,
        active_agent_login_server: server.active_agent_login_server,
        asterisk_version: server.asterisk_version,
        max_vicidial_trunks: server.max_vicidial_trunks,
        local_gmt: server.local_gmt
      };

      const res = await fetchWithAuth('http://localhost:8000/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serverData)
      });

      if (res.ok) {
        const newServer = await res.json();
        // Remplacer le serveur temporaire par celui retourné par l'API
        servers = servers.map(s => 
          s.server_id === server.server_id ? newServer : s
        );
        showToast('Nouveau serveur créé avec succès');
      } else {
        const err = await res.text();
        console.error('Erreur lors de la création du serveur:', err);
        error = 'Erreur lors de la création du serveur';
      }
    } catch (err) {
      console.error('Erreur lors de la création du serveur:', err);
      error = 'Erreur lors de la création du serveur';
    }
  }

  // Confirmer la suppression d'un serveur
  function confirmDelete(server) {
    serverToDelete = server;
    showDeleteConfirm = true;
  }

  // Annuler la suppression
  function cancelDelete() {
    serverToDelete = null;
    showDeleteConfirm = false;
  }

  // Supprimer un serveur
  async function deleteServer() {
    if (!serverToDelete) return;
    
    try {
      // Si c'est un serveur temporaire, le supprimer localement
      if (serverToDelete.server_id.toString().startsWith('temp-')) {
        servers = servers.filter(s => s.server_id !== serverToDelete.server_id);
        showDeleteConfirm = false;
        serverToDelete = null;
        return;
      }

      const res = await fetchWithAuth(`http://localhost:8000/api/servers/${serverToDelete.server_id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        servers = servers.filter(s => s.server_id !== serverToDelete.server_id);
        showToast('Serveur supprimé avec succès');
      } else {
        const err = await res.text();
        console.error('Erreur lors de la suppression:', err);
        error = 'Erreur lors de la suppression du serveur';
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      error = 'Erreur lors de la suppression du serveur';
    } finally {
      showDeleteConfirm = false;
      serverToDelete = null;
    }
  }
</script>

<!-- Toast de succès -->
<div class="position-fixed top-0 end-0 p-3" style="z-index: 1100">
  <div class="toast align-items-center text-white bg-success border-0 fade {showSuccessToast ? 'show' : ''}" role="alert" aria-live="assertive" aria-atomic="true">
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi bi-check-circle-fill me-2"></i>
        {successMessage}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" on:click={() => showSuccessToast = false}></button>
    </div>
  </div>
</div>

<!-- Modal de confirmation de suppression -->
<div class="modal fade {showDeleteConfirm ? 'show' : ''}" tabindex="-1" style="display: {showDeleteConfirm ? 'block' : 'none'}">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow">
      <div class="modal-header bg-danger text-white">
        <h5 class="modal-title">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          Confirmer la suppression
        </h5>
        <button type="button" class="btn-close btn-close-white" on:click={cancelDelete}></button>
      </div>
      <div class="modal-body p-4">
        <p>Êtes-vous sûr de vouloir supprimer ce serveur ?</p>
        {#if serverToDelete}
          <div class="alert alert-warning">
            <strong>ID:</strong> {serverToDelete.server_id}<br>
            <strong>Description:</strong> {serverToDelete.server_description || 'Non défini'}<br>
            <strong>IP:</strong> {serverToDelete.server_ip || 'Non défini'}
          </div>
          <p class="text-danger mb-0"><strong>Cette action est irréversible.</strong></p>
        {/if}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" on:click={cancelDelete}>
          <i class="bi bi-x-lg me-2"></i>Annuler
        </button>
        <button type="button" class="btn btn-danger" on:click={deleteServer}>
          <i class="bi bi-trash-fill me-2"></i>Supprimer
        </button>
      </div>
    </div>
  </div>
</div>
{#if showDeleteConfirm}
  <div class="modal-backdrop fade show"></div>
{/if}

<div class="container-fluid py-4">
  <!-- En-tête avec titre et bouton d'ajout -->
  <div class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h1 class="display-6 mb-0 fw-bold text-primary">
        <i class="bi bi-hdd-rack-fill me-2"></i>Gestion des Serveurs
      </h1>
      <p class="text-muted mt-2">Configuration et administration des serveurs du système</p>
    </div>
    <button class="btn btn-primary btn-lg rounded-3 shadow-sm" on:click={addServer}>
      <i class="bi bi-plus-lg me-2"></i>Nouveau serveur
    </button>
  </div>

  <!-- Carte principale -->
  <div class="card border-0 shadow-sm rounded-3 overflow-hidden">
    <!-- Barre d'outils -->
    <div class="card-header bg-white border-0 py-3">
      <div class="row g-3 align-items-center">
        <!-- Recherche -->
        <div class="col-md-6 col-lg-4">
          <div class="input-group">
            <span class="input-group-text bg-light border-end-0">
              <i class="bi bi-search text-muted"></i>
            </span>
            <input 
              type="text" 
              class="form-control border-start-0 ps-0" 
              placeholder="Rechercher un serveur..." 
              bind:value={searchTerm}
            >
            {#if searchTerm}
              <button class="btn btn-outline-secondary border-start-0" type="button" on:click={() => searchTerm = ''}>
                <i class="bi bi-x-lg"></i>
              </button>
            {/if}
          </div>
        </div>
        
        <!-- Compteur et informations -->
        <div class="col-md-6 col-lg-8 text-md-end">
          <span class="badge bg-primary rounded-pill px-3 py-2">
            <i class="bi bi-hdd-stack me-1"></i>
            {filteredServers.length} serveur{filteredServers.length !== 1 ? 's' : ''}
          </span>
          <span class="badge bg-success rounded-pill px-3 py-2 ms-2">
            <i class="bi bi-check-circle me-1"></i>
            {servers.filter(s => s.active).length} actif{servers.filter(s => s.active).length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Alerte d'erreur -->
    {#if error}
      <div class="mx-3 mt-3">
        <div class="alert alert-danger d-flex align-items-center border-0 rounded-3 shadow-sm" role="alert">
          <div class="bg-danger bg-opacity-25 p-2 me-3 rounded-circle">
            <i class="bi bi-exclamation-triangle-fill text-danger fs-4"></i>
          </div>
          <div>{error}</div>
          <button type="button" class="btn-close ms-auto" on:click={() => error = ''}></button>
        </div>
      </div>
    {/if}
    
    <!-- Corps de la carte -->
    <div class="card-body p-0">
      <!-- Indicateur de chargement -->
      {#if loading}
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Chargement...</span>
          </div>
          <p class="mt-3 text-muted fs-5">Chargement des serveurs...</p>
        </div>
      {:else if filteredServers.length === 0}
        <!-- État vide -->
        <div class="text-center py-5">
          <div class="mb-4">
            <span class="display-1 text-muted">
              <i class="bi bi-hdd-rack"></i>
            </span>
          </div>
          {#if searchTerm}
            <h3 class="text-muted">Aucun résultat pour "{searchTerm}"</h3>
            <p class="text-muted mb-3">Essayez avec d'autres termes de recherche</p>
            <button class="btn btn-outline-secondary" on:click={() => searchTerm = ''}>
              <i class="bi bi-arrow-counterclockwise me-2"></i>Réinitialiser la recherche
            </button>
          {:else}
            <h3 class="text-muted">Aucun serveur disponible</h3>
            <p class="text-muted mb-3">Commencez par ajouter votre premier serveur</p>
            <button class="btn btn-primary" on:click={addServer}>
              <i class="bi bi-plus-lg me-2"></i>Ajouter un serveur
            </button>
          {/if}
        </div>
      {:else}
        <!-- Tableau des serveurs -->
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="border-0 py-3" style="cursor: pointer" on:click={() => changeSort('server_id')}>
                  <div class="d-flex align-items-center">
                    <span>ID</span>
                    {#if sortField === 'server_id'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3" style="cursor: pointer" on:click={() => changeSort('server_description')}>
                  <div class="d-flex align-items-center">
                    <span>Description</span>
                    {#if sortField === 'server_description'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3" style="cursor: pointer" on:click={() => changeSort('server_ip')}>
                  <div class="d-flex align-items-center">
                    <span>IP</span>
                    {#if sortField === 'server_ip'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3 text-center" style="cursor: pointer" on:click={() => changeSort('active')}>
                  <div class="d-flex align-items-center justify-content-center">
                    <span>Actif</span>
                    {#if sortField === 'active'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3" style="cursor: pointer" on:click={() => changeSort('active_agent_login_server')}>
                  <div class="d-flex align-items-center">
                    <span>Agent</span>
                    {#if sortField === 'active_agent_login_server'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3" style="cursor: pointer" on:click={() => changeSort('asterisk_version')}>
                  <div class="d-flex align-items-center">
                    <span>Version</span>
                    {#if sortField === 'asterisk_version'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3" style="cursor: pointer" on:click={() => changeSort('max_vicidial_trunks')}>
                  <div class="d-flex align-items-center">
                    <span>Trunks</span>
                    {#if sortField === 'max_vicidial_trunks'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3" style="cursor: pointer" on:click={() => changeSort('local_gmt')}>
                  <div class="d-flex align-items-center">
                    <span>GMT</span>
                    {#if sortField === 'local_gmt'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredServers as server (server.server_id)}
                <tr class="border-bottom {server.server_id.toString().startsWith('temp-') ? 'table-info' : ''}">
                  <td>
                    {#if server.server_id.toString().startsWith('temp-')}
                      <span class="badge bg-info text-dark">Nouveau</span>
                    {:else}
                      <span class="badge bg-secondary rounded-pill">{server.server_id}</span>
                    {/if}
                  </td>
                  <td>
                    <input 
                      type="text" 
                      class="form-control form-control-sm" 
                      placeholder="Description du serveur"
                      bind:value={server.server_description} 
                    />
                  </td>
                  <td>
                    <div class="input-group input-group-sm">
                      <span class="input-group-text bg-light">
                        <i class="bi bi-hdd-network text-primary"></i>
                      </span>
                      <input 
                        type="text" 
                        class="form-control" 
                        placeholder="Adresse IP"
                        bind:value={server.server_ip} 
                      />
                    </div>
                  </td>
                  <td class="text-center">
                    <div class="form-check form-switch d-flex justify-content-center">
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        style="transform: scale(1.5);"
                        bind:checked={server.active} 
                      />
                    </div>
                  </td>
                  <td>
                    <select class="form-select form-select-sm" bind:value={server.active_agent_login_server}>
                      <option value="Y">Oui</option>
                      <option value="N">Non</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      class="form-control form-control-sm" 
                      placeholder="Version Asterisk"
                      bind:value={server.asterisk_version} 
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      class="form-control form-control-sm" 
                      placeholder="0"
                      bind:value={server.max_vicidial_trunks} 
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      class="form-control form-control-sm" 
                      placeholder="0"
                      bind:value={server.local_gmt} 
                    />
                  </td>
                  <td>
                    <div class="d-flex justify-content-center gap-2">
                      <button 
                        class="btn btn-sm btn-primary" 
                        on:click={() => updateServer(server)}
                        title={server.server_id.toString().startsWith('temp-') ? 'Créer le serveur' : 'Enregistrer les modifications'}
                      >
                        <i class="bi {server.server_id.toString().startsWith('temp-') ? 'bi-plus-lg' : 'bi-save'}"></i>
                      </button>
                      <button 
                        class="btn btn-sm btn-danger" 
                        on:click={() => confirmDelete(server)}
                        title="Supprimer le serveur"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Styles pour les modals */
  .modal {
    transition: opacity 0.15s linear;
  }
  
  .modal.fade:not(.show) {
    opacity: 0;
  }
  
  .modal.show {
    opacity: 1;
  }
  
  /* Styles pour le toast */
  .toast {
    transition: opacity 0.15s linear;
  }
  
  .toast:not(.show) {
    display: none;
  }
  
  /* Styles pour les badges */
  .badge {
    font-weight: 500;
    letter-spacing: 0.3px;
  }
  
  /* Styles pour les boutons */
  .btn {
    font-weight: 500;
  }
  
  /* Styles pour les inputs */
  .form-control:focus, .form-select:focus {
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }
  
  /* Styles pour le tableau */
  .table {
    vertical-align: middle;
    font-size: 0.95rem;
  }
  
  .table thead th {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.5px;
  }
  
  /* Animation pour le spinner */
  .spinner-border {
    animation: spinner-border 0.75s linear infinite;
  }
</style>