<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  // Propriétés
  export let show: boolean = false;
  export let callData: any = {};
  
  // Liste des dispositions possibles
  const dispositions = [
    { id: 'SALE', name: 'Vente', color: 'bg-green-100 text-green-800' },
    { id: 'CBHOLD', name: 'Rappel', color: 'bg-blue-100 text-blue-800' },
    { id: 'NA', name: 'Pas de réponse', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'B', name: 'Occupé', color: 'bg-orange-100 text-orange-800' },
    { id: 'DC', name: 'Ne pas rappeler', color: 'bg-red-100 text-red-800' },
    { id: 'DNC', name: 'Ne pas appeler', color: 'bg-red-100 text-red-800' },
    { id: 'NI', name: 'Non intéressé', color: 'bg-gray-100 text-gray-800' },
    { id: 'NP', name: 'Pas de potentiel', color: 'bg-gray-100 text-gray-800' },
    { id: 'LB', name: 'Barrière linguistique', color: 'bg-purple-100 text-purple-800' },
    { id: 'OTH', name: 'Autre', color: 'bg-gray-100 text-gray-800' }
  ];
  
  // État local
  let selectedDisposition: string = '';
  let notes: string = '';
  let callbackDate: string = '';
  let callbackTime: string = '';
  let showCallbackFields: boolean = false;
  
  // Réinitialiser le formulaire quand il est affiché
  $: if (show) {
    selectedDisposition = '';
    notes = '';
    callbackDate = '';
    callbackTime = '';
    showCallbackFields = false;
  }
  
  // Surveiller si la disposition sélectionnée est un rappel
  $: showCallbackFields = selectedDisposition === 'CBHOLD';
  
  // Fonction pour soumettre la disposition
  function submitDisposition() {
    // Valider le formulaire
    if (!selectedDisposition) {
      alert('Veuillez sélectionner une disposition');
      return;
    }
    
    // Valider les champs de rappel si nécessaire
    if (showCallbackFields && (!callbackDate || !callbackTime)) {
      alert('Veuillez spécifier la date et l\'heure du rappel');
      return;
    }
    
    // Créer l'objet de disposition
    const dispositionData = {
      dispositionId: selectedDisposition,
      dispositionName: dispositions.find(d => d.id === selectedDisposition)?.name || '',
      notes,
      callbackDate: showCallbackFields ? callbackDate : null,
      callbackTime: showCallbackFields ? callbackTime : null
    };
    
    // Envoyer la disposition au composant parent
    dispatch('submit', dispositionData);
  }
  
  // Fonction pour fermer le panneau sans soumettre
  function cancel() {
    dispatch('cancel');
  }
  
  // Obtenir la date et l'heure actuelles pour les valeurs par défaut
  function getDefaultDateTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateStr = tomorrow.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    
    callbackDate = dateStr;
    callbackTime = timeStr;
  }
  
  // Appeler getDefaultDateTime lorsque showCallbackFields devient true
  $: if (showCallbackFields && !callbackDate) {
    getDefaultDateTime();
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
      <h2 class="text-xl font-bold text-gray-800 mb-4">Disposition d'appel</h2>
      
      <!-- Informations d'appel -->
      <div class="bg-gray-50 p-3 rounded-lg mb-4">
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-gray-500">Numéro:</span>
            <span class="font-medium ml-1">{callData.phoneNumber || 'N/A'}</span>
          </div>
          <div>
            <span class="text-gray-500">Durée:</span>
            <span class="font-medium ml-1">{callData.duration || '00:00'}</span>
          </div>
          <div>
            <span class="text-gray-500">Client:</span>
            <span class="font-medium ml-1">{callData.customerName || 'Inconnu'}</span>
          </div>
          <div>
            <span class="text-gray-500">ID d'appel:</span>
            <span class="font-medium ml-1">{callData.callId || 'N/A'}</span>
          </div>
        </div>
      </div>
      
      <!-- Sélection de disposition -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Sélectionnez une disposition</label>
        <div class="grid grid-cols-2 gap-2">
          {#each dispositions as disposition}
            <button 
              type="button"
              on:click={() => selectedDisposition = disposition.id}
              class={`py-2 px-3 rounded-md border transition-colors ${selectedDisposition === disposition.id ? disposition.color + ' border-current' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              {disposition.name}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Champs de rappel conditionnels -->
      {#if showCallbackFields}
        <div class="mb-4 p-3 bg-blue-50 rounded-lg">
          <h3 class="font-medium text-blue-800 mb-2">Informations de rappel</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="callbackDate" class="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                id="callbackDate"
                type="date" 
                bind:value={callbackDate}
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label for="callbackTime" class="block text-sm font-medium text-gray-700 mb-1">Heure</label>
              <input 
                id="callbackTime"
                type="time" 
                bind:value={callbackTime}
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Notes -->
      <div class="mb-4">
        <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea 
          id="notes"
          bind:value={notes}
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ajoutez des notes sur cet appel..."
        ></textarea>
      </div>
      
      <!-- Boutons d'action -->
      <div class="flex justify-end space-x-3">
        <button 
          type="button"
          on:click={cancel}
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Annuler
        </button>
        <button 
          type="button"
          on:click={submitDisposition}
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Soumettre
        </button>
      </div>
    </div>
  </div>
{/if}
