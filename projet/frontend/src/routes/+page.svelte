
<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import type { Chart as ChartType } from 'chart.js/auto';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  // API URL from environment variable with fallback
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  // Define types for our data
  type Campaign = {
    campaign_id: string;
    campaign_name: string;
    active: string;
    dial_status_a: string;
    hopper_level: number;
    calls_today: number;
    success_rate: number;
    progress: number;
  };

  // Define types for our data
  type ActivityItem = {
    id: string;
    type: 'call' | 'campaign' | 'system';
    description: string;
    target: string;
    timestamp: Date;
    status: 'success' | 'warning' | 'error' | 'info';
    user?: string;
  };

  // Initialize state variables
  let stats = {
    totalCalls: 0,
    activeCampaigns: 0,
    completedCalls: 0,
    successRate: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalUsers: 0,
    loggedInToday: 0,
    currentlyLoggedIn: 0
  };

  let campaigns: Campaign[] = [];
  let isLoading = true;
  let error = '';

  // Chart data
  let performanceChart: ChartType;
  let performanceData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Appels',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Succès',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#198754',
        backgroundColor: 'rgba(25, 135, 84, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  // Activities data from admin log
  
  let activities: ActivityItem[] = [];
  let recentlyActiveUsers: any[] = [];
  let activitiesLoading = false;
  let activitiesError = '';

  // Function to fetch recent activities from admin log
  async function fetchActivities() {
    try {
      activitiesLoading = true;
      activitiesError = '';
      
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/logs/recent-activities?limit=5`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Convert string timestamps to Date objects
        activities = data.data.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }));
      } else {
        throw new Error('Format de réponse invalide');
      }
      
    } catch (err) {
      console.error('Error fetching activities:', err);
      activitiesError = err instanceof Error ? err.message : 'Une erreur est survenue';
      // Fallback to empty activities array
      activities = [];
    } finally {
      activitiesLoading = false;
    }
  }
  
  // Pagination state
  let currentPage = 1;
  let itemsPerPage = 5;
  let totalItems = 0;
  let totalPages = 0;
  let searchQuery = '';
  
  // Function to fetch campaign data with pagination
  async function fetchCampaigns(page = 1, limit = 5, search = '') {
    try {
      isLoading = true;
      error = '';
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search) {
        queryParams.append('search', search);
      }
      
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/compagnies/recuperer?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la récupération des campagnes');
      }
      
      // Update pagination state
      currentPage = result.pagination.page;
      itemsPerPage = result.pagination.limit;
      totalItems = result.pagination.totalItems;
      totalPages = result.pagination.totalPages;
      
      // Process campaign data
      campaigns = result.data.map(campaign => ({
        campaign_id: campaign.campaign_id,
        campaign_name: campaign.campaign_name,
        active: campaign.active,
        dial_status_a: campaign.dial_status_a,
        hopper_level: parseInt(campaign.hopper_level) || 0,
        // Generate some random stats for now (would be replaced with real data)
        calls_today: Math.floor(Math.random() * 200),
        success_rate: Math.floor(Math.random() * 100),
        progress: campaign.active === 'Y' ? Math.floor(Math.random() * 100) : 0
      }));
      
      // Calculate dashboard stats
      updateDashboardStats();
      
      // Update chart data
      updateChartData();
      
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      error = err instanceof Error ? err.message : 'Une erreur est survenue';
    } finally {
      isLoading = false;
    }
  }
  
  // Function to handle page changes
  function changePage(newPage: number) {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) {
      return;
    }
    fetchCampaigns(newPage, itemsPerPage, searchQuery);
  }
  
  // Function to handle search
  function handleSearch() {
    fetchCampaigns(1, itemsPerPage, searchQuery);
  }
  
  // Update dashboard statistics based on campaign data
  function updateDashboardStats() {
    const activeCampaignsCount = campaigns.filter(c => c.active === 'Y').length;
    const totalCallsCount = campaigns.reduce((sum, c) => sum + c.calls_today, 0);
    const successfulCalls = campaigns.reduce((sum, c) => sum + Math.floor(c.calls_today * (c.success_rate / 100)), 0);
    
    // Preserve existing values for user-related stats
    const { activeUsers, inactiveUsers, totalUsers, loggedInToday, currentlyLoggedIn } = stats;
    
    stats = {
      totalCalls: totalCallsCount,
      activeCampaigns: activeCampaignsCount,
      completedCalls: successfulCalls,
      successRate: totalCallsCount > 0 ? Math.round((successfulCalls / totalCallsCount) * 100) : 0,
      activeUsers,
      inactiveUsers,
      totalUsers,
      loggedInToday,
      currentlyLoggedIn
    };
  }
  
  // Update chart data based on campaign performance
  function updateChartData() {
    // Generate some realistic data for the week
    const weekdays = 7;
    const callsData: number[] = [];
    const successData: number[] = [];
    
    for (let i = 0; i < weekdays; i++) {
      const dailyCalls = Math.floor(Math.random() * 100) + 20;
      callsData.push(dailyCalls);
      successData.push(Math.floor(dailyCalls * (Math.random() * 0.3 + 0.5))); // 50-80% success rate
    }
    
    performanceData = {
      ...performanceData,
      datasets: [
        {
          ...performanceData.datasets[0],
          data: callsData
        },
        {
          ...performanceData.datasets[1],
          data: successData
        }
      ]
    };
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'Y': return 'bg-primary';
      case 'N': return 'bg-secondary';
      default: return 'bg-light text-dark';
    }
  }
  
  function getStatusLabel(status: string) {
    switch (status) {
      case 'Y': return 'Active';
      case 'N': return 'Inactive';
      default: return status;
    }
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'call': return 'bi-telephone';
      case 'campaign': return 'bi-megaphone';
      case 'system': return 'bi-gear';
      default: return 'bi-info-circle';
    }
  }

  function getActivityStatusClass(status: string) {
    switch (status) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-danger';
      case 'info': return 'text-info';
      default: return 'text-secondary';
    }
  }

  function formatDate(date: Date) {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `il y a ${diffMinutes} min`;
    } else if (diffMinutes < 24 * 60) {
      const hours = Math.floor(diffMinutes / 60);
      return `il y a ${hours} h`;
    } else {
      const days = Math.floor(diffMinutes / (24 * 60));
      return `il y a ${days} j`;
    }
  }

  // Function to fetch active users count
  async function fetchActiveUsers() {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/user/active-users-count`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        stats = {
          ...stats,
          activeUsers: result.data.activeUsersCount,
          inactiveUsers: result.data.inactiveUsersCount,
          totalUsers: result.data.totalUsersCount,
          loggedInToday: result.data.loggedInTodayCount,
          currentlyLoggedIn: result.data.currentlyLoggedIn
        };

        // Store recently active users for potential display
        recentlyActiveUsers = result.data.recentlyActiveUsers || [];
      }
    } catch (err) {
      console.error('Error fetching active users count:', err);
    }
  }

  onMount(async () => {
    // Fetch campaign data, activities, and active users count in parallel
    await Promise.all([
      fetchCampaigns(),
      fetchActivities(),
      fetchActiveUsers()
    ]);
    
    // Initialize chart
    const ctx = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (ctx) {
      performanceChart = new Chart(ctx, {
        type: 'line',
        data: performanceData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                // Using any to bypass Chart.js type limitation
                drawBorder: false as any,
              }
            },
            x: {
              grid: {
                display: false,
              }
            }
          }
        }
      });
    }
  });
  import { goto } from '$app/navigation';

  async function handleLogout() {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        goto('/login');
      } else {
        alert('Erreur lors de la déconnexion.');
      }
    } catch (e) {
      alert('Erreur lors de la déconnexion.');
    }
  }
