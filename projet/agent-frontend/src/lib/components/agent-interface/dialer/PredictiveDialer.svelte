<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount, onDestroy } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import CallLogs from './CallLogs.svelte';
  import CampaignNumberList from './CampaignNumberList.svelte';
  import ProspectModal from './ProspectModal.svelte';
  import KeyboardShortcuts from './KeyboardShortcuts.svelte';
  import { addToast, success, error, warning, info } from '$lib/services/toastService';

  const dispatch = createEventDispatcher<{
    callInitiated: { phoneNumber: string, callId: string, contactName: string, leadId?: string };
    callEnded: { callId: string, duration: number };
    pauseStateChanged: { isPaused: boolean };
    prospectLoaded: { prospect: any };
    callReceived: { phoneNumber: string, callId: string, contactName: string, leadId?: string };
  }>();

  // Propriétés
  export let agentId: string = '';
  export let campaignId: string = '';
  export let disabled: boolean = false;
  export let canManualDial: boolean = false; // Permission pour les appels manuels
  export let apiBaseUrl: string = 'http://localhost:8000/api';
  export let callActive: boolean = false; // Indique si un appel est actuellement actif
  export let callEnded: boolean = false; // Indique si un appel vient de se terminer

  // État local
  let status: 'waiting' | 'ready' | 'dialing' | 'paused' = 'waiting';
  let waitingForCall: boolean = false;
  let manualNumber: string = '';
  let errorMessage: string = '';
  let pollingInterval: number | null = null;
  let showManualDialer: boolean = false;
  
  // Observer les changements de canManualDial pour mettre à jour l'état
  $: {
    if (!canManualDial && status !== 'dialing') {
      // Si l'agent est en pause, mettre à jour le statut
      status = 'paused';
      if (waitingForCall) {
        waitingForCall = false;
        console.log('Vérification des appels entrants suspendue pendant la pause');
      }
    } else if (canManualDial && status === 'paused') {
      // Si l'agent reprend son activité, revenir à l'état d'attente
      status = 'waiting';
    }
  }
  
  // Variables pour le mode prédictif continu
  let continuousPredictiveMode = false;
  let processedNumbers: string[] = [];
  
  // Variables pour comparer les statuts
  const STATUS_WAITING = 'waiting';
  const STATUS_READY = 'ready';
  const STATUS_DIALING = 'dialing';
  const STATUS_PAUSED = 'paused';
  
  // Observer les changements de callActive et callEnded pour mettre à jour l'état
  $: {
    if (callActive) {
      // Si un appel est actif, mettre à jour le statut
      status = 'dialing';
      console.log('PredictiveDialer: Appel actif détecté, statut mis à jour à "dialing"');
    } else if (callEnded) {
      // Uniquement réinitialiser si un appel vient de se terminer (callEnded = true)
      if (status === STATUS_DIALING) {
        status = 'waiting';
        console.log('PredictiveDialer: Fin d\'appel détectée, statut réinitialisé à "waiting"');
        
        // Si le mode prédictif continu est activé, appeler le prochain numéro après un court délai
        if (continuousPredictiveMode) {
          console.log('Mode prédictif continu: appel du prochain numéro dans 2 secondes...');
          setTimeout(() => {
            callNextNumber();
          }, 2000);
        }
      }
    }
  }
  
  // Observer directement les changements de callEnded pour détecter la fin d'appel même si le statut n'est pas 'dialing'
  $: if (callEnded && continuousPredictiveMode) {
    console.log('Fin d\'appel détectée via callEnded en mode prédictif continu');
    // Programmer l'appel suivant avec un délai plus long pour éviter les conflits
    setTimeout(() => {
      if (continuousPredictiveMode) {
        console.log('Tentative d\'appel du prochain numéro après fin d\'appel...');
        callNextNumber();
      }
    }, 3000);
  }
  
  // Ajouter un log pour déboguer les changements de statut et callActive
  $: console.log('Statut actuel:', status, 'callActive:', callActive, 'callEnded:', callEnded);
  
  // État pour les logs d'appels
  let showCallLogs: boolean = false;
  let callLogs: any[] = [];
  let isLoadingLogs: boolean = false;
  let campaignNumbers: any[] = [];
  let isLoadingNumbers: boolean = false;
  let showCampaignNumbers: boolean = false;
  
  // État pour le prospect actuel
  let currentProspect: any = null;
  let showProspectForm: boolean = false;
  let isLoadingProspect: boolean = false;
  let prospectNotes: string = '';
  
  // Fonction pour  // Vérifier que l'ID de l'agent est disponible
  async function ensureAgentId() {
    if (agentId) {
      console.log('ID agent disponible:', agentId);
      return true;
    }
    
    // TEMPORAIREMENT DÉSACTIVÉ - API non implémentée
    // Utiliser un ID simulé pour le développement
    try {
      // Simulation d'un ID agent récupéré
      agentId = localStorage.getItem('agent_id') || '1001';
      console.log('ID agent simulé pour le développement:', agentId);
      return true;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID de l\'agent:', error);
      return false;
    }
  }
  
  // Initialisation au chargement du composant
  onMount(async () => {
    // S'assurer que l'ID de l'agent est disponible
    await ensureAgentId();
    
    // Charger l'historique des appels et les numéros de campagne au chargement
    loadCallHistory();
    loadCampaignNumbers();
    
    // Configurer le polling pour vérifier les appels entrants
    pollingInterval = setInterval(checkForIncomingCalls, 3000);
    
    console.log('Composant PredictiveDialer initialisé avec agentId:', agentId);
  });
  
  // Fonction pour démarrer le mode prédictif
  // Fonction pour récupérer l'historique des appels
  async function loadCallHistory() {
    isLoadingLogs = true;
    errorMessage = '';
    
    try {
      // TEMPORAIREMENT DÉSACTIVÉ - API non implémentée
      // Utiliser des données simulées pour le développement
      console.log('Utilisation de données d\'historique d\'appels simulées');
      
      // Données simulées
      callLogs = [
        { call_id: '1', phone_number: '0123456789', contact_name: 'Jean Dupont', duration: 120, date: new Date().toISOString(), status: 'COMPLETED' },
        { call_id: '2', phone_number: '0987654321', contact_name: 'Marie Martin', duration: 45, date: new Date().toISOString(), status: 'NOANSWER' }
      ];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      errorMessage = `Erreur: ${error.message || 'Inconnue'}`;
    } finally {
      isLoadingLogs = false;
    }
  }
  
  // Fonction pour formater la durée en minutes:secondes
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Fonction pour récupérer les numéros à appeler pour la campagne
  async function loadCampaignNumbers() {
    isLoadingNumbers = true;
    errorMessage = '';
    
    try {
      // TEMPORAIREMENT DÉSACTIVÉ - API non implémentée
      // Utiliser des données simulées pour le développement
      console.log('Utilisation de numéros de campagne simulés');
      
      // Données simulées
      campaignNumbers = [
        { phone_number: '0123456789', first_name: 'Jean', last_name: 'Dupont', lead_id: '101' },
        { phone_number: '0987654321', first_name: 'Marie', last_name: 'Martin', lead_id: '102' },
        { phone_number: '0654321987', first_name: 'Pierre', last_name: 'Durand', lead_id: '103' },
        { phone_number: '0612345678', first_name: 'Sophie', last_name: 'Leroy', lead_id: '104' }
      ];
      
      showCampaignNumbers = true;
      console.log(`${campaignNumbers.length} numéros simulés disponibles pour la campagne`);
      
    } catch (error: any) {
      console.error('Erreur lors de la récupération des numéros:', error);
      // Ne pas afficher cette erreur à l'utilisateur, juste logger
    } finally {
      isLoadingNumbers = false;
    }
  }
  
  // Fonction pour appeler le prochain numéro de la liste en mode prédictif continu
  async function callNextNumber() {
    console.log('Recherche du prochain numéro à appeler...');
    
    // Vérifier si l'agent est disponible pour un nouvel appel
    if (callActive || status === 'dialing' || status === 'paused') {
      console.log('Agent non disponible pour un nouvel appel. Mode:', status, 'callActive:', callActive);
      // Programmer une nouvelle tentative dans 5 secondes si toujours en mode prédictif continu
      if (continuousPredictiveMode) {
        console.log('Nouvelle tentative programmée dans 5 secondes...');
        setTimeout(() => {
          if (continuousPredictiveMode) {
            callNextNumber();
          }
        }, 5000);
      }
      return;
    }
    
    // Activer le mode d'attente
    status = 'ready';
    waitingForCall = true;
    
    // Vérifier si nous avons des numéros disponibles
    if (campaignNumbers.length === 0) {
      console.log('Aucun numéro disponible dans la liste. Chargement des numéros...');
      await loadCampaignNumbers();
      
      // Si toujours pas de numéros, créer un numéro factice pour les tests
      if (campaignNumbers.length === 0) {
        console.log('Création d\'un numéro factice pour les tests');
        campaignNumbers = [{
          phone_number: '0123456789',
          first_name: 'Test',
          last_name: 'Utilisateur',
          lead_id: '12345'
        }];
      }
    }
    
    // Filtrer les numéros déjà appelés
    const availableNumbers = campaignNumbers.filter(num => 
      !processedNumbers.includes(num.phone_number)
    );
    
    console.log(`${availableNumbers.length} numéros disponibles sur ${campaignNumbers.length} total`);
    
    if (availableNumbers.length === 0) {
      console.log('Tous les numéros ont été appelés. Fin du mode prédictif continu.');
      continuousPredictiveMode = false;
      status = 'waiting';
      waitingForCall = false;
      alert('Tous les numéros de la liste ont été appelés.');
      return;
    }
    
    // Sélectionner le premier numéro disponible
    const nextNumber = availableNumbers[0];
    
    console.log('Prochain numéro à appeler:', nextNumber);
    
    if (!nextNumber || !nextNumber.phone_number) {
      console.error('Aucun numéro valide trouvé dans la liste');
      return;
    }
    
    // Ajouter le numéro à la liste des numéros traités
    processedNumbers.push(nextNumber.phone_number);
    
    // Utiliser la fonction callFromList pour initier l'appel
    const contactName = nextNumber.first_name ? 
      `${nextNumber.first_name} ${nextNumber.last_name || ''}` : 
      'Client';
    
    console.log('Initiation d\'un appel vers', nextNumber.phone_number, '(', contactName, ')');
    
    // Arrêter le mode d'attente d'appel
    waitingForCall = false;
    
    // Appeler le numéro sélectionné
    callFromList(
      nextNumber.phone_number,
      contactName,
      nextNumber.lead_id
    );
  }
  
  // Fonction pour simuler un appel prédictif en utilisant un numéro aléatoire de la liste
  async function simulatePredictiveCall() {
    console.log('Tentative de simulation d\'un appel prédictif...');
    console.log('status:', status);
    console.log('waitingForCall:', waitingForCall);
    console.log('campaignNumbers:', campaignNumbers);
    
    // Activer le mode prédictif continu
    continuousPredictiveMode = true;
    
    // Notification pour informer l'agent
    success('Mode prédictif continu activé. Les appels seront passés automatiquement.');
    
    // Appeler le premier numéro
    callNextNumber();
  }
  
  // Fonction pour sortir l'agent de pause
  async function resumePredictive() {
    try {
      // TEMPORAIREMENT DÉSACTIVÉ - API non implémentée
      // Simuler une sortie de pause réussie
      console.log('Simulation de sortie de pause réussie');
      
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      status = 'waiting';
      console.log('Agent sorti de pause avec succès (simulé)');
      return true;
    } catch (err: any) {
      console.error('Erreur lors de la sortie de pause:', err);
      errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sortie de pause';
      return false;
    }
  }
  
  async function startPredictive() {
    if (disabled) return;
    
    // Si l'agent est en pause, le sortir de pause d'abord
    if (status === 'paused') {
      console.log('Agent en pause, tentative de sortie de pause avant de mettre en mode prêt...');
      const resumed = await resumePredictive();
      if (!resumed) {
        console.error('Impossible de sortir l\'agent de pause');
        return;
      }
    }
    
    // Réinitialiser la liste des numéros traités pour un nouveau cycle d'appels
    processedNumbers = [];
    continuousPredictiveMode = true;
    console.log('Mode prédictif continu activé');
    
    status = 'ready';
    waitingForCall = true;
    errorMessage = '';
    
    // TEMPORAIREMENT DÉSACTIVÉ - API non implémentée
    // Simuler une réponse réussie
    try {
      console.log('Simulation de mise en attente d\'appels réussie');
      
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Charger l'historique des appels et les numéros de la campagne
      loadCallHistory();
      loadCampaignNumbers();
      
      waitingForCall = true;
      status = 'ready';
      
      // Simuler un appel après un court délai (entre 3 et 10 secondes)
      const delay = Math.floor(Math.random() * 7000) + 3000;
      setTimeout(simulatePredictiveCall, delay);
    } catch (error: any) {
      console.error('Erreur:', error);
      errorMessage = error.message;
      waitingForCall = false;
      status = 'waiting';
    }
  }
  
  // Fonction pour mettre en pause le mode prédictif
  // Fonction pour mettre l'agent en pause (utilise la route /agent/pause comme le bouton principal)
  async function pausePredictive() {
    // Désactiver le mode prédictif continu
    continuousPredictiveMode = false;
    console.log('Mode prédictif continu désactivé suite à la mise en pause');
    
    // Notification pour informer l'agent
    info('Mode prédictif désactivé. Les appels automatiques sont arrêtés.');
    
    // Arrêter l'attente d'appel
    waitingForCall = false;
    status = 'paused';
    
    // Si un appel est en cours, informer le parent pour le terminer
    if (callActive) {
      console.log('Appel en cours détecté lors de la mise en pause, demande de fin d\'appel');
      // Utiliser le format attendu pour l'événement callEnded
      dispatch('callEnded', { 
        callId: 'pause-' + Date.now(), // Générer un ID unique
        duration: 0 // Durée nulle car l'appel est interrompu
      });
    }
    
    try {
      // Utiliser la même route que le bouton principal de pause
      const response = await fetch(`${apiBaseUrl}/agent/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentId,
          campaignId
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Agent en pause', data);
        // Désactiver la possibilité de passer des appels
        dispatch('pauseStateChanged', { isPaused: true });
        
        // Réinitialiser la liste des numéros traités
        processedNumbers = [];
      } else {
        console.error('Erreur lors de la mise en pause:', response.status);
        errorMessage = 'Erreur lors de la mise en pause';
      }
    } catch (err: unknown) {
      console.error('Erreur lors de la mise en pause:', err);
      errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise en pause';
    }
  }
  
  // Fonction pour réinitialiser l'état du composeur
  export function resetDialerStatus(preserveContinuousMode = true) {
    console.log('PredictiveDialer: Réinitialisation forcée du statut, préservation du mode continu:', preserveContinuousMode);
    
    // Sauvegarder l'état du mode prédictif continu
    const wasContinuous = continuousPredictiveMode;
    
    // Vérifier si l'agent est en mode "ready" avant de réinitialiser
    const wasReady = status === 'ready';
    
    status = 'waiting';
    // Ne réinitialiser waitingForCall que si l'agent n'était pas en attente d'appel
    if (!wasReady) {
      waitingForCall = false;
    }
    errorMessage = '';
    
    // Préserver le mode prédictif continu si demandé
    if (!preserveContinuousMode) {
      continuousPredictiveMode = false;
      console.log('Mode prédictif continu désactivé lors de la réinitialisation');
    } else if (wasContinuous) {
      // Garantir que le mode prédictif continu reste actif
      continuousPredictiveMode = true;
      console.log('Mode prédictif continu maintenu actif');
      
      // Programmer l'appel du prochain numéro avec un délai plus court
      setTimeout(() => {
        if (continuousPredictiveMode && !callActive) {
          console.log('Appel du prochain numéro après réinitialisation...');
          callNextNumber();
        } else {
          console.log('Impossible d\'appeler le prochain numéro: callActive =', callActive, 'continuousPredictiveMode =', continuousPredictiveMode);
        }
      }, 1500);
    }
    
    // Afficher l'état actuel des variables
    console.log('État des variables après réinitialisation:', {
      status,
      waitingForCall,
      disabled,
      canManualDial,
      wasReady,
      wasContinuous,
      continuousPredictiveMode
    });
  }
  
  // Fonction pour composer un numéro manuellement
  async function dialManually() {
    // Vérifier si l'appel est possible
    if (!canManualDial || !manualNumber || disabled || ['dialing', 'ready'].includes(status)) {
      if (!canManualDial) {
        errorMessage = 'Impossible de passer un appel pendant la pause';
        setTimeout(() => {
          errorMessage = '';
        }, 3000);
      }
      return;
    }
    
    status = 'dialing';
    waitingForCall = false;
    errorMessage = '';
    
    // Nettoyer le numéro (enlever espaces, tirets, etc.)
    const cleanNumber = manualNumber.replace(/[\s\-\(\)]/g, '');
    
    // Vérifier que le numéro est valide
    if (cleanNumber.length < 8) {
      errorMessage = 'Numéro de téléphone invalide';
      status = 'waiting';
      return;
    }
    
    // S'assurer que l'ID de l'agent est défini
    const agentIdAvailable = await ensureAgentId();
    if (!agentIdAvailable) {
      console.error('Erreur: Impossible de récupérer l\'ID de l\'agent');
      errorMessage = 'Impossible de récupérer l\'ID de l\'agent. Veuillez vous reconnecter.';
      status = 'waiting';
      return;
    }
    
    console.log('Initiation d\'appel manuel avec:', { agentId, campaignId, phoneNumber: cleanNumber });
    
    // Envoyer la requête au backend
    fetch(`${apiBaseUrl}/agent/manual-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentId,
        campaignId: campaignId || 'DEFAULT', // Fournir une valeur par défaut si non définie
        phoneNumber: cleanNumber,
        contactName: '', // Ajouter un nom de contact vide par défaut
        leadId: null // Pas de leadId pour les appels manuels directs
      }),
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors de la composition du numéro');
      }
      return response.json();
    })
    .then(data => {
      console.log('Appel manuel initié', data);
      
      // Informer le composant parent qu'un appel a été initié
      dispatch('callInitiated', {
        phoneNumber: cleanNumber,
        callId: data.callId,
        contactName: 'Client' // Valeur par défaut pour les appels manuels
      });
      manualNumber = '';
      showManualDialer = false;
      
      // Rafraîchir l'historique des appels après un appel réussi
      loadCallHistory();
    })
    .catch(error => {
      console.error('Erreur:', error);
      errorMessage = error.message;
      status = 'waiting';
    });
  }
  
  // Fonction pour appeler un numéro depuis la liste des numéros de campagne
  async function callFromList(phoneNumber: string, contactName: string, leadId?: string) {
    // Ne pas bloquer les appels depuis la simulation prédictive
    // Vérifier uniquement si l'appel est déjà en cours (status === 'dialing')
    if (disabled && status === 'dialing') {
      console.log('Appel déjà en cours, impossible d\'initier un nouvel appel');
      return;
    }
    
    console.log('Appel depuis la liste avec statut:', status);
    
    // Forcer la mise à jour du statut à 'dialing'
    status = 'dialing';
    waitingForCall = false;
    errorMessage = '';
    
    // Forcer la mise à jour de l'interface
    setTimeout(() => {
      status = 'dialing';
      console.log('Statut forcé à "dialing" après délai');
    }, 100);
    
    // Vérifier si le numéro de téléphone est défini
    if (!phoneNumber && !leadId) {
      console.error('Erreur: Ni le numéro de téléphone ni le leadId ne sont définis');
      errorMessage = 'Numéro de téléphone et ID de prospect manquants';
      status = 'waiting';
      return;
    }
    
    // Nettoyer le numéro (enlever espaces, tirets, etc.) s'il est défini
    const cleanedNumber = phoneNumber ? phoneNumber.replace(/[\s\-\(\)]/g, '') : '';
    
    // S'assurer que l'ID de l'agent est défini
    const agentIdAvailable = await ensureAgentId();
    if (!agentIdAvailable) {
      console.error('Erreur: Impossible de récupérer l\'ID de l\'agent');
      errorMessage = 'Impossible de récupérer l\'ID de l\'agent. Veuillez vous reconnecter.';
      status = 'waiting';
      return;
    }
    
    // Préparer les données pour la requête
    const requestData = {
      agentId,
      campaignId: campaignId || 'DEFAULT', // Fournir une valeur par défaut si non définie
      phoneNumber: cleanedNumber,
      contactName: contactName || '', // Ajouter le nom du contact pour les logs
      leadId: leadId || null // Ajouter l'ID du prospect si disponible
    };
    
    console.log('Initiation d\'appel avec:', requestData);
    
    // Appeler le backend pour initier l'appel
    fetch(`${apiBaseUrl}/agent/manual-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData),
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors de l\'initiation de l\'appel');
      }
      return response.json();
    })
    .then(data => {
      console.log('Appel manuel initié', data);
      
      // Récupérer les informations du prospect
      loadProspectData(cleanedNumber, leadId || data.leadId);
      
      // Informer le composant parent qu'un appel a été initié
      dispatch('callInitiated', {
        phoneNumber: cleanedNumber,
        callId: data.callId,
        contactName: contactName,
        leadId: leadId || data.leadId
      });
      
      // Forcer à nouveau le statut à 'dialing' après la réponse du serveur
      status = 'dialing';
      console.log('Statut forcé à "dialing" après réponse du serveur');
      
      // Afficher le statut du mode prédictif continu
      if (continuousPredictiveMode) {
        console.log('Mode prédictif continu actif. Numéros traités:', processedNumbers.length);
      }
      
      // Rafraîchir l'historique des appels et la liste des numéros après un appel réussi
      loadCallHistory();
      loadCampaignNumbers();
    })
    .catch(error => {
      console.error('Erreur:', error);
      errorMessage = error.message;
      status = 'waiting';
    });
  }
  
  // Fonction pour sauvegarder les données du prospect
  async function saveProspectData() {
    if (!currentProspect) return;
    
    try {
      // Mettre à jour les commentaires avec les notes
      currentProspect.comments = prospectNotes;
      
      const response = await fetchWithAuth(`${apiBaseUrl}/agent/save-prospect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentProspect)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde des données du prospect');
      }
      
      const data = await response.json();
      console.log('Données du prospect sauvegardées:', data);
      
      // Mettre à jour le prospect actuel avec les données sauvegardées
      currentProspect = data.prospect || currentProspect;
      
      // Afficher un message de succès temporaire
      const tempMessage = errorMessage;
      errorMessage = 'Données sauvegardées avec succès!';
      setTimeout(() => {
        errorMessage = tempMessage;
      }, 3000);
      
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des données du prospect:', error);
      errorMessage = `Erreur: ${error.message || 'Inconnue'}`;
    }
  }
  
  // Fonction pour charger les données du prospect
  async function loadProspectData(phoneNumber: string, leadId?: string) {
    isLoadingProspect = true;
    showProspectForm = true;
    
    console.log(`Chargement des données du prospect: ${phoneNumber}, ID: ${leadId || 'non défini'}`);
    
    // Forcer la mise à jour du statut pour afficher "En appel"
    status = STATUS_DIALING;
    
    // Notification pour informer l'agent
    info(`Appel en cours vers ${phoneNumber}`);
    
    // Rechercher les informations du prospect dans la liste des numéros de campagne
    let prospectInfo = campaignNumbers.find(num => num.phone_number === phoneNumber);
    console.log("Données trouvées dans campaignNumbers:", prospectInfo);
    
    // Réinitialiser le prospect actuel pour éviter d'afficher des données d'un appel précédent
    currentProspect = null;
    // Informer le composant parent que le prospect a été réinitialisé
    dispatch('prospectLoaded', { prospect: null });
    
    // Créer un objet prospect avec les données disponibles
    currentProspect = {
      // Champs principaux
      lead_id: leadId || (prospectInfo?.lead_id || ''),
      list_id: prospectInfo?.list_id || '',
      entry_date: new Date().toISOString().slice(0, 16),
      status: prospectInfo?.status || 'NEW',
      vendor_lead_code: '',
      source_id: '',
      
      // Informations de contact
      phone_code: '',
      phone_number: phoneNumber,
      alt_phone: '',
      title: '',
      first_name: prospectInfo?.first_name || '',
      middle_initial: '',
      last_name: prospectInfo?.last_name || '',
      email: '',
      
      // Adresse
      address1: '',
      address2: '',
      address3: '',
      city: '',
      state: '',
      province: '',
      postal_code: '',
      country_code: '',
      
      // Informations personnelles
      gender: 'U',
      date_of_birth: '',
      security_phrase: '',
      
      // Statistiques d'appel
      called_count: 0,
      last_local_call_time: '',
      called_since_last_reset: 'N',
      
      // Autres
      rank: 0,
      owner: '',
      comments: ''
    };
    
    // Initialiser les notes
    prospectNotes = '';
    console.log('Prospect créé avec les données disponibles:', currentProspect);
    
    // Informer le composant parent que les données du prospect ont été chargées
    // Utiliser setTimeout pour s'assurer que l'UI a le temps de se mettre à jour
    setTimeout(() => {
      dispatch('prospectLoaded', { prospect: { ...currentProspect } });
    }, 100);
    
    // Essayer de récupérer les données du prospect depuis le backend en arrière-plan
    // sans bloquer l'affichage du formulaire
    try {
      // Construire l'URL avec le numéro de téléphone et l'ID du prospect si disponible
      let url = `${apiBaseUrl}/agent/prospect-data?phone=${encodeURIComponent(phoneNumber)}`;
      if (leadId) {
        url += `&lead_id=${encodeURIComponent(leadId)}`;
      }
      
      console.log('Requête API pour les données du prospect:', url);
      
      fetchWithAuth(url)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          return null;
        })
        .then(data => {
          if (data && data.prospect) {
            console.log('Données du prospect récupérées depuis le backend:', data.prospect);
            currentProspect = data.prospect;
            prospectNotes = currentProspect.comments || '';
            
            // S'assurer que le formulaire est visible
            showProspectForm = true;
            
            // Notification pour informer l'agent
            success(`Fiche prospect chargée: ${currentProspect.first_name} ${currentProspect.last_name}`);
            
            // Informer le composant parent que les données du prospect ont été mises à jour
            // Créer une copie pour éviter les problèmes de référence
            setTimeout(() => {
              dispatch('prospectLoaded', { prospect: { ...currentProspect } });
            }, 100);
          } else {
            // Même si aucune donnée n'est retournée, on garde le formulaire ouvert avec les données de base
            console.log('Aucune donnée complémentaire reçue du backend, utilisation des données de base');
            warning('Informations limitées disponibles pour ce contact');
          }
        })
        .catch(error => {
          console.warn('Erreur lors de la récupération des données du prospect en arrière-plan:', error);
          // Afficher une notification d'erreur mais garder le formulaire ouvert
          error('Impossible de récupérer toutes les informations du prospect');
          
          // Même en cas d'erreur, s'assurer que les données de base sont envoyées au parent
          setTimeout(() => {
            dispatch('prospectLoaded', { prospect: { ...currentProspect } });
          }, 100);
        });
    } catch (error) {
      console.warn('Erreur lors de la tentative de récupération des données du prospect:', error);
    } finally {
      isLoadingProspect = false;
    }
  }
  
  // Fonction pour vérifier s'il y a des appels entrants
  // Variable pour compter le nombre de vérifications sans appel
  let checkCounter = 0;
  
  function checkForIncomingCalls() {
    // Ne pas vérifier si l'agent n'est pas en attente d'appel
    if (!waitingForCall) return;
    
    fetch(`${apiBaseUrl}/agent/check-calls`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification des appels');
      }
      return response.json();
    })
    .then(data => {
      // Limiter les logs pour éviter de surcharger la console
      checkCounter++;
      if (checkCounter % 10 === 0) {
        console.log(`Vérification d'appels #${checkCounter} - Aucun appel trouvé`);
      }
      
      // Vérifier si nous avons un appel (soit avec data.call ou data.callInfo)
      const callData = data.call || (data.hasCall && data.callInfo);
      
      if (callData) {
        console.log('Appel entrant détecté:', callData);
        
        // Un appel a été trouvé
        waitingForCall = false;
        status = 'dialing';
        
        // Réinitialiser le compteur
        checkCounter = 0;
        
        // Récupérer les informations de l'appel
        const phoneNumber = callData.phone_number || callData.phoneNumber;
        const callId = callData.call_id || callData.callId || callData.uniqueid;
        const leadId = callData.lead_id || callData.leadId;
        const contactName = callData.contact_name || (callData.customerInfo && callData.customerInfo.first_name) || 'Client';
        
        // Charger les données du prospect
        loadProspectData(phoneNumber, leadId);
        
        // Informer le composant parent qu'un appel a été reçu
        dispatch('callReceived', {
          phoneNumber: phoneNumber,
          callId: callId,
          contactName: contactName,
          leadId: leadId
        });
        
        // Également émettre l'événement callInitiated pour cohérence avec les appels manuels
        dispatch('callInitiated', {
          phoneNumber: phoneNumber,
          callId: callId,
          contactName: contactName,
          leadId: leadId
        });
      }
    })
    .catch(error => {
      console.error('Erreur lors de la vérification des appels:', error);
      // Ne pas afficher cette erreur à l'utilisateur, juste logger
    });
  }
  
  // Gérer l'entrée du numéro de téléphone
  function handleNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    // Autoriser uniquement les chiffres, +, -, espaces et parenthèses
    manualNumber = input.value.replace(/[^\d\+\-\s\(\)]/g, '');
  }
  
  // Démarrer/arrêter le polling lors du montage/démontage du composant
  onMount(() => {
    // Vérifier les appels entrants toutes les 3 secondes
    pollingInterval = window.setInterval(checkForIncomingCalls, 3000);
    console.log('Vérification des appels entrants activée');
    
    return () => {
      if (pollingInterval) {
        window.clearInterval(pollingInterval);
        console.log('Vérification des appels entrants désactivée');
      }
    };
  });
  
  // Observer les changements d'état pour arrêter le polling quand nécessaire
  $: if (status === 'dialing' && pollingInterval) {
    // Arrêter la vérification des appels entrants pendant un appel
    window.clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('Vérification des appels entrants suspendue pendant l\'appel');
  } else if (status === 'ready' && !pollingInterval && waitingForCall) {
    // Réactiver la vérification si l'agent est prêt mais pas en appel
    pollingInterval = window.setInterval(checkForIncomingCalls, 3000);
    console.log('Vérification des appels entrants réactivée');
  }
  
  // Réinitialiser l'état lorsque disabled change
  $: if (disabled) {
    waitingForCall = false;
    status = 'waiting';
  }
  
  // Réinitialiser l'état lorsqu'un appel se termine
  $: if (callEnded && status === 'dialing') {
    console.log('Appel terminé, réinitialisation de l\'interface');
    resetCallState();
  }
  
  // Mettre à jour l'état en fonction de callActive
  $: if (callActive && status !== 'dialing') {
    status = 'dialing';
  }
  
  // Fonction pour réinitialiser l'état après la fin d'un appel
  function resetCallState() {
    // Ne pas réinitialiser waitingForCall si on est en mode prédictif continu
    if (!continuousPredictiveMode) {
      waitingForCall = false;
      status = 'waiting';
    } else {
      // En mode prédictif continu, on reste en mode 'ready' pour le prochain appel
      status = 'ready';
      console.log('Mode prédictif continu: maintien du statut "ready" pour le prochain appel');
    }
    
    showProspectForm = false;
    currentProspect = null;
    prospectNotes = '';
  }
  
  // Fonction pour afficher/masquer le composeur manuel
  function toggleManualDialer() {
    if (canManualDial && !disabled) {
      showManualDialer = !showManualDialer;
    }
  }
