<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { warning } from '$lib/services/toastService';
  
  export let callActive: boolean = false;
  
  const dispatch = createEventDispatcher<{
    pauseToggle: void;
    hangup: void;
  }>();
  
  // Gestionnaire d'événements pour les raccourcis clavier
  function handleKeydown(event: KeyboardEvent) {
    // Ne pas traiter les événements si l'agent est en train de saisir du texte
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    // Espace pour pause/reprendre
    if (event.code === 'Space') {
      event.preventDefault();
      dispatch('pauseToggle');
    }
    
    // H pour raccrocher
    if (event.code === 'KeyH' && callActive) {
      event.preventDefault();
      dispatch('hangup');
      warning('Appel terminé via raccourci clavier');
    }
  }
  
  onMount(() => {
    // Ajouter l'écouteur d'événements pour les raccourcis clavier
    window.addEventListener('keydown', handleKeydown);
  });
  
  onDestroy(() => {
    // Supprimer l'écouteur d'événements pour les raccourcis clavier
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

<!-- Composant invisible, uniquement pour la gestion des raccourcis clavier -->
<div class="sr-only" aria-hidden="true">Gestionnaire de raccourcis clavier</div>
