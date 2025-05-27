<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import type { Chart as ChartType } from 'chart.js/auto';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
  import { goto } from '$app/navigation';

  let stats = {
    totalCalls: 0,
    activeCampaigns: 0,
    completedCalls: 0,
    successRate: 0
  };

  let activities = [];
  let campaigns = [];
async function loadRealtimeStats() {
  try {
    const res = await fetchWithAuth('http://localhost:8000/api/admin/compagnies/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error('Erreur API');

    const data = await res.json();
    console.log("data ",data);
    

    stats.totalCalls = data.totalCalls;
   
    stats.completedCalls = data.completedCalls;
    stats.successRate = data.successRate;
    activities = data.activities || [];

    // 🟢 Filtrage des campagnes actives seulement
    campaigns = (data || []).filter((c: { status: string; }) => c.status === 'Y');
     stats.activeCampaigns = campaigns.length
console.log(campaigns)
  } catch (error) {
    console.error('Erreur chargement stats backend :', error);
  }
}


  let performanceChart: ChartType;

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'active': return 'bg-primary';
      case 'paused': return 'bg-warning text-dark';
      case 'completed': return 'bg-success';
      case 'scheduled': return 'bg-secondary';
      default: return 'bg-light text-dark';
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

  function formatDate(dateString: string) {
    const date = new Date(dateString);
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

  onMount(() => {
    loadRealtimeStats();
    const interval = setInterval(loadRealtimeStats, 10000);

    const ctx = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (ctx) {
      performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          datasets: [
            {
              label: 'Appels',
              data: [65, 78, 52, 91, 43, 23, 36],
              borderColor: '#0d6efd',
              backgroundColor: 'rgba(13, 110, 253, 0.1)',
              tension: 0.3,
              fill: true
            },
            {
              label: 'Succès',
              data: [42, 55, 40, 70, 32, 18, 29],
              borderColor: '#198754',
              backgroundColor: 'rgba(25, 135, 84, 0.1)',
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            y: { beginAtZero: true, grid: { display: true } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    return () => clearInterval(interval);
  });

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


  <!-- Stats Cards -->
  <div class="row mb-4">
    <div class="col-md-3 mb-3 mb-md-0">
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
    <div class="col-md-3 mb-3 mb-md-0">
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
    <div class="col-md-3 mb-3 mb-md-0">
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
    <div class="col-md-3">
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
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Campaigns Section -->
  <div class="row mb-4">
    <div class="col-12 mb-3">
      <div class="d-flex justify-content-between align-items-center">
        <h4>Campagnes Actives</h4>
        <div class="d-flex gap-2">
          <div class="input-group">
            <input type="text" class="form-control form-control-sm" placeholder="Rechercher...">
            <button class="btn btn-outline-secondary btn-sm" type="button">
              <i class="bi bi-search"></i>
            </button>
          </div>
          <button class="btn btn-primary btn-sm">
            <i class="bi bi-plus-lg me-1"></i>Nouvelle Campagne
          </button>
        </div>
      </div>
    </div>
    
    {#each campaigns.filter(c => c.status === 'active') as campaign}
      <div class="col-md-6 col-lg-4 mb-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
            <h5 class="mb-0">{campaign.name}</h5>
            <span class="badge {getStatusBadgeClass(campaign.status)}">{campaign.status}</span>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span>Progression</span>
                <span>{campaign.progress}%</span>
              </div>
              <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: {campaign.progress}%;" aria-valuenow="{campaign.progress}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>
            <div class="row">
              <div class="col-6">
                <div class="border rounded p-2 text-center">
                  <div class="text-muted small">Appels</div>
                  <div class="fw-bold">{campaign.callsToday}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="border rounded p-2 text-center">
                  <div class="text-muted small">Taux de Succès</div>
                  <div class="fw-bold">{campaign.successRate}%</div>
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer bg-white border-0">
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center">
                <div class="spinner-grow spinner-grow-sm text-success me-2" role="status">
                  <span class="visually-hidden">En cours...</span>
                </div>
                <small class="text-muted">En cours</small>
              </div>
              <button class="btn btn-sm btn-outline-primary">Gérer</button>
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- All Campaigns Table -->
  <div class="row mb-4">
    <div class="col-12">
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-0">
          <h5 class="mb-0">Toutes les Campagnes</h5>
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
                          <div>{campaign.name}</div>
                          <small class="text-muted">ID: {campaign.id}</small>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge {getStatusBadgeClass(campaign.status)}">{campaign.status}</span></td>
                    <td>
                      <div class="progress" style="height: 6px; width: 100px;">
                        <div class="progress-bar bg-primary" role="progressbar" style="width: {campaign.progress}%;" aria-valuenow="{campaign.progress}" aria-valuemin="0" aria-valuemax="100"></div>
                      </div>
                      <small class="text-muted">{campaign.progress}%</small>
                    </td>
                    <td>{campaign.callsToday}</td>
                    <td>{campaign.successRate}%</td>
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
            <small class="text-muted">Affichage de {campaigns.length} campagnes</small>
          </div>
          <nav aria-label="Page navigation">
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item disabled">
                <a class="page-link" href="#" aria-label="Previous">
                  <span aria-hidden="true">&laquo;</span>
                </a>
              </li>
              <li class="page-item active"><a class="page-link" href="#">1</a></li>
              <li class="page-item"><a class="page-link" href="#">2</a></li>
              <li class="page-item"><a class="page-link" href="#">3</a></li>
              <li class="page-item">
                <a class="page-link" href="#" aria-label="Next">
                  <span aria-hidden="true">&raquo;</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>

</div>