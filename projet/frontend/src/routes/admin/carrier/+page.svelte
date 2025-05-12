<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  // Données et états
  let carriers: any[] = [];
  let error: string = '';
  let success: string = '';
  let newCarrier: any = null;
  let editingCarrier: any = null;
  let loading: boolean = true;
  let showAddModal: boolean = false;
  let showEditModal: boolean = false;
  let searchTerm: string = '';
  let filteredCarriers: any[] = [];
  let activeTab: string = 'all'; // 'all', 'active', 'inactive'
  let showSuccessToast: boolean = false;
  let successMessage: string = '';
  let sortField: string = 'carrier_name';
  let sortDirection: 'asc' | 'desc' = 'asc';

  // Chargement initial des carriers
  onMount(async () => {
    try {
      const res = await fetchWithAuth('http://localhost:8000/api/carriers');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      carriers = await res.json();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });

  // Filtrer les carriers par recherche et onglet actif
  $: {
    let filtered = carriers;
    
    // Filtre par texte de recherche
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.carrier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.carrier_id.toString().includes(searchTerm) ||
        (c.server_ip && c.server_ip.includes(searchTerm))
      );
    }
    
    // Filtre par onglet actif
    if (activeTab === 'active') {
      filtered = filtered.filter(c => c.active === 'Y');
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(c => c.active !== 'Y');
    }
    
    // Tri
    filtered = [...filtered].sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    filteredCarriers = filtered;
  }

  // Changer le tri
  function changeSort(field: string) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
  }

  // Afficher un toast de succès
  function showToast(message: string) {
    successMessage = message;
    showSuccessToast = true;
    setTimeout(() => {
      showSuccessToast = false;
    }, 3000);
  }

  // Ouvre le formulaire d'ajout
  function openAddForm() {
    error = '';
    newCarrier = {
      carrier_id: '',
      carrier_name: '',
      server_ip: '',
      protocol: '',
      registration_string: '',
      active: true,
      user_group: ''
    };
    showAddModal = true;
  }

  // Annule l'ajout
  function cancelAdd() {
    newCarrier = null;
    error = '';
    showAddModal = false;
  }

  // Envoie l'ajout au backend
  async function addCarrier() {
    // Validation front
    if (!newCarrier.carrier_name.trim()) {
      error = 'Le nom du carrier est requis.';
      return;
    }
    try {
      const payload = {
        ...newCarrier,
        active: newCarrier.active ? 'Y' : 'N'
      };
      const res = await fetchWithAuth('http://localhost:8000/api/carriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const created = await res.json();
      carriers = [...carriers, created];
      newCarrier = null;
      error = '';
      showAddModal = false;
      showToast('Carrier ajouté avec succès!');
    } catch (err) {
      error = err.message;
    }
  }

  // Ouvre le formulaire de modification
  function editCarrier(c: any) {
    error = '';
    editingCarrier = { ...c, active: c.active === 'Y' };
    showEditModal = true;
  }

  // Annule la modification
  function cancelEdit() {
    editingCarrier = null;
    error = '';
    showEditModal = false;
  }

  // Envoie la mise à jour au backend
  async function saveChanges() {
    if (!editingCarrier.carrier_name.trim()) {
      error = 'Le nom du carrier est requis.';
      return;
    }
    try {
      const payload = {
        ...editingCarrier,
        active: editingCarrier.active ? 'Y' : 'N'
      };
      const res = await fetchWithAuth(
        `http://localhost:8000/api/carriers/${editingCarrier.carrier_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      carriers = carriers.map(c =>
        c.carrier_id === editingCarrier.carrier_id ? { ...editingCarrier, active: editingCarrier.active ? 'Y' : 'N' } : c
      );
      editingCarrier = null;
      error = '';
      showEditModal = false;
      showToast('Carrier mis à jour avec succès!');
    } catch (err) {
      error = err.message;
    }
  }

  // Basculer rapidement l'état actif d'un carrier
  async function toggleActive(carrier: any) {
    try {
      const newActive = carrier.active === 'Y' ? 'N' : 'Y';
      const payload = {
        ...carrier,
        active: newActive
      };
      
      const res = await fetchWithAuth(
        `http://localhost:8000/api/carriers/${carrier.carrier_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      
      carriers = carriers.map(c =>
        c.carrier_id === carrier.carrier_id ? { ...c, active: newActive } : c
      );
      
      showToast(`Carrier ${newActive === 'Y' ? 'activé' : 'désactivé'} avec succès!`);
    } catch (err) {
      error = err.message;
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

<div class="container-fluid py-4">
  <!-- En-tête avec titre et bouton d'ajout -->
  <div class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h1 class="display-6 mb-0 fw-bold text-primary">
        <i class="bi bi-telephone-plus me-2"></i>Gestion des Carriers
      </h1>
      <p class="text-muted mt-2">Gérez vos connexions téléphoniques et protocoles</p>
    </div>
    <button class="btn btn-primary btn-lg rounded-pill shadow-sm" on:click={openAddForm}>
      <i class="bi bi-plus-lg me-2"></i>Nouveau carrier
    </button>
  </div>

  <!-- Carte principale -->
  <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
    <!-- Barre d'outils -->
    <div class="card-header bg-white border-0 py-3">
      <div class="row g-3 align-items-center">
        <!-- Recherche -->
        <div class="col-md-6 col-lg-4">
          <div class="input-group input-group-lg">
            <span class="input-group-text bg-light border-end-0">
              <i class="bi bi-search text-muted"></i>
            </span>
            <input 
              type="text" 
              class="form-control border-start-0 ps-0" 
              placeholder="Rechercher..." 
              bind:value={searchTerm}
            >
            {#if searchTerm}
              <button class="btn btn-outline-secondary border-start-0" type="button" on:click={() => searchTerm = ''}>
                <i class="bi bi-x-lg"></i>
              </button>
            {/if}
          </div>
        </div>
        
        <!-- Filtres par onglets -->
        <div class="col-md-6 col-lg-8">
          <ul class="nav nav-pills justify-content-md-end">
            <li class="nav-item">
              <button 
                class="nav-link {activeTab === 'all' ? 'active' : ''}" 
                on:click={() => activeTab = 'all'}
              >
                <i class="bi bi-grid-3x3-gap me-1"></i>
                Tous <span class="badge bg-light text-dark ms-1">{carriers.length}</span>
              </button>
            </li>
            <li class="nav-item ms-2">
              <button 
                class="nav-link {activeTab === 'active' ? 'active' : ''}" 
                on:click={() => activeTab = 'active'}
              >
                <i class="bi bi-check-circle me-1"></i>
                Actifs <span class="badge bg-light text-dark ms-1">{carriers.filter(c => c.active === 'Y').length}</span>
              </button>
            </li>
            <li class="nav-item ms-2">
              <button 
                class="nav-link {activeTab === 'inactive' ? 'active' : ''}" 
                on:click={() => activeTab = 'inactive'}
              >
                <i class="bi bi-x-circle me-1"></i>
                Inactifs <span class="badge bg-light text-dark ms-1">{carriers.filter(c => c.active !== 'Y').length}</span>
              </button>
            </li>
          </ul>
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
          <div class="spinner-grow text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Chargement...</span>
          </div>
          <p class="mt-3 text-muted fs-5">Chargement des données...</p>
        </div>
      {:else if filteredCarriers.length === 0}
        <!-- État vide -->
        <div class="text-center py-5">
          <div class="mb-4">
            <span class="display-1 text-muted">
              <i class="bi bi-inbox"></i>
            </span>
          </div>
          {#if searchTerm}
            <h3 class="text-muted">Aucun résultat pour "{searchTerm}"</h3>
            <p class="text-muted mb-3">Essayez avec d'autres termes de recherche</p>
            <button class="btn btn-outline-secondary" on:click={() => searchTerm = ''}>
              <i class="bi bi-arrow-counterclockwise me-2"></i>Réinitialiser la recherche
            </button>
          {:else}
            <h3 class="text-muted">Aucun carrier disponible</h3>
            <p class="text-muted mb-3">Commencez par ajouter votre premier carrier</p>
            <button class="btn btn-primary" on:click={openAddForm}>
              <i class="bi bi-plus-lg me-2"></i>Ajouter un carrier
            </button>
          {/if}
        </div>
      {:else}
        <!-- Tableau des carriers -->
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="border-0 py-3" style="cursor: pointer" on:click={() => changeSort('carrier_id')}>
                  <div class="d-flex align-items-center">
                    <span>ID</span>
                    {#if sortField === 'carrier_id'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3" style="cursor: pointer" on:click={() => changeSort('carrier_name')}>
                  <div class="d-flex align-items-center">
                    <span>Nom</span>
                    {#if sortField === 'carrier_name'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3" style="cursor: pointer" on:click={() => changeSort('server_ip')}>
                  <div class="d-flex align-items-center">
                    <span>IP Serveur</span>
                    {#if sortField === 'server_ip'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3" style="cursor: pointer" on:click={() => changeSort('protocol')}>
                  <div class="d-flex align-items-center">
                    <span>Protocole</span>
                    {#if sortField === 'protocol'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3">Registration</th>
                <th class="border-0 py-3 text-center" style="cursor: pointer" on:click={() => changeSort('active')}>
                  <div class="d-flex align-items-center justify-content-center">
                    <span>Statut</span>
                    {#if sortField === 'active'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3" style="cursor: pointer" on:click={() => changeSort('user_group')}>
                  <div class="d-flex align-items-center">
                    <span>Groupe</span>
                    {#if sortField === 'user_group'}
                      <i class="bi ms-1 {sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}"></i>
                    {/if}
                  </div>
                </th>
                <th class="border-0 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredCarriers as c}
                <tr class="border-bottom">
                  <td>
                    <span class="badge bg-secondary rounded-pill">{c.carrier_id}</span>
                  </td>
                  <td>
                    <div class="fw-bold">{c.carrier_name}</div>
                  </td>
                  <td>
                    {#if c.server_ip}
                      <div class="d-flex align-items-center">
                        <div class="bg-light p-1 rounded me-2">
                          <i class="bi bi-hdd-network text-primary"></i>
                        </div>
                        <span>{c.server_ip}</span>
                      </div>
                    {:else}
                      <span class="text-muted fst-italic">Non défini</span>
                    {/if}
                  </td>
                  <td>
                    {#if c.protocol}
                      <span class="badge bg-info text-dark rounded-pill px-3">{c.protocol}</span>
                    {:else}
                      <span class="text-muted fst-italic">-</span>
                    {/if}
                  </td>
                  <td>
                    <div class="text-truncate" style="max-width: 200px;" title={c.registration_string || ''}>
                      {#if c.registration_string}
                        <div class="d-flex align-items-center">
                          <div class="bg-light p-1 rounded me-2">
                            <i class="bi bi-card-text text-warning"></i>
                          </div>
                          <span>{c.registration_string}</span>
                        </div>
                      {:else}
                        <span class="text-muted fst-italic">-</span>
                      {/if}
                    </div>
                  </td>
                  <td class="text-center">
                    <div class="form-check form-switch d-flex justify-content-center">
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        checked={c.active === 'Y'} 
                        on:change={() => toggleActive(c)}
                        style="transform: scale(1.5);"
                      >
                    </div>
                  </td>
                  <td>
                    {#if c.user_group}
                      <div class="d-flex align-items-center">
                        <div class="bg-light p-1 rounded me-2">
                          <i class="bi bi-people text-success"></i>
                        </div>
                        <span>{c.user_group}</span>
                      </div>
                    {:else}
                      <span class="text-muted fst-italic">-</span>
                    {/if}
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary rounded-pill" on:click={() => editCarrier(c)}>
                      <i class="bi bi-pencil me-1"></i>Modifier
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
    
    <!-- Pied de carte avec pagination (pour une future implémentation) -->
    {#if filteredCarriers.length > 0}
      <div class="card-footer bg-white border-0 py-3">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <span class="text-muted">Affichage de {filteredCarriers.length} carrier{filteredCarriers.length > 1 ? 's' : ''}</span>
          </div>
          <div>
            <button class="btn btn-primary" on:click={openAddForm}>
              <i class="bi bi-plus-lg me-1"></i>Ajouter
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Modal d'ajout de carrier -->
<div class="modal fade" class:show={showAddModal} class:d-block={showAddModal} tabindex="-1" role="dialog">
  {#if newCarrier}
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content border-0 shadow rounded-4 overflow-hidden">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title">
          <i class="bi bi-plus-circle me-2"></i>Ajouter un nouveau Carrier
        </h5>
        <button type="button" class="btn-close btn-close-white" on:click={cancelAdd}></button>
      </div>
      
      <div class="modal-body p-4">
        {#if error}
          <div class="alert alert-danger d-flex align-items-center rounded-3" role="alert">
            <div class="bg-danger bg-opacity-25 p-2 me-3 rounded-circle">
              <i class="bi bi-exclamation-triangle-fill text-danger"></i>
            </div>
            <div>{error}</div>
            <button type="button" class="btn-close ms-auto" on:click={() => error = ''}></button>
          </div>
        {/if}
        
        <form on:submit|preventDefault={addCarrier} id="addCarrierForm">
          <div class="row g-4">
            <!-- Informations de base -->
            <div class="col-12">
              <h6 class="text-uppercase text-muted fw-bold mb-3">Informations de base</h6>
            </div>
            
            <div class="col-md-6">
              <label for="carrier-id" class="form-label">Carrier ID</label>
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-key text-secondary"></i>
                </span>
                <input
                  type="text"
                  id="carrier-id"
                  class="form-control"
                  placeholder="ID unique (optionnel)"
                  bind:value={newCarrier.carrier_id}
                />
              </div>
              <div class="form-text">Laissez vide pour une génération automatique</div>
            </div>
            
            <div class="col-md-6">
              <label for="carrier-name" class="form-label">Nom <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-tag text-primary"></i>
                </span>
                <input
                  type="text"
                  id="carrier-name"
                  class="form-control"
                  placeholder="Nom du carrier"
                  bind:value={newCarrier.carrier_name}
                  required
                />
              </div>
            </div>
            
            <!-- Configuration technique -->
            <div class="col-12 mt-4">
              <h6 class="text-uppercase text-muted fw-bold mb-3">Configuration technique</h6>
            </div>
            
            <div class="col-md-6">
              <label for="server-ip" class="form-label">IP Serveur</label>
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-hdd-network text-info"></i>
                </span>
                <input
                  type="text"
                  id="server-ip"
                  class="form-control"
                  placeholder="Adresse IP"
                  bind:value={newCarrier.server_ip}
                />
              </div>
            </div>
            
            <div class="col-md-6">
              <label for="protocol" class="form-label">Protocole</label>
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-gear text-secondary"></i>
                </span>
                <select class="form-select" id="protocol" bind:value={newCarrier.protocol}>
                  <option value="">Sélectionner un protocole</option>
                  <option value="SIP">SIP</option>
                  <option value="H323">H323</option>
                  <option value="IAX">IAX</option>
                  <option value="MGCP">MGCP</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
            </div>
            
            <div class="col-12">
              <label for="registration" class="form-label">Registration</label>
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-card-text text-warning"></i>
                </span>
                <input
                  type="text"
                  id="registration"
                  class="form-control"
                  placeholder="Chaîne de registration"
                  bind:value={newCarrier.registration_string}
                />
              </div>
            </div>
            
            <!-- Paramètres additionnels -->
            <div class="col-12 mt-4">
              <h6 class="text-uppercase text-muted fw-bold mb-3">Paramètres additionnels</h6>
            </div>
            
            <div class="col-md-6">
              <label for="user-group" class="form-label">Groupe d'utilisateurs</label>
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-people text-success"></i>
                </span>
                <input
                  type="text"
                  id="user-group"
                  class="form-control"
                  placeholder="Groupe"
                  bind:value={newCarrier.user_group}
                />
              </div>
            </div>
            
            <div class="col-md-6">
              <label class="form-label d-block">Statut</label>
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="new-active"
                  bind:checked={newCarrier.active}
                  style="transform: scale(1.5); margin-right: 10px;"
                />
                <label class="form-check-label" for="new-active">
                  {#if newCarrier.active}
                    <span class="text-success fw-bold">Actif</span>
                  {:else}
                    <span class="text-danger fw-bold">Inactif</span>
                  {/if}
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-outline-secondary rounded-pill" on:click={cancelAdd}>
          <i class="bi bi-x-lg me-1"></i>Annuler
        </button>
        <button type="submit" form="addCarrierForm" class="btn btn-primary rounded-pill">
          <i class="bi bi-check-lg me-1"></i>Ajouter
        </button>
      </div>
    </div>
  </div>
  {/if}
</div>

<!-- Overlay pour le modal -->
{#if showAddModal}
  <div class="modal-backdrop fade show"></div>
{/if}

<!-- Modal d'édition de carrier -->
<div class="modal fade" class:show={showEditModal} class:d-block={showEditModal} tabindex="-1" role="dialog">
  {#if editingCarrier}
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content border-0 shadow rounded-4 overflow-hidden">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title">
          <i class="bi bi-pencil-square me-2"></i>Modifier le Carrier
        </h5>
        <button type="button" class="btn-close btn-close-white" on:click={cancelEdit}></button>
      </div>
      
      <div class="modal-body p-4">
        {#if error}
          <div class="alert alert-danger d-flex align-items-center rounded-3" role="alert">
            <div class="bg-danger bg-opacity-25 p-2 me-3 rounded-circle">
              <i class="bi bi-exclamation-triangle-fill text-danger"></i>
            </div>
            <div>{error}</div>
            <button type="button" class="btn-close ms-auto" on:click={() => error = ''}></button>
          </div>
        {/if}
        
        <form on:submit|preventDefault={saveChanges} id="editCarrierForm">
          <div class="row g-4">
            <!-- Informations de base -->
            <div class="col-12">
              <div class="d-flex align-items-center">
                <span class="badge bg-secondary rounded-pill me-2">{editingCarrier.carrier_id}</span>
                <h6 class="text-uppercase text-muted fw-bold mb-0">Informations de base</h6>
              </div>
              <hr class="mt-2 mb-3">
            </div>
            
            <div class="col-12">
              <label for="edit-carrier-name" class="form-label">Nom <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-tag text-primary"></i>
                </span>
                <input
                  type="text"
                  id="edit-carrier-name"
                  class="form-control"
                  bind:value={editingCarrier.carrier_name}
                  required
                />
              </div>
            </div>
            
            <!-- Configuration technique -->
            <div class="col-12 mt-4">
              <h6 class="text-uppercase text-muted fw-bold mb-0">Configuration technique</h6>
              <hr class="mt-2 mb-3">
            </div>
            
            <div class="col-md-6">
              <label for="edit-server-ip" class="form-label">IP Serveur</label>
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-hdd-network text-info"></i>
                </span>
                <input
                  type="text"
                  id="edit-server-ip"
                  class="form-control"
                  bind:value={editingCarrier.server_ip}
                />
              </div>
            </div>
            
            <div class="col-md-6">
              <label for="edit-protocol" class="form-label">Protocole</label>
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-gear text-secondary"></i>
                </span>
                <select class="form-select" id="edit-protocol" bind:value={editingCarrier.protocol}>
                  <option value="">Sélectionner un protocole</option>
                  <option value="SIP">SIP</option>
                  <option value="H323">H323</option>
                  <option value="IAX">IAX</option>
                  <option value="MGCP">MGCP</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
            </div>
            
            <div class="col-12">
              <label for="edit-registration" class="form-label">Registration</label>
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-card-text text-warning"></i>
                </span>
                <input
                  type="text"
                  id="edit-registration"
                  class="form-control"
                  bind:value={editingCarrier.registration_string}
                />
              </div>
            </div>
            
            <!-- Paramètres additionnels -->
            <div class="col-12 mt-4">
              <h6 class="text-uppercase text-muted fw-bold mb-0">Paramètres additionnels</h6>
              <hr class="mt-2 mb-3">
            </div>
            
            <div class="col-md-6">
              <label for="edit-user-group" class="form-label">Groupe d'utilisateurs</label>
              <div class="input-group">
                <span class="input-group-text bg-light">
                  <i class="bi bi-people text-success"></i>
                </span>
                <input
                  type="text"
                  id="edit-user-group"
                  class="form-control"
                  bind:value={editingCarrier.user_group}
                />
              </div>
            </div>
            
            <div class="col-md-6">
              <label class="form-label d-block">Statut</label>
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="edit-active"
                  bind:checked={editingCarrier.active}
                  style="transform: scale(1.5); margin-right: 10px;"
                />
                <label class="form-check-label" for="edit-active">
                  {#if editingCarrier.active}
                    <span class="text-success fw-bold">Actif</span>
                  {:else}
                    <span class="text-danger fw-bold">Inactif</span>
                  {/if}
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-outline-secondary rounded-pill" on:click={cancelEdit}>
          <i class="bi bi-x-lg me-1"></i>Annuler
        </button>
        <button type="submit" form="editCarrierForm" class="btn btn-primary rounded-pill">
          <i class="bi bi-check-lg me-1"></i>Enregistrer
        </button>
      </div>
    </div>
  </div>
  {/if}
</div>

<!-- Overlay pour le modal d'édition -->
{#if showEditModal}
  <div class="modal-backdrop fade show"></div>
{/if}

<style>
  /* Styles généraux */
  .rounded-4 {
    border-radius: 0.75rem;
  }
  
  .rounded-pill {
    border-radius: 50rem;
  }
  
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
  
  /* Styles pour les onglets */
  .nav-pills .nav-link {
    border-radius: 50rem;
    padding: 0.5rem 1rem;
  }
  
  .nav-pills .nav-link.active {
    background-color: var(--bs-primary);
  }
  
  /* Animation pour le spinner */
  .spinner-grow {
    animation: spinner-grow 0.75s linear infinite;
  }
</style>