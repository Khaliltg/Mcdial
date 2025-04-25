<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  // Propriétés
  export let disabled: boolean = false;
  
  // État
  let phoneNumber: string = '';
  let isDialing: boolean = false;
  
  // Fonction pour composer un numéro
  async function dialNumber() {
    if (!phoneNumber || phoneNumber.length < 5) {
      alert('Veuillez entrer un numéro de téléphone valide');
      return;
    }
    
    isDialing = true;
    
    try {
      // Simuler l'appel API (à remplacer par votre vrai appel API)
      dispatch('dial', { phoneNumber });
    } catch (error) {
      console.error('Erreur lors de la composition:', error);
      alert('Erreur lors de la composition du numéro');
    } finally {
      isDialing = false;
    }
  }
  
  // Fonction pour effacer le numéro
  function clearNumber() {
    phoneNumber = '';
  }
  
  // Fonction pour ajouter un chiffre au numéro
  function addDigit(digit: string) {
    phoneNumber += digit;
  }
  
  // Fonction pour filtrer les entrées non numériques
  function handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    // Ne garder que les chiffres, * et #
    input.value = input.value.replace(/[^0-9*#]/g, '');
    phoneNumber = input.value;
  }
</script>

<div class="bg-white rounded-lg shadow-lg p-4">
  <h2 class="text-lg font-bold text-gray-800 mb-4">Composition manuelle</h2>
  
  <!-- Affichage du numéro -->
  <div class="relative mb-4">
    <input
      type="tel"
      bind:value={phoneNumber}
      on:input={handleInput}
      placeholder="Entrez un numéro..."
      class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-medium text-center"
      disabled={disabled || isDialing}
      pattern="[0-9*#+]*"
      inputmode="tel"
    />
    {#if phoneNumber}
      <button 
        on:click={clearNumber}
        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-red-500"
        disabled={disabled || isDialing}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </button>
    {/if}
  </div>
  
  <!-- Clavier numérique -->
  <div class="grid grid-cols-3 gap-2 mb-4">
    {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as digit}
      <button
        on:click={() => addDigit(digit)}
        class="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-lg transition-colors"
        disabled={disabled || isDialing}
      >
        {digit}
      </button>
    {/each}
  </div>
  
  <!-- Bouton d'appel -->
  <button
    on:click={dialNumber}
    class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-colors"
    disabled={disabled || isDialing || !phoneNumber}
  >
    {#if isDialing}
      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Composition...
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
      </svg>
      Appeler
    {/if}
  </button>
</div>
