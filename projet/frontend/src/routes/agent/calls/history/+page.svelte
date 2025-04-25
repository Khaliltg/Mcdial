<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  // Types pour les données
  interface Campaign {
    id: number;
    name: string;
  }

  interface Call {
    id: number;
    contactName: string;
    contactPhone: string;
    date: string;
    time: string;
    duration: number;
    status: string;
    campaign: number;
    notes: string;
    followUpDate: string | null;
  }

  // Données pour la page
  let isLoading: boolean = true;
  let calls: Call[] = [];
  let filteredCalls: Call[] = [];
  let campaigns: Campaign[] = [];
  let selectedCampaign: string = '';
  let selectedStatus: string = '';
  let searchQuery: string = '';
  let startDate: string = '';
  let endDate: string = '';
  let sortField: string = 'date';
  let sortDirection: string = 'desc';
  let selectedCall: Call | null = null;

  // Charger les données initiales
  onMount(async () => {
    try {
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Dans une vraie application, ces données viendraient d'une API
      campaigns = [
        { id: 1, name: 'Campagne Printemps 2025' },
        { id: 2, name: 'Nouveaux clients potentiels' },
        { id: 3, name: 'Relance clients inactifs' }
      ];

      calls = [
        { 
          id: 1, 
          contactName: 'Jean Dupont', 
          contactPhone: '06 12 34 56 78', 
          date: '2025-04-18', 
          time: '10:23', 
          duration: 252, 
          status: 'success', 
          campaign: 1,
          notes: 'Client intéressé par l\'offre premium. A demandé plus d\'informations sur les tarifs. Rappeler la semaine prochaine pour finaliser.',
          followUpDate: '2025-04-25'
        },
        { 
          id: 2, 
          contactName: 'Marie Martin', 
          contactPhone: '06 23 45 67 89', 
          date: '2025-04-18', 
          time: '11:05', 
          duration: 167, 
          status: 'pending', 
          campaign: 1,
          notes: 'Occupée lors de l\'appel. A demandé à être rappelée demain matin.',
          followUpDate: '2025-04-19'
        },
        { 
          id: 3, 
          contactName: 'Pierre Durand', 
          contactPhone: '06 34 56 78 90', 
          date: '2025-04-17', 
          time: '13:30', 
          duration: 318, 
          status: 'success', 
          campaign: 2,
          notes: 'A souscrit à l\'offre standard. Documents envoyés par email.',
          followUpDate: '2025-05-17'
        },
        { 
          id: 4, 
          contactName: 'Sophie Petit', 
          contactPhone: '06 45 67 89 01', 
          date: '2025-04-17', 
          time: '14:45', 
          duration: 63, 
          status: 'failed', 
          campaign: 3,
          notes: 'Pas intéressée. A demandé à être retirée de la liste de contacts.',
          followUpDate: null
        },
        { 
          id: 5, 
          contactName: 'Thomas Bernard', 
          contactPhone: '06 56 78 90 12', 
          date: '2025-04-16', 
          time: '15:20', 
          duration: 231, 
          status: 'pending', 
          campaign: 2,
          notes: 'Intéressé mais souhaite plus d\'informations. Documentation envoyée par email.',
          followUpDate: '2025-04-23'
        },
        { 
          id: 6, 
          contactName: 'Julie Leroy', 
          contactPhone: '06 67 89 01 23', 
          date: '2025-04-16', 
          time: '09:15', 
          duration: 195, 
          status: 'success', 
          campaign: 3,
          notes: 'A accepté l\'offre de relance. Rendez-vous pris pour une démonstration en ligne.',
          followUpDate: '2025-04-20'
        },
        { 
          id: 7, 
          contactName: 'Nicolas Moreau', 
          contactPhone: '06 78 90 12 34', 
          date: '2025-04-15', 
          time: '16:40', 
          duration: 127, 
          status: 'failed', 
          campaign: 1,
          notes: 'Numéro incorrect. À vérifier dans la base de données.',
          followUpDate: null
        },
        { 
          id: 8, 
          contactName: 'Emma Dubois', 
          contactPhone: '06 89 01 23 45', 
          date: '2025-04-15', 
          time: '11:30', 
          duration: 284, 
          status: 'success', 
          campaign: 2,
          notes: 'Très intéressée par notre offre. A demandé un devis personnalisé.',
          followUpDate: '2025-04-22'
        },
        { 
          id: 9, 
          contactName: 'Lucas Roux', 
          contactPhone: '06 90 12 34 56', 
          date: '2025-04-14', 
          time: '14:15', 
          duration: 176, 
          status: 'pending', 
          campaign: 3,
          notes: 'En déplacement. Rappeler la semaine prochaine.',
          followUpDate: '2025-04-21'
        },
        { 
          id: 10, 
          contactName: 'Camille Fournier', 
          contactPhone: '06 01 23 45 67', 
          date: '2025-04-14', 
          time: '10:05', 
          duration: 205, 
          status: 'success', 
          campaign: 1,
          notes: 'A souscrit à l\'offre premium. Contrat envoyé par email.',
          followUpDate: '2025-05-14'
        }
      ];

      // Initialiser les filtres
      applyFilters();
      isLoading = false;
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      isLoading = false;
    }
  });

  // Appliquer les filtres
  function applyFilters(): void {
    filteredCalls = [...calls];
    
    // Filtre par campagne
    if (selectedCampaign) {
      const campaignId = parseInt(selectedCampaign);
      filteredCalls = filteredCalls.filter(call => call.campaign === campaignId);
    }
    
    // Filtre par statut
    if (selectedStatus) {
      filteredCalls = filteredCalls.filter(call => call.status === selectedStatus);
    }
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredCalls = filteredCalls.filter(call => 
        call.contactName.toLowerCase().includes(query) || 
        call.contactPhone.toLowerCase().includes(query) ||
        call.notes.toLowerCase().includes(query)
      );
    }
    
    // Filtre par date
    if (startDate) {
      filteredCalls = filteredCalls.filter(call => call.date >= startDate);
    }
    
    if (endDate) {
      filteredCalls = filteredCalls.filter(call => call.date <= endDate);
    }
    
    // Tri
    sortCalls();
  }

  // Trier les appels
  function sortCalls(): void {
    filteredCalls = filteredCalls.sort((a, b) => {
      let fieldA: any, fieldB: any;
      
      // Déterminer les valeurs à comparer
      if (sortField === 'date') {
        fieldA = new Date(a.date).getTime();
        fieldB = new Date(b.date).getTime();
      } else if (sortField === 'duration') {
        fieldA = a.duration;
        fieldB = b.duration;
      } else if (sortField === 'contactName') {
        fieldA = a.contactName;
        fieldB = b.contactName;
      } else if (sortField === 'status') {
        fieldA = a.status;
        fieldB = b.status;
      } else {
        fieldA = a.date;
        fieldB = b.date;
      }
      
      // Comparer les valeurs selon la direction de tri
      if (sortDirection === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      } else {
        return fieldA < fieldB ? 1 : -1;
      }
    });
  }

  // Changer le champ de tri
  function setSortField(field: string): void {
    if (sortField === field) {
      // Inverser la direction si on clique sur le même champ
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nouveau champ, réinitialiser la direction
      sortField = field;
      sortDirection = 'asc';
    }
    sortCalls();
  }

  // Formater la durée
  function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  // Sélectionner un appel pour voir les détails
  function selectCall(call: Call): void {
    selectedCall = call;
  }

  // Fermer les détails
  function closeDetails(): void {
    selectedCall = null;
  }

  // Obtenir la classe CSS selon le statut
  function getStatusClass(status: string): string {
    switch(status) {
      case 'success': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  }

  // Obtenir le libellé du statut
  function getStatusLabel(status: string): string {
    switch(status) {
      case 'success': return 'Réussi';
      case 'pending': return 'En attente';
      case 'failed': return 'Échoué';
      default: return 'Inconnu';
    }
  }
</script>

<div class="call-history-container">
  <div class="page-header">
    <h1>Historique des appels</h1>
    <p class="subtitle">Consultez et gérez vos appels précédents</p>
  </div>

  {#if isLoading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Chargement des données...</p>
    </div>
  {:else}
    <!-- Filtres -->
    <div class="card mb-4">
      <div class="card-header">
        <h2>Filtres</h2>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-3 mb-3">
            <label for="campaignSelect" class="form-label">Campagne</label>
            <select 
              id="campaignSelect" 
              class="form-select" 
              bind:value={selectedCampaign} 
              on:change={applyFilters}
            >
              <option value="">Toutes les campagnes</option>
              {#each campaigns as campaign}
                <option value={campaign.id}>{campaign.name}</option>
              {/each}
            </select>
          </div>
          
          <div class="col-md-3 mb-3">
            <label for="statusSelect" class="form-label">Statut</label>
            <select 
              id="statusSelect" 
              class="form-select" 
              bind:value={selectedStatus} 
              on:change={applyFilters}
            >
              <option value="">Tous les statuts</option>
              <option value="success">Réussi</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
            </select>
          </div>
          
          <div class="col-md-6 mb-3">
            <label for="searchInput" class="form-label">Rechercher</label>
            <div class="input-group">
              <input 
                type="text" 
                id="searchInput" 
                class="form-control" 
                placeholder="Nom, téléphone ou notes..." 
                bind:value={searchQuery}
              >
              <button class="btn btn-outline-primary" on:click={applyFilters}>
                <i class="bi bi-search"></i>
              </button>
            </div>
          </div>
          
          <div class="col-md-3 mb-3">
            <label for="startDate" class="form-label">Date de début</label>
            <input 
              type="date" 
              id="startDate" 
              class="form-control" 
              bind:value={startDate} 
              on:change={applyFilters}
            >
          </div>
          
          <div class="col-md-3 mb-3">
            <label for="endDate" class="form-label">Date de fin</label>
            <input 
              type="date" 
              id="endDate" 
              class="form-control" 
              bind:value={endDate} 
              on:change={applyFilters}
            >
          </div>
          
          <div class="col-md-6 d-flex align-items-end mb-3">
            <button class="btn btn-secondary me-2" on:click={() => {
              selectedCampaign = '';
              selectedStatus = '';
              searchQuery = '';
              startDate = '';
              endDate = '';
              applyFilters();
            }}>
              <i class="bi bi-x-circle me-1"></i> Réinitialiser les filtres
            </button>
            
            <span class="ms-auto text-muted">
              {filteredCalls.length} appel{filteredCalls.length !== 1 ? 's' : ''} trouvé{filteredCalls.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau des appels -->
    <div class="card mb-4">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th class="sortable" on:click={() => setSortField('contactName')}>
                  Contact
                  {#if sortField === 'contactName'}
                    <i class="bi bi-arrow-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                  {/if}
                </th>
                <th class="sortable" on:click={() => setSortField('date')}>
                  Date
                  {#if sortField === 'date'}
                    <i class="bi bi-arrow-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                  {/if}
                </th>
                <th class="sortable" on:click={() => setSortField('duration')}>
                  Durée
                  {#if sortField === 'duration'}
                    <i class="bi bi-arrow-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                  {/if}
                </th>
                <th class="sortable" on:click={() => setSortField('status')}>
                  Statut
                  {#if sortField === 'status'}
                    <i class="bi bi-arrow-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                  {/if}
                </th>
                <th>Campagne</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#if filteredCalls.length === 0}
                <tr>
                  <td colspan="6" class="text-center py-4">
                    <p class="text-muted mb-0">Aucun appel trouvé</p>
                  </td>
                </tr>
              {:else}
                {#each filteredCalls as call}
                  <tr>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="contact-avatar me-2">
                          {call.contactName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div class="fw-medium">{call.contactName}</div>
                          <div class="text-muted small">{call.contactPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{call.date}</div>
                      <div class="text-muted small">{call.time}</div>
                    </td>
                    <td>{formatDuration(call.duration)}</td>
                    <td>
                      <span class="badge bg-{getStatusClass(call.status)}">
                        {getStatusLabel(call.status)}
                      </span>
                    </td>
                    <td>
                      {campaigns.find(c => c.id === call.campaign)?.name || 'N/A'}
                    </td>
                    <td>
                      <button type="button" class="call-item" on:click={() => selectCall(call)} aria-label="Voir les détails de l'appel">
                        <i class="bi bi-eye"></i> Détails
                      </button>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de détails d'appel -->
    {#if selectedCall}
      <div class="call-details-modal">
        <div class="modal-backdrop" on:click={closeDetails}></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2>Détails de l'appel</h2>
            <button type="button" class="btn-close" on:click={closeDetails}></button>
          </div>
          <div class="modal-body">
            <div class="row mb-4">
              <div class="col-md-6">
                {#if selectedCall}
                  <div class="call-details">
                    <div class="call-details-header">
                      <h3>{selectedCall?.contactName || 'Contact'}</h3>
                    </div>
                    <div class="d-flex align-items-center mb-3">
                      <div class="contact-avatar-lg me-3">
                        {selectedCall.contactName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 class="mb-1">{selectedCall.contactName}</h4>
                        <p class="mb-0 text-muted">{selectedCall.contactPhone}</p>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
              <div class="col-md-6">
                <h3>Informations</h3>
                <div class="detail-item">
                  <span class="detail-label">Date et heure</span>
                  <span class="detail-value">{selectedCall.date} à {selectedCall.time}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Durée</span>
                  <span class="detail-value">{formatDuration(selectedCall.duration)}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Statut</span>
                  <span class="detail-value">
                    <span class="badge bg-{getStatusClass(selectedCall.status)}">
                      {getStatusLabel(selectedCall.status)}
                    </span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Campagne</span>
                  <span class="detail-value">
                    {campaigns.find(c => c.id === selectedCall.campaign)?.name || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="mb-4">
              <h3>Notes</h3>
              <div class="notes-box">
                {selectedCall.notes || 'Aucune note pour cet appel.'}
              </div>
            </div>
            
            <div class="mb-4">
              <h3>Suivi</h3>
              {#if selectedCall.followUpDate}
                <div class="follow-up-box">
                  <i class="bi bi-calendar-event me-2"></i>
                  Rappel prévu le {selectedCall.followUpDate}
                </div>
              {:else}
                <p class="text-muted">Aucun suivi prévu pour cet appel.</p>
              {/if}
            </div>
            
            <div class="d-flex justify-content-end mt-4">
              <button class="btn btn-outline-secondary me-2" on:click={closeDetails}>
                Fermer
              </button>
              <button class="btn btn-primary">
                <i class="bi bi-telephone-outbound me-2"></i> Rappeler
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .call-history-container {
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

  /* Cartes */
  .card {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: none;
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
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 600;
    padding: 0.75rem 1.25rem;
  }

  .table td {
    padding: 0.75rem 1.25rem;
    vertical-align: middle;
  }

  .sortable {
    cursor: pointer;
    user-select: none;
  }

  .sortable:hover {
    background-color: #f9fafb;
  }

  /* Avatar de contact */
  .contact-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #e5e7eb;
    color: #4b5563;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .contact-avatar-lg {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #e5e7eb;
    color: #4b5563;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.5rem;
  }

  /* Modal de détails */
  .call-details-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1050;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
  }

  .modal-content {
    position: relative;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    z-index: 1051;
  }

  .modal-header {
    padding: 1.25rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .modal-body h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1rem;
  }

  .modal-body h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .detail-item {
    margin-bottom: 0.75rem;
  }

  .detail-label {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .detail-value {
    font-size: 0.875rem;
    color: #1f2937;
    font-weight: 500;
  }

  .notes-box {
    background-color: #f9fafb;
    border-radius: 8px;
    padding: 1rem;
    font-size: 0.875rem;
    color: #4b5563;
    white-space: pre-line;
  }

  .follow-up-box {
    background-color: #ebf5ff;
    border-radius: 8px;
    padding: 1rem;
    font-size: 0.875rem;
    color: #1e40af;
    display: flex;
    align-items: center;
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

  /* Responsive */
  @media (max-width: 767.98px) {
    .call-history-container {
      padding: 1rem;
    }
    
    .modal-content {
      width: 95%;
    }
  }
</style>
