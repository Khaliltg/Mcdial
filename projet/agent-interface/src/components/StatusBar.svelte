<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { agentState } from '../stores/agent';
  import { formatTime, formatTimeDisplay, formatDate } from '../utils/timeUtils';
  import { formatCurrency } from '../utils/formatUtils';
  import { clearAuthData } from '../utils/fetchWithAuth';

  // Agent status definitions
  const agentStatuses = {
    READY: {
      color: '#28a745',
      icon: 'bi-check-circle',
      description: 'Prêt à recevoir des appels'
    },
    PAUSED: {
      color: '#ffc107',
      icon: 'bi-pause-circle',
      description: 'En pause'
    },
    DIALING: {
      color: '#17a2b8',
      icon: 'bi-telephone-outbound',
      description: 'Appel en cours...'
    },
    INCALL: {
      color: '#dc3545',
      icon: 'bi-telephone',
      description: 'En communication'
    },
    WAITING: {
      color: '#6c757d',
      icon: 'bi-hourglass-split',
      description: 'En attente'
    },
    OFFLINE: {
      color: '#6c757d',
      icon: 'bi-x-circle',
      description: 'Hors ligne'
    }
  };

  // Time tracking variables
  let callStartTime = 0;
  let callDuration = 0;
  let callCost = 0;
  let callTimer: number;
  let statusTimer: number;
  let statusDuration = 0;
  let statusStartTime = Date.now();
  let currentDateTime = new Date();
  let dateTimeInterval: number;

  // Update current date and time
  function updateDateTime() {
    currentDateTime = new Date();
  }

  // Update call duration
  function updateCallDuration() {
    if ($agentState.callActive) {
      const now = Date.now();
      callDuration = Math.floor((now - callStartTime) / 1000);
      // Cost calculation (example: 0.02€ per second)
      callCost = callDuration * 0.02;
    }
  }

  // Update status duration
  function updateStatusDuration() {
    const now = Date.now();
    statusDuration = Math.floor((now - statusStartTime) / 1000);
  }

  // Handle status change
  function handleStatusChange() {
    statusStartTime = Date.now();
    statusDuration = 0;
  }

  // Handle call start
  function handleCallStart() {
    callStartTime = Date.now();
    callDuration = 0;
    callCost = 0;
    callTimer = window.setInterval(updateCallDuration, 1000);
  }

  // Handle call end
  function handleCallEnd() {
    if (callTimer) {
      clearInterval(callTimer);
    }
  }

  // Get current agent status
  function getCurrentStatus() {
    const status = $agentState.status;
    return agentStatuses[status] || agentStatuses.OFFLINE;
  }

  // Logout function
  function handleLogout() {
    // Remove all authentication data
    clearAuthData();
    
    // Update agent state
    agentState.update(state => ({
      ...state,
      status: 'OFFLINE',
      callActive: false
    }));
    
    // Redirect to login page
    window.location.href = '/';
  }

  // Watch for status and call changes
  $: if ($agentState.status) {
    handleStatusChange();
  }

  $: if ($agentState.callActive) {
    handleCallStart();
  } else {
    handleCallEnd();
  }

  // Set up timers on component mount
  onMount(() => {
    statusTimer = window.setInterval(updateStatusDuration, 1000);
    dateTimeInterval = window.setInterval(updateDateTime, 1000);
    updateDateTime();
  });

  // Clean up timers on component destroy
  onDestroy(() => {
    if (statusTimer) clearInterval(statusTimer);
    if (callTimer) clearInterval(callTimer);
    if (dateTimeInterval) clearInterval(dateTimeInterval);
  });
</script>

<div class="container-fluid py-2 bg-light border-bottom shadow-sm">
  <div class="row">
    <!-- User Information Section -->
    <div class="col-md-3 mb-2 mb-md-0">
      <div class="d-flex align-items-center">
        <div class="avatar-container me-2">
          <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
            {$agentState.fullName ? $agentState.fullName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div class="status-dot" style="background-color: {getCurrentStatus().color};"></div>
        </div>
        <div>
          <div class="fw-bold">{$agentState.fullName || 'Agent'}</div>
          <div class="small text-muted">{$agentState.user || 'Utilisateur'}</div>
        </div>
      </div>
    </div>

    <!-- Status and Time Section -->
    <div class="col-md-2 mb-2 mb-md-0">
      <div class="card h-100 border-0 bg-light">
        <div class="card-body p-2">
          <div class="d-flex align-items-center mb-1">
            <i class="bi {getCurrentStatus().icon} me-2" style="color: {getCurrentStatus().color};"></i>
            <span class="fw-bold">{$agentState.status}</span>
          </div>
          <div class="small text-muted">{formatTime(statusDuration)}</div>
          <div class="small text-muted mt-1">{formatTimeDisplay(currentDateTime)}</div>
        </div>
      </div>
    </div>

    <!-- Campaign and Extension Section -->
    <div class="col-md-3 mb-2 mb-md-0">
      <div class="card h-100 border-0 bg-light">
        <div class="card-body p-2">
          <div class="row g-2">
            <div class="col-6">
              <div class="small text-muted">Campagne</div>
              <div class="fw-bold text-truncate">{$agentState.campaignName || 'N/A'}</div>
            </div>
            <div class="col-6">
              <div class="small text-muted">Extension</div>
              <div class="fw-bold">{$agentState.extension || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Section -->
    <div class="col-md-3 mb-2 mb-md-0">
      <div class="card h-100 border-0 bg-light">
        <div class="card-body p-2">
          <div class="row g-2">
            <div class="col-4">
              <div class="small text-muted">Appels</div>
              <div class="fw-bold">{$agentState.callsToday || 0}</div>
            </div>
            <div class="col-4">
              <div class="small text-muted">Répondus</div>
              <div class="fw-bold">{$agentState.callsAnswered || 0}</div>
            </div>
            <div class="col-4">
              <div class="small text-muted">Temps moy.</div>
              <div class="fw-bold">{$agentState.avgTalkTime ? formatTime($agentState.avgTalkTime) : '00:00'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logout Button Section -->
    <div class="col-md-1 text-end">
      <button class="btn btn-sm btn-outline-danger" on:click={handleLogout}>
        <i class="bi bi-box-arrow-right"></i>
        <span class="d-none d-md-inline ms-1">Déconnexion</span>
      </button>
    </div>
  </div>

  <!-- Call Information Bar (only shown when call is active) -->
  {#if $agentState.callActive}
    <div class="row mt-2 py-1 bg-danger bg-opacity-10 rounded">
      <div class="col-md-2">
        <div class="d-flex align-items-center">
          <i class="bi bi-telephone-fill text-danger me-2"></i>
          <div>
            <div class="small text-muted">Durée</div>
            <div class="fw-bold">{formatTime(callDuration)}</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="d-flex align-items-center">
          <i class="bi bi-person-fill me-2"></i>
          <div>
            <div class="small text-muted">Contact</div>
            <div class="fw-bold">{$agentState.contactName || 'Inconnu'}</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="d-flex align-items-center">
          <i class="bi bi-telephone me-2"></i>
          <div>
            <div class="small text-muted">Numéro</div>
            <div class="fw-bold">{$agentState.phoneNumber || 'N/A'}</div>
          </div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="d-flex align-items-center">
          <i class="bi bi-currency-euro me-2"></i>
          <div>
            <div class="small text-muted">Coût</div>
            <div class="fw-bold">{formatCurrency(callCost)}</div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .avatar {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
  
  .avatar-container {
    position: relative;
  }
  
  .status-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid white;
  }
</style>
