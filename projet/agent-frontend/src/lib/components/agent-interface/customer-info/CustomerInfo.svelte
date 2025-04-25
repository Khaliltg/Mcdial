<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  // Types pour les informations client
  interface Customer {
    id?: string;
    firstName?: string;
    lastName?: string;
    name: string;
    phone: string;
    altPhone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    postalCode?: string;
    notes?: string;
    lastContact?: string;
    tags?: string[];
    company?: string;
    callHistory?: CallHistoryItem[];
  }
  
  interface CallHistoryItem {
    date: string;
    duration: string;
    disposition: string;
    agent: string;
    notes?: string;
  }
  
  // Propriétés
  export let customer: Customer = {
    name: '',
    phone: '',
  };
  export let callActive: boolean = false;
  export let readOnly: boolean = false;
  
  // État local
  let isEditing: boolean = false;
  let editedCustomer: Customer = { ...customer };
  let isSaving: boolean = false;
  let showCallHistory: boolean = false;
  
  // Fonction pour sauvegarder les modifications
  async function saveChanges() {
    isSaving = true;
    
    try {
      // Mise à jour des informations client
      customer = { ...editedCustomer };
      
      // Dispatch de l'événement pour informer le parent
      dispatch('save', { customer: editedCustomer });
      
      isEditing = false;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      isSaving = false;
    }
  }
  
  // Fonction pour annuler les modifications
  function cancelEdit() {
    editedCustomer = { ...customer };
    isEditing = false;
  }
  
  // Fonction pour commencer l'édition
  function startEdit() {
    if (readOnly) return;
    editedCustomer = { ...customer };
    isEditing = true;
  }
  
  // Fonction pour gérer les actions rapides
  function handleAction(actionType: string) {
    dispatch('action', { type: actionType, customer });
  }
  
  // Fonction pour afficher l'historique des appels
  function toggleCallHistory() {
    showCallHistory = !showCallHistory;
  }
  
  // Réinitialiser l'édition quand le client change
  $: {
    if (customer && !isEditing) {
      // S'assurer que postalCode est toujours défini, en utilisant zip comme fallback si nécessaire
      editedCustomer = { 
        ...customer,
        postalCode: customer.postalCode || customer.zip || ''
      };
    }
  }
  
  // Calculer le nom complet à partir du prénom et du nom
  $: fullName = customer.name || 
    [customer.firstName, customer.lastName]
      .filter(Boolean)
      .join(' ') || 
    'Non spécifié';
</script>

