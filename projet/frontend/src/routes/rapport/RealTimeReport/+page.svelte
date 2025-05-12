<script>
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';
  import { fade, fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  // Hardcoded backend URL - replace with your actual backend URL if different
  const API_BASE_URL = 'http://localhost:8000';

  let groupedAgents = {
    READY: [],
    INCALL: [],
    PAUSED: [],
    WAITING: [],
  };
  let hopper = {};
  let socket;
  let connectionStatus = 'Déconnecté';
  let lastUpdate = null;
  let dataReceived = false;
  let updateCount = 0;
  let showUpdateIndicator = false;
  let showExportOptions = false;
  
  // Pour suivre les changements d'agents
  let previousAgentIds = {
    READY: new Set(),
    INCALL: new Set(),
    PAUSED: new Set(),
    WAITING: new Set(),
  };
  let newAgents = {
    READY: new Set(),
    INCALL: new Set(),
    PAUSED: new Set(),
    WAITING: new Set(),
  };
  
  function trackAgentChanges(status, newAgentList) {
    const currentIds = new Set(newAgentList.map(a => a.user));
    newAgents[status] = new Set([...currentIds].filter(id => !previousAgentIds[status].has(id)));
    previousAgentIds[status] = currentIds;
    return newAgentList;
  }
  
  function isNewAgent(status, agentId) {
    return newAgents[status].has(agentId);
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  
  function manualRefresh() {
    if (socket && socket.connected) {
      socket.emit('request-update');
      showUpdateIndicator = true;
      setTimeout(() => {
        showUpdateIndicator = false;
      }, 1000);
    }
  }
  
  // Fonction pour exporter les données en CSV
  function exportToCSV() {
    // Préparer les données
    const allAgents = [
      ...groupedAgents.READY.map(a => ({...a, status: 'Prêt'})),
      ...groupedAgents.INCALL.map(a => ({...a, status: 'En appel'})),
      ...groupedAgents.PAUSED.map(a => ({...a, status: 'En pause'})),
      ...groupedAgents.WAITING.map(a => ({...a, status: 'En attente'}))
    ];
    
    // Créer les en-têtes CSV
    const headers = ['Nom', 'Utilisateur', 'Station', 'Statut', 'Appels aujourd\'hui', 'Temps dans le statut', 'Campagne'];
    
    // Créer les lignes de données
    const rows = allAgents.map(agent => [
      agent.full_name,
      agent.user,
      agent.station,
      agent.status,
      agent.calls_today,
      formatTime(agent.seconds_in_status),
      agent.campaign_id
    ]);
    
    // Combiner en-têtes et lignes
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_agents_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // Fonction pour exporter les données en PDF
  function exportToPDF() {
    // Créer un élément temporaire pour le contenu du PDF
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <h1 style="text-align: center;">Rapport des Agents en Temps Réel</h1>
      <p style="text-align: center;">Généré le ${new Date().toLocaleString()}</p>
      <hr>
      
      <h2>Résumé</h2>
      <ul>
        <li>Leads dans le hopper: ${hopper?.leads_in_hopper || 0}</li>
        <li>Agents prêts: ${groupedAgents.READY.length}</li>
        <li>Agents en appel: ${groupedAgents.INCALL.length}</li>
        <li>Agents en pause: ${groupedAgents.PAUSED.length}</li>
        <li>Agents en attente: ${groupedAgents.WAITING.length}</li>
        <li>Total des appels: ${[...groupedAgents.READY, ...groupedAgents.INCALL, ...groupedAgents.PAUSED, ...groupedAgents.WAITING].reduce((sum, agent) => sum + (agent.calls_today || 0), 0)}</li>
      </ul>
      
      <h2>Détails des Agents</h2>
    `;
    
    // Ajouter chaque catégorie d'agents
    ['READY', 'INCALL', 'PAUSED', 'WAITING'].forEach(status => {
      const statusLabel = {
        'READY': 'Prêts',
        'INCALL': 'En appel',
        'PAUSED': 'En pause',
        'WAITING': 'En attente'
      }[status];
      
      printContent.innerHTML += `<h3>Agents ${statusLabel} (${groupedAgents[status].length})</h3>`;
      
      if (groupedAgents[status].length === 0) {
        printContent.innerHTML += `<p>Aucun agent dans cette catégorie</p>`;
      } else {
        printContent.innerHTML += `
          <table border="1" cellpadding="5" style="width: 100%; border-collapse: collapse;">
            <tr>
              <th>Nom</th>
              <th>Station</th>
              <th>Appels</th>
              <th>Temps</th>
              <th>Campagne</th>
            </tr>
            ${groupedAgents[status].map(agent => `
              <tr>
                <td>${agent.full_name}</td>
                <td>${agent.station}</td>
                <td>${agent.calls_today}</td>
                <td>${formatTime(agent.seconds_in_status)}</td>
                <td>${agent.campaign_id}</td>
              </tr>
            `).join('')}
          </table>
        `;
      }
    });
    
    // Ouvrir une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Rapport des Agents - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #f2f2f2; }
            td, th { padding: 8px; border: 1px solid #ddd; text-align: left; }
            h1, h2, h3 { color: #333; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px;">Imprimer</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  onMount(() => {
    socket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ['websocket'],
      // Send auth token if available
      auth: {
        token: localStorage.getItem('token') || document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1")
      }
    });

    if (!socket) return;

    socket.on('connect', () => {
      console.log('✅ Connecté au WebSocket');
      connectionStatus = 'Connecté';
    });

    socket.on('realtime-update', (data) => {
      console.log('Données reçues en temps réel:', data);
      if (!data) return;
      
      dataReceived = true;
      updateCount++;
      hopper = data.hopper || {};

      // Mettre à jour les agents et suivre les changements
      groupedAgents.READY = trackAgentChanges('READY', data.agents?.filter(a => a.status === 'READY') || []);
      groupedAgents.INCALL = trackAgentChanges('INCALL', data.agents?.filter(a => a.status === 'INCALL') || []);
      groupedAgents.PAUSED = trackAgentChanges('PAUSED', data.agents?.filter(a => a.status === 'PAUSED') || []);
      groupedAgents.WAITING = trackAgentChanges('WAITING', data.agents?.filter(a => a.status === 'WAITING') || []);
      
      // Force Svelte to update
      groupedAgents = {...groupedAgents};
      lastUpdate = new Date();
      
      // Afficher l'indicateur de mise à jour
      showUpdateIndicator = true;
      setTimeout(() => {
        showUpdateIndicator = false;
      }, 1000);
    });

    socket.on('disconnect', () => {
      console.log('❌ Déconnecté du WebSocket');
      connectionStatus = 'Déconnecté';
    });

    socket.on('connect_error', (error) => {
      console.error('Erreur de connexion WebSocket:', error);
      connectionStatus = 'Erreur de connexion';
    });
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
  });
</script>

<div class="container-fluid py-4">
  <!-- Header avec statut de connexion, contrôles et statistiques -->
  <div class="row mb-4">
    <div class="col-12">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center flex-wrap">
            <div class="d-flex align-items-center mb-2 mb-md-0">
              <h1 class="h3 mb-0 me-3">Rapport en temps réel</h1>
              
              <!-- Statut de connexion -->
              {#if connectionStatus === 'Connecté'}
                <span class="badge bg-success d-flex align-items-center">
                  <i class="bi bi-broadcast me-1"></i> En direct
                </span>
              {:else}
                <span class="badge bg-danger d-flex align-items-center">
                  <i class="bi bi-exclamation-triangle me-1"></i> {connectionStatus}
                </span>
              {/if}
              
              <!-- Indicateur de mise à jour -->
              {#if showUpdateIndicator}
                <span class="badge bg-info ms-2 d-flex align-items-center" transition:fade>
                  <i class="bi bi-arrow-repeat me-1"></i> Mise à jour
                </span>
              {/if}
            </div>
            
            <!-- Contrôles d'exportation -->
            <div class="d-flex gap-2 align-items-center">
              <div class="btn-group">
                <button class="btn btn-outline-primary" on:click={manualRefresh} title="Rafraîchir maintenant">
                  <i class="bi bi-arrow-clockwise"></i>
                </button>
                <button class="btn btn-outline-success" on:click={exportToCSV} title="Exporter en CSV">
                  <i class="bi bi-file-earmark-excel me-1"></i> CSV
                </button>
                <button class="btn btn-outline-danger" on:click={exportToPDF} title="Exporter en PDF">
                  <i class="bi bi-file-earmark-pdf me-1"></i> PDF
                </button>
                <button class="btn btn-outline-primary" on:click={() => showExportOptions = !showExportOptions} title="Options d'exportation">
                  <i class="bi bi-gear"></i>
                </button>
              </div>
            </div>
            
            <div class="w-100 d-md-none mb-2"></div> <!-- Séparateur sur mobile -->
            
            <!-- Informations de mise à jour -->
            <div class="ms-auto text-end">
              {#if lastUpdate}
                <div class="text-muted small">
                  Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
                  <div class="badge bg-light text-dark">{updateCount} mises à jour</div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Options d'exportation -->
  {#if showExportOptions}
    <div class="row mb-4" transition:fly={{y: -20}}>
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Options d'exportation</h5>
            <button type="button" class="btn-close" on:click={() => showExportOptions = false}></button>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6 mb-3">
                <h6>Exporter en CSV</h6>
                <p class="text-muted">Exporte toutes les données des agents dans un fichier CSV que vous pouvez ouvrir dans Excel ou tout autre tableur.</p>
                <button class="btn btn-success" on:click={exportToCSV}>
                  <i class="bi bi-file-earmark-excel me-1"></i> Télécharger CSV
                </button>
              </div>
              <div class="col-md-6 mb-3">
                <h6>Exporter en PDF</h6>
                <p class="text-muted">Génère un rapport PDF formaté avec résumé et détails des agents. Idéal pour l'impression ou le partage.</p>
                <button class="btn btn-danger" on:click={exportToPDF}>
                  <i class="bi bi-file-earmark-pdf me-1"></i> Générer PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Indicateur d'attente des données -->
  {#if !dataReceived}
    <div class="row justify-content-center mb-4">
      <div class="col-md-6">
        <div class="card border-0 shadow-sm text-center py-5">
          <div class="card-body">
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Chargement...</span>
            </div>
            <h5>En attente des données en temps réel...</h5>
            <p class="text-muted">Connexion au serveur WebSocket</p>
          </div>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Statistiques principales -->
  <div class="row mb-4">
    <div class="col-md-3">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="text-muted mb-1">Leads dans le hopper</h6>
              <h2 class="mb-0">{hopper?.leads_in_hopper || 0}</h2>
            </div>
            <div class="bg-light rounded-circle p-2">
              <i class="bi bi-database text-primary fs-4"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="col-md-3">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="text-muted mb-1">Total agents actifs</h6>
              <h2 class="mb-0">{groupedAgents.READY.length + groupedAgents.INCALL.length + groupedAgents.PAUSED.length + groupedAgents.WAITING.length}</h2>
            </div>
            <div class="bg-primary bg-opacity-10 rounded-circle p-2">
              <i class="bi bi-people text-primary fs-4"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="col-md-3">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="text-muted mb-1">Appels en cours</h6>
              <h2 class="mb-0">{groupedAgents.INCALL.length}</h2>
            </div>
            <div class="bg-warning bg-opacity-10 rounded-circle p-2">
              <i class="bi bi-telephone text-warning fs-4"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="col-md-3">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="text-muted mb-1">Total appels aujourd'hui</h6>
              <h2 class="mb-0">{groupedAgents.READY.reduce((sum, agent) => sum + (agent.calls_today || 0), 0) + 
                               groupedAgents.INCALL.reduce((sum, agent) => sum + (agent.calls_today || 0), 0) + 
                               groupedAgents.PAUSED.reduce((sum, agent) => sum + (agent.calls_today || 0), 0) + 
                               groupedAgents.WAITING.reduce((sum, agent) => sum + (agent.calls_today || 0), 0)}</h2>
            </div>
            <div class="bg-success bg-opacity-10 rounded-circle p-2">
              <i class="bi bi-graph-up text-success fs-4"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Agents par statut -->
  <div class="row">
    <!-- Agents READY -->
    <div class="col-md-6 col-lg-3 mb-4">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-header bg-success bg-opacity-10 border-0">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0 text-success">
              <i class="bi bi-person-check me-2"></i>Agents prêts
            </h5>
            <span class="badge bg-success">{groupedAgents.READY.length}</span>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="list-group list-group-flush agent-list">
            {#each groupedAgents.READY as agent (agent.user + '-READY')}
              <div class="list-group-item list-group-item-action {isNewAgent('READY', agent.user) ? 'new-agent' : ''}" 
                   in:fly|local={{y: 20, duration: 300}} 
                   animate:flip|local={{duration: 300}}>
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">{agent.full_name}</h6>
                    <small class="text-muted">Station: {agent.station}</small>
                  </div>
                  <div class="text-end">
                    <span class="badge bg-light text-dark">{agent.calls_today} appels</span>
                    <div class="small text-muted">{formatTime(agent.seconds_in_status)}</div>
                  </div>
                </div>
              </div>
            {:else}
              <div class="list-group-item text-center py-4 text-muted">
                <i class="bi bi-person-x fs-3 d-block mb-2"></i>
                Aucun agent prêt
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Agents INCALL -->
    <div class="col-md-6 col-lg-3 mb-4">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-header bg-warning bg-opacity-10 border-0">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0 text-warning">
              <i class="bi bi-telephone me-2"></i>Agents en appel
            </h5>
            <span class="badge bg-warning text-dark">{groupedAgents.INCALL.length}</span>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="list-group list-group-flush agent-list">
            {#each groupedAgents.INCALL as agent (agent.user + '-INCALL')}
              <div class="list-group-item list-group-item-action {isNewAgent('INCALL', agent.user) ? 'new-agent' : ''}">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">{agent.full_name}</h6>
                    <small class="text-muted">Station: {agent.station}</small>
                  </div>
                  <div class="text-end">
                    <span class="badge bg-light text-dark">{agent.calls_today} appels</span>
                    <div class="small text-muted">{formatTime(agent.seconds_in_status)}</div>
                  </div>
                </div>
              </div>
            {:else}
              <div class="list-group-item text-center py-4 text-muted">
                <i class="bi bi-telephone-x fs-3 d-block mb-2"></i>
                Aucun agent en appel
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Agents PAUSED -->
    <div class="col-md-6 col-lg-3 mb-4">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-header bg-info bg-opacity-10 border-0">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0 text-info">
              <i class="bi bi-pause-circle me-2"></i>Agents en pause
            </h5>
            <span class="badge bg-info">{groupedAgents.PAUSED.length}</span>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="list-group list-group-flush agent-list">
            {#each groupedAgents.PAUSED as agent (agent.user + '-PAUSED')}
              <div class="list-group-item list-group-item-action {isNewAgent('PAUSED', agent.user) ? 'new-agent' : ''}">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">{agent.full_name}</h6>
                    <small class="text-muted">Station: {agent.station}</small>
                  </div>
                  <div class="text-end">
                    <span class="badge bg-light text-dark">{agent.calls_today} appels</span>
                    <div class="small text-muted">{formatTime(agent.seconds_in_status)}</div>
                  </div>
                </div>
              </div>
            {:else}
              <div class="list-group-item text-center py-4 text-muted">
                <i class="bi bi-pause-btn fs-3 d-block mb-2"></i>
                Aucun agent en pause
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Agents WAITING -->
    <div class="col-md-6 col-lg-3 mb-4">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-header bg-secondary bg-opacity-10 border-0">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0 text-secondary">
              <i class="bi bi-hourglass-split me-2"></i>Agents en attente
            </h5>
            <span class="badge bg-secondary">{groupedAgents.WAITING.length}</span>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="list-group list-group-flush agent-list">
            {#each groupedAgents.WAITING as agent (agent.user + '-WAITING')}
              <div class="list-group-item list-group-item-action {isNewAgent('WAITING', agent.user) ? 'new-agent' : ''}">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">{agent.full_name}</h6>
                    <small class="text-muted">Station: {agent.station}</small>
                  </div>
                  <div class="text-end">
                    <span class="badge bg-light text-dark">{agent.calls_today} appels</span>
                    <div class="small text-muted">{formatTime(agent.seconds_in_status)}</div>
                  </div>
                </div>
              </div>
            {:else}
              <div class="list-group-item text-center py-4 text-muted">
                <i class="bi bi-clock-history fs-3 d-block mb-2"></i>
                Aucun agent en attente
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Styles minimaux pour compléter Bootstrap */
  .agent-list {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .new-agent {
    animation: highlight-new 3s ease;
  }
  
  @keyframes highlight-new {
    0% {
      background-color: rgba(255, 193, 7, 0.2);
    }
    100% {
      background-color: transparent;
    }
  }
</style>
