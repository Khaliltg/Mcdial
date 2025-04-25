<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  // Propriétés
  export let callActive: boolean = false;
  export let callMuted: boolean = false;
  export let callOnHold: boolean = false;
  export let callDuration: number = 0;
  export let customerName: string = "";
  export let phoneNumber: string = "";
  export let recording: boolean = false;
  export let currentProspect: any = null;
  
  // Variables pour le formulaire prospect
  let status: string = 'idle';
  let showProspectForm: boolean = true;
  let isLoadingProspect: boolean = false;
  let prospectNotes: string = '';
  
  // Formatage de la durée d'appel
  $: formattedDuration = formatDuration(callDuration);
  
  // Mettre à jour le statut en fonction de l'état de l'appel
  $: status = callActive ? 'dialing' : 'idle';
  
  function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // Fonctions de contrôle d'appel
  function hangup() {
    dispatch('hangup');
  }
  
  function toggleMute() {
    dispatch('toggleMute');
  }
  
  function toggleHold() {
    dispatch('toggleHold');
  }
  
  function toggleRecording() {
    dispatch('toggleRecording');
  }
  
  function transfer() {
    dispatch('transfer');
  }
  
  function openDtmfPad() {
    dispatch('openDtmfPad');
  }
</script>

<div class="bg-white rounded-lg shadow-lg p-4">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-bold text-gray-800">Contrôle d'appel</h2>
    
    <!-- Indicateur d'appel et durée -->
    <div class="flex items-center">
      {#if callActive}
        <div class="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
          <span class="font-medium">Appel en cours</span>
          <span class="ml-2 font-bold">{formattedDuration}</span>
        </div>
      {:else}
        <div class="flex items-center bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
          <span class="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
          <span class="font-medium">Aucun appel</span>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Informations client -->
  {#if callActive}
    <div class="bg-blue-50 p-3 rounded-lg mb-4">
      <div class="grid grid-cols-2 gap-2">
        <div>
          <span class="text-sm text-gray-500">Client:</span>
          <span class="font-medium ml-1">{customerName || "Inconnu"}</span>
        </div>
        <div>
          <span class="text-sm text-gray-500">Numéro:</span>
          <span class="font-medium ml-1">{phoneNumber}</span>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Boutons de contrôle -->
  <!-- Section Informations du prospect -->
  <div class="mt-4 border border-gray-200 rounded-lg p-6 bg-white shadow-md max-w-full">
    <h3 class="text-xl font-semibold mb-4 text-blue-700 border-b pb-2">Informations du prospect</h3>
    
    {#if status === 'dialing' && showProspectForm && currentProspect}
      {#if isLoadingProspect}
        <div class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      {:else}
        <!-- Version simplifiée du formulaire -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Informations principales -->
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
                      class="mt-1 w-16 px-2 py-1 text-sm border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input 
                      type="tel" 
                      id="phoneNumber" 
                      bind:value={currentProspect.phone_number} 
                      readonly
                      class="mt-1 flex-1 px-2 py-1 text-sm border-l-0 border border-gray-300 rounded-r-md shadow-sm bg-gray-50"
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
                
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label for="state" class="block text-xs font-medium text-gray-500">État/Région</label>
                    <input 
                      type="text" 
                      id="state" 
                      bind:value={currentProspect.state} 
                      maxlength="2"
                      class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label for="country" class="block text-xs font-medium text-gray-500">Pays</label>
                    <input 
                      type="text" 
                      id="country" 
                      bind:value={currentProspect.country_code} 
                      placeholder="FR"
                      maxlength="3"
                      class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-md shadow-sm">
              <h4 class="text-base font-medium text-blue-700 mb-3">Informations additionnelles</h4>
              <div class="space-y-2">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label for="gender" class="block text-xs font-medium text-gray-500">Genre</label>
                    <select 
                      id="gender" 
                      bind:value={currentProspect.gender}
                      class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="U">Non spécifié</option>
                      <option value="M">Homme</option>
                      <option value="F">Femme</option>
                    </select>
                  </div>
                  
                  <div>
                    <label for="dob" class="block text-xs font-medium text-gray-500">Date de naissance</label>
                    <input 
                      type="date" 
                      id="dob" 
                      bind:value={currentProspect.date_of_birth} 
                      class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label for="vendor" class="block text-xs font-medium text-gray-500">Code vendeur</label>
                  <input 
                    type="text" 
                    id="vendor" 
                    bind:value={currentProspect.vendor_lead_code} 
                    class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label for="security" class="block text-xs font-medium text-gray-500">Phrase de sécurité</label>
                  <input 
                    type="text" 
                    id="security" 
                    bind:value={currentProspect.security_phrase} 
                    class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
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
          
          <!-- Informations de contact -->
          <div class="bg-blue-50 p-4 rounded-md shadow-sm">
            <h4 class="text-base font-medium text-blue-700 mb-3">Informations de contact</h4>
            <div class="space-y-2">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label for="firstName" class="block text-xs font-medium text-gray-500">Prénom</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    value={currentProspect.first_name || ''}
                    readonly
                    class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label for="lastName" class="block text-xs font-medium text-gray-500">Nom</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    value={currentProspect.last_name || ''}
                    readonly
                    class="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>
        
        <!-- Bouton pour ouvrir la boîte de dialogue modale -->
        <div class="mt-4 flex justify-center">
          <button 
            on:click={() => dispatch('openProspectModal', { prospect: currentProspect })}
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg shadow-md transition-all duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Voir détails complets
          </button>
        </div>
      {/if}
    {:else}
      <div class="flex flex-col items-center justify-center space-y-4 py-4">
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
    {/if}
  </div>

</div>
