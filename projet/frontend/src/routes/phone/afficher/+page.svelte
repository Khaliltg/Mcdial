<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
  
  // API configuration
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // API configuration
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      interface Phone {
        extension: string;
        mot_de_pass: string;
        server_ip?: string;
        dialplan_number?: string;
        status?: string;
        active?: string; // Y = actif, N = inactif
        fullname?: string;
        protocol?: string;
        user_group?: string;
      }
      
      let phones: Phone[] = [];
      let filteredPhones: Phone[] = [];
      let isLoading = true;
      let searchQuery = '';
      let sortField = 'extension';
      let sortDirection: 'asc' | 'desc' = 'asc';
      let refreshing = false;
      let showFab = false;
      let animateStats = false;
      
      // Stats for dashboard cards
      let stats = {
        active: 0,
        inactive: 0,
        total: 0,
        groups: new Set()
      };
      
      // Calculate stats when phones change
      $: {
        stats.total = phones.length;
        stats.active = phones.filter(p => (p.status || '').toLowerCase() === 'active').length;
        stats.inactive = phones.filter(p => (p.status || '').toLowerCase() === 'inactive').length;
        stats.groups = new Set(phones.map(p => p.user_group).filter(Boolean));
      }
      
      // Filter phones based on search query
      $: {
        const q = searchQuery.toLowerCase();
        filteredPhones = phones.filter(phone => 
          phone.extension?.toLowerCase().includes(q) ||
          phone.fullname?.toLowerCase().includes(q) ||
          phone.user_group?.toLowerCase().includes(q) ||
          phone.status?.toLowerCase().includes(q) ||
          phone.server_ip?.toLowerCase().includes(q)
        );
      }
      
      // Sort phones based on sort field and direction
      $: {
        filteredPhones = [...filteredPhones].sort((a, b) => {
          const aValue = a[sortField as keyof Phone] || '';
          const bValue = b[sortField as keyof Phone] || '';
          
          if (sortDirection === 'asc') {
            return aValue.toString().localeCompare(bValue.toString());
          } else {
            return bValue.toString().localeCompare(aValue.toString());
          }
        });
      }
      
      async function loadPhones() {
        isLoading = true;
        animateStats = false;
        try {
          const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/phone/list`);
          const contentType = response.headers.get('content-type');
      
          if (!response.ok) {
            const errorData = contentType?.includes('application/json') 
              ? await response.json()
              : { message: 'Server error occurred' };
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }
      
          if (!contentType?.includes('application/json')) {
            throw new Error('Invalid response format from server');
          }
      
          phones = await response.json();
          
          // Trigger stats animation after data is loaded
          setTimeout(() => {
            animateStats = true;
          }, 300);
        } catch (error) {
          console.error('Failed to fetch phones:', error);
        } finally {
          isLoading = false;
        }
      }
      
      async function refreshData() {
        refreshing = true;
        await loadPhones();
        setTimeout(() => {
          refreshing = false;
        }, 500);
      }
      
      function clearSearch() {
        searchQuery = '';
      }
      
      function sortBy(field: keyof Phone) {
        if (sortField === field) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortField = field;
          sortDirection = 'asc';
        }
      }
      
      function getSortIcon(field: keyof Phone) {
        if (sortField !== field) return 'bi-arrow-down-up text-muted opacity-25';
        return sortDirection === 'asc' ? 'bi-arrow-down' : 'bi-arrow-up';
      }
      
      function afficherDetail(phoneID: string) {
        goto(`/phone/detail/?id=${phoneID}`)
      }
      
      
      
      function getStatusColor(status: string, active?: string) {
        // Si active est défini, il a priorité sur status
        if (active) {
          return active === 'Y' ? '#28a745' : '#dc3545';
        }
        
        // Sinon, utiliser status comme avant
        switch ((status || '').toLowerCase()) {
          case 'active': return '#28a745';
          case 'inactive': return '#6c757d';
          case 'paused': return '#ffc107';
          case 'error': return '#dc3545';
          case 'pending': return '#17a2b8';
          case 'suspended': return '#dc3545';
          case 'disabled': return '#343a40';
          default: return '#e9ecef';
        }
      }
      
      function getStatusBadgeClass(status: string, active?: string) {
        // Si active est défini, il a priorité sur status
        if (active) {
          return active === 'Y' ? 'bg-success text-light' : 'bg-danger text-light';
        }
        
        // Sinon, utiliser status comme avant
        switch ((status || '').toLowerCase()) {
          case 'active': return 'bg-success text-light';
          case 'inactive': return 'bg-secondary text-light';
          case 'paused': return 'bg-warning text-dark';
          case 'error': return 'bg-danger text-light';
          case 'pending': return 'bg-info text-dark';
          case 'suspended': return 'bg-danger text-light';
          case 'disabled': return 'bg-dark text-light';
          default: return 'bg-light text-dark border';
        }
      }
      
      // Show/hide FAB on scroll
      function handleScroll() {
        showFab = window.scrollY > 100;
      }
      
      onMount(() => {
        loadPhones();
        window.addEventListener('scroll', handleScroll);
        
        return () => {
          window.removeEventListener('scroll', handleScroll);
        };
      });
      </script>
      
      <div class="main-container py-4">
       
      
        <!-- Breadcrumb with modern styling -->
        <nav aria-label="breadcrumb" class="mb-4 fade-in">
          <ol class="breadcrumb glass-breadcrumb p-2 rounded">
            <li class="breadcrumb-item"><a href="/" class="text-decoration-none"><i class="bi bi-house me-1"></i>Accueil</a></li>
            <li class="breadcrumb-item active" aria-current="page"><i class="bi bi-telephone me-1"></i>Téléphones</li>
          </ol>
        </nav>
      
        <!-- Stats Cards -->
        <div class="row mb-4 fade-in">
          <div class="col-md-3 mb-3">
            <div class="card stat-card glass-card border-0 h-100 {animateStats ? 'animate-card' : ''}">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="stat-icon bg-primary bg-opacity-10 text-primary {animateStats ? 'animate-icon' : ''}">
                    <i class="bi bi-telephone-fill"></i>
                  </div>
                  <div class="ms-3">
                    <h6 class="stat-title">Total Téléphones</h6>
                    <h3 class="stat-value {animateStats ? 'animate-value' : ''}">{stats.total}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card stat-card glass-card border-0 h-100 {animateStats ? 'animate-card' : ''}" style="animation-delay: 0.1s;">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="stat-icon bg-success bg-opacity-10 text-success {animateStats ? 'animate-icon' : ''}" style="animation-delay: 0.1s;">
                    <i class="bi bi-check-circle-fill"></i>
                  </div>
                  <div class="ms-3">
                    <h6 class="stat-title">Téléphones Actifs</h6>
                    <h3 class="stat-value {animateStats ? 'animate-value' : ''}" style="animation-delay: 0.1s;">{stats.active}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card stat-card glass-card border-0 h-100 {animateStats ? 'animate-card' : ''}" style="animation-delay: 0.2s;">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="stat-icon bg-secondary bg-opacity-10 text-secondary {animateStats ? 'animate-icon' : ''}" style="animation-delay: 0.2s;">
                    <i class="bi bi-dash-circle-fill"></i>
                  </div>
                  <div class="ms-3">
                    <h6 class="stat-title">Téléphones Inactifs</h6>
                    <h3 class="stat-value {animateStats ? 'animate-value' : ''}" style="animation-delay: 0.2s;">{stats.inactive}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card stat-card glass-card border-0 h-100 {animateStats ? 'animate-card' : ''}" style="animation-delay: 0.3s;">
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <div class="stat-icon bg-info bg-opacity-10 text-info {animateStats ? 'animate-icon' : ''}" style="animation-delay: 0.3s;">
                    <i class="bi bi-people-fill"></i>
                  </div>
                  <div class="ms-3">
                    <h6 class="stat-title">Groupes</h6>
                    <h3 class="stat-value {animateStats ? 'animate-value' : ''}" style="animation-delay: 0.3s;">{stats.groups.size}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        <div class="row justify-content-center mb-4">
          <div class="col-12 col-lg-12">
            <div class="card glass-card shadow-lg border-0 mb-4">
              <div class="card-header py-3">
                <div class="d-flex justify-content-between align-items-center flex-wrap">
                  <h2 class="h4 mb-0 fw-bold"><i class="bi bi-telephone-fill me-2 text-primary"></i>Liste des Téléphones</h2>
                  <button class="btn btn-sm btn-primary" on:click={refreshData} disabled={refreshing}>
                    <i class="bi {refreshing ? 'bi-arrow-repeat spin' : 'bi-arrow-repeat'}"></i>
                    {refreshing ? 'Actualisation...' : 'Actualiser'}
                  </button>
                </div>
              </div>
              
              <div class="card-body">
                <!-- Search and filters -->
                <div class="row mb-4">
                  <div class="col-md-8">
                    <div class="search-container">
                      <div class="input-group glass-input">
                        <span class="input-group-text border-0 bg-transparent"><i class="bi bi-search"></i></span>
                        <input 
                          type="text" 
                          class="form-control border-0 shadow-none" 
                          placeholder="Rechercher par extension, nom, groupe..." 
                          bind:value={searchQuery}
                          aria-label="Rechercher">
                        {#if searchQuery}
                          <button class="btn btn-link text-secondary" type="button" on:click={clearSearch}>
                            <i class="bi bi-x-circle-fill"></i>
                          </button>
                        {/if}
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4 text-md-end mt-3 mt-md-0 d-flex align-items-center justify-content-md-end">
                    <div class="badge result-count">
                      <i class="bi bi-telephone-fill me-1"></i>
                      {filteredPhones.length} téléphone{filteredPhones.length !== 1 ? 's' : ''} 
                      {filteredPhones.length !== phones.length ? `(sur ${phones.length})` : ''}
                    </div>
                  </div>
                </div>
      
                <!-- Phone list -->
                {#if isLoading}
                  <div class="d-flex justify-content-center align-items-center py-5">
                    <div class="text-center">
                      <div class="loading-animation">
                        <div class="spinner-grow text-primary" role="status"></div>
                        <div class="spinner-grow text-primary" role="status" style="animation-delay: 0.2s"></div>
                        <div class="spinner-grow text-primary" role="status" style="animation-delay: 0.4s"></div>
                      </div>
                      <div class="mt-4 text-primary fw-bold">Chargement de la liste des téléphones...</div>
                    </div>
                  </div>
                {:else if phones.length === 0}
                  <div class="text-center py-5 empty-state">
                    <div class="empty-icon-container mb-4">
                      <i class="bi bi-telephone-x display-1"></i>
                    </div>
                    <h4 class="fw-bold">Aucun téléphone trouvé</h4>
                    <p class="text-muted mb-4">Aucun téléphone n'a été configuré dans le système.</p>
                    <button class="btn btn-primary btn-lg pulse-button" on:click={refreshData}>
                      <i class="bi bi-arrow-repeat me-2"></i> Actualiser
                    </button>
                  </div>
                {:else if filteredPhones.length === 0}
                  <div class="text-center py-5 empty-state">
                    <div class="empty-icon-container mb-4">
                      <i class="bi bi-search display-1"></i>
                    </div>
                    <h4 class="fw-bold">Aucun résultat pour "{searchQuery}"</h4>
                    <p class="text-muted mb-4">Essayez de modifier votre recherche ou d'effacer les filtres.</p>
                    <button class="btn btn-primary btn-lg" on:click={clearSearch}>
                      <i class="bi bi-x-circle me-2"></i> Effacer la recherche
                    </button>
                  </div>
                {:else}
                  <div class="table-responsive rounded">
                    <table class="table table-hover align-middle mb-0 modern-table">
                      <thead>
                        <tr>
                          <th class="sortable" on:click={() => sortBy('extension')}>
                            <div class="d-flex align-items-center">
                              <i class="bi bi-hash me-2"></i> EXTEN
                              <i class="bi {getSortIcon('extension')} ms-1 sort-icon"></i>
                            </div>
                          </th>
                          <th class="sortable" on:click={() => sortBy('password')}>
                            <div class="d-flex align-items-center">
                              <i class="bi bi-usb me-2"></i> MOT DE PASS
                              <i class="bi {getSortIcon('password')} ms-1 sort-icon"></i>
                            </div>
                          </th>
                          <th class="sortable" on:click={() => sortBy('server_ip')}>
                            <div class="d-flex align-items-center">
                              <i class="bi bi-hdd-network me-2"></i> SERVER
                              <i class="bi {getSortIcon('server_ip')} ms-1 sort-icon"></i>
                            </div>
                          </th>
                          <th class="sortable" on:click={() => sortBy('dialplan_number')}>
                            <div class="d-flex align-items-center">
                              <i class="bi bi-diagram-3 me-2"></i> DIAL PLAN
                              <i class="bi {getSortIcon('dialplan_number')} ms-1 sort-icon"></i>
                            </div>
                          </th>
                          <th class="sortable" on:click={() => sortBy('status')}>
                            <div class="d-flex align-items-center">
                              <i class="bi bi-circle-half me-2"></i> STATUS
                              <i class="bi {getSortIcon('status')} ms-1 sort-icon"></i>
                            </div>
                          </th>
                          <th class="sortable" on:click={() => sortBy('fullname')}>
                            <div class="d-flex align-items-center">
                              <i class="bi bi-person me-2"></i> NOM
                              <i class="bi {getSortIcon('fullname')} ms-1 sort-icon"></i>
                            </div>
                          </th>
                          <th class="sortable" on:click={() => sortBy('protocol')}>
                            <div class="d-flex align-items-center">
                              <i class="bi bi-voicemail me-2"></i> PROTO
                              <i class="bi {getSortIcon('protocol')} ms-1 sort-icon"></i>
                            </div>
                          </th>
                          <th class="sortable" on:click={() => sortBy('user_group')}>
                            <div class="d-flex align-items-center">
                              <i class="bi bi-people me-2"></i> GROUP
                              <i class="bi {getSortIcon('user_group')} ms-1 sort-icon"></i>
                            </div>
                          </th>
                          <th class="text-center">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each filteredPhones as phone, i}
                          <tr class="phone-row {i % 2 === 0 ? 'even-row' : 'odd-row'}">
                            <td>
                              <div class="fw-bold">{phone.extension || '-'}</div>
                            </td>
                            <td>{phone.pass || '-'}</td>
                            <td>
                              {#if phone.server_ip}
                                <span class="d-inline-block text-truncate" style="max-width: 150px;">
                                  {phone.server_ip}
                                </span>
                              {:else}
                                -
                              {/if}
                            </td>
                            <td>{phone.dialplan_number || '-'}</td>
                            <td>
                              {#if phone.active || phone.status}
                                <div class="status-indicator">
                                  <span class="status-dot" style="background-color: {getStatusColor(phone.status, phone.active)}"></span>
                                  <span class="badge {getStatusBadgeClass(phone.status, phone.active)}">
                                    {phone.active ? (phone.active === 'Y' ? 'Actif' : 'Inactif') : phone.status}
                                  </span>
                                </div>
                              {:else}
                                <span class="badge bg-light text-dark border">-</span>
                              {/if}
                            </td>
                            <td>
                              {#if phone.fullname}
                                <span class="d-inline-block text-truncate" style="max-width: 150px;">
                                  {phone.fullname}
                                </span>
                              {:else}
                                -
                              {/if}
                            </td>
                            <td>{phone.protocol || '-'}</td>
                            <td>
                              {#if phone.user_group}
                                <span class="group-badge">{phone.user_group}</span>
                              {:else}
                                -
                              {/if}
                            </td>
                            <td class="text-center">
                              <button 
                                class="btn btn-primary btn-sm action-button" 
                                title="Voir détails" 
                                on:click={() => afficherDetail(phone.extension)}
                                data-bs-toggle="tooltip">
                                <i class="bi bi-eye"></i>
                              </button>
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
        </div>
      </div>
      
      <!-- Floating Action Button -->
      {#if showFab}
      <div class="fab-container fade-in">
        <button class="btn btn-primary fab-button shadow-lg" on:click={refreshData} title="Actualiser la liste">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
      {/if}
      
      <style>
        /* Base Styles */
        .main-container {
          min-height: 100vh;
          padding-bottom: 2rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        /* Page Header */
        .page-header {
          position: relative;
          padding: 2rem 0;
          border-radius: 0.5rem;
          overflow: hidden;
          background: linear-gradient(90deg, #0d6efd, #0dcaf0);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }
        
        .header-content {
          position: relative;
          z-index: 2;
          padding: 0 2rem;
          color: white;
        }
        
        .header-decoration {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 30%;
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='white' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
          opacity: 0.5;
          z-index: 1;
        }
        
        /* Glass Morphism Effects */
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
        }
        
        .glass-breadcrumb {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .glass-input {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          padding: 0.2rem 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(31, 38, 135, 0.1);
        }
        
        /* Card Styles */
        .card {
          border-radius: 1rem;
          overflow: hidden;
          transition: all 0.3s ease;
          border: none;
        }
        
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
        }
        
        .card-header {
          border-bottom: none;
          background-color: rgba(13, 110, 253, 0.05);
        }
        
        /* Stats Cards */
        .stat-card {
          transition: all 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        
        .stat-title {
          font-size: 0.875rem;
          color: #6c757d;
          margin-bottom: 0.25rem;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0;
        }
        
        /* Table Styles */
        .modern-table {
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
        }
        
        .modern-table thead {
          background-color: #f8f9fa;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .modern-table th {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 1rem 0.75rem;
          border-bottom: 2px solid #e9ecef;
          white-space: nowrap;
        }
        
        .modern-table td {
          padding: 0.75rem;
          vertical-align: middle;
          border-bottom: 1px solid #e9ecef;
        }
        
        .even-row {
          background-color: rgba(0, 0, 0, 0.01);
        }
        
        .odd-row {
          background-color: rgba(255, 255, 255, 1);
        }
        
        .phone-row {
          transition: all 0.2s ease;
        }
        
        .phone-row:hover {
          transform: scale(1.01);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          z-index: 5;
          position: relative;
        }
        
        /* Status Indicators */
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 5px currentColor;
          animation: pulse 2s infinite;
        }
        
        .badge {
          font-weight: 500;
          padding: 0.4em 0.8em;
          border-radius: 50px;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .group-badge {
          background-color: rgba(13, 110, 253, 0.1);
          color: #0d6efd;
          padding: 0.3em 0.8em;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        /* Search and Filters */
        .search-container {
          max-width: 500px;
        }
        
        .result-count {
          background-color: rgba(13, 110, 253, 0.1);
          color: #0d6efd;
          padding: 0.5em 1em;
          border-radius: 50px;
          font-weight: 500;
        }
        
        /* Empty States */
        .empty-state {
          padding: 3rem 1rem;
        }
        
        .empty-icon-container {
          width: 120px;
          height: 120px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(13, 110, 253, 0.1);
          border-radius: 50%;
          color: #0d6efd;
        }
        
        /* Loading Animation */
        .loading-animation {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
        
        .spinner-grow {
          width: 1rem;
          height: 1rem;
        }
        
        /* Sortable Columns */
        .sortable {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease;
        }
        
        .sortable:hover {
          background-color: rgba(13, 110, 253, 0.05);
        }
        
        .sort-icon {
          opacity: 0.5;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        
        .sortable:hover .sort-icon {
          opacity: 1;
        }
        
        /* Action Buttons */
        .action-button {
          border-radius: 50%;
          width: 32px;
          height: 32px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        /* Enhanced Card Styling */
        .glass-card, .card {
          position: relative;
          overflow: hidden;
          border: none;
        }
        
        .glass-card::before, .card::before {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
          filter: blur(20px);
          z-index: -1;
        }
        
        /* Floating Action Button */
        .fab-container {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 1000;
        }
        
        .fab-button {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }
        
        .fab-button:hover {
          transform: scale(1.1) rotate(10deg);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
        }
        
        /* Animations */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Stats Card Animations */
        .animate-card {
          animation: cardPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transform: scale(0.95);
          opacity: 0.5;
        }
        
        @keyframes cardPop {
          from { transform: scale(0.95); opacity: 0.5; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-icon {
          animation: iconPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transform: scale(0) rotate(-30deg);
          opacity: 0;
        }
        
        @keyframes iconPop {
          from { transform: scale(0) rotate(-30deg); opacity: 0; }
          to { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        .animate-value {
          animation: countUp 1s forwards;
          opacity: 0;
          transform: translateY(10px);
        }
        
        @keyframes countUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .pulse-button {
          animation: pulseButton 2s infinite;
        }
        
        @keyframes pulseButton {
          0% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(13, 110, 253, 0); }
          100% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0); }
        }
        
        /* Responsive adjustments */
        @media (max-width: 767.98px) {
          .table th, .table td {
            padding: 0.5rem 0.25rem;
            font-size: 0.75rem;
          }
          
          .badge {
            font-size: 0.7rem;
            padding: 0.25em 0.5em;
          }
          
          .stat-icon {
            width: 40px;
            height: 40px;
            font-size: 1.25rem;
          }
          
          .stat-value {
            font-size: 1.25rem;
          }
          
          .fab-button {
            width: 48px;
            height: 48px;
            font-size: 1.25rem;
          }
        }
      </style>
      