<script lang="ts">
  import { writable } from 'svelte/store';
  import Toast from './Toast.svelte';
  
  // Store pour gérer les toasts
  export const toasts = writable<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration: number;
    showProgressBar: boolean;
  }[]>([]);
  
  // Fonction pour ajouter un toast
  export function addToast(
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = 5000,
    showProgressBar: boolean = true
  ) {
    const id = Date.now().toString();
    
    toasts.update(all => [
      ...all,
      { id, type, message, duration, showProgressBar }
    ]);
    
    return id;
  }
  
  // Fonction pour supprimer un toast par son ID
  export function removeToast(id: string) {
    toasts.update(all => all.filter(t => t.id !== id));
  }
  
  // Raccourcis pour les différents types de toasts
  export function success(message: string, duration: number = 5000) {
    return addToast(message, 'success', duration);
  }
  
  export function error(message: string, duration: number = 8000) {
    return addToast(message, 'error', duration);
  }
  
  export function warning(message: string, duration: number = 6000) {
    return addToast(message, 'warning', duration);
  }
  
  export function info(message: string, duration: number = 5000) {
    return addToast(message, 'info', duration);
  }
  
  // Toasts actuels
  let currentToasts: {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration: number;
    showProgressBar: boolean;
  }[] = [];
  
  // S'abonner aux changements du store
  toasts.subscribe(value => {
    currentToasts = value;
  });
  
  // Gérer la fermeture d'un toast
  function handleClose(id: string) {
    removeToast(id);
  }
</script>

<div class="toast-container">
  {#each currentToasts as toast (toast.id)}
    <Toast
      type={toast.type}
      message={toast.message}
      duration={toast.duration}
      showProgressBar={toast.showProgressBar}
      on:close={() => handleClose(toast.id)}
    />
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
  }
  
  .toast-container :global(> *) {
    pointer-events: auto;
  }
</style>
