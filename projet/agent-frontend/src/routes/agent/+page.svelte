
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  
  // Importer les composants
  import AgentHeader from '$lib/components/agent-interface/header/AgentHeader.svelte';
  import PredictiveDialer from '$lib/components/agent-interface/dialer/PredictiveDialer.svelte';
  import CallControls from '$lib/components/agent-interface/call-controls/CallControls.svelte';
  import ProspectForm from '$lib/components/agent-interface/prospect-form/ProspectForm.svelte';
  import DispositionPanel from '$lib/components/agent-interface/disposition/DispositionPanel.svelte';
  
  // Importer le service WebRTC
  import * as webrtcService from '$lib/services/webrtcService';
  import { simulationMode } from '$lib/services/webrtcService';
  import { sipStatus, callStatus, currentSession } from '$lib/services/webrtcService';
  
  // URL de base de l'API
  const API_BASE_URL = 'http://localhost:8000/api';
  
  // Configuration WebRTC
  const ASTERISK_SERVER = 'localhost';
  const ASTERISK_WEBRTC_PORT = '8088';
  const ASTERISK_SIP_DOMAIN = 'localhost';
  
  // État de l'agent
  let agentInfo = {
    name: 'Agent',
    id: '',
    extension: '',
    campaign: '',
    status: 'Disponible',
    sipPassword: 'welcome' // Mot de passe SIP par défaut
  };
  
  // Statistiques d'appels
  let callStats = {
    today: 0,
    completed: 0,
    successRate: 0
  };
  
  // État de l'appel
  let callActive = false;
  let callMuted = false;
  let callOnHold = false;
  let callDuration = 0;
  let callDurationInterval: ReturnType<typeof setInterval> | null = null;
  let recording = false;
  let callJustEnded = false; // Indique qu'un appel vient de se terminer
  
  // État WebRTC
  let sipConnected = false;
  let sipRegistered = false;
  // Forcer l'activation du mode simulation pour permettre les appels
  simulationMode.set(true);
  let webrtcInitialized = false;
  let isSimulationMode = false; // Mode simulation actif
  
  // Informations sur l'appel en cours
  let currentCall = {
    callId: '',
    phoneNumber: '',
    customerName: '',
    startTime: null as Date | null
  };
  
  // Informations client
  let customer = {
    name: '',
    phone: ''
  };
  
  // Données du prospect actuel
  let currentProspect: any = null;
  let showProspectModal: boolean = false; // Contrôle l'affichage de la boîte de dialogue modale du prospect
  
  // Script
  interface ScriptSection {
    id: string;
    title: string;
    content: string;
    order: number;
  }
  
  interface Script {
    id: string;
    name: string;
    description: string;
    sections: ScriptSection[];
  }
  
  let currentScript: Script | null = null;
  
  // État de l'interface
  let isLoading = true;
  let error = '';
  let showDisposition = false;
  let canManualDial = true; // Permission pour les appels manuels
  
  // Variables pour l'API Web Audio
  let audioContext: AudioContext | undefined;
  let oscillator: OscillatorNode | undefined;
  let gainNode: GainNode | undefined;
  let dialToneInterval: ReturnType<typeof setInterval> | null = null; // Intervalle pour le son de tonalité d'appel
  let ringtoneAudio: HTMLAudioElement | null = null; // Élément audio pour la sonnerie
  
  // Fonction pour charger les données de l'agent
  async function loadAgentData() {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/agent/info`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Récupérer les informations du token stocké
        const token = localStorage.getItem('agent_token');
        let decodedToken = null;
        
        if (token) {
          // Décoder le token JWT (sans vérification de signature)
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          decodedToken = JSON.parse(window.atob(base64));
        }
        
        // Utiliser les données du token si disponibles, sinon utiliser les données de l'API
        agentInfo = {
          name: decodedToken?.full_name || data?.full_name || 'Agent',
          id: decodedToken?.user || data?.user_id || '',
          status: data?.status || 'Disponible',
          extension: decodedToken?.extension || data?.extension || '',
          campaign: decodedToken?.campaign_name || data?.campaign_name || '',
          sipPassword: data?.sip_password || 'welcome'
        };
        
        // Récupérer les statistiques d'appels si disponibles
        if (data.callStats) {
          callStats = data.callStats;
        }

        // Initialiser WebRTC si l'extension est disponible
        if (agentInfo.extension && !webrtcInitialized) {
          initWebRTC();
        }
      } else {
        console.error('Erreur lors de la récupération des données agent:', response.status);
        error = 'Impossible de récupérer les informations de l\'agent';
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      error = 'Erreur lors du chargement des données';
    } finally {
      isLoading = false;
    }
  }
  
  // Fonction pour mettre l'agent en pause
  async function handlePause() {
    console.log('Mise en pause de l\'agent initiée');
    
    // Terminer l'appel en cours si nécessaire
    if (callActive) {
      console.log('Appel en cours détecté lors de la mise en pause, terminaison de l\'appel');
      // Terminer l'appel en cours
      await webrtcService.hangupCall();
      endCall();
    }
    
    // Désactiver le mode prédictif continu dans le composant PredictiveDialer
    if (predictiveDialerComponent) {
      console.log('Désactivation du mode prédictif continu');
      // Appeler resetDialerStatus avec false pour désactiver le mode prédictif continu
      predictiveDialerComponent.resetDialerStatus(false);
    }
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/agent/pause`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Agent en pause', data);
        agentInfo.status = 'En pause';
        // Désactiver la possibilité de passer des appels
        canManualDial = false;
      } else {
        console.error('Erreur lors de la mise en pause:', response.status);
      }
    } catch (err) {
      console.error('Erreur lors de la mise en pause:', err);
    }
  }
  
  // Fonction pour reprendre l'activité de l'agent
  async function handleResume() {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/agent/resume`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Agent disponible', data);
        agentInfo.status = 'Disponible';
        // Réactiver la possibilité de passer des appels
        canManualDial = true;
      } else {
        console.error('Erreur lors de la reprise:', response.status);
      }
    } catch (err) {
      console.error('Erreur lors de la reprise:', err);
    }
  }
  
  // Fonction pour déconnecter l'agent
  async function handleLogout() {
    try {
      await fetchWithAuth(`${API_BASE_URL}/agent/auth/logout`, {
        method: 'POST'
      });
      
      // Supprimer le token et rediriger vers la page de login
      localStorage.removeItem('agent_token');
      window.location.href = '/login';
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  }
  
  // Fonction pour composer un numéro manuellement
  async function handleDial(event: CustomEvent) {
    const { phoneNumber } = event.detail;
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/agent/call/dial-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone_number: phoneNumber })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Démarrer l'appel
        startCall({
          callId: data.call_id || Date.now().toString(),
          phoneNumber,
          customerName: 'Client'
        });
      } else {
        console.error('Erreur lors de la composition:', response.status);
        alert('Erreur lors de la composition du numéro');
      }
    } catch (err) {
      console.error('Erreur lors de la composition:', err);
      alert('Erreur lors de la composition du numéro');
    }
  }
  
  // Fonction pour démarrer un appel
  function startCall(callInfo: { callId: string, phoneNumber: string, customerName: string }) {
    if (callActive) return;
    
    callActive = true;
    currentCall = {
      callId: callInfo.callId,
      phoneNumber: callInfo.phoneNumber,
      customerName: callInfo.customerName,
      startTime: new Date()
    };
    
    customer = {
      name: callInfo.customerName,
      phone: callInfo.phoneNumber
    };
    
    // S'assurer qu'un prospect existe pour l'affichage du formulaire
    if (!currentProspect) {
      currentProspect = {
        lead_id: '',
        phone_number: callInfo.phoneNumber,
        first_name: callInfo.customerName.split(' ')[0] || '',
        last_name: callInfo.customerName.split(' ')[1] || '',
        status: 'NEW',
        comments: ''
      };
    }
    
    // Jouer le son de tonalité d'appel (bip)
    playDialTone();
    
    // Démarrer le timer d'appel
    callDuration = 0;
    callDurationInterval = setInterval(() => {
      callDuration++;
    }, 1000);
    
    // Jouer le son de sonnerie si en mode simulation ou si WebRTC n'est pas connecté
    if (isSimulationMode || !sipRegistered) {
      playRingtone();
    }
  }
  
  // Fonction pour jouer le son de tonalité d'appel
  function playDialTone() {
    try {
      // Créer un nouveau contexte audio si nécessaire
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Arrêter l'intervalle précédent s'il existe
      if (dialToneInterval) {
        clearInterval(dialToneInterval);
        dialToneInterval = null;
      }
      
      // Fonction pour créer et jouer un bip
      const createBip = () => {
        // Arrêter l'oscillateur précédent s'il existe
        if (oscillator) {
          try {
            oscillator.stop();
            oscillator.disconnect();
          } catch (e) {
            // Ignorer les erreurs si l'oscillateur est déjà arrêté
          }
        }
        
        if (!audioContext) return;
        
        // Créer un nouvel oscillateur
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        
        // Configurer l'oscillateur pour un son de bip d'appel
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // 440Hz = La
        
        // Configurer le volume
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        
        // Connecter les nœuds
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Démarrer l'oscillateur pour 0.8 seconde
        oscillator.start();
        setTimeout(() => {
          if (oscillator) {
            try {
              oscillator.stop();
              oscillator.disconnect();
            } catch (e) {
              // Ignorer les erreurs
            }
          }
        }, 800);
      };
      
      // Jouer le premier bip immédiatement
      createBip();
      
      // Créer un intervalle pour jouer un bip toutes les 2 secondes
      dialToneInterval = setInterval(createBip, 2000);
      
      console.log('Son de tonalité d\'appel démarré');
    } catch (error) {
      console.error('Erreur lors de la création du son de tonalité:', error);
    }
  }
  
  // Fonction pour arrêter le son de tonalité d'appel
  function stopDialTone() {
    try {
      // Arrêter l'intervalle
      if (dialToneInterval) {
        clearInterval(dialToneInterval);
        dialToneInterval = null;
      }
      
      // Arrêter l'oscillateur
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
        oscillator = undefined;
      }
      
      console.log('Son de tonalité d\'appel arrêté');
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du son de tonalité:', error);
    }
  }
  
  // Fonction pour jouer la sonnerie (appel entrant)
  function playRingtone() {
    try {
      // Créer un élément audio pour la sonnerie si nécessaire
      if (!ringtoneAudio) {
        ringtoneAudio = new Audio('/sounds/ringtone.mp3');
        ringtoneAudio.loop = true;
      }
      
      // Jouer la sonnerie
      ringtoneAudio.play();
      console.log('Sonnerie démarrée');
    } catch (error) {
      console.error('Erreur lors de la lecture de la sonnerie:', error);
    }
  }
  
  // Fonction pour arrêter la sonnerie
  function stopRingtone() {
    try {
      if (ringtoneAudio) {
        ringtoneAudio.pause();
        ringtoneAudio.currentTime = 0;
        console.log('Sonnerie arrêtée');
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de la sonnerie:', error);
    }
  }
  
  // Fonction pour démarrer le timer de durée d'appel
  function startCallDurationTimer() {
    // Arrêter le timer précédent s'il existe
    if (callDurationInterval) {
      clearInterval(callDurationInterval);
    }
    
    // Réinitialiser la durée
    callDuration = 0;
    
    // Démarrer un nouveau timer
    callDurationInterval = setInterval(() => {
      callDuration += 1;
    }, 1000);
  }
  
  // Fonction pour initialiser WebRTC
  function initWebRTC() {
    if (!agentInfo || !agentInfo.extension) {
      console.error('Impossible d\'initialiser WebRTC: informations de l\'agent manquantes');
      return;
    }
    
    // Initialiser la connexion SIP avec le serveur de démonstration
    try {
      // Utiliser l'extension de l'agent comme nom d'utilisateur
      webrtcService.initSIP(agentInfo.extension);
      webrtcInitialized = true;
      console.log('Initialisation WebRTC avec le serveur de démonstration');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation WebRTC:', error);
      webrtcInitialized = false;
    }
  }
  
  // Fonction pour terminer un appel
  // Référence au composant PredictiveDialer
  let predictiveDialerComponent: any;
  
  function endCall() {
    console.log('Fin d\'appel initiée, réinitialisation de l\'interface...');
    
    // Réinitialiser immédiatement l'état de l'interface
    callActive = false;
    callJustEnded = true;
    callMuted = false;
    callOnHold = false;
    recording = false;
    agentInfo.status = 'Disponible';
    
    // Réinitialiser callJustEnded après un court délai pour permettre au composant PredictiveDialer de détecter la fin d'appel
    setTimeout(() => {
      callJustEnded = false;
      console.log('Variable callJustEnded réinitialisée');
    }, 3000);
    
    // Arrêter le timer de durée d'appel
    if (callDurationInterval) {
      clearInterval(callDurationInterval);
      callDurationInterval = null;
    }
    
    // Arrêter le son de tonalité d'appel s'il est en cours
    stopDialTone();
    
    // Force la réinitialisation du statut WebRTC
    webrtcService.callStatus.set('idle');
    
    // Si WebRTC est activé, terminer l'appel via WebRTC
    if (webrtcInitialized) {
      try {
        webrtcService.hangupCall();
      } catch (error) {
        console.error('Erreur lors de la terminaison de l\'appel WebRTC:', error);
      }
    }
    
    // Réinitialiser la session WebRTC
    webrtcService.currentSession.set(null);
    
    // Réinitialiser le statut du composeur si le composant est disponible
    if (predictiveDialerComponent && predictiveDialerComponent.resetDialerStatus) {
      console.log('Réinitialisation du statut du composeur via la référence au composant');
      // Passer true pour préserver le mode prédictif continu
      predictiveDialerComponent.resetDialerStatus(true);
    }
    
    // Enregistrer la fin de l'appel
    if (currentCall.callId) {
      try {
        fetchWithAuth(`${API_BASE_URL}/agent/end-call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            callId: currentCall.callId,
            duration: callDuration
          })
        });
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la fin de l\'appel:', error);
      }
    }
    
    // Afficher le panneau de disposition
    showDisposition = true;
  }
  
  // Fonction pour gérer le clic sur le bouton de mise en sourdine
  function handleToggleMute() {
    callMuted = !callMuted;
    console.log('Micro ' + (callMuted ? 'coupé' : 'activé'));
    
    // Si WebRTC est activé, mettre en sourdine via WebRTC
    if (webrtcInitialized) {
      webrtcService.toggleMute(callMuted);
    }
  }
  
  // Fonction pour gérer le clic sur le bouton de mise en attente
  function handleToggleHold() {
    callOnHold = !callOnHold;
    console.log('Appel ' + (callOnHold ? 'mis en attente' : 'repris'));
    
    // Si WebRTC est activé, mettre en attente via WebRTC
    if (webrtcInitialized) {
      webrtcService.toggleHold(callOnHold);
    }
  }
  
  // Fonction pour gérer le clic sur le bouton d'enregistrement
  function handleToggleRecording() {
    recording = !recording;
    console.log('Enregistrement ' + (recording ? 'démarré' : 'arrêté'));
    
    // Envoyer une requête pour démarrer/arrêter l'enregistrement
    try {
      fetchWithAuth(`${API_BASE_URL}/agent/recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          callId: currentCall.callId,
          recording: recording
        })
      });
    } catch (error) {
      console.error('Erreur lors de la gestion de l\'enregistrement:', error);
    }
  }
  
  // Fonction pour gérer le clic sur le bouton de raccrochage
  function handleHangup() {
    console.log('Bouton de raccrochage cliqué');
    endCall();
    
    // Force la mise à jour du statut
    agentInfo.status = 'Disponible';
    webrtcService.callStatus.set('idle');
    
    // Réinitialiser le statut du composeur directement, mais préserver le mode prédictif continu
    if (predictiveDialerComponent && predictiveDialerComponent.resetDialerStatus) {
      // Passer true pour préserver le mode prédictif continu
      predictiveDialerComponent.resetDialerStatus(true);
    }
    
    console.log('Appel raccroché, statut réinitialisé');
  }
  
  // Fonction pour gérer l'événement callEnded du composant PredictiveDialer
  function handleCallEndedEvent(event: CustomEvent) {
    console.log('Evénement callEnded reçu du composant PredictiveDialer:', event.detail);
    // Gérer la fin d'appel si nécessaire
    if (callActive) {
      endCall();
    }
  }
  
  // Fonction pour gérer le transfert d'appel
  function handleTransfer() {
    alert('Fonctionnalité de transfert à implémenter');
  }
  
  // Fonction pour gérer l'ouverture du pavé DTMF
  function handleOpenDtmfPad() {
    alert('Fonctionnalité DTMF à implémenter');
  }
  
  // Fonction pour gérer l'événement callInitiated du composant PredictiveDialer
  function handleCallInitiated(event: { detail: any }) {
    const { phoneNumber, callId, contactName, leadId } = event.detail;
    
    console.log('Appel initié depuis PredictiveDialer avec détails:', event.detail);
    
    // Mettre à jour les informations du client
    customer = {
      name: contactName || 'Client',
      phone: phoneNumber
    };
    
    // Démarrer l'appel avec les informations reçues
    startCall({
      callId: callId,
      phoneNumber: phoneNumber,
      customerName: contactName || 'Client'
    });
    
    // Si currentProspect n'est pas défini, créer un objet prospect par défaut
    if (!currentProspect) {
      currentProspect = {
        lead_id: leadId || '',
        phone_number: phoneNumber,
        first_name: contactName?.split(' ')[0] || '',
        last_name: contactName?.split(' ')[1] || '',
        status: 'NEW',
        comments: ''
      };
      console.log('Prospect par défaut créé:', currentProspect);
    }
  }
  
  // Fonction pour gérer l'événement prospectLoaded du composant PredictiveDialer
  function handleProspectLoaded(event: { detail: any }) {
    const { prospect } = event.detail;
    
    console.log('Prospect chargé:', prospect);
    
    // Mettre à jour le prospect actuel avec une copie pour éviter les problèmes de référence
    if (prospect) {
      // Créer une nouvelle référence pour forcer la mise à jour du composant
      currentProspect = { ...prospect };
      console.log('Données du prospect mises à jour dans la page agent:', currentProspect);
    } else {
      // Si prospect est null, réinitialiser currentProspect
      currentProspect = null;
      console.log('Réinitialisation des données du prospect dans la page agent');
    }
  }
  
  // Fonction pour gérer l'événement pauseStateChanged du composant PredictiveDialer
  function handlePauseStateChanged(event: CustomEvent<{isPaused: boolean}>) {
    const { isPaused } = event.detail;
    if (isPaused) {
      handlePause();
    } else {
      handleResume();
    }
  }
  
  // Fonction pour gérer la soumission de la disposition
  function handleDispositionSubmit(event: CustomEvent) {
    const dispositionData = event.detail;
    
    try {
      fetchWithAuth(`${API_BASE_URL}/agent/call/disposition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          call_id: currentCall.callId,
          disposition: dispositionData.dispositionId,
          notes: dispositionData.notes,
          callback_date: dispositionData.callbackDate,
          callback_time: dispositionData.callbackTime
        })
      });
      
      // Réinitialiser l'état de l'appel
      showDisposition = false;
      currentCall = {
        callId: '',
        phoneNumber: '',
        customerName: '',
        startTime: null
      };
      customer = {
        name: '',
        phone: ''
      };
      currentProspect = null;
      
      // Mettre à jour les statistiques
      callStats.completed++;
      callStats.today++;
      callStats.successRate = Math.round((callStats.completed / callStats.today) * 100);
    } catch (error) {
      console.error('Erreur lors de la soumission de la disposition:', error);
    }
  }
  
  // Fonction pour annuler la disposition
  function handleDispositionCancel() {
    showDisposition = false;
    
    // Réinitialiser l'état de l'appel
    currentCall = {
      callId: '',
      phoneNumber: '',
      customerName: '',
      startTime: null
    };
    customer = {
      name: '',
      phone: ''
    };
    currentProspect = null;
  }
  
  // Fonction pour charger un script
  function loadScript() {
    // Script fictif pour démonstration
    currentScript = {
      id: '1',
      name: 'Script d\'appel standard',
      description: 'Script standard pour les appels sortants',
      sections: [
        {
          id: '1',
          title: 'Introduction',
          content: 'Bonjour, je m\'appelle [Votre Nom] et je vous appelle de la part de [Entreprise]. Comment allez-vous aujourd\'hui ?',
          order: 1
        },
        {
          id: '2',
          title: 'Présentation du produit',
          content: 'Je vous contacte aujourd\'hui pour vous parler de notre nouveau produit/service qui pourrait vous intéresser...',
          order: 2
        },
        {
          id: '3',
          title: 'Gestion des objections',
          content: 'Je comprends vos préoccupations. Beaucoup de nos clients avaient les mêmes inquiétudes avant d\'essayer notre produit/service...',
          order: 3
        },
        {
          id: '4',
          title: 'Conclusion',
          content: 'Pour résumer, notre produit/service vous permettra de [avantages]. Souhaitez-vous en savoir plus ou procéder à une commande ?',
          order: 4
        }
      ]
    };
  }
  
  // Initialisation au chargement de la page
  onMount(async () => {
    // Charger les informations de l'agent
    await loadAgentData();
    
    // Démarrer le timer de durée d'appel si un appel est en cours
    if (callActive) {
      startCallDurationTimer();
    }
    
    // S'abonner aux changements d'état SIP
    const unsubscribeSipStatus = webrtcService.sipStatus.subscribe(status => {
      console.log('Statut SIP changé:', status);
      sipConnected = status === 'connected' || status === 'registered';
      sipRegistered = status === 'registered';
    });
    
    // S'abonner au mode simulation
    const unsubscribeSimulationMode = simulationMode.subscribe(mode => {
      console.log('Mode simulation WebRTC:', mode ? 'activé' : 'désactivé');
      isSimulationMode = mode;
    });
    
    // S'abonner aux changements d'état d'appel
    const unsubscribeCallStatus = callStatus.subscribe(status => {
      console.log('Statut d\'appel changé:', status);
      
      if (status === 'ringing') {
        // Appel entrant, déclencher la sonnerie
        playRingtone();
      } else if (status === 'inprogress') {
        // Appel en cours, arrêter la sonnerie et démarrer le timer
        stopRingtone();
        callActive = true;
        startCallDurationTimer();
      } else if (status === 'ended' || status === 'idle') {
        // Appel terminé
        if (callActive) {
          console.log('Statut d\'appel changé à terminé/inactif, fin de l\'appel...');
          endCall();
        } else {
          // Même si callActive est false, on force la réinitialisation du statut
          agentInfo.status = 'Disponible';
          console.log('Statut d\'appel changé, réinitialisation du statut agent à Disponible');
        }
      }
    });
    
    // S'abonner aux changements de session d'appel
    const unsubscribeCurrentSession = currentSession.subscribe(session => {
      if (session) {
        // Récupérer les informations de l'appel
        const phoneNumber = session.remote_identity?.uri?.user || '';
        const displayName = session.remote_identity?.display_name || 'Client';
        
        // Démarrer l'appel dans l'interface
        if (!callActive) {
          startCall({
            callId: session.id || Date.now().toString(),
            phoneNumber,
            customerName: displayName
          });
        }
      }
    });
    
    // Nettoyage lors du démontage du composant
    return () => {
      unsubscribeSipStatus();
      unsubscribeCallStatus();
      unsubscribeSimulationMode();
      unsubscribeCurrentSession();
    };
  });
  
  // Nettoyage lors du démontage du composant
  onDestroy(() => {
    // Terminer la connexion WebRTC
    if (webrtcInitialized) {
      webrtcService.terminateSIP();
    }
    
    // Arrêter le timer de durée d'appel
    if (callDurationInterval) {
      clearInterval(callDurationInterval);
    }
    
    // Arrêter les sons
    stopDialTone();
    stopRingtone();
  });
