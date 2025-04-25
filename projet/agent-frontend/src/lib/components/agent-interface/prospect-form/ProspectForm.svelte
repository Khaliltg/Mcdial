<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  
  const dispatch = createEventDispatcher();
  
  // Props
  export let currentProspect: any = null;
  export let callActive: boolean = false;
  export let apiBaseUrl: string = 'http://localhost:8000/api';
  
  // État local
  let isLoading: boolean = false;
  let errorMessage: string = '';
  let prospectNotes: string = '';
  let successMessage: string = '';
  
  // Fonction pour sauvegarder les données du prospect
  async function saveProspectData() {
    if (!currentProspect) return;
    
    isLoading = true;
    errorMessage = '';
    successMessage = '';
    
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
      
      // Émettre un événement pour informer le composant parent que les données ont été sauvegardées
      dispatch('save', { prospect: { ...currentProspect } });
      
      // Afficher un message de succès temporaire
      successMessage = 'Données sauvegardées avec succès!';
      setTimeout(() => {
        successMessage = '';
      }, 3000);
      
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des données du prospect:', error);
      errorMessage = `Erreur: ${error.message || 'Inconnue'}`;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="w-full">
  {#if currentProspect && callActive}
    <div class="border border-gray-200 rounded-lg p-6 bg-white shadow-md w-full">
      <h3 class="text-xl font-semibold mb-4 text-blue-700 border-b pb-2">Informations du prospect</h3>
      
      {#if isLoading}
        <div class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      {:else}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Colonne de gauche -->
          <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-md shadow-sm">
              <h4 class="text-base font-medium text-gray-700 mb-3">Informations principales</h4>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label for="leadId" class="block text-xs font-medium text-gray-500">ID Lead</label>
                  <input 
                    type="text" 
                    id="leadId" 
                    value={currentProspect.lead_id} 
                    readonly
                    class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label for="listId" class="block text-xs font-medium text-gray-500">Liste</label>
                  <input 
                    type="text" 
                    id="listId" 
                    value={currentProspect.list_id} 
                    readonly
                    class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label for="status" class="block text-xs font-medium text-gray-500">Statut</label>
                  <select 
                    id="status" 
                    bind:value={currentProspect.status}
                    class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Non défini</option>
                    <option value="NEW">Nouveau</option>
                    <option value="CBHOLD">Rappel</option>
                    <option value="DNC">Ne pas appeler</option>
                    <option value="SALE">Vente</option>
                    <option value="NOAN">Pas de réponse</option>
                    <option value="BUSY">Occupé</option>
                  </select>
                </div>
                <div>
                  <label for="calledCount" class="block text-xs font-medium text-gray-500">Nb. appels</label>
                  <input 
                    type="text" 
                    id="calledCount" 
                    value={currentProspect.called_count} 
                    readonly
                    class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  />
                </div>
              </div>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-md shadow-sm">
              <h4 class="text-base font-medium text-blue-700 mb-3">Informations de contact</h4>
              <div class="space-y-2">
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label for="title" class="block text-xs font-medium text-gray-500">Titre</label>
                    <select 
                      id="title" 
                      bind:value={currentProspect.title}
                      class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-</option>
                      <option value="M.">M.</option>
                      <option value="Mme">Mme</option>
                      <option value="Dr">Dr</option>
                    </select>
                  </div>
                  <div class="col-span-2">
                    <label for="firstName" class="block text-xs font-medium text-gray-500">Prénom</label>
                    <input 
                      type="text" 
                      id="firstName" 
                      bind:value={currentProspect.first_name} 
                      class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div class="grid grid-cols-4 gap-2">
                  <div>
                    <label for="middleInitial" class="block text-xs font-medium text-gray-500">Init.</label>
                    <input 
                      type="text" 
                      id="middleInitial" 
                      bind:value={currentProspect.middle_initial} 
                      maxlength="1"
                      class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div class="col-span-3">
                    <label for="lastName" class="block text-xs font-medium text-gray-500">Nom</label>
                    <input 
                      type="text" 
                      id="lastName" 
                      bind:value={currentProspect.last_name} 
                      class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label for="phoneNumber" class="block text-xs font-medium text-gray-500">Téléphone principal</label>
                  <div class="flex">
                    <input 
                      type="text" 
                      id="phoneCode" 
                      bind:value={currentProspect.phone_code} 
                      placeholder="+33"
                      class="mt-1 w-16 px-3 py-2 text-base border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input 
                      type="tel" 
                      id="phoneNumber" 
                      bind:value={currentProspect.phone_number} 
                      readonly
                      class="mt-1 flex-1 px-3 py-2 text-base border-l-0 border border-gray-300 rounded-r-md shadow-sm bg-gray-50"
                    />
                  </div>
                </div>
                
                <div>
                  <label for="altPhone" class="block text-xs font-medium text-gray-500">Téléphone alternatif</label>
                  <input 
                    type="tel" 
                    id="altPhone" 
                    bind:value={currentProspect.alt_phone} 
                    class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label for="email" class="block text-xs font-medium text-gray-500">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    bind:value={currentProspect.email} 
                    class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Colonne de droite -->
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-md shadow-sm">
              <h4 class="text-base font-medium text-blue-700 mb-3">Adresse</h4>
              <div class="space-y-2">
                <div>
                  <label for="address1" class="block text-xs font-medium text-gray-500">Adresse ligne 1</label>
                  <input 
                    type="text" 
                    id="address1" 
                    bind:value={currentProspect.address1} 
                    class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label for="address2" class="block text-xs font-medium text-gray-500">Adresse ligne 2</label>
                  <input 
                    type="text" 
                    id="address2" 
                    bind:value={currentProspect.address2} 
                    class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label for="city" class="block text-xs font-medium text-gray-500">Ville</label>
                    <input 
                      type="text" 
                      id="city" 
                      bind:value={currentProspect.city} 
                      class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label for="postalCode" class="block text-xs font-medium text-gray-500">Code postal</label>
                    <input 
                      type="text" 
                      id="postalCode" 
                      bind:value={currentProspect.postal_code} 
                      class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-md shadow-sm">
              <label for="notes" class="block text-base font-medium text-gray-700 mb-2">Notes</label>
              <textarea 
                id="notes" 
                bind:value={prospectNotes} 
                rows="4"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ajoutez vos notes sur cet appel ici..."
              ></textarea>
            </div>
          </div>
        </div>
        
        <!-- Messages d'erreur ou de succès -->
        {#if errorMessage}
          <div class="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {errorMessage}
          </div>
        {/if}
        
        {#if successMessage}
          <div class="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
            {successMessage}
          </div>
        {/if}
        
        <div class="mt-4 flex justify-end">
          <button 
            on:click={saveProspectData}
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg shadow-md transition-all duration-200 flex items-center"
            disabled={isLoading}
          >
            {#if isLoading}
              <div class="animate-spin mr-2 h-5 w-5 border-t-2 border-b-2 border-white rounded-full"></div>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {/if}
            Enregistrer
          </button>
        </div>
      {/if}
    </div>
  {:else}
    <div class="border border-gray-200 rounded-lg p-8 bg-white shadow-md">
      <div class="flex flex-col items-center justify-center space-y-4">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-blue-700">Aucun prospect actif</h3>
        <p class="text-center text-gray-600 max-w-md">Les informations du prospect s'afficheront ici pendant un appel</p>
        <div class="mt-4 text-sm text-gray-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Initiez un appel pour voir les détails du prospect</span>
        </div>
      </div>
    </div>
  {/if}
</div>
