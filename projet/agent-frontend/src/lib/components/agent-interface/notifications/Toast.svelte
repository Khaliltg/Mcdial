<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  
  export let type: 'success' | 'error' | 'info' | 'warning' = 'info';
  export let message: string;
  export let duration: number = 5000; // Durée en ms avant disparition automatique
  export let showProgressBar: boolean = true;
  
  const dispatch = createEventDispatcher<{
    close: void;
  }>();
  
  let progressWidth = 100;
  let interval: number;
  let visible = false;
  
  // Définir les couleurs en fonction du type
  $: backgroundColor = type === 'success' ? 'bg-green-100' 
    : type === 'error' ? 'bg-red-100'
    : type === 'warning' ? 'bg-amber-100'
    : 'bg-blue-100';
    
  $: borderColor = type === 'success' ? 'border-green-500' 
    : type === 'error' ? 'border-red-500'
    : type === 'warning' ? 'border-amber-500'
    : 'border-blue-500';
    
  $: textColor = type === 'success' ? 'text-green-800' 
    : type === 'error' ? 'text-red-800'
    : type === 'warning' ? 'text-amber-800'
    : 'text-blue-800';
    
  $: progressColor = type === 'success' ? 'bg-green-500' 
    : type === 'error' ? 'bg-red-500'
    : type === 'warning' ? 'bg-amber-500'
    : 'bg-blue-500';
    
  $: iconPath = type === 'success' 
    ? 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
    : type === 'error'
    ? 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
    : type === 'warning'
    ? 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
    : 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z';
  
  onMount(() => {
    // Animation d'entrée
    setTimeout(() => {
      visible = true;
    }, 10);
    
    // Initialiser la barre de progression
    if (showProgressBar && duration > 0) {
      const step = 10; // Mise à jour toutes les 10ms
      const decrementPerStep = (step / duration) * 100;
      
      interval = setInterval(() => {
        progressWidth -= decrementPerStep;
        
        if (progressWidth <= 0) {
          clearInterval(interval);
          close();
        }
      }, step);
    }
    
    // Fermeture automatique
    if (duration > 0) {
      setTimeout(() => {
        close();
      }, duration);
    }
  });
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
  
  function close() {
    visible = false;
    setTimeout(() => {
      dispatch('close');
    }, 300); // Attendre que l'animation de sortie soit terminée
  }
</script>

<div 
  class="fixed right-4 top-4 z-50 max-w-sm transform transition-all duration-300 ease-in-out {visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}"
  role="alert"
>
  <div class="flex items-start p-4 {backgroundColor} {textColor} border-l-4 {borderColor} rounded-lg shadow-lg">
    <div class="flex-shrink-0 mr-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="{iconPath}" clip-rule="evenodd" />
      </svg>
    </div>
    <div class="flex-1">
      <p class="text-sm font-medium">{message}</p>
      
      {#if showProgressBar}
        <div class="mt-2 w-full bg-gray-200 rounded-full h-1.5">
          <div class="{progressColor} h-1.5 rounded-full" style="width: {progressWidth}%"></div>
        </div>
      {/if}
    </div>
    <button 
      class="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
      on:click={close}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</div>
