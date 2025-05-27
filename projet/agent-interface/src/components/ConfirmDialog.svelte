<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  
  // Props
  export let title: string = 'Confirmation';
  export let message: string = 'Êtes-vous sûr ?';
  export let confirmButtonText: string = 'Confirmer';
  export let cancelButtonText: string = 'Annuler';
  export let isOpen: boolean = false;
  
  // Dispatcher pour les événements
  const dispatch = createEventDispatcher();
  
  // Référence pour le focus
  let dialogContainer: HTMLElement;
  
  // Gestionnaire d'événement pour la touche Escape
  function handleKeydown(event: KeyboardEvent) {
    if (isOpen && event.key === 'Escape') {
      cancel();
    }
  }
  
  // Gestionnaire de clic sur l'overlay
  function handleOverlayClick(event: MouseEvent) {
    // Si le clic est sur l'overlay et non sur le contenu de la boîte de dialogue
    if (event.target === event.currentTarget) {
      cancel();
    }
  }
  
  // Fonction pour confirmer
  function confirm() {
    dispatch('confirm');
    isOpen = false;
  }
  
  // Fonction pour annuler
  function cancel() {
    dispatch('cancel');
    isOpen = false;
  }
  
  // Mettre le focus sur le conteneur de dialogue lorsqu'il s'ouvre
  $: if (isOpen && dialogContainer) {
    setTimeout(() => dialogContainer.focus(), 50);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
<div class="dialog-overlay" role="presentation" on:click={handleOverlayClick} on:keydown={() => {}} tabindex="-1">
  <div 
    class="dialog-container" 
    bind:this={dialogContainer} 
    tabindex="-1" 
    role="dialog" 
    aria-labelledby="dialog-title" 
    aria-modal="true"
  >
    <div class="dialog-header">
      <h3>{title}</h3>
      <button class="close-button" on:click={cancel}>×</button>
    </div>
    <div class="dialog-content">
      <p>{message}</p>
    </div>
    <div class="dialog-footer">
      <button class="cancel-button" on:click={cancel}>{cancelButtonText}</button>
      <button class="confirm-button" on:click={confirm}>{confirmButtonText}</button>
    </div>
  </div>
</div>
{/if}

<style>
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .dialog-container {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
    overflow: hidden;
    animation: slide-in 0.2s ease-out;
  }
  
  @keyframes slide-in {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #1e293b;
    color: white;
  }
  
  .dialog-header h3 {
    margin: 0;
    font-size: 1.2rem;
  }
  
  .close-button {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  
  .dialog-content {
    padding: 1.5rem;
  }
  
  .dialog-content p {
    margin: 0;
    color: #334155;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    padding: 1rem;
    background-color: #f1f5f9;
    gap: 0.5rem;
  }
  
  .cancel-button, .confirm-button {
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .cancel-button {
    background-color: #e2e8f0;
    color: #475569;
    border: 1px solid #cbd5e1;
  }
  
  .cancel-button:hover {
    background-color: #cbd5e1;
  }
  
  .confirm-button {
    background-color: #ef4444;
    color: white;
    border: none;
  }
  
  .confirm-button:hover {
    background-color: #dc2626;
  }
</style>