</script>

<!-- Bootstrap Dashboard -->
<div class="container-fluid">
  <!-- Header -->
  <div class="row bg-primary text-white py-3 mb-4">
    <div class="col-md-6">
      <h1 class="h3 mb-0">McDial Dashboard</h1>
      <p class="mb-0">Gestion des campagnes d'appels</p>
    </div>
    <div class="col-md-6 text-md-end">
      <div class="d-inline-block me-3">
        <span class="text-white-50">Aujourd'hui:</span>
        <span>{new Date().toLocaleDateString('fr-FR')}</span>
      </div>
      <div class="d-inline-block dropdown">
        <button class="btn btn-sm btn-outline-light dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-circle me-1"></i>
          Admin
        </button>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
          <li><a class="dropdown-item" href="#"><i class="bi bi-gear me-2"></i>Paramètres</a></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-person me-2"></i>Profil</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><button class="dropdown-item" type="button" on:click|preventDefault={handleLogout}><i class="bi bi-box-arrow-right me-2"></i>Déconnexion</button></li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="row mb-4">
    <div class="col-md-3 col-lg-2 mb-3 mb-md-0">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="text-muted mb-1">Total Appels</h6>
              <h3 class="mb-0">{stats.totalCalls}</h3>
            </div>
            <div class="bg-primary bg-opacity-10 p-3 rounded">
              <i class="bi bi-telephone text-primary fs-4"></i>
            </div>
          </div>
          <div class="progress mt-3" style="height: 5px;">
            <div class="progress-bar bg-primary" role="progressbar" style="width: 75%;" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-lg-2 mb-3 mb-md-0">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="text-muted mb-1">Campagnes Actives</h6>
              <h3 class="mb-0">{stats.activeCampaigns}</h3>
            </div>
            <div class="bg-success bg-opacity-10 p-3 rounded">
              <i class="bi bi-megaphone text-success fs-4"></i>
            </div>
          </div>
          <div class="progress mt-3" style="height: 5px;">
            <div class="progress-bar bg-success" role="progressbar" style="width: 60%;" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-lg-2 mb-3 mb-md-0">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="text-muted mb-1">Appels Complétés</h6>
              <h3 class="mb-0">{stats.completedCalls}</h3>
            </div>
            <div class="bg-info bg-opacity-10 p-3 rounded">
              <i class="bi bi-check2-circle text-info fs-4"></i>
            </div>
          </div>
          <div class="progress mt-3" style="height: 5px;">
            <div class="progress-bar bg-info" role="progressbar" style="width: 80%;" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-lg-2 mb-3 mb-md-0">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="text-muted mb-1">Taux de Succès</h6>
              <h3 class="mb-0">{stats.successRate}%</h3>
            </div>
            <div class="bg-warning bg-opacity-10 p-3 rounded">
              <i class="bi bi-graph-up text-warning fs-4"></i>
            </div>
          </div>
          <div class="progress mt-3" style="height: 5px;">
            <div class="progress-bar bg-warning" role="progressbar" style="width: {stats.successRate}%;" aria-valuenow="{stats.successRate}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-lg-2 mb-3 mb-md-0">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="text-muted mb-1">Utilisateurs Actifs</h6>
              <h3 class="mb-0">{stats.activeUsers}</h3>
              <small class="text-muted">{Math.round((stats.activeUsers / stats.totalUsers) * 100) || 0}% du total</small>
            </div>
            <div class="bg-success bg-opacity-10 p-3 rounded">
              <i class="bi bi-person-check-fill text-success fs-4"></i>
            </div>
          </div>
          <div class="progress mt-3" style="height: 5px;">
            <div class="progress-bar bg-success" role="progressbar" 
              style="width: {stats.totalUsers ? (stats.activeUsers / stats.totalUsers) * 100 : 0}%;" 
              aria-valuenow="{stats.totalUsers ? (stats.activeUsers / stats.totalUsers) * 100 : 0}" 
              aria-valuemin="0" 
              aria-valuemax="100"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-lg-2 mb-3 mb-md-0">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="text-muted mb-1">Utilisateurs Inactifs</h6>
              <h3 class="mb-0">{stats.inactiveUsers}</h3>
              <small class="text-muted">{Math.round((stats.inactiveUsers / stats.totalUsers) * 100) || 0}% du total</small>
            </div>
            <div class="bg-danger bg-opacity-10 p-3 rounded">
              <i class="bi bi-person-x text-danger fs-4"></i>
            </div>
          </div>
          <div class="progress mt-3" style="height: 5px;">
            <div class="progress-bar bg-danger" role="progressbar" 
              style="width: {stats.totalUsers ? (stats.inactiveUsers / stats.totalUsers) * 100 : 0}%;" 
              aria-valuenow="{stats.totalUsers ? (stats.inactiveUsers / stats.totalUsers) * 100 : 0}" 
              aria-valuemin="0" 
              aria-valuemax="100"></div>
          </div>
        </div>
      </div>
    </div>
  
  </div>

  <!-- Charts and Activity -->
  <div class="row mb-4">
    <div class="col-lg-8 mb-4 mb-lg-0">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-header bg-white border-0">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Performance d'Appels</h5>
            <div class="btn-group">
              <button type="button" class="btn btn-sm btn-outline-secondary">Jour</button>
              <button type="button" class="btn btn-sm btn-primary">Semaine</button>
              <button type="button" class="btn btn-sm btn-outline-secondary">Mois</button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div style="height: 300px;">
            <canvas id="performanceChart"></canvas>
          </div>
        </div>
      </div>
    </div>
    <div class="col-lg-4">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Activités Récentes</h5>
          <button class="btn btn-sm btn-outline-primary">Voir tout</button>
        </div>
        <div class="card-body p-0">
          {#if activitiesLoading}
            <div class="d-flex justify-content-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Chargement...</span>
              </div>
            </div>
          {:else if activitiesError}
            <div class="alert alert-danger m-3" role="alert">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {activitiesError}
            </div>
          {:else if activities.length === 0}
            <div class="text-center py-4 text-muted">
              <i class="bi bi-inbox-fill fs-3 mb-2"></i>
              <p>Aucune activité récente</p>
            </div>
          {:else}
            <div class="list-group list-group-flush">
              {#each activities as activity}
                <div class="list-group-item border-0 py-3">
                  <div class="d-flex">
                    <div class="me-3">
                      <div class="avatar bg-light p-2 rounded-circle">
                        <i class="bi {getActivityIcon(activity.type)} {getActivityStatusClass(activity.status)}"></i>
                      </div>
                    </div>
                    <div class="flex-grow-1">
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <h6 class="mb-0">{activity.target}</h6>
                        <small class="text-muted">{formatDate(activity.timestamp)}</small>
                      </div>
                      <p class="mb-0 text-muted small">{activity.description}</p>
                      {#if activity.user}
                        <small class="text-primary">Par: {activity.user}</small>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

 

  <!-- All Campaigns Table -->
  <div class="row mb-4">
    <div class="col-12">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Toutes les Campagnes</h5>
          <div class="d-flex">
            <div class="input-group input-group-sm me-2" style="width: 200px;">
              <input 
                type="text" 
                class="form-control" 
                placeholder="Rechercher..." 
                bind:value={searchQuery}
                on:keyup={(e) => e.key === 'Enter' && handleSearch()}
              >
              <button class="btn btn-outline-secondary" type="button" on:click={handleSearch}>
                <i class="bi bi-search"></i>
              </button>
            </div>
            <select 
              class="form-select form-select-sm" 
              style="width: 80px;" 
              bind:value={itemsPerPage} 
              on:change={() => fetchCampaigns(1, itemsPerPage, searchQuery)}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Nom</th>
                  <th>Statut</th>
                  <th>Progression</th>
                  <th>Appels</th>
                  <th>Taux de Succès</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each campaigns as campaign}
                  <tr>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="bg-light p-2 rounded me-2">
                          <i class="bi bi-folder text-primary"></i>
                        </div>
                        <div>
                          <div>{campaign.campaign_name}</div>
                          <small class="text-muted">ID: {campaign.campaign_id}</small>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge {getStatusBadgeClass(campaign.active)}">{getStatusLabel(campaign.active)}</span></td>
                    <td>
                      <div class="progress" style="height: 6px; width: 100px;">
                        <div class="progress-bar bg-primary" role="progressbar" style="width: {campaign.progress}%;" aria-valuenow="{campaign.progress}" aria-valuemin="0" aria-valuemax="100"></div>
                      </div>
                      <small class="text-muted">{campaign.progress}%</small>
                    </td>
                    <td>{campaign.calls_today}</td>
                    <td>{campaign.success_rate}%</td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-secondary me-1">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer bg-white d-flex justify-content-between align-items-center">
          <div>
            <small class="text-muted">
              {#if totalItems > 0}
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} campagnes
              {:else}
                Aucune campagne trouvée
              {/if}
            </small>
          </div>
          <nav aria-label="Page navigation">
            <ul class="pagination pagination-sm mb-0">
              <!-- Previous button -->
              <li class="page-item {currentPage === 1 ? 'disabled' : ''}">
                <button 
                  class="page-link" 
                  on:click={() => changePage(currentPage - 1)} 
                  disabled={currentPage === 1}
                  aria-label="Previous"
                >
                  <span aria-hidden="true">&laquo;</span>
                </button>
              </li>
              
              <!-- Page numbers -->
              {#each Array(totalPages) as _, i}
                <li class="page-item {currentPage === i + 1 ? 'active' : ''}">
                  <button 
                    class="page-link" 
                    on:click={() => changePage(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              {/each}
              
              <!-- Next button -->
              <li class="page-item {currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
                <button 
                  class="page-link" 
                  on:click={() => changePage(currentPage + 1)} 
                  disabled={currentPage === totalPages || totalPages === 0}
                  aria-label="Next"
                >
                  <span aria-hidden="true">&raquo;</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>

</div>
