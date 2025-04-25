<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  // Propriétés
  export let customer = {
    id: '',
    firstName: '',
    lastName: '',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    notes: '',
    company: ''
  };
  export let callActive = false;
  export let readOnly = false;
  
  // État local
  let editedCustomer = { ...customer };
  let isEditing = false;
  let isSaving = false;
  
  // Mettre à jour les données locales lorsque les props changent
  $: {
    if (!isEditing) {
      editedCustomer = { ...customer };
    }
  }
  
  // Fonction pour commencer l'édition
  function startEditing() {
    if (readOnly) return;
    isEditing = true;
  }
  
  // Fonction pour annuler l'édition
  function cancelEditing() {
    isEditing = false;
    editedCustomer = { ...customer };
  }
  
  // Fonction pour sauvegarder les modifications
  async function saveChanges() {
    if (!isEditing) return;
    
    isSaving = true;
    
    try {
      // Envoyer les modifications au parent
      dispatch('save', { customer: editedCustomer });
      isEditing = false;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="bg-white rounded-lg shadow-lg p-4">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-bold text-gray-800">Informations client</h2>
    
    {#if !readOnly && callActive}
      {#if isEditing}
        <div class="space-x-2">
          <button 
            on:click={cancelEditing}
            class="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm"
            disabled={isSaving}
          >
            Annuler
          </button>
          <button 
            on:click={saveChanges}
            class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm flex items-center"
            disabled={isSaving}
          >
            {#if isSaving}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {/if}
            Enregistrer
          </button>
        </div>
      {:else}
        <button 
          on:click={startEditing}
          class="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm"
        >
          Modifier
        </button>
      {/if}
    {/if}
  </div>
  
  {#if !callActive}
    <div class="text-center text-gray-500 py-8">
      Aucun appel actif
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Nom et prénom -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
        {#if isEditing}
          <input 
            type="text" 
            bind:value={editedCustomer.firstName}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        {:else}
          <div class="px-3 py-2 bg-gray-50 rounded-md">{customer.firstName || '-'}</div>
        {/if}
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
        {#if isEditing}
          <input 
            type="text" 
            bind:value={editedCustomer.lastName}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        {:else}
          <div class="px-3 py-2 bg-gray-50 rounded-md">{customer.lastName || '-'}</div>
        {/if}
      </div>
      
      <!-- Téléphone -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
        {#if isEditing}
          <input 
            type="tel" 
            bind:value={editedCustomer.phone}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        {:else}
          <div class="px-3 py-2 bg-gray-50 rounded-md">{customer.phone || '-'}</div>
        {/if}
      </div>
      
      <!-- Téléphone alternatif -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone alternatif</label>
        {#if isEditing}
          <input 
            type="tel" 
            bind:value={editedCustomer.altPhone}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        {:else}
          <div class="px-3 py-2 bg-gray-50 rounded-md">{customer.altPhone || '-'}</div>
        {/if}
      </div>
      
      <!-- Email -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        {#if isEditing}
          <input 
            type="email" 
            bind:value={editedCustomer.email}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        {:else}
          <div class="px-3 py-2 bg-gray-50 rounded-md">{customer.email || '-'}</div>
        {/if}
      </div>
      
      <!-- Entreprise -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
        {#if isEditing}
          <input 
            type="text" 
            bind:value={editedCustomer.company}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        {:else}
          <div class="px-3 py-2 bg-gray-50 rounded-md">{customer.company || '-'}</div>
        {/if}
      </div>
      
      <!-- Adresse -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
        {#if isEditing}
          <input 
            type="text" 
            bind:value={editedCustomer.address}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        {:else}
          <div class="px-3 py-2 bg-gray-50 rounded-md">{customer.address || '-'}</div>
        {/if}
      </div>
      
      <!-- Ville, État, Code postal -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Ville</label>
        {#if isEditing}
          <input 
            type="text" 
            bind:value={editedCustomer.city}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        {:else}
          <div class="px-3 py-2 bg-gray-50 rounded-md">{customer.city || '-'}</div>
        {/if}
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">État</label>
          {#if isEditing}
            <input 
              type="text" 
              bind:value={editedCustomer.state}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          {:else}
            <div class="px-3 py-2 bg-gray-50 rounded-md">{customer.state || '-'}</div>
          {/if}
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
          {#if isEditing}
            <input 
              type="text" 
              bind:value={editedCustomer.postalCode}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          {:else}
            <div class="px-3 py-2 bg-gray-50 rounded-md">{customer.postalCode || '-'}</div>
          {/if}
        </div>
      </div>
      
      <!-- Notes -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        {#if isEditing}
          <textarea 
            bind:value={editedCustomer.notes}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        {:else}
          <div class="px-3 py-2 bg-gray-50 rounded-md min-h-[80px] whitespace-pre-line">{customer.notes || '-'}</div>
        {/if}
      </div>
    </div>
    
    <!-- Actions rapides -->
    {#if !isEditing && callActive}
      <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
        <button 
          on:click={() => dispatch('action', { type: 'email', customer })}
          class="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-sm flex items-center"
          disabled={!customer.email}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Envoyer email
        </button>
        
        <button 
          on:click={() => dispatch('action', { type: 'sms', customer })}
          class="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm flex items-center"
          disabled={!customer.phone}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
          </svg>
          Envoyer SMS
        </button>
        
        <button 
          on:click={() => dispatch('action', { type: 'altDial', customer })}
          class="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm flex items-center"
          disabled={!customer.altPhone}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          Appeler alt.
        </button>
        
        <button 
          on:click={() => dispatch('action', { type: 'history', customer })}
          class="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
          </svg>
          Historique
        </button>
      </div>
    {/if}
  {/if}
</div>