<div class="bg-white rounded-lg shadow-lg p-4">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-bold text-gray-800">Informations client</h2>
    
    <div class="flex space-x-2">
      {#if !isEditing && !readOnly && callActive}
        <button 
          on:click={startEdit}
          class="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          Modifier
        </button>
      {:else if isEditing}
        <div class="flex space-x-2">
          <button 
            on:click={cancelEdit}
            class="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm flex items-center"
            disabled={isSaving}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
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
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {/if}
            Enregistrer
          </button>
        </div>
      {/if}
      
      {#if callActive && !isEditing && customer.callHistory && customer.callHistory.length > 0}
        <button 
          on:click={toggleCallHistory}
          class="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
          </svg>
          Historique
        </button>
      {/if}
    </div>
  </div>
  
  {#if !callActive}
    <div class="text-center py-8 text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <p>Aucun client actif</p>
      <p class="text-sm">Les informations client apparaîtront ici pendant un appel</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#if showCallHistory && customer.callHistory && customer.callHistory.length > 0}
        <!-- Historique des appels -->
        <div class="border rounded-lg overflow-hidden">
          <div class="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
            <h3 class="font-medium">Historique des appels</h3>
            <button 
              on:click={toggleCallHistory}
              class="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durée</th>
                  <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disposition</th>
                  <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each customer.callHistory as call}
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{call.date}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{call.duration}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {call.disposition}
                      </span>
                    </td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{call.agent}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {:else}
        <!-- Informations de base -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Prénom et Nom -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
            {#if isEditing}
              <input 
                type="text" 
                bind:value={editedCustomer.firstName} 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            {:else}
              <div class="bg-gray-50 px-3 py-2 rounded-md">{customer.firstName || '-'}</div>
            {/if}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            {#if isEditing}
              <input 
                type="text" 
                bind:value={editedCustomer.lastName} 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            {:else}
              <div class="bg-gray-50 px-3 py-2 rounded-md">{customer.lastName || '-'}</div>
            {/if}
          </div>
          
          <!-- Téléphone principal et alternatif -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            {#if isEditing}
              <input 
                type="tel" 
                bind:value={editedCustomer.phone} 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            {:else}
              <div class="bg-gray-50 px-3 py-2 rounded-md">{customer.phone || '-'}</div>
            {/if}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone alternatif</label>
            {#if isEditing}
              <input 
                type="tel" 
                bind:value={editedCustomer.altPhone} 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            {:else}
              <div class="bg-gray-50 px-3 py-2 rounded-md">{customer.altPhone || '-'}</div>
            {/if}
          </div>
          
          <!-- Email et Entreprise -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {#if isEditing}
              <input 
                type="email" 
                bind:value={editedCustomer.email} 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            {:else}
              <div class="bg-gray-50 px-3 py-2 rounded-md">{customer.email || '-'}</div>
            {/if}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
            {#if isEditing}
              <input 
                type="text" 
                bind:value={editedCustomer.company} 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            {:else}
              <div class="bg-gray-50 px-3 py-2 rounded-md">{customer.company || '-'}</div>
            {/if}
          </div>
          
          <!-- Dernier contact -->
          {#if customer.lastContact}
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Dernier contact</label>
              <div class="bg-gray-50 px-3 py-2 rounded-md">{customer.lastContact}</div>
            </div>
          {/if}
        </div>
        
        <!-- Adresse -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          {#if isEditing}
            <input 
              type="text" 
              bind:value={editedCustomer.address} 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
              placeholder="Adresse"
            />
            <div class="grid grid-cols-3 gap-2">
              <input 
                type="text" 
                bind:value={editedCustomer.city} 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ville"
              />
              <input 
                type="text" 
                bind:value={editedCustomer.state} 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="État/Province"
              />
              <input 
                type="text" 
                bind:value={editedCustomer.postalCode} 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Code postal"
              />
            </div>
          {:else}
            <div class="bg-gray-50 px-3 py-2 rounded-md">
              {#if customer.address || customer.city || customer.state || (customer.zip || customer.postalCode)}
                <p>{customer.address || ''}</p>
                <p>
                  {[
                    customer.city, 
                    customer.state, 
                    customer.postalCode || customer.zip || ''
                  ].filter(Boolean).join(', ')}
                </p>
              {:else}
                -
              {/if}
            </div>
          {/if}
        </div>
        
        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          {#if isEditing}
            <textarea 
              bind:value={editedCustomer.notes} 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            ></textarea>
          {:else}
            <div class="bg-gray-50 px-3 py-2 rounded-md min-h-[80px] whitespace-pre-line">{customer.notes || '-'}</div>
          {/if}
        </div>
        
        <!-- Tags -->
        {#if customer.tags && customer.tags.length > 0}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div class="flex flex-wrap gap-1">
              {#each customer.tags as tag}
                <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {tag}
                </span>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Actions rapides -->
        {#if !isEditing}
          <div class="pt-4 border-t flex flex-wrap gap-2">
            <button 
              on:click={() => handleAction('email')}
              class="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-sm flex items-center"
              disabled={!customer.email}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Email
            </button>
            
            <button 
              on:click={() => handleAction('sms')}
              class="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm flex items-center"
              disabled={!customer.phone}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
              </svg>
              SMS
            </button>
            
            <button 
              on:click={() => handleAction('altDial')}
              class="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm flex items-center"
              disabled={!customer.altPhone}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Alt. Tel
            </button>
            
            {#if customer.callHistory && customer.callHistory.length > 0}
              <button 
                on:click={toggleCallHistory}
                class="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                </svg>
                Historique
              </button>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>
