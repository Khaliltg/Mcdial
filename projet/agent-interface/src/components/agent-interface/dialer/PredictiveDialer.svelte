<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly, slide, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { get } from 'svelte/store';
  import { agentState, startCall as startAgentCall, endCall as endAgentCall, resetCall, callDuration as agentCallDuration, AGENT_STATUSES } from '../../../stores/agent';
  import { api } from '../../../utils/fetchWithAuth';
  import { setAgentReady, setAgentPaused } from '../../../stores/agentStatus';
  
  // Props pour la communication avec les composants parents
  export let callEnded = false;
  
  // Exporter une méthode pour arrêter le mode prédictif depuis l'extérieur
  export function stopPredictiveMode() {
    if (predictiveMode) togglePredictiveMode();
  }
  
  // Variables d'état locales
  let predictiveMode = false;
  let waitingForCall = false;
  let errorMessage = '';
  let successMessage = '';
  let prospectData: any = null;
  let predictiveCheckInterval: number;
  let lastCheckTime = new Date();
  let showCallStats = false;
  let callTimer: number | null = null;
  let selectedCampaign = '';
  let availableCampaigns = [];
  let dialLevel = 'AUTO';
  let campaignName = '';
  let callStats = {
    callsToday: 0,
    successfulCalls: 0,
    averageDuration: '0s',
    currentCalls: 0,
    totalCalls: 0,
    callRatio: 0
  };

  // Observer les changements dans l'état d'appel pour gérer le timer
  $: if (get(agentState).callActive) {
    if (!callTimer) callTimer = window.setInterval(() => {}, 1000);
  } else if (callTimer) {
    clearInterval(callTimer);
    callTimer = null;
  }
  
  // Observer les changements dans la propriété callEnded
  $: if (callEnded) handleEndCall();
  
  // Fonction pour formater le temps écoulé
  function formatElapsedTime(date) {
    if (!date) return '0s';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}m ${secs}s`;
  }
  
  // Fonction pour formater la durée d'un appel
  function formatCallDuration(seconds) {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Fonction pour vérifier les appels entrants
  async function checkForIncomingCalls() {
    try {
      lastCheckTime = new Date();
      const response = await api.get('/agent/calls/check-calls');
      
      if (response.ok) {
        const data = await response.json();
        if (data.incomingCalls && !get(agentState).callActive) {
          // Mettre à jour l'état de l'agent
          startAgentCall({
            callId: data.incomingCalls.uniqueid,
            leadId: data.incomingCalls.lead_id,
            phoneNumber: data.incomingCalls.phone_number,
            contactName: data.incomingCalls.contact_name || 'Contact entrant',
            direction: 'inbound'
          });
          
          // Charger les données du prospect
          if (data.incomingCalls.lead_id) loadProspectData(data.incomingCalls.lead_id);
        }
      }
    } catch (err) {
      console.error('Erreur lors de la vérification des appels entrants:', err);
    }
  }
  
  // Fonction pour charger les données d'un prospect
  async function loadProspectData(leadId: string) {
    try {
      const response = await api.get(`/agent/prospect/${leadId}`);
      if (response.ok) {
        prospectData = await response.json();
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données du prospect:', err);
    }
  }
  
  // Fonction pour terminer un appel
  async function handleEndCall() {
    try {
      if (get(agentState).callActive && get(agentState).callId) {
        const response = await api.post('/agent/calls/hangup', {
          callId: get(agentState).callId
        });
        
        if (response.ok) {
          endAgentCall();
          successMessage = 'Appel terminé avec succès';
          setTimeout(() => { successMessage = ''; }, 3000);
          
          // Mise à jour des statistiques
          callStats = {
            callsToday: callStats.callsToday + 1,
            successfulCalls: callStats.successfulCalls + 1,
            averageDuration: formatCallDuration(get(agentCallDuration)),
            currentCalls: callStats.currentCalls,
            totalCalls: callStats.totalCalls,
            callRatio: callStats.callRatio
          };
          
          // Réinitialiser l'état
          setTimeout(() => {
            resetCall();
            prospectData = null;
          }, 2000);
        } else {
          errorMessage = 'Erreur lors de la fin de l\'appel';
          setTimeout(() => { errorMessage = ''; }, 3000);
        }
      }
    } catch (err) {
      errorMessage = 'Erreur lors de la fin de l\'appel';
      setTimeout(() => { errorMessage = ''; }, 3000);
    }
  }
  
  // Charger la campagne depuis le localStorage
  function loadCampaignFromLocalStorage() {
    try {
      // Récupérer l'ID de campagne du localStorage
      const campaignId = localStorage.getItem('campaign_id');
      
      if (campaignId) {
        selectedCampaign = campaignId;
        console.log('Campagne chargée depuis localStorage:', campaignId);
        
        // Récupérer les informations de l'agent depuis le token JWT
        const agentToken = localStorage.getItem('agent_token');
        if (agentToken) {
          try {
            // Décoder le token JWT pour obtenir le nom de la campagne
            const tokenParts = agentToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              campaignName = payload.campaign_name || '';
            }
          } catch (tokenErr) {
            console.error('Erreur lors du décodage du token:', tokenErr);
          }
        }
        
        return true;
      } else {
        console.warn('Aucun ID de campagne trouvé dans le localStorage');
        return false;
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la campagne depuis localStorage:', err);
      return false;
    }
  }
  
  // Fonction pour mettre à jour les statistiques du mode prédictif
  async function updatePredictiveStats() {
    if (!predictiveMode || !selectedCampaign) return;
    
    try {
      const response = await api.get(`/predictive/stats?campaignId=${selectedCampaign}`);
      if (response.ok) {
        const data = await response.json();
        if (data.stats) {
          callStats = {
            callsToday: data.stats.totalCalls || 0,
            successfulCalls: data.stats.successfulCalls || 0,
            averageDuration: formatCallDuration(data.stats.averageDuration || 0),
            currentCalls: data.stats.currentCalls || 0,
            totalCalls: data.stats.totalCalls || 0,
            callRatio: data.stats.callRatio || 0
          };
        }
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err);
    }
  }
  
  // Fonction pour activer/désactiver le mode prédictif
  async function togglePredictiveMode() {
    try {
      // Si le mode prédictif n'est pas actif, essayer de charger la campagne depuis localStorage
      if (!predictiveMode && !selectedCampaign) {
        const campaignLoaded = loadCampaignFromLocalStorage();
        if (!campaignLoaded) {
          errorMessage = 'Aucune campagne disponible. Veuillez vous reconnecter.';
          setTimeout(() => { errorMessage = ''; }, 3000);
          return;
        }
      }
      
      predictiveMode = !predictiveMode;
      
      if (predictiveMode) {
        // Mettre à jour le statut de l'agent à READY
        setAgentReady();
        
        // Mettre à jour le statut sur le serveur
        try {
          await api.post('/agent/status', { status: AGENT_STATUSES.READY });
        } catch (statusErr) {
          // Erreur silencieuse - déjà loggée par l'API
        }
        
        // Appel API pour démarrer le composeur prédictif
        const response = await api.post('/predictive/start', {
          campaignId: selectedCampaign,
          level: dialLevel
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.campaignName) campaignName = data.campaignName;
          if (data.dialLevel) callStats.callRatio = data.dialLevel;
          
          successMessage = `Mode prédictif activé pour ${campaignName || selectedCampaign}`;
          setTimeout(() => { successMessage = ''; }, 3000);
          waitingForCall = true;
          
          // Démarrer la vérification périodique des appels et des statistiques
          predictiveCheckInterval = window.setInterval(() => {
            checkForIncomingCalls();
            updatePredictiveStats();
          }, 3000);
        } else {
          const data = await response.json();
          errorMessage = `Erreur: ${data.message || 'Erreur lors de l\'activation du mode prédictif'}`;
          setTimeout(() => { errorMessage = ''; }, 3000);
          predictiveMode = false;
          setAgentPaused('SYSTEM', 'Erreur activation mode prédictif');
        }
      } else {
        // Mettre à jour le statut de l'agent à PAUSED
        setAgentPaused('SYSTEM', 'Arrêt mode prédictif');
        
        // Mettre à jour le statut sur le serveur
        try {
          await api.post('/agent/status', {
            status: AGENT_STATUSES.PAUSED,
            pauseCode: 'SYSTEM'
          });
        } catch (statusErr) {
          // Erreur silencieuse - déjà loggée par l'API
        }
        
        // Appel API pour arrêter le composeur prédictif
        const response = await api.post('/predictive/stop', {
          campaignId: selectedCampaign
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.stats) {
            callStats = {
              ...callStats,
              totalCalls: data.stats.totalCalls || callStats.totalCalls,
              successfulCalls: data.stats.successfulCalls || callStats.successfulCalls
            };
          }
        }
        
        // Arrêter la vérification périodique des appels
        if (predictiveCheckInterval) clearInterval(predictiveCheckInterval);
        
        successMessage = `Mode prédictif désactivé pour ${campaignName || selectedCampaign}`;
        setTimeout(() => { successMessage = ''; }, 3000);
        waitingForCall = false;
      }
    } catch (err) {
      console.error('Erreur lors du changement de mode prédictif:', err);
      errorMessage = 'Erreur lors du changement de mode prédictif';
      setTimeout(() => { errorMessage = ''; }, 3000);
      predictiveMode = !predictiveMode; // Revenir à l'état précédent
    }
  }
  
  // Fonction pour sauvegarder les données du prospect
  async function saveProspectData(data: any) {
    try {
      const response = await api.post('/agent/prospect/save', {
        leadId: get(agentState).leadId,
        prospectData: data
      });
      
      if (response.ok) {
        prospectData = data;
        successMessage = 'Données du prospect sauvegardées';
        setTimeout(() => { successMessage = ''; }, 3000);
      } else {
        errorMessage = 'Erreur lors de la sauvegarde des données';
        setTimeout(() => { errorMessage = ''; }, 3000);
      }
    } catch (err) {
      errorMessage = 'Erreur lors de la sauvegarde des données';
      setTimeout(() => { errorMessage = ''; }, 3000);
    }
  }
  
  // Fonctions utilitaires
  const handleCheckCalls = () => checkForIncomingCalls();
  const closeErrorMessage = () => errorMessage = '';
  const closeSuccessMessage = () => successMessage = '';
  const toggleStats = () => showCallStats = !showCallStats;
  
  // Initialisation au montage du composant
  onMount(() => {
    // Charger la campagne depuis le localStorage
    loadCampaignFromLocalStorage();
    
    // Vérifier les appels entrants toutes les 3 secondes
    predictiveCheckInterval = window.setInterval(checkForIncomingCalls, 3000);
    
    // Nettoyer l'intervalle lors de la destruction du composant
    return () => {
      if (predictiveCheckInterval) clearInterval(predictiveCheckInterval);
    };
  });
  
  // Nettoyage à la destruction du composant
  onDestroy(() => {
    if (predictiveCheckInterval) clearInterval(predictiveCheckInterval);
    if (callTimer) clearInterval(callTimer);
  });
</script>

<div class="container-fluid py-4 bg-light">
  <div class="container mb-4">
    <!-- Notifications -->
    {#if errorMessage}
      <div 
        class="position-fixed top-0 end-0 p-3" style="z-index: 1050;"
        in:fly={{ x: 300, duration: 300, easing: quintOut }}
        out:fly={{ x: 300, duration: 200 }}
      >
        <div class="toast show align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              {errorMessage}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" on:click={closeErrorMessage}></button>
          </div>
        </div>
      </div>
    {/if}
    
    {#if successMessage}
      <div 
        class="position-fixed top-0 end-0 p-3" style="z-index: 1050;"
        in:fly={{ x: 300, duration: 300, easing: quintOut }}
        out:fly={{ x: 300, duration: 200 }}
      >
        <div class="toast show align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body">
              <i class="bi bi-check-circle-fill me-2"></i>
              {successMessage}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" on:click={closeSuccessMessage}></button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Header avec titre et statut -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-header bg-white py-3">
        <div class="row align-items-center">
          <div class="col-md-7">
            <h5 class="card-title d-flex align-items-center mb-0 fw-bold">
              <i class="bi bi-telephone-fill text-primary me-2 fs-4"></i>
              Composeur Prédictif
            </h5>
            <p class="card-text text-muted small mt-1 mb-0">Gérez vos appels sortants automatiquement</p>
          </div>
          
          <div class="col-md-5 d-flex justify-content-end align-items-center gap-2">
            <!-- Statut de l'agent -->
            <div class="d-flex align-items-center">
              <span class="badge {predictiveMode ? 'bg-success' : 'bg-secondary'} d-flex align-items-center py-2 px-3">
                {#if predictiveMode}
                  <span class="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                {/if}
                <i class="bi {predictiveMode ? 'bi-headset' : 'bi-headset-vr'} me-1"></i>
                <span>
                  {#if predictiveMode}
                    Mode prédictif actif - {campaignName || selectedCampaign}
                  {:else}
                    Mode prédictif inactif
                  {/if}
                </span>
              </span>
            </div>
            
            <!-- Boutons de contrôle -->
            <button 
              class="btn {predictiveMode ? 'btn-danger' : 'btn-success'}"
              on:click={togglePredictiveMode}
            >
              {predictiveMode ? 'Arrêter' : 'Démarrer'}
            </button>
            
            <button 
              class="btn btn-outline-primary btn-sm"
              on:click={() => showCallStats = !showCallStats}
              aria-label="Statistiques"
            >
              <i class="bi bi-bar-chart-fill"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    {#if showCallStats}
    <div class="card shadow-sm border-0 mb-4" transition:slide={{ duration: 300 }}>
      <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
        <h5 class="card-title mb-0 d-flex align-items-center fw-bold">
          <i class="bi bi-bar-chart-fill text-primary me-2"></i>
          Statistiques d'appels
        </h5>
        <button 
          type="button" 
          class="btn-close" 
          aria-label="Fermer" 
          on:click={() => showCallStats = false}
        ></button>
      </div>
      
      <div class="card-body p-4">
        <div class="row g-4">
          <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-primary fw-bold mb-1">Appels aujourd'hui</h6>
                    <h3 class="display-6 fw-bold mb-0">{callStats.callsToday}</h3>
                  </div>
                  <div class="bg-light rounded-circle p-3 d-flex align-items-center justify-content-center">
                    <i class="bi bi-telephone-outbound fs-3 text-primary"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-success fw-bold mb-1">Appels réussis</h6>
                    <h3 class="display-6 fw-bold mb-0">{callStats.successfulCalls}</h3>
                  </div>
                  <div class="bg-light rounded-circle p-3 d-flex align-items-center justify-content-center">
                    <i class="bi bi-check-circle fs-3 text-success"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-info fw-bold mb-1">Durée moyenne</h6>
                    <h3 class="display-6 fw-bold mb-0">{callStats.averageDuration}</h3>
                  </div>
                  <div class="bg-light rounded-circle p-3 d-flex align-items-center justify-content-center">
                    <i class="bi bi-clock-history fs-3 text-info"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/if}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Contrôles de numérotation -->
      <div class="mb-4">
        
    
        </div>

        {#if get(agentState).callActive}
          <!-- Carte d'appel actif -->
          <div 
            class="card shadow mb-4"
            in:scale={{ duration: 400, start: 0.9 }}
          >
            <div class="card-header bg-success text-white p-4">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                  <div class="rounded-circle bg-white bg-opacity-25 p-3 me-3">
                    <i class="bi bi-telephone-fill text-white fs-4 animate-pulse"></i>
                  </div>
                  <div>
                    <h3 class="mb-0 fs-4">Appel en cours</h3>
                    <p class="mb-0 text-white-50">{formatCallDuration($agentCallDuration)}s</p>
                  </div>
                </div>
                <button 
                  class="btn btn-outline-light"
                  on:click={handleEndCall}
                >
                  <i class="bi bi-x-lg me-2"></i>
                  Terminer l'appel
                </button>
              </div>
            </div>
            
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="card border-0 bg-light">
                    <div class="card-body">
                      <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                          <i class="bi bi-telephone-fill text-primary"></i>
                        </div>
                        <div>
                          <small class="text-muted d-block">Numéro</small>
                          <span class="fw-medium">{get(agentState).phoneNumber || 'Numéro inconnu'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="card border-0 bg-light">
                    <div class="card-body">
                      <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-info bg-opacity-10 p-2 me-3">
                          <i class="bi bi-person-fill text-info"></i>
                        </div>
                        <div>
                          <small class="text-muted d-block">Contact</small>
                          <span class="fw-medium">{get(agentState).contactName || 'Contact inconnu'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {:else}
     
        {/if}
      </div>

      <!-- Informations du prospect -->
      <div class="card shadow-sm border-0 mb-4" in:fade={{ duration: 400, delay: 300 }}>
        <div class="card-header bg-gradient-primary text-white p-4">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <div class="rounded-circle bg-white bg-opacity-25 p-2 me-3">
                <i class="bi bi-person-circle fs-4"></i>
              </div>
              <div>
                <h5 class="card-title mb-0 fw-bold">Informations prospect</h5>
                <p class="card-subtitle text-white-50 small mb-0">Données du contact actuel</p>
              </div>
            </div>
            
            {#if prospectData}
              <button class="btn btn-sm btn-outline-light" aria-label="Edit prospect data">
                <div class="d-flex align-items-center">
                  <i class="bi bi-pencil-square me-2"></i>
                  <span>Modifier</span>
                </div>
              </button>
            {/if}
          </div>
        </div>
        
        <div class="card-body p-4">
          {#if get(agentState).callActive && prospectData}
            <div class="prospect-form" in:slide={{ duration: 300 }}>
              <!-- Formulaire prospect -->
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label" for="firstName">Prénom</label>
                  <input 
                    type="text" 
                    value={prospectData?.firstName || ''}
                    on:input={(e) => prospectData = {...prospectData, firstName: e.target.value}}
                    class="form-control" 
                    placeholder="Prénom du prospect"
                    id="firstName"
                    readonly
                  />
                </div>
                
                <div class="col-md-6">
                  <label class="form-label" for="lastName">Nom</label>
                  <input 
                    type="text" 
                    value={prospectData?.lastName || ''}
                    on:input={(e) => prospectData = {...prospectData, lastName: e.target.value}}
                    class="form-control"
                    placeholder="Nom du prospect"
                    id="lastName"
                    readonly
                  />
                </div>
                
                <div class="col-md-6">
                  <label class="form-label" for="phone">Téléphone</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-telephone"></i></span>
                    <input 
                      type="tel" 
                      value={prospectData?.phone || ''}
                      on:input={(e) => prospectData = {...prospectData, phone: e.target.value}}
                      class="form-control"
                      placeholder="Numéro de téléphone"
                      id="phone"
                      readonly
                    />
                  </div>
                </div>
                
                <div class="col-md-6">
                  <label class="form-label" for="email">Email</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                    <input 
                      type="email" 
                      value={prospectData?.email || ''}
                      on:input={(e) => prospectData = {...prospectData, email: e.target.value}}
                      class="form-control"
                      placeholder="Adresse email"
                      id="email"
                      readonly
                    />
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label" for="company">Entreprise</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-building"></i></span>
                  <input 
                    type="text" 
                    value={prospectData?.company || ''}
                    on:input={(e) => prospectData = {...prospectData, company: e.target.value}}
                    class="form-control"
                    placeholder="Nom de l'entreprise"
                    id="company"
                    readonly
                  />
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label" for="notes">Commentaires</label>
                <textarea 
                  value={prospectData?.notes || ''}
                  on:input={(e) => prospectData = {...prospectData, notes: e.target.value}}
                  rows="3"
                  class="form-control"
                  placeholder="Ajoutez vos commentaires ici..."
                  id="notes"
                ></textarea>
                <div class="form-text">Seul ce champ peut être modifié par l'agent.</div>
              </div>
              
              <button 
                class="btn btn-success w-100 py-3"
                aria-label="Save prospect data"
                on:click={() => saveProspectData(prospectData)}
              >
                <div class="d-flex align-items-center justify-content-center">
                  <i class="bi bi-save me-2 fs-5"></i>
                  <span>Sauvegarder les commentaires</span>
                </div>
              </button>
            </div>
          {:else}
            <!-- État vide -->
            <div class="text-center py-4">
              <div class="bg-light rounded-circle p-4 d-inline-flex align-items-center justify-content-center mb-3" style="width: 100px; height: 100px;">
                <i class="bi bi-person-circle text-secondary fs-1"></i>
              </div>
              <h3 class="fs-4 fw-bold mb-2">Aucun prospect actif</h3>
              <p class="text-muted mb-4">Les informations du prospect s'afficheront pendant un appel</p>
              <button class="btn btn-outline-primary" aria-label="Manual call">
                <div class="d-flex align-items-center">
                  <i class="bi bi-telephone-plus me-2"></i>
                  <span>Appel manuel</span>
                </div>
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>

<style>
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  .bg-gradient-primary {
    background: linear-gradient(to right, #4f46e5, #7e22ce);
  }
  
  .bg-white.bg-opacity-25 {
    background-color: rgba(255, 255, 255, 0.25);
  }
</style>
