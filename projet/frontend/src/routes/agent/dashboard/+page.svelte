<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  // Types pour les données
  interface Stat {
    callsToday: number;
    callsWeek: number;
    successfulCalls: number;
    averageDuration: string;
    conversionRate: string;
  }

  interface Call {
    id: number;
    contact: string;
    time: string;
    duration: string;
    status: string;
    notes: string;
  }

  interface Task {
    id: number;
    title: string;
    time: string;
    priority: string;
  }

  // Données pour le tableau de bord
  let stats: Stat = {
    callsToday: 0,
    callsWeek: 0,
    successfulCalls: 0,
    averageDuration: '0:00',
    conversionRate: '0%'
  };

  let recentCalls: Call[] = [];
  let upcomingTasks: Task[] = [];
  let isLoading = true;

  // Simuler le chargement des données
  onMount(async () => {
    try {
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Dans une vraie application, ces données viendraient d'une API
      stats = {
        callsToday: 12,
        callsWeek: 78,
        successfulCalls: 42,
        averageDuration: '3:24',
        conversionRate: '53.8%'
      };

      recentCalls = [
        { id: 1, contact: 'Jean Dupont', time: '10:23', duration: '4:12', status: 'success', notes: 'Client intéressé par l\'offre premium' },
        { id: 2, contact: 'Marie Martin', time: '11:05', duration: '2:47', status: 'pending', notes: 'Rappeler demain pour confirmation' },
        { id: 3, contact: 'Pierre Durand', time: '13:30', duration: '5:18', status: 'success', notes: 'A souscrit à l\'offre standard' },
        { id: 4, contact: 'Sophie Petit', time: '14:45', duration: '1:03', status: 'failed', notes: 'Pas intéressée, à retirer de la liste' },
        { id: 5, contact: 'Thomas Bernard', time: '15:20', duration: '3:51', status: 'pending', notes: 'Demande d\'informations supplémentaires' }
      ];

      upcomingTasks = [
        { id: 1, title: 'Rappeler Marie Martin', time: '10:00', priority: 'high' },
        { id: 2, title: 'Envoyer documentation à Thomas Bernard', time: '11:30', priority: 'medium' },
        { id: 3, title: 'Réunion d\'équipe', time: '14:00', priority: 'high' },
        { id: 4, title: 'Contacter nouveaux prospects', time: '15:30', priority: 'medium' }
      ];

      isLoading = false;
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      isLoading = false;
    }
  });

  // Fonction pour obtenir la classe CSS selon le statut de l'appel
  function getStatusClass(status: string): string {
    switch(status) {
      case 'success': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  }

  // Fonction pour obtenir la classe CSS selon la priorité de la tâche
  function getPriorityClass(priority: string): string {
    switch(priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  }
</script>

<div class="dashboard-container">
  <div class="page-header">
    <h1>Tableau de bord</h1>
    <p class="subtitle">Bienvenue sur votre espace de travail</p>
  </div>

  {#if isLoading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Chargement des données...</p>
    </div>
  {:else}
    <!-- Statistiques -->
    <div class="stats-container">
      <div class="row">
        <div class="col-md-4 col-sm-6 mb-4">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="bi bi-telephone"></i>
            </div>
            <div class="stat-content">
              <h3>{stats.callsToday}</h3>
              <p>Appels aujourd'hui</p>
            </div>
          </div>
        </div>
        <div class="col-md-4 col-sm-6 mb-4">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="bi bi-calendar-week"></i>
            </div>
            <div class="stat-content">
              <h3>{stats.callsWeek}</h3>
              <p>Appels cette semaine</p>
            </div>
          </div>
        </div>
        <div class="col-md-4 col-sm-6 mb-4">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="bi bi-check-circle"></i>
            </div>
            <div class="stat-content">
              <h3>{stats.successfulCalls}</h3>
              <p>Appels réussis</p>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-sm-6 mb-4">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="bi bi-clock"></i>
            </div>
            <div class="stat-content">
              <h3>{stats.averageDuration}</h3>
              <p>Durée moyenne</p>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-sm-6 mb-4">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="bi bi-graph-up"></i>
            </div>
            <div class="stat-content">
              <h3>{stats.conversionRate}</h3>
              <p>Taux de conversion</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-4">
      <!-- Appels récents -->
      <div class="col-lg-7 mb-4">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h2>Appels récents</h2>
            <a href="/agent/calls/history" class="btn btn-sm btn-outline-primary">Voir tout</a>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Heure</th>
                    <th>Durée</th>
                    <th>Statut</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {#each recentCalls as call}
                    <tr>
                      <td><strong>{call.contact}</strong></td>
                      <td>{call.time}</td>
                      <td>{call.duration}</td>
                      <td>
                        <span class="badge bg-{getStatusClass(call.status)}">
                          {call.status === 'success' ? 'Réussi' : call.status === 'pending' ? 'En attente' : 'Échoué'}
                        </span>
                      </td>
                      <td class="text-truncate" style="max-width: 200px;">{call.notes}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Tâches à venir -->
      <div class="col-lg-5 mb-4">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h2>Tâches à venir</h2>
            <button class="btn btn-sm btn-outline-primary">+ Ajouter</button>
          </div>
          <div class="card-body p-0">
            <ul class="list-group list-group-flush">
              {#each upcomingTasks as task}
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <span class="badge bg-{getPriorityClass(task.priority)} me-2">
                      {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </span>
                    <span>{task.title}</span>
                  </div>
                  <span class="text-muted">{task.time}</span>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="quick-actions mt-2 mb-4">
      <div class="row">
        <div class="col-md-3 col-sm-6 mb-3">
          <a href="/agent/calls/new" class="quick-action-card">
            <i class="bi bi-telephone-plus"></i>
            <span>Nouvel appel</span>
          </a>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <a href="/agent/contacts/add" class="quick-action-card">
            <i class="bi bi-person-plus"></i>
            <span>Ajouter contact</span>
          </a>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <a href="/agent/scripts" class="quick-action-card">
            <i class="bi bi-file-text"></i>
            <span>Scripts d'appel</span>
          </a>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <a href="/agent/stats" class="quick-action-card">
            <i class="bi bi-bar-chart"></i>
            <span>Mes statistiques</span>
          </a>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard-container {
    padding: 1.5rem;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 1.75rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #6b7280;
    font-size: 1rem;
    margin-bottom: 0;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Cartes de statistiques */
  .stat-card {
    background-color: white;
    border-radius: 8px;
    padding: 1.25rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    transition: transform 0.2s, box-shadow 0.2s;
    height: 100%;
  }

  .stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background-color: #ebf5ff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    flex-shrink: 0;
  }

  .stat-icon i {
    font-size: 1.5rem;
    color: #3b82f6;
  }

  .stat-content h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .stat-content p {
    color: #6b7280;
    margin-bottom: 0;
    font-size: 0.875rem;
  }

  /* Cartes */
  .card {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: none;
    height: 100%;
  }

  .card-header {
    background-color: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 1rem 1.25rem;
  }

  .card-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0;
  }

  /* Tableau */
  .table {
    margin-bottom: 0;
  }

  .table th {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #6b7280;
    font-weight: 600;
    letter-spacing: 0.05em;
    padding: 0.75rem 1.25rem;
  }

  .table td {
    padding: 0.75rem 1.25rem;
    vertical-align: middle;
  }

  /* Liste de tâches */
  .list-group-item {
    padding: 0.75rem 1.25rem;
    border-left: none;
    border-right: none;
  }

  /* Actions rapides */
  .quick-action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
    text-decoration: none;
    color: #1f2937;
    height: 100%;
  }

  .quick-action-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    color: #3b82f6;
  }

  .quick-action-card i {
    font-size: 2rem;
    margin-bottom: 0.75rem;
    color: #3b82f6;
  }

  .quick-action-card span {
    font-weight: 500;
  }

  /* Badges */
  .badge {
    font-weight: 500;
    padding: 0.35em 0.65em;
    font-size: 0.75em;
  }

  .bg-success {
    background-color: #10b981 !important;
  }

  .bg-warning {
    background-color: #f59e0b !important;
  }

  .bg-danger {
    background-color: #ef4444 !important;
  }

  .bg-info {
    background-color: #3b82f6 !important;
  }

  .bg-secondary {
    background-color: #6b7280 !important;
  }

  /* Responsive */
  @media (max-width: 767.98px) {
    .dashboard-container {
      padding: 1rem;
    }

    .stat-card {
      margin-bottom: 1rem;
    }
  }
</style>