</script>
<!-- Interface agent avec intégration WebRTC -->
<main class="min-h-screen bg-gray-100">
  {#if isLoading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Chargement de l'interface agent...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center p-6 bg-white rounded-lg shadow-md">
        <div class="text-red-500 text-5xl mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-800 mb-2">Erreur</h2>
        <p class="text-gray-600 mb-4">{error}</p>
        <button 
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          on:click={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    </div>
  {:else}
    <div class="flex flex-col h-screen">
      <!-- En-tête -->
      <AgentHeader 
        agentName={agentInfo.name}
        agentId={agentInfo.id}
        extension={agentInfo.extension}
        campaign={agentInfo.campaign}
        status={agentInfo.status}
        callsToday={callStats.today}
        callsCompleted={callStats.completed}
        successRate={callStats.successRate}
        onPause={handlePause}
        onResume={handleResume}
        onLogout={handleLogout}
      />
      
      <!-- Contenu principal -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Colonne gauche - Composeur prédictif -->
        <div class="w-1/4 bg-white border-r border-gray-200 overflow-y-auto">
          <PredictiveDialer
            bind:this={predictiveDialerComponent}
            agentId={agentInfo.id}
            campaignId={agentInfo.campaign}
            disabled={!sipRegistered && !isSimulationMode}
            canManualDial={canManualDial}
            callActive={callActive}
            callEnded={callJustEnded}
            apiBaseUrl={API_BASE_URL}
            on:callInitiated={handleCallInitiated}
            on:callEnded={handleCallEndedEvent}
            on:pauseStateChanged={handlePauseStateChanged}
            on:prospectLoaded={handleProspectLoaded}
          />
        </div>
        
        <!-- Colonne centrale - Contrôles d'appel et formulaire prospect -->
        <div class="flex-1 bg-white overflow-y-auto p-4">
          {#if callActive}
            <!-- Informations sur l'appel en cours -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="text-lg font-medium text-gray-800">{customer.name || 'Client'}</h3>
                  <p class="text-sm text-gray-600">{customer.phone}</p>
                </div>
                <div class="flex space-x-2">
                  <button 
                    on:click={handleToggleMute}
                    class="p-2 rounded-full {callMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} hover:bg-gray-200"
                    title={callMuted ? 'Activer le micro' : 'Couper le micro'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button 
                    on:click={handleToggleHold}
                    class="p-2 rounded-full {callOnHold ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'} hover:bg-gray-200"
                    title={callOnHold ? 'Reprendre l\'appel' : 'Mettre en attente'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button 
                    on:click={handleToggleRecording}
                    class="p-2 rounded-full {recording ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} hover:bg-gray-200"
                    title={recording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <circle cx="10" cy="10" r="6" />
                    </svg>
                  </button>
                  <button 
                    on:click={handleHangup}
                    class="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                    title="Raccrocher"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="mt-2 text-center">
                <span class="text-sm font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
            
            <!-- Formulaire prospect quand un appel est actif -->
            <ProspectForm 
              currentProspect={currentProspect || {
                lead_id: '',
                phone_number: customer.phone || currentCall.phoneNumber,
                first_name: '',
                last_name: '',
                status: '',
                comments: ''
              }}
              {callActive}
              apiBaseUrl={API_BASE_URL}
              on:save={(event) => {
                // Mettre à jour les données du prospect lorsqu'elles sont sauvegardées
                currentProspect = event.detail.prospect;
                console.log('Données du prospect sauvegardées dans la page agent:', currentProspect);
              }}
            />
          {:else}
            <!-- Contrôles d'appel quand aucun appel n'est actif -->
            <CallControls 
              callActive={callActive}
              callMuted={callMuted}
              callOnHold={callOnHold}
              callDuration={callDuration}
              customerName={customer.name}
              phoneNumber={customer.phone}
              recording={recording}
              currentProspect={currentProspect}
              on:hangup={handleHangup}
              on:toggleMute={handleToggleMute}
              on:toggleHold={handleToggleHold}
              on:toggleRecording={handleToggleRecording}
              on:transfer={handleTransfer}
              on:openDtmfPad={handleOpenDtmfPad}
            />
          {/if}
        </div>
        
        <!-- La colonne droite a été fusionnée avec la colonne centrale -->
      </div>
    </div>
  {/if}
</main>

<!-- Panneau de disposition -->
<DispositionPanel 
  show={showDisposition}
  callData={{
    callId: currentCall.callId,
    phoneNumber: currentCall.phoneNumber,
    customerName: currentCall.customerName,
    duration: callDuration ? `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}` : '00:00'
  }}
  on:submit={handleDispositionSubmit}
  on:cancel={handleDispositionCancel}
/>
