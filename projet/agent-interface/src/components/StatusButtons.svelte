<script lang="ts">
  import { onMount, afterUpdate, createEventDispatcher } from 'svelte';
  import { AGENT_STATUSES } from '../stores/agent';
  import { agentStatus, updateStatus, setAgentReady, setAgentPaused, setAgentLogout } from '../stores/agentStatus';
  import { api } from '../utils/fetchWithAuth';
  import { canMakeApiCall, recordApiCall } from '../utils/apiThrottle';
  import { get } from 'svelte/store';
  
  // Créer un dispatcher d'événements pour communiquer avec le composant parent
  const dispatch = createEventDispatcher();
  
  // Props
  export let onPauseClick: () => void;
  
  // Utiliser directement le nouveau store agentStatus avec le préfixe $ pour une réactivité automatique
  // Cela garantit que les changements du store sont immédiatement reflétés dans le composant
  $: console.log('StatusButtons - Statut actuel:', $agentStatus.status, 'Code de pause:', $agentStatus.pauseCode);
  
  // Initialiser le statut au chargement du composant
  onMount(() => {
    console.log('StatusButtons - Initialisation');
    // Vérifier si le statut est PAUSED
    if ($agentStatus.status === AGENT_STATUSES.PAUSED) {
      console.log('StatusButtons - L\'agent est en pause avec le code:', $agentStatus.pauseCode);
    }
  });
  
  // Nous utilisons maintenant l'utilitaire apiThrottle pour la limitation des appels API
  
  // Fonction pour mettre l'agent en statut prêt
  async function handleReady() {
    console.log('StatusButtons - Clic sur bouton Prêt');
    
    if (get(agentStatus).status !== AGENT_STATUSES.READY && !get(agentStatus).callActive) {
      try {
        console.log('Changement de statut vers READY');
        
        // Mettre à jour le store agentStatus directement
        updateStatus(AGENT_STATUSES.READY);
        
        // Notifier le composant parent du changement de statut
        dispatch('statusChange', { status: AGENT_STATUSES.READY });
        
        // Envoyer immédiatement la mise à jour au serveur
        sendStatusToServer(AGENT_STATUSES.READY);
      } catch (err) {
        console.error('Erreur lors de la mise en statut prêt:', err);
      }
    }
  }
  
  // Fonction pour envoyer le statut au serveur sans throttling
  async function sendStatusToServer(status) {
    // Appel API direct sans vérification de throttling
    try {
      console.log(`Envoi du statut ${status} au serveur`);
      const response = await api.post('/agent/status', {
        status: status
      });
      
      if (!response.ok) {
        console.error('Erreur lors de la mise à jour du statut côté serveur:', response.status);
      } else {
        console.log('Statut mis à jour avec succès sur le serveur');
        // Enregistrer l'appel API réussi
        recordApiCall();
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du statut au serveur:', error);
    }
  }
  
  // Fonction pour ouvrir le modal de pause
  function handlePause() {
    console.log('StatusButtons - Clic sur bouton Pause');
    
    if (!get(agentStatus).callActive) {
      try {
        // Appeler la fonction pour ouvrir le modal de pause
        onPauseClick();
        
        // Note: Le changement de statut vers PAUSED sera géré par le composant parent
        // lorsque l'utilisateur sélectionnera un code de pause dans le modal
      } catch (err) {
        console.error('Erreur lors de l\'ouverture du modal de pause:', err);
      }
    }
  }
  
  // Note: La fonction de déconnexion a été supprimée car elle est gérée ailleurs dans l'application
  
  // Après chaque mise à jour du composant
  afterUpdate(() => {
    console.log('StatusButtons - afterUpdate - Statut actuel:', get(agentStatus).status);
  });
</script>

<div class="d-flex justify-content-center gap-3 mt-3">
  <!-- Bouton Prêt -->
  <button 
    class="btn {$agentStatus.status === AGENT_STATUSES.READY ? 'btn-success' : 'btn-outline-success'}" 
    on:click={handleReady}
    disabled={$agentStatus.callActive}
    title="Prêt"
  >
    <i class="bi bi-check-circle-fill me-2"></i>
    Prêt
  </button>
  
  <!-- Bouton Pause -->
  <button 
    class="btn {$agentStatus.status === AGENT_STATUSES.PAUSED ? 'btn-warning' : 'btn-outline-warning'}" 
    on:click={handlePause}
    disabled={$agentStatus.callActive}
    title="Pause"
  >
    <i class="bi bi-pause-circle-fill me-2"></i>
    Pause
  </button>
</div>

<!-- Pas besoin de style personnalisé car nous utilisons les classes Bootstrap -->