</script>

<div class="bg-white rounded-lg shadow-lg p-4 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300">
  <h2 class="text-lg font-bold text-blue-700 mb-4 border-b pb-2 flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
    Système d'appels
  </h2>
  
  {#if errorMessage}
    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r-md shadow-sm">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <p>{errorMessage}</p>
      </div>
    </div>
  {/if}
  
  <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="bg-gray-50 px-3 py-2 rounded-lg inline-flex items-center space-x-2 shadow-sm border border-gray-100">
          <span class="font-medium text-gray-700">Statut:</span> 
          {#if callActive || status === 'dialing'}
            <!-- Afficher "En appel" si callActive est true OU si status est 'dialing' -->
            <span class="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium shadow-sm flex items-center">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              En appel
            </span>
          {:else if status === STATUS_PAUSED}
            <span class="ml-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium shadow-sm flex items-center">
              <span class="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
              En pause
            </span>
          {:else if status === STATUS_READY}
            <span class="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium shadow-sm flex items-center">
              <span class="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Prêt à recevoir
            </span>
          {:else}
            <!-- Statut par défaut: En attente -->
            <span class="ml-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium shadow-sm flex items-center">
              <span class="w-2 h-2 bg-gray-400 rounded-full mr-2 animate-pulse"></span>
              En attente
            </span>
          {/if}
        </div>
      </div>
      {#if waitingForCall}
        <div class="flex items-center text-blue-600">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          En attente d'appel...
        </div>
      {/if}
    </div>
    
    <!-- Boutons de contrôle -->
    <div class="flex flex-wrap gap-2">
      {#if status === STATUS_WAITING || status === STATUS_PAUSED}
        <button 
          on:click={startPredictive} 
          disabled={disabled || status === STATUS_READY || waitingForCall}
          class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            Prêt à recevoir
          </div>
        </button>
        
        <button 
          on:click={pausePredictive} 
          disabled={disabled || status === 'paused' || !canManualDial}
          class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            Pause
          </div>
        </button>
      {/if}
      
      {#if canManualDial && (status === 'waiting' || status === 'paused')}
        <button 
          on:click={toggleManualDialer}
          disabled={disabled}
          class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            Appel manuel
          </div>
        </button>
      {/if}
    </div>
    
    <!-- Indicateur de pause (affiché en haut du composeur) -->
    {#if !canManualDial}
      <div class="mt-4 p-4 border-l-4 border-yellow-500 bg-yellow-100 text-yellow-700 rounded-lg shadow-sm flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div>
          <h3 class="font-bold">Agent en pause</h3>
          <p>Vous ne pouvez pas passer d'appels tant que vous êtes en pause. Cliquez sur "Reprendre" dans la barre supérieure pour activer le composeur.</p>
        </div>
      </div>
    {/if}
    
    <!-- Composeur manuel (affiché uniquement si activé) -->
    {#if showManualDialer && (status === 'waiting' || status === 'paused')}
      <div class="mt-4 p-4 border border-gray-200 rounded-lg shadow-sm {!canManualDial ? 'opacity-60' : ''}">
        <h3 class="text-md font-medium mb-2">Composeur manuel</h3>
        
        <div class="flex">
          <input 
            type="tel"
            bind:value={manualNumber}
            on:input={handleNumberInput}
            placeholder="Entrez un numéro de téléphone"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            on:click={dialManually}
            disabled={!manualNumber || disabled || status === STATUS_DIALING || !canManualDial}
            class="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              {!canManualDial ? 'En pause' : 'Appeler'}
            </span>
          </button>
        </div>
        
        <div class="mt-2 text-xs text-gray-500">
          <p>Entrez un numéro de téléphone valide pour effectuer un appel manuel.</p>
        </div>
      </div>
    {/if}
    
    <!-- Affichage des logs d'appels -->
    <div class="mt-6 border-t pt-4">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-md font-medium text-blue-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
          </svg>
          Historique des appels
        </h3>
        <div class="flex space-x-2">
          <button 
            on:click={() => loadCallHistory()}
            class="p-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors shadow-sm"
            title="Rafraîchir l'historique"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
          </button>
          <button 
            on:click={() => showCallLogs = !showCallLogs}
            class="p-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors flex items-center space-x-1 shadow-sm"
            title="Afficher l'historique"
          >
            <span class="text-xs font-medium">{showCallLogs ? 'Masquer' : 'Afficher'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M{showCallLogs ? '5.293 7.293' : '14.707 12.707'} a1 1 0 01-1.414 0L10 {showCallLogs ? '10.586' : '9.414'}l-3.293 {showCallLogs ? '-3.293' : '3.293'} a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {#if showCallLogs}
        <CallLogs {callLogs} isLoading={isLoadingLogs} errorMessage={errorMessage} />
      {/if}
    </div>
    
    <!-- Indicateur de progression des appels en mode prédictif continu -->
    {#if continuousPredictiveMode}
      <div class="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-sm font-medium text-gray-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
            </svg>
            Progression de la campagne
          </h3>
          <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
            {processedNumbers.length} / {campaignNumbers.length} appel{processedNumbers.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style="width: {Math.min(100, (processedNumbers.length / Math.max(1, campaignNumbers.length)) * 100)}%"></div>
        </div>
        <div class="flex justify-between text-xs text-gray-500">
          <span>{campaignNumbers.length - processedNumbers.length} numéros restants</span>
          <span>Progression: {Math.round((processedNumbers.length / Math.max(1, campaignNumbers.length)) * 100)}%</span>
        </div>
        
        <!-- Raccourcis clavier -->
        <div class="mt-3 text-xs text-gray-600 bg-gray-100 p-2 rounded border border-gray-200">
          <div class="font-medium mb-1">Raccourcis clavier:</div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1">
            <div><kbd class="px-1.5 py-0.5 bg-white border border-gray-300 rounded shadow-sm">Espace</kbd> Pause/Reprendre</div>
            <div><kbd class="px-1.5 py-0.5 bg-white border border-gray-300 rounded shadow-sm">H</kbd> Raccrocher</div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Le formulaire du prospect a été supprimé car il est maintenant affiché dans la colonne centrale de la page agent -->
    
    <!-- Affichage des numéros de la campagne -->
    <div class="mt-6 border-t pt-4">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-md font-medium text-blue-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          Numéros à appeler
        </h3>
        <div class="flex space-x-2">
          <button 
            on:click={() => loadCampaignNumbers()}
            class="p-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors shadow-sm"
            title="Rafraîchir les numéros"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
          </button>
          <button 
            on:click={() => showCampaignNumbers = !showCampaignNumbers}
            class="p-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors flex items-center space-x-1 shadow-sm"
            title="Afficher les numéros"
          >
            <span class="text-xs font-medium">{showCampaignNumbers ? 'Masquer' : 'Afficher'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M{showCampaignNumbers ? '5.293 7.293' : '14.707 12.707'} a1 1 0 01-1.414 0L10 {showCampaignNumbers ? '10.586' : '9.414'}l-3.293 {showCampaignNumbers ? '-3.293' : '3.293'} a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {#if showCampaignNumbers}
        <CampaignNumberList
          campaignNumbers={campaignNumbers}
          isLoading={isLoadingNumbers}
          errorMessage={errorMessage}
          disabled={disabled}
          status={status}
          callFromList={callFromList}
        />
      {/if}
    </div>
  </div>
